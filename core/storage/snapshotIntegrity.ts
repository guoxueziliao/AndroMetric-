import type { Snapshot } from '../../domain';
import { checkAdultEventLinks } from './importMerge';
import { normalizeTrainingGoals, normalizeGoalCheckins } from './importMerge';
import { getActivityTargetDate } from '../../shared/lib/targetDate';

const MIN_READBACK_LENGTH_RATIO = 0.95;

type SnapshotStore = {
  add: (snapshot: Snapshot) => Promise<number>;
  get: (id: number) => Promise<Snapshot | undefined>;
  delete: (id: number) => Promise<void>;
};

const getDataJsonLength = (snapshot: Snapshot) => JSON.stringify(snapshot.data).length;

const EVENT_LENGTH_FIELDS = ['pornUseEvents', 'masturbationEvents', 'sexEvents'] as const;
const TRAINING_LENGTH_FIELDS = ['trainingGoals', 'goalCheckins'] as const;

export const assertSnapshotReadback = (expected: Snapshot, readback: Snapshot | undefined, id: number) => {
  if (!readback) {
    throw new Error('快照写入自检失败：无法读回刚创建的快照');
  }

  if (readback.id !== id) {
    throw new Error('快照写入自检失败：读回快照 ID 不一致');
  }

  const expectedLength = getDataJsonLength(expected);
  const readbackLength = getDataJsonLength(readback);
  if (readbackLength < expectedLength * MIN_READBACK_LENGTH_RATIO) {
    throw new Error('快照写入自检失败：读回数据长度异常');
  }

  if (readback.data.logs.length !== expected.data.logs.length) {
    throw new Error('快照写入自检失败：日志数量不一致');
  }

  if (readback.data.partners.length !== expected.data.partners.length) {
    throw new Error('快照写入自检失败：伴侣数量不一致');
  }

  // Check 3 adult behavior event array lengths and ID sets
  for (const field of EVENT_LENGTH_FIELDS) {
    const expectedArr = expected.data[field] ?? [];
    const readbackArr = readback.data[field] ?? [];
    if (readbackArr.length !== expectedArr.length) {
      throw new Error(`快照写入自检失败：${field} 数量不一致`);
    }
    const expectedIds = new Set(expectedArr.map((e: { id: string }) => e.id).sort());
    const readbackIds = new Set(readbackArr.map((e: { id: string }) => e.id).sort());
    const expectedIdStr = [...expectedIds].join(',');
    const readbackIdStr = [...readbackIds].join(',');
    if (expectedIdStr !== readbackIdStr) {
      throw new Error(`快照写入自检失败：${field} ID 集合不一致`);
    }
  }

  // Check training data array lengths and ID sets
  for (const field of TRAINING_LENGTH_FIELDS) {
    const expectedArr = expected.data[field] ?? [];
    const readbackArr = readback.data[field] ?? [];
    if (readbackArr.length !== expectedArr.length) {
      throw new Error(`快照写入自检失败：${field} 数量不一致`);
    }
    const expectedIds = new Set(expectedArr.map((e: { id: string }) => e.id).sort());
    const readbackIds = new Set(readbackArr.map((e: { id: string }) => e.id).sort());
    const expectedIdStr = [...expectedIds].join(',');
    const readbackIdStr = [...readbackIds].join(',');
    if (expectedIdStr !== readbackIdStr) {
      throw new Error(`快照写入自检失败：${field} ID 集合不一致`);
    }
  }
};

export const addSnapshotWithReadbackCheck = async (snapshot: Snapshot, store: SnapshotStore) => {
  const id = await store.add(snapshot);
  const readback = await store.get(id);

  try {
    assertSnapshotReadback(snapshot, readback, id);
    return id;
  } catch (error) {
    await store.delete(id).catch(() => undefined);
    throw error;
  }
};

// ── Full integrity check ────────────────────────────────────────────────────

export interface SnapshotIntegrityIssue {
  severity: 'info' | 'warning' | 'error';
  kind: string;
  message: string;
  details?: unknown;
}

/**
 * Run a full integrity check on a snapshot's data.
 * Reports: event link issues, missing targetDate, targetDate/starterAt inconsistency.
 * Pure function: does not read Dexie or modify data.
 */
export const checkSnapshotIntegrity = (snapshot: Snapshot): SnapshotIntegrityIssue[] => {
  const issues: SnapshotIntegrityIssue[] = [];
  const data = snapshot.data;

  // Check event link issues (orphan, one-way, duplicate_id)
  const puEvents = data.pornUseEvents ?? [];
  const mbEvents = data.masturbationEvents ?? [];
  const sxEvents = data.sexEvents ?? [];

  const linkIssues = checkAdultEventLinks({
    pornUseEvents: puEvents,
    masturbationEvents: mbEvents,
    sexEvents: sxEvents,
  });

  for (const li of linkIssues) {
    issues.push({
      severity: li.severity,
      kind: li.kind,
      message: li.message,
      details: li,
    });
  }

  // Check missing targetDate and targetDate/starterAt inconsistency
  const checkTargetDateConsistency = (
    events: { id: string; startedAt: string; targetDate: string }[],
    label: string
  ) => {
    for (const ev of events) {
      if (!ev.targetDate) {
        issues.push({ severity: 'warning', kind: 'missing_target_date', message: `${label} ${ev.id} 缺少 targetDate` });
        continue;
      }
      // Verify targetDate matches 03:00 physiological day rule
      const expectedTarget = getActivityTargetDate(new Date(ev.startedAt));
      if (ev.targetDate !== expectedTarget) {
        issues.push({
          severity: 'warning',
          kind: 'target_date_mismatch',
          message: `${label} ${ev.id} targetDate=${ev.targetDate} 与 startedAt 生理日 ${expectedTarget} 不一致`,
        });
      }
    }
  };

  checkTargetDateConsistency(puEvents, 'porn_use');
  checkTargetDateConsistency(mbEvents, 'masturbation');
  checkTargetDateConsistency(sxEvents, 'sex');

  // Check training data integrity
  const trainingGoals = data.trainingGoals ?? [];
  const goalCheckins = data.goalCheckins ?? [];

  // Report training data counts
  if (trainingGoals.length > 0 || goalCheckins.length > 0) {
    issues.push({
      severity: 'info',
      kind: 'training_data_present',
      message: `训练数据：${trainingGoals.length} 个目标，${goalCheckins.length} 条签到`,
      details: {
        goalCount: trainingGoals.length,
        checkinCount: goalCheckins.length,
      },
    });
  }

  // Normalize training goals to detect invalid data
  const goalResult = normalizeTrainingGoals(trainingGoals);
  for (const w of goalResult.warnings) {
    issues.push({
      severity: 'warning',
      kind: w.kind,
      message: w.message,
      details: w,
    });
  }

  // Normalize goal checkins
  const validGoalIds = new Set(goalResult.goals.map((g) => g.id));
  const checkinResult = normalizeGoalCheckins(goalCheckins, validGoalIds);
  for (const w of checkinResult.warnings) {
    issues.push({
      severity: 'warning',
      kind: w.kind,
      message: w.message,
      details: w,
    });
  }

  // Report orphan check-in count
  const orphanCount = checkinResult.warnings.filter((w) => w.kind === 'orphan_checkin').length;
  if (orphanCount > 0) {
    issues.push({
      severity: 'warning',
      kind: 'orphan_checkins_summary',
      message: `${orphanCount} 条签到关联的目标不存在`,
    });
  }

  return issues;
};
