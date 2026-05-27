import { describe, expect, it, vi } from 'vitest';
import type { Snapshot } from '../domain';
import { addSnapshotWithReadbackCheck } from '../core/storage/snapshotIntegrity';

const createSnapshot = (): Snapshot => ({
  timestamp: 1_798_000_000_000,
  dataVersion: 6,
  appVersion: '0.1.2',
  description: 'test snapshot',
  kind: 'manual',
  settings: null,
  userName: null,
  data: {
    version: 6,
    logs: [
      {
        date: '2026-05-22',
        status: 'completed',
        updatedAt: 1_798_000_000_000,
        alcoholRecords: [],
        tags: ['morning'],
        exercise: [],
        sex: [],
        masturbation: [],
        changeHistory: [],
        notes: 'A deliberately long note keeps truncation visible in the readback length check.'
      }
    ],
    partners: [{
      id: 'partner-1',
      name: 'A',
      sensitiveSpots: [],
      stimulationPreferences: [],
      likedPositions: [],
      dislikedActs: [],
      socialTags: [],
      milestones: {}
    }],
    tags: [],
    cycleEvents: [],
    pregnancyEvents: []
  }
});

describe('addSnapshotWithReadbackCheck', () => {
  it('returns the created id when readback matches the written snapshot', async () => {
    const snapshot = createSnapshot();
    const stored = { ...snapshot, id: 42 };
    const store = {
      add: vi.fn(async () => 42),
      get: vi.fn(async () => stored),
      delete: vi.fn(async () => undefined)
    };

    await expect(addSnapshotWithReadbackCheck(snapshot, store)).resolves.toBe(42);
    expect(store.get).toHaveBeenCalledWith(42);
    expect(store.delete).not.toHaveBeenCalled();
  });

  it('deletes the new snapshot and throws when readback is missing', async () => {
    const snapshot = createSnapshot();
    const store = {
      add: vi.fn(async () => 42),
      get: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined)
    };

    await expect(addSnapshotWithReadbackCheck(snapshot, store)).rejects.toThrow('无法读回');
    expect(store.delete).toHaveBeenCalledWith(42);
  });

  it('deletes the new snapshot and throws when readback data length is abnormal', async () => {
    const snapshot = createSnapshot();
    const truncated = {
      ...snapshot,
      id: 42,
      data: {
        ...snapshot.data,
        logs: [],
        partners: []
      }
    };
    const store = {
      add: vi.fn(async () => 42),
      get: vi.fn(async () => truncated),
      delete: vi.fn(async () => undefined)
    };

    await expect(addSnapshotWithReadbackCheck(snapshot, store)).rejects.toThrow('数据长度异常');
    expect(store.delete).toHaveBeenCalledWith(42);
  });
});
