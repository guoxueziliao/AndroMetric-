import type { DataQualitySource, LogEntry } from '../types';
import { buildDataQualityForLog } from './dataQuality';

const cloneLog = (log: LogEntry): LogEntry => JSON.parse(JSON.stringify(log)) as LogEntry;

const hasValue = (value: unknown) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

const hasHistoryCategory = (log: LogEntry, category: string) => (
    Array.isArray(log.changeHistory)
    && log.changeHistory.some(entry => Array.isArray(entry.details) && entry.details.some(detail => detail.category === category))
);

const hasOnlyQuickOrAutoHistory = (log: LogEntry) => (
    Array.isArray(log.changeHistory)
    && log.changeHistory.length > 0
    && log.changeHistory.every(entry => entry.type === 'quick' || entry.type === 'auto')
);

const hasRecordedActivity = (log: LogEntry) => (
    (Array.isArray(log.exercise) && log.exercise.length > 0)
    || (Array.isArray(log.sex) && log.sex.length > 0)
    || (Array.isArray(log.masturbation) && log.masturbation.length > 0)
    || (Array.isArray(log.alcoholRecords) && log.alcoholRecords.length > 0)
    || (Array.isArray(log.sleep?.naps) && log.sleep!.naps.length > 0)
);

const isSyntheticMorningDefault = (log: LogEntry) => {
    const morning = log.morning;
    if (!morning) return false;
    return morning.wokeWithErection === true
        && morning.hardness === 3
        && morning.retention === 'normal'
        && morning.wokenByErection === false
        && (!hasValue(morning.durationImpression) || morning.durationImpression === 'brief');
};

const isSyntheticSleepDefault = (log: LogEntry) => {
    const sleep = log.sleep;
    if (!sleep) return false;
    return !hasValue(sleep.startTime)
        && !hasValue(sleep.endTime)
        && sleep.quality === 3
        && (!hasValue(sleep.attire) || sleep.attire === 'light')
        && (sleep.naturalAwakening === false || sleep.naturalAwakening === true)
        && sleep.nocturnalEmission === false
        && sleep.withPartner === false
        && (!hasValue(sleep.preSleepState) || sleep.preSleepState === 'calm')
        && (!Array.isArray(sleep.naps) || sleep.naps.length === 0)
        && sleep.hasDream === false
        && (!Array.isArray(sleep.dreamTypes) || sleep.dreamTypes.length === 0)
        && sleep.environment?.location === 'home'
        && sleep.environment?.temperature === 'comfortable';
};

const isDefaultHealthShell = (log: LogEntry) => {
    const health = log.health;
    if (!health) return false;
    return health.isSick === false
        && !hasValue(health.illnessType)
        && !hasValue(health.medicationTaken)
        && !hasValue(health.medicationName)
        && (!hasValue(health.feeling) || health.feeling === 'normal')
        && !hasValue(health.discomfortLevel)
        && (!Array.isArray(health.symptoms) || health.symptoms.length === 0)
        && (!Array.isArray(health.medications) || health.medications.length === 0);
};

const isLegacyShiftPlaceholder = (log: LogEntry) => (
    hasValue(log.alcohol) || hasValue(log.pornConsumption)
) && !hasRecordedActivity(log)
    && !hasValue(log.notes)
    && (!Array.isArray(log.dailyEvents) || log.dailyEvents.length === 0)
    && (!Array.isArray(log.changeHistory) || log.changeHistory.length === 0)
    && isSyntheticMorningDefault(log)
    && isSyntheticSleepDefault(log);

const scrubMorning = (log: LogEntry) => {
    if (!log.morning) return false;
    const morning = log.morning as unknown as Record<string, unknown>;
    delete morning.wokeWithErection;
    delete morning.hardness;
    delete morning.retention;
    delete morning.wokenByErection;
    delete morning.durationImpression;
    if (!hasValue(log.morning.wokeWithErection) && !hasValue(log.morning.hardness) && !hasValue(log.morning.retention)) {
        delete log.morning;
    }
    return true;
};

const scrubSleepShell = (log: LogEntry) => {
    if (!log.sleep) return false;
    const sleep = log.sleep as unknown as Record<string, unknown>;
    delete sleep.quality;
    delete sleep.attire;
    delete sleep.naturalAwakening;
    delete sleep.nocturnalEmission;
    delete sleep.withPartner;
    delete sleep.preSleepState;
    delete sleep.hasDream;
    delete sleep.dreamTypes;
    delete sleep.environment;
    if (!hasValue(log.sleep.startTime) && !hasValue(log.sleep.endTime) && (!Array.isArray(log.sleep.naps) || log.sleep.naps.length === 0)) {
        delete log.sleep;
    }
    return true;
};

const scrubHealthShell = (log: LogEntry) => {
    if (!log.health) return false;
    delete log.health;
    return true;
};

const scrubIncompleteMasturbationDefaults = (log: LogEntry) => {
    if (!Array.isArray(log.masturbation) || log.masturbation.length === 0) return false;
    let changed = false;
    log.masturbation = log.masturbation.map(record => {
        const shouldScrub = record.status === 'inProgress'
            || (record.duration === 0
                && (!Array.isArray(record.contentItems) || record.contentItems.length === 0)
                && !hasValue(record.notes));
        if (!shouldScrub) return record;
        changed = true;
        const nextRecord = { ...record } as unknown as Record<string, unknown>;
        delete nextRecord.orgasmIntensity;
        delete nextRecord.stressLevel;
        delete nextRecord.energyLevel;
        return nextRecord as unknown as typeof record;
    });
    return changed;
};

export const scrubHistoricalDefaultContamination = (
    log: LogEntry,
    source: DataQualitySource = 'repair'
): { log: LogEntry; changed: boolean; notes: string[] } => {
    const nextLog = cloneLog(log);
    const notes: string[] = [];
    let changed = false;

    const quickSkeletonPattern = hasRecordedActivity(nextLog)
        && hasOnlyQuickOrAutoHistory(nextLog)
        && !hasHistoryCategory(nextLog, 'morning')
        && !hasHistoryCategory(nextLog, 'sleep');

    if ((quickSkeletonPattern || isLegacyShiftPlaceholder(nextLog)) && isSyntheticMorningDefault(nextLog)) {
        scrubMorning(nextLog);
        changed = true;
        notes.push('清理历史晨间默认值');
    }

    if ((quickSkeletonPattern || isLegacyShiftPlaceholder(nextLog)) && isSyntheticSleepDefault(nextLog)) {
        scrubSleepShell(nextLog);
        changed = true;
        notes.push('清理历史睡眠默认值');
    }

    if (!hasHistoryCategory(nextLog, 'health') && isDefaultHealthShell(nextLog)) {
        scrubHealthShell(nextLog);
        changed = true;
        notes.push('清理历史健康默认壳');
    }

    if (scrubIncompleteMasturbationDefaults(nextLog)) {
        changed = true;
        notes.push('清理未完成自慰记录默认值');
    }

    if (changed) {
        nextLog.dataQuality = buildDataQualityForLog(nextLog, source);
    }

    return { log: nextLog, changed, notes };
};
