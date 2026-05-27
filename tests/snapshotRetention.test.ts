import { describe, expect, it } from 'vitest';
import type { Snapshot } from '../domain';
import {
  getSnapshotIdsToPrune,
  getSnapshotIdsToPruneBySize,
  getSnapshotIdsToPruneForRetention,
  getSnapshotSizeBytes,
  normalizeAutoSafetySnapshotLimit,
  normalizeBackupRetention
} from '../core/storage/snapshotRetention';

const createSnapshot = (id: number, kind: Snapshot['kind'], timestamp = id): Snapshot => ({
  id,
  timestamp,
  dataVersion: 46,
  appVersion: '0.1.1',
  description: `snapshot-${id}`,
  kind,
  settings: null,
  userName: null,
  data: {
    version: 46,
    logs: [],
    partners: [],
    tags: [],
    cycleEvents: [],
    pregnancyEvents: []
  }
});

const createSizedSnapshot = (id: number, sizeBytes: number, timestamp = id): Snapshot => ({
  ...createSnapshot(id, 'auto-safety', timestamp),
  sizeBytes
});

describe('getSnapshotIdsToPrune', () => {
  it('keeps the newest seven auto-safety snapshots', () => {
    const snapshots = Array.from({ length: 9 }, (_, index) => createSnapshot(index + 1, 'auto-safety'));

    expect(getSnapshotIdsToPrune(snapshots)).toEqual([1, 2]);
  });

  it('does not prune manual or legacy snapshots', () => {
    const autoSafetySnapshots = Array.from({ length: 8 }, (_, index) => createSnapshot(index + 1, 'auto-safety'));
    const manual = createSnapshot(99, 'manual', 0);
    const legacy = createSnapshot(100, undefined, 0);

    expect(getSnapshotIdsToPrune([manual, legacy, ...autoSafetySnapshots])).toEqual([1]);
  });

  it('honors a custom keep count', () => {
    const snapshots = Array.from({ length: 5 }, (_, index) => createSnapshot(index + 1, 'auto-safety'));

    expect(getSnapshotIdsToPrune(snapshots, 3)).toEqual([1, 2]);
  });

  it('falls back to the default keep count for unsupported values', () => {
    expect(normalizeAutoSafetySnapshotLimit(99)).toBe(7);
    expect(normalizeAutoSafetySnapshotLimit(15)).toBe(15);
  });

  it('normalizes legacy and size retention settings', () => {
    expect(normalizeBackupRetention(undefined)).toEqual({ mode: 'count', autoSafetyMaxCount: 7 });
    expect(normalizeBackupRetention({ autoSafetyMaxCount: 15 })).toEqual({ mode: 'count', autoSafetyMaxCount: 15 });
    expect(normalizeBackupRetention({ mode: 'size', autoSafetyMaxMB: 50 })).toEqual({ mode: 'size', autoSafetyMaxMB: 50 });
    expect(normalizeBackupRetention({ mode: 'size', autoSafetyMaxMB: 999 })).toEqual({ mode: 'size', autoSafetyMaxMB: 20 });
  });

  it('keeps newest auto-safety snapshots within the size budget', () => {
    const mb = 1024 * 1024;
    const snapshots = [
      createSizedSnapshot(1, 3 * mb, 1),
      createSizedSnapshot(2, 3 * mb, 2),
      createSizedSnapshot(3, 3 * mb, 3)
    ];

    expect(getSnapshotIdsToPruneBySize(snapshots, 5)).toEqual([1, 2]);
  });

  it('always keeps the newest auto-safety snapshot even if it exceeds the size budget', () => {
    const mb = 1024 * 1024;

    expect(getSnapshotIdsToPruneBySize([createSizedSnapshot(1, 10 * mb, 1)], 5)).toEqual([]);
  });

  it('uses computed data size when sizeBytes is missing', () => {
    const snapshot = createSnapshot(1, 'auto-safety');

    expect(getSnapshotSizeBytes(snapshot)).toBe(JSON.stringify(snapshot.data).length);
  });

  it('applies retention by mode', () => {
    const mb = 1024 * 1024;
    const snapshots = [
      createSizedSnapshot(1, 3 * mb, 1),
      createSizedSnapshot(2, 3 * mb, 2),
      createSizedSnapshot(3, 3 * mb, 3)
    ];

    expect(getSnapshotIdsToPruneForRetention(snapshots, { mode: 'count', autoSafetyMaxCount: 3 })).toEqual([]);
    expect(getSnapshotIdsToPruneForRetention(snapshots, { mode: 'size', autoSafetyMaxMB: 5 })).toEqual([1, 2]);
  });
});
