import { useEffect } from 'react';
import {
  estimateStorage,
  getStorageQuotaLevel,
  notifyStorageUsageChanged,
  subscribeStorageUsageChanges,
  type StorageUsageChangeReason
} from '../../../core/storage';
import { useToast } from '../../../contexts/ToastContext';

const STARTUP_CHECK_DELAY_MS = 5_000;
const LOG_SAVE_DEBOUNCE_MS = 60_000;
const WARNING_DEDUP_MS = 24 * 60 * 60 * 1000;
const WARNING_TOAST_META_KEY = 'storageQuotaWarningToastAt';

const getLastWarningAt = () => {
  try {
    const value = localStorage.getItem(WARNING_TOAST_META_KEY);
    const timestamp = value ? Number(value) : 0;
    return Number.isFinite(timestamp) ? timestamp : 0;
  } catch {
    return 0;
  }
};

const setLastWarningAt = (timestamp: number) => {
  try {
    localStorage.setItem(WARNING_TOAST_META_KEY, String(timestamp));
  } catch {
    // Ignore unavailable localStorage; quota checks should remain best-effort.
  }
};

const clearLastWarningAt = () => {
  try {
    localStorage.removeItem(WARNING_TOAST_META_KEY);
  } catch {
    // Ignore unavailable localStorage.
  }
};

export const useStorageQuotaMonitor = () => {
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    let logSaveTimer: number | undefined;

    const runCheck = async () => {
      const estimate = await estimateStorage();
      if (cancelled || !estimate) return;

      const percent = Math.round(estimate.ratio * 100);
      const level = getStorageQuotaLevel(estimate.ratio);

      if (level === 'normal') {
        clearLastWarningAt();
        return;
      }

      if (level === 'critical') {
        showToast(`本地存储已用 ${percent}%，请尽快导出并清理旧快照`, 'error');
        return;
      }

      const now = Date.now();
      if (now - getLastWarningAt() >= WARNING_DEDUP_MS) {
        setLastWarningAt(now);
        showToast(`本地存储已用 ${percent}%，建议导出后清理旧快照`, 'info');
      }
    };

    const scheduleCheck = (reason: StorageUsageChangeReason) => {
      if (reason !== 'log-saved') {
        runCheck().catch(() => {});
        return;
      }

      if (logSaveTimer !== undefined) return;
      logSaveTimer = window.setTimeout(() => {
        logSaveTimer = undefined;
        runCheck().catch(() => {});
      }, LOG_SAVE_DEBOUNCE_MS);
    };

    const startupTimer = window.setTimeout(() => {
      notifyStorageUsageChanged('startup');
    }, STARTUP_CHECK_DELAY_MS);

    const unsubscribe = subscribeStorageUsageChanges(scheduleCheck);

    return () => {
      cancelled = true;
      window.clearTimeout(startupTimer);
      if (logSaveTimer !== undefined) window.clearTimeout(logSaveTimer);
      unsubscribe();
    };
  }, [showToast]);
};
