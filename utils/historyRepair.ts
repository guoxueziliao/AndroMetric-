import { LogEntry } from '../types';
import { buildDataQualityForLog } from './dataQuality';
import { scrubHistoricalDefaultContamination } from './legacyDataCleanup';

const ensureArray = <T>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

const cloneLog = (log: LogEntry): LogEntry => JSON.parse(JSON.stringify(log)) as LogEntry;

const ensureId = (prefix: string, currentId: unknown, fallbackSeed: string) => {
    if (typeof currentId === 'string' && currentId.trim().length > 0) return currentId;
    return `${prefix}_${fallbackSeed}`;
};

/**
 * Structural-only repair for persisted logs.
 * It never invents factual values such as hardness, sleep quality, stress, or illness.
 */
export const repairLogUsingHistory = (log: LogEntry): { log: LogEntry; repaired: boolean } => {
    const newLog = cloneLog(log);
    let repaired = false;

    if (!newLog.dataQuality) {
        newLog.dataQuality = buildDataQualityForLog(newLog, 'repair');
        repaired = true;
    }

    if (newLog.morning) {
        const nextId = ensureId('mr', newLog.morning.id, `${newLog.date}_${Date.now()}`);
        if (nextId !== newLog.morning.id) {
            newLog.morning.id = nextId;
            repaired = true;
        }
    }

    if (newLog.sleep) {
        const nextId = ensureId('sr', newLog.sleep.id, `${newLog.date}_${Date.now()}`);
        if (nextId !== newLog.sleep.id) {
            newLog.sleep.id = nextId;
            repaired = true;
        }
        if (!Array.isArray(newLog.sleep.naps)) {
            newLog.sleep.naps = [];
            repaired = true;
        }
    }

    if (!Array.isArray(newLog.exercise)) {
        newLog.exercise = [];
        repaired = true;
    }

    if (!Array.isArray(newLog.sex)) {
        newLog.sex = [];
        repaired = true;
    }

    if (!Array.isArray(newLog.masturbation)) {
        newLog.masturbation = [];
        repaired = true;
    }

    if (!Array.isArray(newLog.alcoholRecords)) {
        newLog.alcoholRecords = [];
        repaired = true;
    }

    if (!Array.isArray(newLog.changeHistory)) {
        newLog.changeHistory = [];
        repaired = true;
    }

    newLog.exercise = ensureArray(newLog.exercise).map((record, index) => {
        const nextId = ensureId('ex', record.id, `${newLog.date}_${index}`);
        if (nextId !== record.id) {
            repaired = true;
            return { ...record, id: nextId };
        }
        return record;
    });

    newLog.sex = ensureArray(newLog.sex).map((record, index) => {
        let nextRecord = record;
        const updates: Record<string, unknown> = {};
        const nextId = ensureId('sex', record.id, `${newLog.date}_${index}`);
        if (nextId !== record.id) {
            updates.id = nextId;
        }
        if (!Array.isArray(record.interactions)) {
            updates.interactions = [];
        }
        if (Object.keys(updates).length > 0) {
            repaired = true;
            nextRecord = { ...record, ...updates };
        }
        return nextRecord;
    });

    newLog.masturbation = ensureArray(newLog.masturbation).map((record, index) => {
        const updates: Record<string, unknown> = {};
        const nextId = ensureId('mb', record.id, `${newLog.date}_${index}`);
        if (nextId !== record.id) {
            updates.id = nextId;
        }
        if (!Array.isArray(record.contentItems)) {
            updates.contentItems = [];
        }
        if (!Array.isArray(record.tools)) {
            updates.tools = [];
        }
        if (!Array.isArray(record.interruptionReasons)) {
            updates.interruptionReasons = [];
        }
        if (Object.keys(updates).length > 0) {
            repaired = true;
            return { ...record, ...updates };
        }
        return record;
    });

    newLog.alcoholRecords = ensureArray(newLog.alcoholRecords).map((record, index) => {
        const nextId = ensureId('alc', record.id, `${newLog.date}_${index}`);
        if (nextId !== record.id) {
            repaired = true;
            return { ...record, id: nextId };
        }
        return record;
    });

    const historicalCleanup = scrubHistoricalDefaultContamination(newLog, 'repair');
    if (historicalCleanup.changed) {
        repaired = true;
        newLog.morning = historicalCleanup.log.morning;
        newLog.sleep = historicalCleanup.log.sleep;
        newLog.health = historicalCleanup.log.health;
        newLog.masturbation = historicalCleanup.log.masturbation;
        newLog.dataQuality = historicalCleanup.log.dataQuality;
    }

    if (repaired) {
        newLog.dataQuality = buildDataQualityForLog(newLog, 'repair');
        newLog.changeHistory = [
            ...(newLog.changeHistory || []),
            {
                timestamp: Date.now(),
                summary: historicalCleanup.changed ? '系统修复: 结构规范化并清理历史默认值' : '系统修复: 结构规范化',
                type: 'auto',
                fieldPath: 'system.repair',
                operation: 'repair',
                actor: 'system',
                source: 'repair',
                confidence: 'recorded'
            }
        ];
    }

    return { log: newLog, repaired };
};
