import type { LogEntry } from '../../domain';

export type ImportConflictResolution = 'keep-current' | 'use-import';

export interface LogImportConflict {
  date: string;
  field: keyof LogEntry;
  currentValue: string;
  incomingValue: string;
}

type LogConflictCandidate = Partial<LogEntry> & { date?: string };

const IGNORED_LOG_CONFLICT_FIELDS = new Set<keyof LogEntry>([
  'date',
  'status',
  'updatedAt',
  'dataQuality',
  'touchedPaths',
  'changeHistory'
]);

const isPresentValue = (value: unknown) => value !== undefined && value !== null;

const normalizeForCompare = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeForCompare);

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeForCompare((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
};

const stringifyForCompare = (value: unknown) => JSON.stringify(normalizeForCompare(value));

const formatConflictValue = (value: unknown) => {
  const normalized = normalizeForCompare(value);
  const text = typeof normalized === 'string' ? `"${normalized}"` : JSON.stringify(normalized);

  if (!text) return String(value);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const getComparableKeys = (incoming: LogConflictCandidate) => (
  Object.keys(incoming).filter((key): key is keyof LogEntry => (
    !IGNORED_LOG_CONFLICT_FIELDS.has(key as keyof LogEntry)
  ))
);

export const computeLogConflicts = (
  currentLogs: LogConflictCandidate[],
  incomingLogs: LogConflictCandidate[]
): LogImportConflict[] => {
  const currentByDate = new Map(
    currentLogs
      .filter((log): log is LogConflictCandidate & { date: string } => typeof log.date === 'string')
      .map((log) => [log.date, log])
  );

  return incomingLogs.flatMap((incoming) => {
    if (typeof incoming.date !== 'string') return [];

    const date = incoming.date;
    const current = currentByDate.get(incoming.date);
    if (!current) return [];

    return getComparableKeys(incoming).flatMap((field) => {
      const currentValue = current[field];
      const incomingValue = incoming[field];
      if (!isPresentValue(currentValue) || !isPresentValue(incomingValue)) return [];
      if (stringifyForCompare(currentValue) === stringifyForCompare(incomingValue)) return [];

      return [{
        date,
        field,
        currentValue: formatConflictValue(currentValue),
        incomingValue: formatConflictValue(incomingValue)
      }];
    });
  });
};

export const mergeLogEntryForImport = (
  current: LogEntry,
  incoming: LogEntry,
  conflictResolution: ImportConflictResolution
) => {
  const merged = { ...current, ...incoming } as LogEntry;
  const mutableMerged = merged as Record<keyof LogEntry, unknown>;

  for (const field of Object.keys(incoming) as Array<keyof LogEntry>) {
    if (incoming[field] === undefined) {
      mutableMerged[field] = current[field];
    }
  }

  if (conflictResolution === 'keep-current') {
    for (const conflict of computeLogConflicts([current], [incoming])) {
      mutableMerged[conflict.field] = current[conflict.field];
    }
  }

  return merged;
};

export const mergeLogsForImport = (
  currentLogs: LogEntry[],
  incomingLogs: LogEntry[],
  conflictResolution: ImportConflictResolution
) => {
  const currentByDate = new Map(currentLogs.map((log) => [log.date, log]));

  return incomingLogs.map((incoming) => {
    const current = currentByDate.get(incoming.date);
    return current ? mergeLogEntryForImport(current, incoming, conflictResolution) : incoming;
  });
};
