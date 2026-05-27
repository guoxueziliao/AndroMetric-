import type { AutoSafetySnapshotLimit, AutoSafetySnapshotSizeLimitMB, BackupRetentionSettings, Snapshot } from '../../domain';

export const AUTO_SAFETY_SNAPSHOT_LIMIT = 7;
export const AUTO_SAFETY_SNAPSHOT_LIMIT_OPTIONS: AutoSafetySnapshotLimit[] = [3, 7, 15, 30];
export const AUTO_SAFETY_SNAPSHOT_SIZE_LIMIT_OPTIONS_MB: AutoSafetySnapshotSizeLimitMB[] = [5, 20, 50, 100];
export const AUTO_SAFETY_SNAPSHOT_SIZE_LIMIT_MB: AutoSafetySnapshotSizeLimitMB = 20;

export const normalizeAutoSafetySnapshotLimit = (value: unknown): AutoSafetySnapshotLimit => (
  AUTO_SAFETY_SNAPSHOT_LIMIT_OPTIONS.includes(value as AutoSafetySnapshotLimit)
    ? value as AutoSafetySnapshotLimit
    : AUTO_SAFETY_SNAPSHOT_LIMIT
);

export const normalizeAutoSafetySnapshotSizeLimitMB = (value: unknown): AutoSafetySnapshotSizeLimitMB => (
  AUTO_SAFETY_SNAPSHOT_SIZE_LIMIT_OPTIONS_MB.includes(value as AutoSafetySnapshotSizeLimitMB)
    ? value as AutoSafetySnapshotSizeLimitMB
    : AUTO_SAFETY_SNAPSHOT_SIZE_LIMIT_MB
);

export const normalizeBackupRetention = (value: unknown): BackupRetentionSettings => {
  if (typeof value !== 'object' || value === null) {
    return { mode: 'count', autoSafetyMaxCount: AUTO_SAFETY_SNAPSHOT_LIMIT };
  }

  const retention = value as Partial<BackupRetentionSettings> & {
    autoSafetyMaxCount?: unknown;
    autoSafetyMaxMB?: unknown;
  };

  if (retention.mode === 'size') {
    return {
      mode: 'size',
      autoSafetyMaxMB: normalizeAutoSafetySnapshotSizeLimitMB(retention.autoSafetyMaxMB)
    };
  }

  return {
    mode: 'count',
    autoSafetyMaxCount: normalizeAutoSafetySnapshotLimit(retention.autoSafetyMaxCount)
  };
};

export const getSnapshotSizeBytes = (snapshot: Snapshot) => {
  if (typeof snapshot.sizeBytes === 'number' && Number.isFinite(snapshot.sizeBytes) && snapshot.sizeBytes >= 0) {
    return snapshot.sizeBytes;
  }

  return JSON.stringify(snapshot.data).length;
};

const getAutoSafetySnapshots = (snapshots: Snapshot[]) => (
  snapshots
    .filter((snapshot) => snapshot.kind === 'auto-safety' && typeof snapshot.id === 'number')
    .sort((left, right) => left.timestamp - right.timestamp)
);

export const getSnapshotIdsToPruneByCount = (snapshots: Snapshot[], keepCount = AUTO_SAFETY_SNAPSHOT_LIMIT) => {
  const normalizedKeepCount = normalizeAutoSafetySnapshotLimit(keepCount);
  const autoSafetySnapshots = getAutoSafetySnapshots(snapshots);

  if (autoSafetySnapshots.length <= normalizedKeepCount) return [] as number[];

  return autoSafetySnapshots.slice(0, autoSafetySnapshots.length - normalizedKeepCount).map((snapshot) => snapshot.id as number);
};

export const getSnapshotIdsToPruneBySize = (
  snapshots: Snapshot[],
  maxMB: unknown = AUTO_SAFETY_SNAPSHOT_SIZE_LIMIT_MB
) => {
  const maxBytes = normalizeAutoSafetySnapshotSizeLimitMB(maxMB) * 1024 * 1024;
  const autoSafetySnapshots = snapshots
    .filter((snapshot) => snapshot.kind === 'auto-safety' && typeof snapshot.id === 'number')
    .sort((left, right) => right.timestamp - left.timestamp);
  let totalBytes = 0;
  const keepIds = new Set<number>();

  for (const snapshot of autoSafetySnapshots) {
    const sizeBytes = getSnapshotSizeBytes(snapshot);
    if (totalBytes + sizeBytes <= maxBytes || keepIds.size === 0) {
      totalBytes += sizeBytes;
      keepIds.add(snapshot.id as number);
    }
  }

  return autoSafetySnapshots
    .filter((snapshot) => !keepIds.has(snapshot.id as number))
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((snapshot) => snapshot.id as number);
};

export const getSnapshotIdsToPrune = (snapshots: Snapshot[], keepCount = AUTO_SAFETY_SNAPSHOT_LIMIT) => (
  getSnapshotIdsToPruneByCount(snapshots, keepCount)
);

export const getSnapshotIdsToPruneForRetention = (snapshots: Snapshot[], retention: unknown) => {
  const normalized = normalizeBackupRetention(retention);
  return normalized.mode === 'size'
    ? getSnapshotIdsToPruneBySize(snapshots, normalized.autoSafetyMaxMB)
    : getSnapshotIdsToPruneByCount(snapshots, normalized.autoSafetyMaxCount);
};
