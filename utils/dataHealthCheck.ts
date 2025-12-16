
import { LogEntry, PartnerProfile, ContentItem } from '../types';
import { validateLogEntry } from './validators';

// Re-export for UI usage
export interface ContentHealthIssue {
    code: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    hintAction?: string;
    path?: string;
}

export interface HealthIssue {
    id: string; // date + type + index
    date: string;
    type: 'schema' | 'missing_field' | 'logic' | 'relation' | 'content';
    message: string;
    severity: 'high' | 'medium' | 'low';
    hintAction?: string; // New: Suggestion for UI button
    path?: string; // New: JSON path to the issue
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

// Heuristic for C-L3: XP Pollution
export const isPollutedXpTag = (tag: string): boolean => {
    const POLLUTION_PATTERNS = [
        /\d{1,2}[:：]\d{2}/, // Time like 09:00
        /\d+(ml|l|g|kg|cm|mm|次|个|分钟|h|小时|岁)/i, // Units
        /^\d+$/, // Pure numbers
    ];
    const POLLUTION_WORDS = ['很爽', '满意', '后悔', '舒服', '一般', '开心', '难过', '刺激', '垃圾'];
    
    if (POLLUTION_PATTERNS.some(p => p.test(tag))) return true;
    if (POLLUTION_WORDS.some(w => tag.includes(w))) return true;
    return false;
};

// Reusable validation for a single ContentItem (UI & Backend)
export const validateContentItem = (item: ContentItem): ContentHealthIssue[] => {
    const issues: ContentHealthIssue[] = [];

    // Error: Missing ID (Technical)
    if (!item.id) {
        issues.push({ code: 'missing_id', severity: 'high', message: '素材标识异常（可能导致编辑错位）', hintAction: '一键修复ID' });
    }

    // Warn: Missing Type
    if (!item.type) {
        issues.push({ code: 'missing_type', severity: 'medium', message: '未选择内容形式', hintAction: '去选择' });
    }

    // Warn: Missing Platform (Conditional)
    const needsPlatform = item.type && item.type !== '回忆' && item.type !== '幻想';
    if (needsPlatform && !item.platform) {
        issues.push({ code: 'missing_platform', severity: 'medium', message: '未选择来源平台', hintAction: '去选择' });
    }

    // Warn: Empty List Items
    const hasEmptyActor = item.actors && item.actors.some(a => !a.trim());
    const hasEmptyTag = item.xpTags && item.xpTags.some(t => !t.trim());
    if (hasEmptyActor || hasEmptyTag) {
        issues.push({ code: 'invalid_list', severity: 'medium', message: '列表包含空项，建议清理', hintAction: '去清理' });
    }

    // Info: Sparse Info
    if (!item.title && (!item.actors || item.actors.length === 0)) {
        issues.push({ code: 'sparse_info', severity: 'low', message: '信息较少，建议补充标题或主演', hintAction: '去补充' });
    }

    // Info: Migration Note
    if (item.notes && item.notes.includes('迁移')) {
        issues.push({ code: 'migration', severity: 'low', message: '迁移生成：建议确认类型与平台', hintAction: '去确认' });
    }

    // Info: XP Pollution
    if (item.xpTags && item.xpTags.some(t => isPollutedXpTag(t))) {
        issues.push({ code: 'pollution', severity: 'low', message: '标签可能混入非性癖内容', hintAction: '去标签管理' });
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

        // 2. Structure Checks (Null Objects)
        if (!log.morning) {
             issues.push({ id: `${log.date}_no_morning`, date: log.date, type: 'missing_field', message: '晨勃记录模块缺失', severity: 'medium' });
        }
        
        if (!log.sleep) {
             issues.push({ id: `${log.date}_no_sleep`, date: log.date, type: 'missing_field', message: '睡眠记录模块缺失', severity: 'medium' });
             missingSleep++;
        } else {
            // Sleep fields check
            if (log.sleep.quality === undefined || log.sleep.quality === null) {
                issues.push({ id: `${log.date}_sleep_quality`, date: log.date, type: 'missing_field', message: '缺少睡眠质量评分', severity: 'low' });
            }
        }

        if (!log.health) {
             issues.push({ id: `${log.date}_no_health`, date: log.date, type: 'missing_field', message: '健康状态模块缺失', severity: 'medium' });
             missingHealth++;
        } else {
            if (typeof log.health.isSick !== 'boolean') {
                 issues.push({ id: `${log.date}_health_issick`, date: log.date, type: 'schema', message: '生病状态字段无效或缺失', severity: 'low' });
            } else if (log.health.isSick) {
                // v0.0.6 Health Check Logic
                if (!log.health.discomfortLevel) {
                    issues.push({ id: `${log.date}_health_level`, date: log.date, type: 'missing_field', message: '已标记生病但未记录不适程度', severity: 'low' });
                }
            }
        }

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
        checkArray(log.tags, 'tags');
        checkArray(log.changeHistory, 'changeHistory');

        // 4. Sub-record IDs
        const checkIds = (arr: any[], name: string) => {
            if (Array.isArray(arr)) {
                arr.forEach((item, i) => {
                    if (!item.id) {
                        issues.push({ id: `${log.date}_${name}_id_${i}`, date: log.date, type: 'schema', message: `${name}[${i}] 缺少唯一ID`, severity: 'medium' });
                        missingIds++;
                    }
                });
            }
        };
        checkIds(log.sex || [], 'sex');
        checkIds(log.masturbation || [], 'masturbation');
        checkIds(log.exercise || [], 'exercise');
        if (log.sleep?.naps) checkIds(log.sleep.naps, 'nap');

        // 5. Logic
        if (log.sleep && log.sleep.startTime && log.sleep.endTime) {
            const start = new Date(log.sleep.startTime).getTime();
            const end = new Date(log.sleep.endTime).getTime();
            if (end <= start) {
                issues.push({ id: `${log.date}_sleep_logic`, date: log.date, type: 'logic', message: '起床时间早于入睡时间', severity: 'medium' });
            }
        }
        if (new Date(log.date).getTime() > Date.now() + 86400000) {
             issues.push({ id: `${log.date}_future`, date: log.date, type: 'logic', message: '记录日期在未来', severity: 'medium' });
        }

        // 6. Relations (Partner Integrity)
        if (log.sex) {
            log.sex.forEach((sex, idx) => {
                const namesToCheck: string[] = [];
                if (sex.partner) namesToCheck.push(sex.partner);
                if (sex.interactions) sex.interactions.forEach(i => i.partner && namesToCheck.push(i.partner));
                
                namesToCheck.forEach(name => {
                    if (!partnerNames.has(name)) {
                        issues.push({ id: `${log.date}_rel_${idx}_${name}`, date: log.date, type: 'relation', message: `引用了不存在的伴侣: "${name}"`, severity: 'low' });
                        brokenRelations++;
                    }
                });
            });
        }

        // 7. ContentItem Checks (Refactored to use validateContentItem)
        if (log.masturbation) {
            log.masturbation.forEach((mb, mIdx) => {
                if (mb.contentItems && !Array.isArray(mb.contentItems)) {
                    issues.push({
                        id: `${log.date}_content_schema_${mIdx}`,
                        date: log.date,
                        type: 'content',
                        severity: 'high',
                        message: '素材数据格式错误（非数组）',
                        hintAction: '导出备份并执行数据修复'
                    });
                    contentStats.schemaErrors++;
                    return;
                }

                if (mb.contentItems) {
                    const seenIds = new Set<string>();
                    
                    mb.contentItems.forEach((item, cIdx) => {
                        // Check Duplication (Contextual, so kept here)
                        if (item.id && seenIds.has(item.id)) {
                             issues.push({
                                id: `${log.date}_content_${mIdx}_${cIdx}_dup`,
                                date: log.date,
                                type: 'content',
                                severity: 'high',
                                message: '素材ID重复',
                                hintAction: '系统可自动修复',
                                path: `masturbation[${mIdx}].contentItems[${cIdx}]`
                            });
                            missingIds++;
                        }
                        if (item.id) seenIds.add(item.id);

                        // Run intrinsic checks
                        const itemIssues = validateContentItem(item);
                        
                        itemIssues.forEach(i => {
                            // Map ContentHealthIssue to Global HealthIssue
                            issues.push({
                                id: `${log.date}_content_${mIdx}_${cIdx}_${i.code}`,
                                date: log.date,
                                type: 'content',
                                severity: i.severity,
                                message: i.message,
                                hintAction: i.hintAction,
                                path: `masturbation[${mIdx}].contentItems[${cIdx}]`
                            });

                            // Update stats based on code
                            if (i.code === 'missing_type') contentStats.missingType++;
                            if (i.code === 'missing_platform') contentStats.missingPlatform++;
                            if (i.code === 'migration') contentStats.migrationUnconfirmed++;
                            if (i.code === 'missing_id') missingIds++;
                        });
                    });
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
