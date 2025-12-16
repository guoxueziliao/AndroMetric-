
import { LogEntry, PartnerProfile, ContentItem } from '../types';
import { validateLogEntry } from './validators';

// Defined in UI Notice System Spec
export interface ContentNoticeDef {
    ruleId: string;
    level: 'error' | 'warn' | 'info';
    title: string;
    detail?: string;
    actionLabel?: string;
}

export interface HealthIssue {
    id: string; // date + type + index
    date: string;
    type: 'schema' | 'missing_field' | 'logic' | 'relation' | 'content';
    message: string;
    severity: 'high' | 'medium' | 'low';
    hintAction?: string; 
    path?: string; 
}

export interface DataHealthReport {
    timestamp: number;
    totalRecords: number;
    score: number; // 0-100
    issues: HealthIssue[];
    stats: {
        missingSleep: number;
        missingHealth: number;
        nullArrays: number;
        brokenRelations: number;
        missingIds: number;
        // New Content Stats
        contentIssues: {
            schemaErrors: number;
            missingType: number;
            missingPlatform: number;
            migrationUnconfirmed: number;
        };
    };
    canRepair: boolean;
}

// Reusable validation for a single ContentItem (UI & Backend) based on C-M1 to C-M7
export const validateContentItem = (item: ContentItem): ContentNoticeDef[] => {
    const issues: ContentNoticeDef[] = [];

    // C-M7: Missing ID (Error)
    if (!item.id) {
        issues.push({ 
            ruleId: 'C-M7', 
            level: 'error', 
            title: '素材缺少唯一标识', 
            detail: '可能影响编辑与迁移', 
            actionLabel: '一键修复' 
        });
    }

    // C-M1: Missing Type (Error)
    if (!item.type) {
        issues.push({ 
            ruleId: 'C-M1', 
            level: 'error', 
            title: '未选择素材类型', 
            detail: '无法区分视频、图片或文字素材', 
            actionLabel: '去选择' 
        });
    }

    // C-M2: Missing Platform (Warn)
    // C-M3: Platform Empty but not caught by C-M2 (covered if logic ensures platform exists)
    // Note: If type is '回忆' or '幻想', platform might not be strictly required or is implied '无来源'.
    // The spec says: C-M2 | 未选择来源平台.
    const isImmersion = item.type === '回忆' || item.type === '幻想';
    if (!isImmersion && !item.platform) {
        issues.push({ 
            ruleId: 'C-M2', 
            level: 'warn', 
            title: '未选择来源平台', 
            detail: '无法统计平台偏好', 
            actionLabel: '去选择' 
        });
    }

    // C-M4: No Title/Notes (Info)
    if (!item.title && !item.notes) {
        issues.push({ 
            ruleId: 'C-M4', 
            level: 'info', 
            title: '未填写素材备注', 
            detail: '回顾时可能难以识别内容', 
            actionLabel: '去补充' 
        });
    }

    // C-M5: XP Tags Empty (Info)
    if (!item.xpTags || item.xpTags.length === 0) {
        issues.push({ 
            ruleId: 'C-M5', 
            level: 'info', 
            title: '未添加性癖标签', 
            detail: '不影响记录，仅影响偏好统计', 
            actionLabel: '去添加' 
        });
    }

    // C-M6: Legacy Migration (Warn)
    // Detected by checking specific notes from migration
    if (item.notes && item.notes.includes('多选结构迁移')) {
        issues.push({ 
            ruleId: 'C-M6', 
            level: 'warn', 
            title: '一个素材包含多个平台', 
            detail: '建议拆分为多个素材单元', 
            actionLabel: '拆分素材' 
        });
    }

    return issues;
};

export const checkDataHealth = (logs: LogEntry[], partners: PartnerProfile[]): DataHealthReport => {
    const issues: HealthIssue[] = [];
    const partnerNames = new Set(partners.map(p => p.name));
    
    let missingSleep = 0;
    let missingHealth = 0;
    let nullArrays = 0;
    let brokenRelations = 0;
    let missingIds = 0;
    
    const contentStats = {
        schemaErrors: 0,
        missingType: 0,
        missingPlatform: 0,
        migrationUnconfirmed: 0
    };

    logs.forEach(log => {
        // 1. Schema Validation (Base types)
        const { valid, errors } = validateLogEntry(log);
        if (!valid) {
            errors.forEach((err, idx) => {
                issues.push({
                    id: `${log.date}_schema_${idx}`,
                    date: log.date,
                    type: 'schema',
                    message: err,
                    severity: 'high'
                });
            });
        }

        // 2. Structure Checks
        if (!log.sleep) { missingSleep++; }
        if (!log.health) { missingHealth++; }

        // 3. Array Checks
        const checkArray = (arr: any, name: string) => {
            if (!Array.isArray(arr)) {
                issues.push({ id: `${log.date}_${name}_array`, date: log.date, type: 'schema', message: `${name} 数据格式错误(非数组)`, severity: 'high' });
                nullArrays++;
            }
        };
        checkArray(log.exercise, 'exercise');
        checkArray(log.sex, 'sex');
        checkArray(log.masturbation, 'masturbation');

        // 4. Relations
        if (log.sex) {
            log.sex.forEach((sex, idx) => {
                const names: string[] = [];
                if (sex.partner) names.push(sex.partner);
                if (sex.interactions) sex.interactions.forEach(i => i.partner && names.push(i.partner));
                names.forEach(name => {
                    if (!partnerNames.has(name)) {
                        brokenRelations++;
                        issues.push({ id: `${log.date}_rel_${idx}`, date: log.date, type: 'relation', message: `引用不存在的伴侣: ${name}`, severity: 'low' });
                    }
                });
            });
        }

        // 5. ContentItem Checks (Using new validateContentItem)
        if (log.masturbation) {
            log.masturbation.forEach((mb, mIdx) => {
                if (mb.contentItems) {
                    mb.contentItems.forEach((item, cIdx) => {
                        const noticeDefs = validateContentItem(item);
                        
                        noticeDefs.forEach(def => {
                            // Map ContentNoticeDef to global HealthIssue format for report
                            // 'error' -> 'high', 'warn' -> 'medium', 'info' -> 'low'
                            const severity = def.level === 'error' ? 'high' : def.level === 'warn' ? 'medium' : 'low';
                            
                            issues.push({
                                id: `${log.date}_content_${mIdx}_${cIdx}_${def.ruleId}`,
                                date: log.date,
                                type: 'content',
                                severity,
                                message: def.title,
                                hintAction: def.actionLabel,
                                path: `masturbation[${mIdx}].contentItems[${cIdx}]`
                            });

                            if (def.ruleId === 'C-M1') contentStats.missingType++;
                            if (def.ruleId === 'C-M2') contentStats.missingPlatform++;
                            if (def.ruleId === 'C-M7') missingIds++;
                        });
                    });
                } else {
                    // C-H2: contentItems Schema (Legacy check)
                    if (!Array.isArray(mb.contentItems)) {
                        issues.push({
                            id: `${log.date}_content_schema_${mIdx}`,
                            date: log.date,
                            type: 'content',
                            severity: 'high',
                            message: '素材数据格式错误（非数组）',
                            hintAction: '导出备份并执行数据修复'
                        });
                        contentStats.schemaErrors++;
                    }
                }
            });
        }
    });

    // Calculate Health Score
    let rawScore = 100;
    issues.forEach(i => {
        if (i.severity === 'high') rawScore -= 5;
        else if (i.severity === 'medium') rawScore -= 2;
        else rawScore -= 0.5;
    });
    const score = Math.max(0, Math.floor(rawScore));

    return {
        timestamp: Date.now(),
        totalRecords: logs.length,
        score,
        issues,
        stats: { 
            missingSleep, 
            missingHealth, 
            nullArrays, 
            brokenRelations, 
            missingIds,
            contentIssues: contentStats
        },
        canRepair: issues.some(i => i.hintAction === '系统可自动修复' || (i.type !== 'content' && i.severity === 'high') || i.message.includes('ID'))
    };
};
