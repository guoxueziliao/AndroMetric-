
import { LogEntry, PartnerProfile } from '../types';
import { validateLogEntry } from './validators';

export interface HealthIssue {
    id: string; // date + type + index
    date: string;
    type: 'schema' | 'missing_field' | 'logic' | 'relation';
    message: string;
    severity: 'low' | 'medium' | 'high';
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
    };
    canRepair: boolean;
}

export const checkDataHealth = (logs: LogEntry[], partners: PartnerProfile[]): DataHealthReport => {
    const issues: HealthIssue[] = [];
    const partnerNames = new Set(partners.map(p => p.name));
    
    let missingSleep = 0;
    let missingHealth = 0;
    let nullArrays = 0;
    let brokenRelations = 0;
    let missingIds = 0;

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
    });

    // Calculate Health Score
    // Base 100. High severity -5, Medium -2, Low -0.5
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
        stats: { missingSleep, missingHealth, nullArrays, brokenRelations, missingIds },
        canRepair: issues.length > 0
    };
};
