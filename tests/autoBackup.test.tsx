import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTO_BACKUP_INTERVAL_MS,
  getIdleAutoBackupStatus,
  normalizeBackupSchedule,
  shouldCreateIdleAutoBackup
} from '../core/storage/autoBackup';
import { useAutoBackup } from '../features/backup/model/useAutoBackup';

const storageMocks = vi.hoisted(() => ({
  getIdleAutoBackupStatus: vi.fn(),
  createIdleAutoBackup: vi.fn(),
  warn: vi.fn()
}));

vi.mock('../core/storage', () => ({
  StorageService: {
    snapshots: {
      getIdleAutoBackupStatus: storageMocks.getIdleAutoBackupStatus,
      createIdleAutoBackup: storageMocks.createIdleAutoBackup
    }
  },
  normalizeBackupSchedule: (value: { enabled?: boolean; intervalHours?: number } | undefined) => ({
    enabled: value?.enabled !== false,
    intervalHours: [6, 12, 24, 48].includes(value?.intervalHours ?? 24) ? value?.intervalHours ?? 24 : 24
  }),
  Logger: {
    warn: storageMocks.warn
  }
}));

const AutoBackupHarness = ({
  isInitializing = false,
  logsCount = 1,
  backupSchedule
}: {
  isInitializing?: boolean;
  logsCount?: number;
  backupSchedule?: { enabled: boolean; intervalHours: 6 | 12 | 24 | 48 };
}) => {
  useAutoBackup({ isInitializing, logsCount, backupSchedule });
  return null;
};

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('idle auto backup decisions', () => {
  it('skips empty databases and creates only after the 24 hour threshold', () => {
    const now = 1_798_000_000_000;

    expect(shouldCreateIdleAutoBackup({ hasLogs: false, lastAutoBackupAt: null, now })).toBe(false);
    expect(shouldCreateIdleAutoBackup({ hasLogs: true, lastAutoBackupAt: null, now })).toBe(true);
    expect(shouldCreateIdleAutoBackup({
      hasLogs: true,
      lastAutoBackupAt: now - AUTO_BACKUP_INTERVAL_MS,
      now
    })).toBe(true);
    expect(shouldCreateIdleAutoBackup({
      hasLogs: true,
      lastAutoBackupAt: now - AUTO_BACKUP_INTERVAL_MS + 1,
      now
    })).toBe(false);
    expect(shouldCreateIdleAutoBackup({
      hasLogs: true,
      lastAutoBackupAt: now - 12 * 60 * 60 * 1000,
      intervalHours: 12,
      now
    })).toBe(true);
  });

  it('reports the remaining delay before the next automatic snapshot', () => {
    const now = 1_798_000_000_000;
    const status = getIdleAutoBackupStatus({
      hasLogs: true,
      lastAutoBackupAt: now - AUTO_BACKUP_INTERVAL_MS + 1_500,
      now
    });

    expect(status.shouldCreate).toBe(false);
    expect(status.delayMs).toBe(1_500);
  });

  it('normalizes backup schedule settings', () => {
    expect(normalizeBackupSchedule(undefined)).toEqual({ enabled: true, intervalHours: 24 });
    expect(normalizeBackupSchedule({ enabled: false, intervalHours: 12 })).toEqual({ enabled: false, intervalHours: 12 });
    expect(normalizeBackupSchedule({ enabled: true, intervalHours: 99 })).toEqual({ enabled: true, intervalHours: 24 });
  });
});

describe('useAutoBackup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    storageMocks.getIdleAutoBackupStatus.mockReset();
    storageMocks.createIdleAutoBackup.mockReset();
    storageMocks.warn.mockReset();
    Object.defineProperty(window, 'requestIdleCallback', { value: undefined, configurable: true });
    Object.defineProperty(window, 'cancelIdleCallback', { value: undefined, configurable: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('does not check storage while logs are empty', () => {
    render(<AutoBackupHarness logsCount={0} />);

    expect(storageMocks.getIdleAutoBackupStatus).not.toHaveBeenCalled();
    expect(storageMocks.createIdleAutoBackup).not.toHaveBeenCalled();
  });

  it('does not check storage when idle auto backup is disabled', () => {
    render(<AutoBackupHarness backupSchedule={{ enabled: false, intervalHours: 24 }} />);

    expect(storageMocks.getIdleAutoBackupStatus).not.toHaveBeenCalled();
    expect(storageMocks.createIdleAutoBackup).not.toHaveBeenCalled();
  });

  it('creates an idle snapshot when the status is due', async () => {
    storageMocks.getIdleAutoBackupStatus.mockResolvedValue({
      hasLogs: true,
      lastAutoBackupAt: null,
      shouldCreate: true,
      delayMs: 0
    });
    storageMocks.createIdleAutoBackup.mockResolvedValue(true);

    render(<AutoBackupHarness logsCount={1} />);
    await flushPromises();

    expect(storageMocks.createIdleAutoBackup).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(storageMocks.getIdleAutoBackupStatus).toHaveBeenCalledWith(24);
    expect(storageMocks.createIdleAutoBackup).toHaveBeenCalledWith(24);
  });

  it('waits until the remaining threshold delay has elapsed', async () => {
    storageMocks.getIdleAutoBackupStatus.mockResolvedValue({
      hasLogs: true,
      lastAutoBackupAt: 1_798_000_000_000,
      shouldCreate: false,
      delayMs: 10_000
    });
    storageMocks.createIdleAutoBackup.mockResolvedValue(true);

    render(<AutoBackupHarness logsCount={1} />);
    await flushPromises();

    act(() => {
      vi.advanceTimersByTime(10_999);
    });
    expect(storageMocks.createIdleAutoBackup).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(storageMocks.createIdleAutoBackup).toHaveBeenCalledTimes(1);
  });

  it('passes the configured interval through to storage checks', async () => {
    storageMocks.getIdleAutoBackupStatus.mockResolvedValue({
      hasLogs: true,
      lastAutoBackupAt: null,
      shouldCreate: true,
      delayMs: 0
    });
    storageMocks.createIdleAutoBackup.mockResolvedValue(true);

    render(<AutoBackupHarness logsCount={1} backupSchedule={{ enabled: true, intervalHours: 6 }} />);
    await flushPromises();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(storageMocks.getIdleAutoBackupStatus).toHaveBeenCalledWith(6);
    expect(storageMocks.createIdleAutoBackup).toHaveBeenCalledWith(6);
  });
});
