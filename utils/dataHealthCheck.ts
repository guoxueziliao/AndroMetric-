
import {
    ContentItem,
    CycleEvent,
    GoalCheckin,
    HealthProject,
    HealthProjectLog,
    HealthProjectPlan,
    LogEntry,
    MasturbationEvent,
    PartnerProfile,
    PregnancyEvent,
    PornUseEvent,
    SexEvent,
    TagEntry,
    TrainingGoal
} from '../types';
import { validateLogEntry } from './validators';
import { validateTag } from './tagValidators';
import { buildDataQualityForLog, isFieldUsable } from './dataQuality';

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

export interface DataTableHealthStats {
    records: number;
    issues: number;
    missingIds: number;
    missingFields: number;
    brokenRelations: number;
}

export interface DataHealthDataset {
    logs: LogEntry[];
    partners: PartnerProfile[];
    tags?: TagEntry[];
    cycleEvents?: CycleEvent[];
    pregnancyEvents?: PregnancyEvent[];
    pornUseEvents?: PornUseEvent[];
    masturbationEvents?: MasturbationEvent[];
    sexEvents?: SexEvent[];
    trainingGoals?: TrainingGoal[];
    goalCheckins?: GoalCheckin[];
    healthProjects?: HealthProject[];
    healthProjectPlans?: HealthProjectPlan[];
    healthProjectLogs?: HealthProjectLog[];
}

export interface DataHealthReport {
    timestamp: number;
    totalRecords: number;
    score: number; // 0-100
    scores: {
        structure: number;
        completeness: number;
        analytics: number;
    };
    issues: HealthIssue[];
    stats: {
        missingSleep: number;
        missingHealth: number;
        nullArrays: number;
        brokenRelations: number;
        missingIds: number;
        completeness: {
            trackedFields: number;
            recordedFields: number;
            missingFields: number;
        };
        analyticsAvailability: Record<string, { usableSamples: number; totalRecords: number }>;
        // New Content Stats
        contentIssues: {
            schemaErrors: number;
            missingType: number;
            missingPlatform: number;
            migrationUnconfirmed: number;
        };
        tableStats: Record<string, DataTableHealthStats>;
        orphanRelations: {
            total: number;
            byTable: Record<string, number>;
        };
    };
    canRepair: boolean;
    canCleanOrphanRelations: boolean;
}

const createTableStats = (records: number): DataTableHealthStats => ({
    records,
    issues: 0,
    missingIds: 0,
    missingFields: 0,
    brokenRelations: 0
});

const hasValue = (value: unknown) => (
    value !== undefined && value !== null && value !== ''
);

const getStringField = (record: unknown, field: string): string | null => {
    if (typeof record !== 'object' || record === null) return null;
    const value = (record as Record<string, unknown>)[field];
    return typeof value === 'string' && value.trim() ? value : null;
};

// Reusable validation for a single ContentItem (UI & Backend) based on C-E1 to C-I3
export const validateContentItem = (item: ContentItem): ContentNoticeDef[] => {
    const issues: ContentNoticeDef[] = [];

    // C-E1: Missing ID (Error)
    if (!item.id) {
        issues.push({ 
            ruleId: 'C-E1', 
            level: 'error', 
            title: '素材缺少唯一标识', 
            detail: '无法定位、编辑或迁移', 
            actionLabel: '一键修复' 
        });
    }

    // C-W1: Missing Type (Warn)
    if (!item.type) {
        issues.push({ 
            ruleId: 'C-W1', 
            level: 'warn', 
            title: '未选择素材类型', 
            detail: '分类统计失效', // Spec says "无法判断素材形态" / "分类统计失效"
            actionLabel: '去选择' 
        });
    }

    // C-W2: Missing Platform (Warn)
    // Only if type is NOT memory/fantasy
    const isImmersion = item.type === '回忆' || item.type === '幻想';
    if (!isImmersion && !item.platform) {
        issues.push({ 
            ruleId: 'C-W2', 
            level: 'warn', 
            title: '未选择来源平台', 
            detail: '平台统计失效', 
            actionLabel: '去选择' 
        });
    }

    // C-W3: Platform Name Empty (Warn)
    // Spec: platform = other but platformName is empty. 
    // Since we don't have separate platformName field in types yet, we assume platform string holds the value.
    // If it equals strictly 'Other' or '其他' without user input details, it triggers.
    if (item.platform === '其他' || item.platform === 'Other') {
         issues.push({
            ruleId: 'C-W3',
            level: 'warn',
            title: '平台名称为空',
            detail: '来源聚合失败',
            actionLabel: '去补充'
        });
    }

    // C-W4: Multiple Platforms (Warn) - Legacy Migration Check
    // Detected by checking specific notes from migration or comma separated values
    if ((item.notes && item.notes.includes('多选结构迁移')) || (item.platform && item.platform.includes(','))) {
        issues.push({ 
            ruleId: 'C-W4', 
            level: 'warn', 
            title: '一个素材包含多个平台', 
            detail: '后续迁移困难', 
            actionLabel: '拆分素材' 
        });
    }

    // C-I1: Title & Actors Empty (Info)
    if (!item.title && (!item.actors || item.actors.length === 0)) {
        issues.push({ 
            ruleId: 'C-I1', 
            level: 'info', 
            title: '未填写素材备注', 
            detail: '回顾困难', 
            actionLabel: '去补充' 
        });
    }

    // C-I2: XP Tags Empty (Info)
    if (!item.xpTags || item.xpTags.length === 0) {
        issues.push({ 
            ruleId: 'C-I2', 
            level: 'info', 
            title: '未添加性癖标签', 
            detail: '不参与偏好统计', 
            actionLabel: '去添加' 
        });
    } else {
        // C-I3: XP Tags Semantics Check (Info)
        // Check if any tag is flagged as 'state' or 'invalid' by validator
        const hasNoise = item.xpTags.some(t => {
            const res = validateTag(t, 'xp');
            // If Level is P0 or message contains specific keywords about state/result/emotion
            return res.level === 'P0' || (res.message && (res.message.includes('状态') || res.message.includes('结果')));
        });

        if (hasNoise) {
            issues.push({
                ruleId: 'C-I3',
                level: 'info',
                title: '标签可能混入非性癖内容',
                detail: 'XP 统计噪声',
                actionLabel: '去检查'
            });
        }
    }

    return issues;
};

export const checkDataHealth = (
    input: DataHealthDataset | LogEntry[],
    legacyPartners: PartnerProfile[] = []
): DataHealthReport => {
    const dataset: DataHealthDataset = Array.isArray(input) ? { logs: input, partners: legacyPartners } : input;
    const {
        logs,
        partners,
        tags = [],
        cycleEvents = [],
        pregnancyEvents = [],
        pornUseEvents = [],
        masturbationEvents = [],
        sexEvents = [],
        trainingGoals = [],
        goalCheckins = [],
        healthProjects = [],
        healthProjectPlans = [],
        healthProjectLogs = []
    } = dataset;
    const issues: HealthIssue[] = [];
    const partnerNames = new Set(partners.map(p => p.name));
    const partnerIds = new Set(partners.map(p => p.id));
    const trainingGoalIds = new Set(trainingGoals.map(goal => goal.id));
    const healthProjectIds = new Set(healthProjects.map(project => project.id));
    
    let missingSleep = 0;
    let missingHealth = 0;
    let nullArrays = 0;
    let brokenRelations = 0;
    let missingIds = 0;
    let trackedFields = 0;
    let recordedFields = 0;
    let missingFields = 0;
    
    const contentStats = {
        schemaErrors: 0,
        missingType: 0,
        missingPlatform: 0,
        migrationUnconfirmed: 0
    };

    const tableStats: Record<string, DataTableHealthStats> = {
        logs: createTableStats(logs.length),
        partners: createTableStats(partners.length),
        tags: createTableStats(tags.length),
        cycle_events: createTableStats(cycleEvents.length),
        pregnancy_events: createTableStats(pregnancyEvents.length),
        porn_use_events: createTableStats(pornUseEvents.length),
        masturbation_events: createTableStats(masturbationEvents.length),
        sex_events: createTableStats(sexEvents.length),
        training_goals: createTableStats(trainingGoals.length),
        goal_checkins: createTableStats(goalCheckins.length),
        health_projects: createTableStats(healthProjects.length),
        health_project_plans: createTableStats(healthProjectPlans.length),
        health_project_logs: createTableStats(healthProjectLogs.length)
    };

    const orphanRelationsByTable: Record<string, number> = {};

    const addTableIssue = (
        table: string,
        issue: HealthIssue,
        counts?: { missingId?: boolean; missingField?: boolean; brokenRelation?: boolean }
    ) => {
        issues.push(issue);
        const stats = tableStats[table] ?? (tableStats[table] = createTableStats(0));
        stats.issues++;
        if (counts?.missingId) stats.missingIds++;
        if (counts?.missingField) stats.missingFields++;
        if (counts?.brokenRelation) {
            stats.brokenRelations++;
            orphanRelationsByTable[table] = (orphanRelationsByTable[table] ?? 0) + 1;
        }
    };

    const checkRequiredFields = (
        table: string,
        record: unknown,
        index: number,
        fields: string[],
        displayName: string,
        date: string
    ) => {
        fields.forEach(field => {
            if (!hasValue(typeof record === 'object' && record !== null ? (record as Record<string, unknown>)[field] : undefined)) {
                const id = getStringField(record, 'id') ?? String(index);
                addTableIssue(table, {
                    id: `${table}_${id}_missing_${field}`,
                    date,
                    type: field === 'id' ? 'schema' : 'missing_field',
                    message: `${displayName} 缺少 ${field}`,
                    severity: field === 'id' ? 'high' : 'medium',
                    path: `${table}[${index}].${field}`
                }, { missingId: field === 'id', missingField: field !== 'id' });
            }
        });
    };

    const addRelationIssue = (
        table: string,
        sourceId: string,
        date: string,
        path: string,
        message: string
    ) => {
        brokenRelations++;
        addTableIssue(table, {
            id: `${table}_${sourceId}_${path}_orphan`,
            date,
            type: 'relation',
            message,
            severity: 'low',
            path
        }, { brokenRelation: true });
    };

    const analyticsAvailability: DataHealthReport['stats']['analyticsAvailability'] = {
        hardness: { usableSamples: 0, totalRecords: logs.length },
        sleep: { usableSamples: 0, totalRecords: logs.length },
        stress: { usableSamples: 0, totalRecords: logs.length },
        exercise: { usableSamples: 0, totalRecords: logs.length },
        alcohol: { usableSamples: 0, totalRecords: logs.length },
        masturbation: { usableSamples: 0, totalRecords: logs.length },
        sex: { usableSamples: 0, totalRecords: logs.length }
    };

    logs.forEach(log => {
        const quality = log.dataQuality || buildDataQualityForLog(log, 'migration');

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
        const checkArray = (arr: unknown, name: string) => {
            if (!Array.isArray(arr)) {
                issues.push({ id: `${log.date}_${name}_array`, date: log.date, type: 'schema', message: `${name} 数据格式错误(非数组)`, severity: 'high', path: name });
                nullArrays++;
            }
        };
        checkArray(log.exercise, 'exercise');
        checkArray(log.sex, 'sex');
        checkArray(log.masturbation, 'masturbation');

        // 4. Relations
        if (log.sex) {
            log.sex.forEach((sex, idx) => {
                if (sex.partner && !partnerNames.has(sex.partner)) {
                    brokenRelations++;
                    orphanRelationsByTable.logs = (orphanRelationsByTable.logs ?? 0) + 1;
                    issues.push({
                        id: `${log.date}_rel_${idx}_partner`,
                        date: log.date,
                        type: 'relation',
                        message: `引用不存在的伴侣: ${sex.partner}`,
                        severity: 'low',
                        path: `sex[${idx}].partner`
                    });
                }
                if (sex.interactions) {
                    sex.interactions.forEach((interaction, interactionIdx) => {
                        if (!interaction.partner || partnerNames.has(interaction.partner)) return;
                        brokenRelations++;
                        orphanRelationsByTable.logs = (orphanRelationsByTable.logs ?? 0) + 1;
                        issues.push({
                            id: `${log.date}_rel_${idx}_interaction_${interactionIdx}`,
                            date: log.date,
                            type: 'relation',
                            message: `引用不存在的伴侣: ${interaction.partner}`,
                            severity: 'low',
                            path: `sex[${idx}].interactions[${interactionIdx}].partner`
                        });
                    });
                }
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
                            const basePath = `masturbation[${mIdx}].contentItems[${cIdx}]`;
                            const specificPath = def.ruleId === 'C-W1' ? `${basePath}.type` :
                              def.ruleId === 'C-W2' ? `${basePath}.platform` : basePath;

                            issues.push({
                                id: `${log.date}_content_${mIdx}_${cIdx}_${def.ruleId}`,
                                date: log.date,
                                type: 'content',
                                severity,
                                message: def.title,
                                hintAction: def.actionLabel,
                                path: specificPath
                            });

                            if (def.ruleId === 'C-W1') contentStats.missingType++;
                            if (def.ruleId === 'C-W2') contentStats.missingPlatform++;
                            if (def.ruleId === 'C-E1') missingIds++;
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

        const qualityEntries = Object.values(quality.fields);
        trackedFields += qualityEntries.length;
        recordedFields += qualityEntries.filter(entry => entry.state === 'recorded' || entry.state === 'inferred' || entry.state === 'none').length;
        missingFields += qualityEntries.filter(entry => entry.state === 'not_recorded' || entry.state === 'unknown' || entry.state === 'defaulted').length;

        if (isFieldUsable(log, 'morning.hardness')) analyticsAvailability.hardness.usableSamples++;
        if (isFieldUsable(log, 'sleep.startTime') && isFieldUsable(log, 'sleep.endTime')) analyticsAvailability.sleep.usableSamples++;
        if (isFieldUsable(log, 'stressLevel')) analyticsAvailability.stress.usableSamples++;
        if (Array.isArray(log.exercise) && log.exercise.length > 0) analyticsAvailability.exercise.usableSamples++;
        if ((Array.isArray(log.alcoholRecords) && log.alcoholRecords.length > 0) || isFieldUsable(log, 'alcohol')) analyticsAvailability.alcohol.usableSamples++;
        if (Array.isArray(log.masturbation) && log.masturbation.length > 0) analyticsAvailability.masturbation.usableSamples++;
        if (Array.isArray(log.sex) && log.sex.length > 0) analyticsAvailability.sex.usableSamples++;
    });

    const scoreIssues = [...issues];
    tableStats.logs = {
        records: logs.length,
        issues: scoreIssues.filter(issue => !issue.path || !issue.path.includes('_events[')).length,
        missingIds,
        missingFields,
        brokenRelations
    };

    partners.forEach((partner, index) => {
        checkRequiredFields('partners', partner, index, ['id', 'name'], '伴侣', 'partners');
    });

    tags.forEach((tag, index) => {
        checkRequiredFields('tags', tag, index, ['name', 'category'], '标签', 'tags');
    });

    cycleEvents.forEach((event, index) => {
        checkRequiredFields('cycle_events', event, index, ['id', 'partnerId', 'date', 'kind', 'source'], '周期事件', event.date ?? 'cycle_events');
        if (event.partnerId && !partnerIds.has(event.partnerId)) {
            addRelationIssue('cycle_events', event.id || String(index), event.date, `cycle_events[${index}].partnerId`, `周期事件引用不存在的伴侣 ID: ${event.partnerId}`);
        }
    });

    pregnancyEvents.forEach((event, index) => {
        checkRequiredFields('pregnancy_events', event, index, ['id', 'partnerId', 'date', 'kind', 'source'], '怀孕事件', event.date ?? 'pregnancy_events');
        if (event.partnerId && !partnerIds.has(event.partnerId)) {
            addRelationIssue('pregnancy_events', event.id || String(index), event.date, `pregnancy_events[${index}].partnerId`, `怀孕事件引用不存在的伴侣 ID: ${event.partnerId}`);
        }
    });

    pornUseEvents.forEach((event, index) => {
        checkRequiredFields('porn_use_events', event, index, ['id', 'startedAt', 'targetDate', 'status', 'source'], '色情使用事件', event.targetDate ?? 'porn_use_events');
        if (!Array.isArray(event.contentTypes)) {
            addTableIssue('porn_use_events', {
                id: `${event.id || index}_contentTypes_array`,
                date: event.targetDate,
                type: 'schema',
                message: '色情使用事件 contentTypes 数据格式错误(非数组)',
                severity: 'high',
                path: `porn_use_events[${index}].contentTypes`
            });
        }
        if (!Array.isArray(event.sourceTypes)) {
            addTableIssue('porn_use_events', {
                id: `${event.id || index}_sourceTypes_array`,
                date: event.targetDate,
                type: 'schema',
                message: '色情使用事件 sourceTypes 数据格式错误(非数组)',
                severity: 'high',
                path: `porn_use_events[${index}].sourceTypes`
            });
        }
    });

    masturbationEvents.forEach((event, index) => {
        checkRequiredFields('masturbation_events', event, index, ['id', 'startedAt', 'targetDate', 'status', 'source'], '自慰事件', event.targetDate ?? 'masturbation_events');
    });

    sexEvents.forEach((event, index) => {
        checkRequiredFields('sex_events', event, index, ['id', 'startedAt', 'targetDate', 'status', 'source'], '性生活事件', event.targetDate ?? 'sex_events');
        if (!Array.isArray(event.partnerIds)) {
            addTableIssue('sex_events', {
                id: `${event.id || index}_partnerIds_array`,
                date: event.targetDate,
                type: 'schema',
                message: '性生活事件 partnerIds 数据格式错误(非数组)',
                severity: 'high',
                path: `sex_events[${index}].partnerIds`
            });
            return;
        }
        event.partnerIds.forEach(partnerId => {
            if (partnerId && !partnerIds.has(partnerId)) {
                addRelationIssue('sex_events', event.id || String(index), event.targetDate, `sex_events[${index}].partnerIds`, `性生活事件引用不存在的伴侣 ID: ${partnerId}`);
            }
        });
    });

    trainingGoals.forEach((goal, index) => {
        checkRequiredFields('training_goals', goal, index, ['id', 'createdAt', 'updatedAt', 'status', 'category', 'title', 'startDate', 'targetWindowDays', 'source'], '训练目标', goal.startDate ?? 'training_goals');
    });

    goalCheckins.forEach((checkin, index) => {
        checkRequiredFields('goal_checkins', checkin, index, ['id', 'goalId', 'createdAt', 'targetDate', 'status'], '目标签到', checkin.targetDate ?? 'goal_checkins');
        if (checkin.goalId && !trainingGoalIds.has(checkin.goalId)) {
            addRelationIssue('goal_checkins', checkin.id || String(index), checkin.targetDate, `goal_checkins[${index}].goalId`, `目标签到引用不存在的训练目标 ID: ${checkin.goalId}`);
        }
    });

    healthProjects.forEach((project, index) => {
        checkRequiredFields('health_projects', project, index, ['id', 'type', 'name', 'status', 'startDate', 'createdAt', 'updatedAt'], '健康项目', project.startDate ?? 'health_projects');
    });

    healthProjectPlans.forEach((plan, index) => {
        checkRequiredFields('health_project_plans', plan, index, ['id', 'projectId', 'scheduleType', 'startDate'], '健康项目计划', plan.startDate ?? 'health_project_plans');
        if (plan.projectId && !healthProjectIds.has(plan.projectId)) {
            addRelationIssue('health_project_plans', plan.id || String(index), plan.startDate, `health_project_plans[${index}].projectId`, `健康项目计划引用不存在的项目 ID: ${plan.projectId}`);
        }
    });

    healthProjectLogs.forEach((log, index) => {
        checkRequiredFields('health_project_logs', log, index, ['id', 'projectId', 'targetDate', 'status'], '健康项目日志', log.targetDate ?? 'health_project_logs');
        if (log.projectId && !healthProjectIds.has(log.projectId)) {
            addRelationIssue('health_project_logs', log.id || String(index), log.targetDate, `health_project_logs[${index}].projectId`, `健康项目日志引用不存在的项目 ID: ${log.projectId}`);
        }
    });

    let structureRawScore = 100;
    scoreIssues.forEach(i => {
        if (i.severity === 'high') structureRawScore -= 5;
        else if (i.severity === 'medium') structureRawScore -= 2;
        else structureRawScore -= 0.5;
    });
    const structureScore = Math.max(0, Math.floor(structureRawScore));
    const completenessScore = trackedFields === 0 ? 100 : Math.max(0, Math.floor((recordedFields / trackedFields) * 100));
    const analyticsRatios = Object.values(analyticsAvailability).map(item => (
        item.totalRecords === 0 ? 1 : item.usableSamples / item.totalRecords
    ));
    const analyticsScore = Math.max(0, Math.floor((analyticsRatios.reduce((sum, value) => sum + value, 0) / (analyticsRatios.length || 1)) * 100));
    const score = Math.round((structureScore + completenessScore + analyticsScore) / 3);

    return {
        timestamp: Date.now(),
        totalRecords: logs.length,
        score,
        scores: {
            structure: structureScore,
            completeness: completenessScore,
            analytics: analyticsScore
        },
        issues,
        stats: { 
            missingSleep, 
            missingHealth, 
            nullArrays, 
            brokenRelations, 
            missingIds,
            completeness: {
                trackedFields,
                recordedFields,
                missingFields
            },
            analyticsAvailability,
            contentIssues: contentStats,
            tableStats,
            orphanRelations: {
                total: Object.values(orphanRelationsByTable).reduce((sum, count) => sum + count, 0),
                byTable: orphanRelationsByTable
            }
        },
        canRepair: scoreIssues.some(i => i.type === 'schema' || i.message.includes('ID')),
        canCleanOrphanRelations: Object.values(orphanRelationsByTable).some(count => count > 0)
    };
};
