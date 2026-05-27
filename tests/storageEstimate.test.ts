import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertStorageCanCreateSnapshot,
  estimateStorage,
  formatBytes,
  getStorageQuotaLevel,
  notifyStorageUsageChanged,
  subscribeStorageUsageChanges
} from '../core/storage/storageEstimate';

const setStorageEstimate = (estimate?: () => Promise<{ usage?: number; quota?: number }>) => {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: estimate ? { estimate } : undefined
  });
};

describe('storageEstimate', () => {
  afterEach(() => {
    setStorageEstimate();
  });

  it('returns null when the browser storage estimate API is unavailable', async () => {
    setStorageEstimate();

    await expect(estimateStorage()).resolves.toBeNull();
  });

  it('normalizes storage usage estimates', async () => {
    setStorageEstimate(async () => ({ usage: 80, quota: 100 }));

    await expect(estimateStorage()).resolves.toEqual({
      usage: 80,
      quota: 100,
      ratio: 0.8
    });
  });

  it('classifies quota levels', () => {
    expect(getStorageQuotaLevel(0.79)).toBe('normal');
    expect(getStorageQuotaLevel(0.8)).toBe('warning');
    expect(getStorageQuotaLevel(0.95)).toBe('critical');
  });

  it('throws before creating snapshots at critical usage', async () => {
    setStorageEstimate(async () => ({ usage: 96, quota: 100 }));

    await expect(assertStorageCanCreateSnapshot()).rejects.toThrow('本地存储空间已用 96%');
  });

  it('does not throw when quota API is unavailable or usage is below critical', async () => {
    setStorageEstimate();
    await expect(assertStorageCanCreateSnapshot()).resolves.toBeUndefined();

    setStorageEstimate(async () => ({ usage: 80, quota: 100 }));
    await expect(assertStorageCanCreateSnapshot()).resolves.toBeUndefined();
  });

  it('formats byte values for display', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('notifies storage usage listeners', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeStorageUsageChanges(listener);

    notifyStorageUsageChanged('snapshot-created');
    unsubscribe();
    notifyStorageUsageChanged('log-saved');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('snapshot-created');
  });
});
