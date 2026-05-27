export interface StorageEstimateInfo {
  usage: number;
  quota: number;
  ratio: number;
}

export type StorageQuotaLevel = 'normal' | 'warning' | 'critical';
export type StorageUsageChangeReason = 'startup' | 'snapshot-created' | 'log-saved';

type StorageUsageListener = (reason: StorageUsageChangeReason) => void;

const WARNING_THRESHOLD = 0.8;
const CRITICAL_THRESHOLD = 0.95;

const listeners = new Set<StorageUsageListener>();

export const getStorageQuotaLevel = (ratio: number): StorageQuotaLevel => {
  if (ratio >= CRITICAL_THRESHOLD) return 'critical';
  if (ratio >= WARNING_THRESHOLD) return 'warning';
  return 'normal';
};

export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** exponent);
  return `${value >= 10 || exponent === 0 ? Math.round(value) : Math.round(value * 10) / 10} ${units[exponent]}`;
};

export const estimateStorage = async (): Promise<StorageEstimateInfo | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;

  const estimate = await navigator.storage.estimate();
  const usage = typeof estimate.usage === 'number' ? estimate.usage : 0;
  const quota = typeof estimate.quota === 'number' ? estimate.quota : 0;

  if (quota <= 0) return null;

  return {
    usage,
    quota,
    ratio: Math.min(1, usage / quota)
  };
};

export const assertStorageCanCreateSnapshot = async () => {
  const estimate = await estimateStorage();
  if (!estimate || getStorageQuotaLevel(estimate.ratio) !== 'critical') return;

  throw new Error(`本地存储空间已用 ${Math.round(estimate.ratio * 100)}%，请先导出并清理旧快照`);
};

export const subscribeStorageUsageChanges = (listener: StorageUsageListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notifyStorageUsageChanged = (reason: StorageUsageChangeReason) => {
  listeners.forEach((listener) => listener(reason));
};
