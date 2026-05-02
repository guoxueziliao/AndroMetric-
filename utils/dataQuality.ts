import type {
    AlcoholRecord,
    CaffeineItem,
    DataQuality,
    DataQualitySource,
    DataQualityState,
    ExerciseRecord,
    FieldQuality,
    LogEntry,
    MasturbationRecordDetails,
    NapRecord,
    SexRecordDetails
} from '../types';

export const DATA_QUALITY_VERSION = 1;

const SCALAR_FIELD_PATHS = [
    'morning.wokeWithErection',
    'morning.hardness',
    'morning.retention',
    'morning.wokenByErection',
    'sleep.startTime',
    'sleep.endTime',
    'sleep.quality',
    'sleep.attire',
    'sleep.naturalAwakening',
    'sleep.nocturnalEmission',
    'sleep.withPartner',
    'sleep.preSleepState',
    'sleep.hasDream',
    'sleep.dreamTypes',
    'sleep.environment.location',
    'sleep.environment.temperature',
    'health.isSick',
    'health.discomfortLevel',
    'health.symptoms',
    'health.medications',
    'screenTime.totalMinutes',
    'screenTime.notes',
    'menstrual.partnerId',
    'menstrual.status',
    'menstrual.cycleDay',
    'menstrual.predictedPeriod',
    'menstrual.predictedFertileWindow',
    'menstrual.notes',
    'location',
    'weather',
    'mood',
    'stressLevel',
    'alcohol',
    'pornConsumption',
    'caffeineRecord.totalCount',
    'dailyEvents',
    'notes'
] as const;

const ARRAY_ROOT_PATHS = [
    'sleep.naps',
    'exercise',
    'sex',
    'masturbation',
    'alcoholRecords',
    'caffeineRecord.items',
    'supplements'
] as const;

const DISPLAY_DEFAULT_PATHS = new Set<string>([
    'morning.wokeWithErection',
    'morning.hardness',
    'morning.retention',
    'morning.wokenByErection',
    'sleep.quality',
    'sleep.naturalAwakening',
    'sleep.nocturnalEmission',
    'sleep.withPartner',
    'sleep.hasDream',
    'sleep.dreamTypes',
    'sleep.environment.location',
    'sleep.environment.temperature',
    'health.isSick',
    'health.symptoms',
    'health.medications',
    'caffeineRecord.totalCount'
]);

const RECORDED_STATES = new Set<DataQualityState>(['recorded', 'inferred', 'none']);

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const cloneLog = (log: LogEntry): LogEntry => JSON.parse(JSON.stringify(log)) as LogEntry;

export const hasFieldValue = (value: unknown): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

export const getPathValue = (source: unknown, path: string): unknown => {
    const parts = path.split('.');
    let current: unknown = source;

    for (const part of parts) {
        if (Array.isArray(current)) {
            current = current.find(item => isRecord(item) && item.id === part);
        } else if (isRecord(current)) {
            current = current[part];
        } else {
            return undefined;
        }
    }

    return current;
};

const fieldQuality = (
    state: DataQualityState,
    source: DataQualitySource,
    now: number,
    confidence?: number
): FieldQuality => ({
    state,
    source,
    confidence: confidence ?? (state === 'recorded' ? 1 : state === 'inferred' ? 0.75 : state === 'defaulted' ? 0 : undefined),
    updatedAt: now
});

const stateForValue = (value: unknown): DataQualityState => {
    if (!hasFieldValue(value)) return 'not_recorded';
    return 'recorded';
};

const stateForTouchedValue = (value: unknown): DataQualityState => {
    if (!hasFieldValue(value)) return 'none';
    return 'recorded';
};

const addArrayRootQuality = (
    fields: Record<string, FieldQuality>,
    path: string,
    items: unknown,
    source: DataQualitySource,
    now: number
) => {
    fields[path] = fieldQuality(Array.isArray(items) && items.length > 0 ? 'recorded' : 'not_recorded', source, now);
};

const addRecordFields = (
    fields: Record<string, FieldQuality>,
    root: string,
    record: UnknownRecord,
    keys: string[],
    source: DataQualitySource,
    now: number
) => {
    const id = typeof record.id === 'string' || typeof record.id === 'number' ? String(record.id) : '';
    if (!id) return;

    keys.forEach(key => {
        const path = `${root}.${id}.${key}`;
        fields[path] = fieldQuality(stateForValue(record[key]), source, now);
    });
};

const addArrayItemQualities = (
    log: LogEntry,
    fields: Record<string, FieldQuality>,
    source: DataQualitySource,
    now: number
) => {
    (log.sleep?.naps || []).forEach((record: NapRecord) => addRecordFields(
        fields,
        'sleep.naps',
        record as unknown as UnknownRecord,
        ['startTime', 'endTime', 'duration', 'quality', 'hardness'],
        source,
        now
    ));

    (log.exercise || []).forEach((record: ExerciseRecord) => addRecordFields(
        fields,
        'exercise',
        record as unknown as UnknownRecord,
        ['type', 'startTime', 'duration', 'intensity', 'steps', 'feeling'],
        source,
        now
    ));

    (log.sex || []).forEach((record: SexRecordDetails) => addRecordFields(
        fields,
        'sex',
        record as unknown as UnknownRecord,
        ['startTime', 'duration', 'partner', 'protection', 'ejaculation', 'partnerScore', 'mood'],
        source,
        now
    ));

    (log.masturbation || []).forEach((record: MasturbationRecordDetails) => addRecordFields(
        fields,
        'masturbation',
        record as unknown as UnknownRecord,
        ['startTime', 'duration', 'status', 'ejaculation', 'orgasmIntensity', 'satisfactionLevel', 'stressLevel', 'energyLevel', 'fatigue'],
        source,
        now
    ));

    (log.alcoholRecords || []).forEach((record: AlcoholRecord) => addRecordFields(
        fields,
        'alcoholRecords',
        record as unknown as UnknownRecord,
        ['totalGrams', 'durationMinutes', 'isLate', 'time', 'drunkLevel'],
        source,
        now
    ));

    (log.caffeineRecord?.items || []).forEach((record: CaffeineItem) => addRecordFields(
        fields,
        'caffeineRecord.items',
        record as unknown as UnknownRecord,
        ['name', 'volume', 'time', 'count', 'isDaily'],
        source,
        now
    ));

    (log.supplements || []).forEach((record) => addRecordFields(
        fields,
        'supplements',
        record as unknown as UnknownRecord,
        ['name', 'taken', 'notes'],
        source,
        now
    ));
};

export const buildDataQualityForLog = (
    log: LogEntry,
    source: DataQualitySource = 'migration',
    now: number = Date.now()
): DataQuality => {
    const fields: Record<string, FieldQuality> = {};

    SCALAR_FIELD_PATHS.forEach(path => {
        fields[path] = fieldQuality(stateForValue(getPathValue(log, path)), source, now);
    });

    ARRAY_ROOT_PATHS.forEach(path => {
        addArrayRootQuality(fields, path, getPathValue(log, path), source, now);
    });

    addArrayItemQualities(log, fields, source, now);

    const partial = Object.values(fields).some(field => field.state === 'not_recorded' || field.state === 'unknown');

    return {
        version: DATA_QUALITY_VERSION,
        source,
        partial,
        fields,
        updatedAt: now
    };
};

const mergeFields = (
    base: Record<string, FieldQuality>,
    next: Record<string, FieldQuality>
): Record<string, FieldQuality> => ({
    ...base,
    ...next
});

const collectTouchedPaths = (log: LogEntry): Set<string> => new Set(log.touchedPaths || []);

const valueForTouchedPath = (log: LogEntry, path: string): unknown => getPathValue(log, path);

const markTouchedPath = (
    log: LogEntry,
    fields: Record<string, FieldQuality>,
    path: string,
    source: DataQualitySource,
    now: number
) => {
    const value = valueForTouchedPath(log, path);
    fields[path] = fieldQuality(stateForTouchedValue(value), source, now);

    if (path === 'morning.wokeWithErection' && value === false) {
        fields['morning.hardness'] = fieldQuality('none', source, now);
        fields['morning.retention'] = fieldQuality('none', source, now);
        fields['morning.wokenByErection'] = fieldQuality('none', source, now);
    }

    if (path === 'exercise' || path === 'sex' || path === 'masturbation' || path === 'alcoholRecords' || path === 'sleep.naps' || path === 'caffeineRecord.items' || path === 'supplements') {
        const generated = buildDataQualityForLog(log, source, now).fields;
        Object.entries(generated).forEach(([generatedPath, quality]) => {
            if (generatedPath === path || generatedPath.startsWith(`${path}.`)) {
                fields[generatedPath] = quality;
            }
        });
    }
};

export const applyTouchedPathsToQuality = (
    log: LogEntry,
    source: DataQualitySource = 'manual',
    now: number = Date.now()
): DataQuality => {
    const current = log.dataQuality || buildDataQualityForLog(log, source, now);
    const fields = mergeFields(current.fields, {});
    collectTouchedPaths(log).forEach(path => markTouchedPath(log, fields, path, source, now));

    return {
        version: DATA_QUALITY_VERSION,
        source,
        partial: Object.values(fields).some(field => field.state === 'not_recorded' || field.state === 'unknown'),
        fields,
        updatedAt: now
    };
};

const shouldStripDefault = (log: LogEntry, path: string, touchedPaths: Set<string>) => {
    const quality = log.dataQuality?.fields?.[path];
    return DISPLAY_DEFAULT_PATHS.has(path) && quality?.state === 'defaulted' && !touchedPaths.has(path);
};

const deletePathValue = (target: LogEntry, path: string) => {
    const parts = path.split('.');
    let current: unknown = target;

    for (let index = 0; index < parts.length - 1; index++) {
        const part = parts[index];
        if (!isRecord(current)) return;
        current = current[part];
    }

    if (isRecord(current)) {
        delete current[parts[parts.length - 1]];
    }
};

const pruneEmptyObjects = (log: LogEntry) => {
    const morning = log.morning as unknown as UnknownRecord | undefined;
    if (morning && !hasFieldValue(morning.wokeWithErection) && !hasFieldValue(morning.hardness) && !hasFieldValue(morning.retention) && !hasFieldValue(morning.wokenByErection)) {
        delete log.morning;
    }

    const sleep = log.sleep as unknown as UnknownRecord | undefined;
    if (sleep) {
        const naps = Array.isArray(log.sleep?.naps) ? log.sleep.naps : [];
        if (!hasFieldValue(sleep.startTime) && !hasFieldValue(sleep.endTime) && !hasFieldValue(sleep.quality) && naps.length === 0) {
            delete log.sleep;
        }
    }

    const health = log.health as unknown as UnknownRecord | undefined;
    if (health && !hasFieldValue(health.isSick) && !hasFieldValue(health.discomfortLevel) && !hasFieldValue(health.symptoms) && !hasFieldValue(health.medications)) {
        delete log.health;
    }

    const screenTime = log.screenTime as unknown as UnknownRecord | undefined;
    if (screenTime && !hasFieldValue(screenTime.totalMinutes) && !hasFieldValue(screenTime.notes)) {
        delete log.screenTime;
    }

    const menstrual = log.menstrual as unknown as UnknownRecord | undefined;
    if (
        menstrual
        && !hasFieldValue(menstrual.partnerId)
        && !hasFieldValue(menstrual.status)
        && !hasFieldValue(menstrual.cycleDay)
        && !hasFieldValue(menstrual.predictedPeriod)
        && !hasFieldValue(menstrual.predictedFertileWindow)
        && !hasFieldValue(menstrual.notes)
    ) {
        delete log.menstrual;
    }
};

export const prepareLogForSave = (
    log: LogEntry,
    source: DataQualitySource = 'manual',
    now: number = Date.now()
): LogEntry => {
    const cleaned = cloneLog(log);
    const touchedPaths = collectTouchedPaths(cleaned);

    DISPLAY_DEFAULT_PATHS.forEach(path => {
        if (shouldStripDefault(cleaned, path, touchedPaths)) {
            deletePathValue(cleaned, path);
        }
    });

    pruneEmptyObjects(cleaned);

    const baseQuality = buildDataQualityForLog(cleaned, source, now);
    cleaned.dataQuality = {
        ...applyTouchedPathsToQuality({ ...cleaned, dataQuality: baseQuality, touchedPaths: [...touchedPaths] }, source, now),
        source
    };
    delete cleaned.touchedPaths;

    return cleaned;
};

export const markDisplayDefaults = (log: LogEntry, raw: unknown, now: number = Date.now()): DataQuality => {
    const base = log.dataQuality || buildDataQualityForLog(log, 'migration', now);
    const fields = { ...base.fields };

    DISPLAY_DEFAULT_PATHS.forEach(path => {
        if (!hasFieldValue(getPathValue(raw, path)) && hasFieldValue(getPathValue(log, path))) {
            fields[path] = fieldQuality('defaulted', 'display_default', now, 0);
        }
    });

    return {
        version: DATA_QUALITY_VERSION,
        source: base.source,
        partial: Object.values(fields).some(field => field.state === 'not_recorded' || field.state === 'unknown' || field.state === 'defaulted'),
        fields,
        updatedAt: now
    };
};

export const isFieldUsable = (log: LogEntry, path: string): boolean => {
    const quality = log.dataQuality?.fields?.[path];
    if (!quality) return hasFieldValue(getPathValue(log, path));
    return RECORDED_STATES.has(quality.state) && quality.state !== 'none' && hasFieldValue(getPathValue(log, path));
};

export const isExplicitNone = (log: LogEntry, path: string): boolean => log.dataQuality?.fields?.[path]?.state === 'none';

export const getKnownFieldPaths = (log: LogEntry): string[] => Object.keys((log.dataQuality || buildDataQualityForLog(log)).fields);
