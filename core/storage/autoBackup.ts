import type { AutoBackupIntervalHours, BackupScheduleSettings } from '../../domain';

export const LAST_AUTO_BACKUP_META_KEY = 'lastAutoBackupAt';
export const DEFAULT_AUTO_BACKUP_INTERVAL_HOURS: AutoBackupIntervalHours = 24;
export const AUTO_BACKUP_INTERVAL_HOUR_OPTIONS: AutoBackupIntervalHours[] = [6, 12, 24, 48];
export const AUTO_BACKUP_INTERVAL_MS = DEFAULT_AUTO_BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;

export const normalizeAutoBackupIntervalHours = (value: unknown): AutoBackupIntervalHours => (
  AUTO_BACKUP_INTERVAL_HOUR_OPTIONS.includes(value as AutoBackupIntervalHours)
    ? value as AutoBackupIntervalHours
    : DEFAULT_AUTO_BACKUP_INTERVAL_HOURS
);

export const normalizeBackupSchedule = (value: unknown): BackupScheduleSettings => {
  if (typeof value !== 'object' || value === null) {
    return { enabled: true, intervalHours: DEFAULT_AUTO_BACKUP_INTERVAL_HOURS };
  }

  const schedule = value as Partial<BackupScheduleSettings>;
  return {
    enabled: schedule.enabled !== false,
    intervalHours: normalizeAutoBackupIntervalHours(schedule.intervalHours)
  };
};

export const getAutoBackupIntervalMs = (intervalHours: unknown) => (
  normalizeAutoBackupIntervalHours(intervalHours) * 60 * 60 * 1000
);

interface IdleAutoBackupCheckInput {
  hasLogs: boolean;
  lastAutoBackupAt?: number | null;
  intervalHours?: unknown;
  now?: number;
}

export interface IdleAutoBackupStatus {
  hasLogs: boolean;
  lastAutoBackupAt: number | null;
  shouldCreate: boolean;
  delayMs: number;
}

const isValidTimestamp = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0
);

export const normalizeAutoBackupTimestamp = (value: unknown) => (
  isValidTimestamp(value) ? value : null
);

export const shouldCreateIdleAutoBackup = ({
  hasLogs,
  lastAutoBackupAt,
  intervalHours,
  now = Date.now()
}: IdleAutoBackupCheckInput) => {
  if (!hasLogs) return false;
  if (!lastAutoBackupAt) return true;
  return now - lastAutoBackupAt >= getAutoBackupIntervalMs(intervalHours);
};

export const getIdleAutoBackupStatus = ({
  hasLogs,
  lastAutoBackupAt,
  intervalHours,
  now = Date.now()
}: IdleAutoBackupCheckInput): IdleAutoBackupStatus => {
  const normalizedLastAutoBackupAt = normalizeAutoBackupTimestamp(lastAutoBackupAt);
  const intervalMs = getAutoBackupIntervalMs(intervalHours);
  const shouldCreate = shouldCreateIdleAutoBackup({
    hasLogs,
    lastAutoBackupAt: normalizedLastAutoBackupAt,
    intervalHours,
    now
  });
  const delayMs = hasLogs && normalizedLastAutoBackupAt && !shouldCreate
    ? Math.max(0, normalizedLastAutoBackupAt + intervalMs - now)
    : 0;

  return {
    hasLogs,
    lastAutoBackupAt: normalizedLastAutoBackupAt,
    shouldCreate,
    delayMs
  };
};
