import { useEffect } from 'react';
import type { BackupScheduleSettings } from '../../../domain';
import { Logger, normalizeBackupSchedule, StorageService } from '../../../core/storage';

interface UseAutoBackupParams {
  isInitializing: boolean;
  logsCount: number;
  backupSchedule?: BackupScheduleSettings;
}

const IDLE_TIMEOUT_MS = 5_000;

const scheduleIdleTask = (callback: () => void) => {
  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, 1_000);
  return () => window.clearTimeout(timeoutId);
};

export const useAutoBackup = ({ isInitializing, logsCount, backupSchedule }: UseAutoBackupParams) => {
  const schedule = normalizeBackupSchedule(backupSchedule);

  useEffect(() => {
    if (isInitializing || logsCount === 0 || !schedule.enabled) return;

    let cancelled = false;
    let cancelScheduledTask: (() => void) | undefined;
    let timerId: number | undefined;

    const createWhenIdle = () => {
      cancelScheduledTask = scheduleIdleTask(() => {
        if (cancelled) return;
        StorageService.snapshots.createIdleAutoBackup(schedule.intervalHours).catch((error) => {
          Logger.warn('AutoBackup:IdleSnapshotFailed', error);
        });
      });
    };

    StorageService.snapshots.getIdleAutoBackupStatus(schedule.intervalHours)
      .then((status) => {
        if (cancelled || !status.hasLogs) return;

        if (status.shouldCreate) {
          createWhenIdle();
          return;
        }

        if (status.delayMs > 0) {
          timerId = window.setTimeout(createWhenIdle, status.delayMs);
        }
      })
      .catch((error) => {
        Logger.warn('AutoBackup:StatusCheckFailed', error);
      });

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearTimeout(timerId);
      cancelScheduledTask?.();
    };
  }, [isInitializing, logsCount, schedule.enabled, schedule.intervalHours]);
};
