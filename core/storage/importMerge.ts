import type { LogEntry, TrainingGoal, GoalCheckin } from '../../domain';
import {
  isTrainingGoalCategory,
  isTrainingGoalStatus,
  isTrainingGoalSource,
  ALLOWED_GOAL_WINDOWS,
  isGoalCheckinStatus,
} from '../../domain';

export type ImportConflictResolution = 'keep-current' | 'use-import';

export interface LogImportConflict {
  date: string;
  field: keyof LogEntry;
  currentValue: string;
  incomingValue: string;
}

type LogConflictCandidate = Partial<LogEntry> & { date?: string };

const IGNORED_LOG_CONFLICT_FIELDS = new Set<keyof LogEntry>([
  'date',
  'status',
  'updatedAt',
  'dataQuality',
  'touchedPaths',
  'changeHistory'
]);

const isPresentValue = (value: unknown) => value !== undefined && value !== null;

const normalizeForCompare = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeForCompare);

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeForCompare((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
};

const stringifyForCompare = (value: unknown) => JSON.stringify(normalizeForCompare(value));

const formatConflictValue = (value: unknown) => {
  const normalized = normalizeForCompare(value);
  const text = typeof normalized === 'string' ? `"${normalized}"` : JSON.stringify(normalized);

  if (!text) return String(value);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const getComparableKeys = (incoming: LogConflictCandidate) => (
  Object.keys(incoming).filter((key): key is keyof LogEntry => (
    !IGNORED_LOG_CONFLICT_FIELDS.has(key as keyof LogEntry)
  ))
);

export const computeLogConflicts = (
  currentLogs: LogConflictCandidate[],
  incomingLogs: LogConflictCandidate[]
): LogImportConflict[] => {
  const currentByDate = new Map(
    currentLogs
      .filter((log): log is LogConflictCandidate & { date: string } => typeof log.date === 'string')
      .map((log) => [log.date, log])
  );

  return incomingLogs.flatMap((incoming) => {
    if (typeof incoming.date !== 'string') return [];

    const date = incoming.date;
    const current = currentByDate.get(incoming.date);
    if (!current) return [];

    return getComparableKeys(incoming).flatMap((field) => {
      const currentValue = current[field];
      const incomingValue = incoming[field];
      if (!isPresentValue(currentValue) || !isPresentValue(incomingValue)) return [];
      if (stringifyForCompare(currentValue) === stringifyForCompare(incomingValue)) return [];

      return [{
        date,
        field,
        currentValue: formatConflictValue(currentValue),
        incomingValue: formatConflictValue(incomingValue)
      }];
    });
  });
};

export const mergeLogEntryForImport = (
  current: LogEntry,
  incoming: LogEntry,
  conflictResolution: ImportConflictResolution
) => {
  const merged = { ...current, ...incoming } as LogEntry;
  const mutableMerged = merged as Record<keyof LogEntry, unknown>;

  for (const field of Object.keys(incoming) as Array<keyof LogEntry>) {
    if (incoming[field] === undefined) {
      mutableMerged[field] = current[field];
    }
  }

  if (conflictResolution === 'keep-current') {
    for (const conflict of computeLogConflicts([current], [incoming])) {
      mutableMerged[conflict.field] = current[conflict.field];
    }
  }

  return merged;
};

export const mergeLogsForImport = (
  currentLogs: LogEntry[],
  incomingLogs: LogEntry[],
  conflictResolution: ImportConflictResolution
) => {
  const currentByDate = new Map(currentLogs.map((log) => [log.date, log]));

  return incomingLogs.map((incoming) => {
    const current = currentByDate.get(incoming.date);
    return current ? mergeLogEntryForImport(current, incoming, conflictResolution) : incoming;
  });
};

// ── Event merge (by id) ─────────────────────────────────────────────────────

/**
 * Merge incoming adult behavior events into current events by id.
 *
 * Rules (from adult-behavior-data-model-import-export-integrity.md):
 * - id not in current: add
 * - id in current, content identical: skip
 * - id in current, content different: apply conflictResolution
 *   - 'use-import': replace with incoming
 *   - 'keep-current': keep current
 *
 * Does NOT merge by startedAt or targetDate. Only by id.
 */
export const mergeEventsForImport = <T extends { id: string }>(
  currentEvents: T[],
  incomingEvents: T[],
  conflictResolution: ImportConflictResolution
): T[] => {
  const currentById = new Map(currentEvents.map((e) => [e.id, e]));
  const result: T[] = [...currentEvents];

  for (const incoming of incomingEvents) {
    const current = currentById.get(incoming.id);
    if (!current) {
      // New event: add
      result.push(incoming);
    } else if (JSON.stringify(current) !== JSON.stringify(incoming)) {
      // Conflict: apply resolution
      if (conflictResolution === 'use-import') {
        const index = result.findIndex((e) => e.id === incoming.id);
        if (index >= 0) result[index] = incoming;
      }
      // 'keep-current': do nothing
    }
    // Same content: skip
  }

  return result;
};

// ── Adult event link issue detection ─────────────────────────────────────────

export type AdultBehaviorSourceType = 'porn_use' | 'masturbation' | 'sex';

export interface AdultEventLinkIssue {
  severity: 'info' | 'warning' | 'error';
  kind: 'orphan' | 'one_way' | 'duplicate_id' | 'missing_required_field';
  sourceType: AdultBehaviorSourceType;
  sourceId: string;
  targetType?: AdultBehaviorSourceType;
  targetId?: string;
  message: string;
}

export interface AdultEventLinkInput {
  pornUseEvents: { id: string; linkedMasturbationEventIds: string[]; linkedSexEventIds: string[] }[];
  masturbationEvents: { id: string; linkedPornUseEventIds: string[]; linkedSexEventIds: string[] }[];
  sexEvents: { id: string; linkedPornUseEventIds: string[]; linkedMasturbationEventIds: string[] }[];
}

/**
 * Check adult event links for orphan and one-way issues.
 * Pure function: no Dexie, no React, does not mutate input.
 */
export const checkAdultEventLinks = (input: AdultEventLinkInput): AdultEventLinkIssue[] => {
  const issues: AdultEventLinkIssue[] = [];
  const puIds = new Set(input.pornUseEvents.map((e) => e.id));
  const mbIds = new Set(input.masturbationEvents.map((e) => e.id));
  const sxIds = new Set(input.sexEvents.map((e) => e.id));

  // Check duplicate IDs within each type
  const checkDuplicates = (events: { id: string }[], sourceType: AdultBehaviorSourceType) => {
    const seen = new Set<string>();
    for (const e of events) {
      if (seen.has(e.id)) {
        issues.push({ severity: 'error', kind: 'duplicate_id', sourceType, sourceId: e.id, message: `重复 ID: ${e.id}` });
      }
      seen.add(e.id);
    }
  };
  checkDuplicates(input.pornUseEvents, 'porn_use');
  checkDuplicates(input.masturbationEvents, 'masturbation');
  checkDuplicates(input.sexEvents, 'sex');

  // Orphan: A points to B, but B does not exist
  const checkOrphan = (
    sourceId: string,
    targetIds: string[],
    sourceType: AdultBehaviorSourceType,
    targetType: AdultBehaviorSourceType,
    targetIdSet: Set<string>
  ) => {
    for (const targetId of targetIds) {
      if (!targetIdSet.has(targetId)) {
        issues.push({ severity: 'warning', kind: 'orphan', sourceType, sourceId, targetType, targetId, message: `${sourceType} ${sourceId} 指向不存在的 ${targetType} ${targetId}` });
      }
    }
  };

  // One-way: A points to B, B exists but does not point back to A
  const checkOneWay = (
    sourceId: string,
    targetIds: string[],
    sourceType: AdultBehaviorSourceType,
    targetType: AdultBehaviorSourceType,
    targetEvents: { id: string; linkedPornUseEventIds?: string[]; linkedMasturbationEventIds?: string[]; linkedSexEventIds?: string[] }[],
    reverseField: string
  ) => {
    for (const targetId of targetIds) {
      const target = targetEvents.find((e) => e.id === targetId);
      if (!target) continue; // orphan already reported
      const reverseIds: string[] = (target as Record<string, unknown>)[reverseField] as string[] ?? [];
      if (!reverseIds.includes(sourceId)) {
        issues.push({ severity: 'warning', kind: 'one_way', sourceType, sourceId, targetType, targetId, message: `${sourceType} ${sourceId} 指向 ${targetType} ${targetId}，但反向链接缺失` });
      }
    }
  };

  // Porn use events
  for (const pu of input.pornUseEvents) {
    checkOrphan(pu.id, pu.linkedMasturbationEventIds, 'porn_use', 'masturbation', mbIds);
    checkOrphan(pu.id, pu.linkedSexEventIds, 'porn_use', 'sex', sxIds);
    checkOneWay(pu.id, pu.linkedMasturbationEventIds, 'porn_use', 'masturbation', input.masturbationEvents, 'linkedPornUseEventIds');
    checkOneWay(pu.id, pu.linkedSexEventIds, 'porn_use', 'sex', input.sexEvents, 'linkedPornUseEventIds');
  }

  // Masturbation events
  for (const mb of input.masturbationEvents) {
    checkOrphan(mb.id, mb.linkedPornUseEventIds, 'masturbation', 'porn_use', puIds);
    checkOrphan(mb.id, mb.linkedSexEventIds, 'masturbation', 'sex', sxIds);
    checkOneWay(mb.id, mb.linkedPornUseEventIds, 'masturbation', 'porn_use', input.pornUseEvents, 'linkedMasturbationEventIds');
    checkOneWay(mb.id, mb.linkedSexEventIds, 'masturbation', 'sex', input.sexEvents, 'linkedMasturbationEventIds');
  }

  // Sex events
  for (const sx of input.sexEvents) {
    checkOrphan(sx.id, sx.linkedPornUseEventIds, 'sex', 'porn_use', puIds);
    checkOrphan(sx.id, sx.linkedMasturbationEventIds, 'sex', 'masturbation', mbIds);
    checkOneWay(sx.id, sx.linkedPornUseEventIds, 'sex', 'porn_use', input.pornUseEvents, 'linkedSexEventIds');
    checkOneWay(sx.id, sx.linkedMasturbationEventIds, 'sex', 'masturbation', input.masturbationEvents, 'linkedSexEventIds');
  }

  return issues;
};

// ── Training data import normalize ───────────────────────────────────────────

export interface TrainingImportWarning {
  kind: 'forbidden_category' | 'invalid_window' | 'invalid_goal_status' | 'invalid_goal_source'
    | 'invalid_checkin_status' | 'orphan_checkin' | 'invalid_cycle_feeling' | 'inverted_window';
  entityId: string;
  entityType: 'goal' | 'checkin';
  message: string;
}

export const normalizeTrainingGoals = (
  goals: TrainingGoal[],
): { goals: TrainingGoal[]; warnings: TrainingImportWarning[] } => {
  const warnings: TrainingImportWarning[] = [];
  const valid: TrainingGoal[] = [];

  for (const goal of goals) {
    if (!isTrainingGoalCategory(goal.category)) {
      warnings.push({
        kind: 'forbidden_category',
        entityId: goal.id,
        entityType: 'goal',
        message: `目标 ${goal.id} 的 category "${goal.category}" 不在允许列表中，已跳过`,
      });
      continue;
    }
    if (!ALLOWED_GOAL_WINDOWS.has(goal.targetWindowDays)) {
      warnings.push({
        kind: 'invalid_window',
        entityId: goal.id,
        entityType: 'goal',
        message: `目标 ${goal.id} 的 targetWindowDays=${goal.targetWindowDays} 不是 7 或 14，已跳过`,
      });
      continue;
    }
    if (!isTrainingGoalStatus(goal.status)) {
      warnings.push({
        kind: 'invalid_goal_status',
        entityId: goal.id,
        entityType: 'goal',
        message: `目标 ${goal.id} 的 status "${goal.status}" 不合法，已跳过`,
      });
      continue;
    }
    if (!isTrainingGoalSource(goal.source)) {
      warnings.push({
        kind: 'invalid_goal_source',
        entityId: goal.id,
        entityType: 'goal',
        message: `目标 ${goal.id} 的 source "${goal.source}" 不合法，已跳过`,
      });
      continue;
    }
    valid.push(goal);
  }

  return { goals: valid, warnings };
};

export const normalizeGoalCheckins = (
  checkins: GoalCheckin[],
  validGoalIds: Set<string>,
): { checkins: GoalCheckin[]; warnings: TrainingImportWarning[] } => {
  const warnings: TrainingImportWarning[] = [];
  const valid: GoalCheckin[] = [];

  for (const checkin of checkins) {
    if (!isGoalCheckinStatus(checkin.status)) {
      warnings.push({
        kind: 'invalid_checkin_status',
        entityId: checkin.id,
        entityType: 'checkin',
        message: `签到 ${checkin.id} 的 status "${checkin.status}" 不合法，已跳过`,
      });
      continue;
    }

    // Orphan checkin: keep but warn
    if (!validGoalIds.has(checkin.goalId)) {
      warnings.push({
        kind: 'orphan_checkin',
        entityId: checkin.id,
        entityType: 'checkin',
        message: `签到 ${checkin.id} 的 goalId "${checkin.goalId}" 不存在，已保留`,
      });
    }

    // cycleFeeling out of range: null it
    const checkinCopy = { ...checkin };
    if (checkinCopy.cycleFeeling !== undefined && checkinCopy.cycleFeeling !== null) {
      if (typeof checkinCopy.cycleFeeling !== 'number' ||
          checkinCopy.cycleFeeling < 1 || checkinCopy.cycleFeeling > 5 ||
          !Number.isInteger(checkinCopy.cycleFeeling)) {
        warnings.push({
          kind: 'invalid_cycle_feeling',
          entityId: checkin.id,
          entityType: 'checkin',
          message: `签到 ${checkin.id} 的 cycleFeeling=${checkinCopy.cycleFeeling} 不在 1-5 范围，已置空`,
        });
        checkinCopy.cycleFeeling = undefined;
      }
    }

    // Inverted window: null both window fields
    if (checkinCopy.windowStartDate && checkinCopy.windowEndDate &&
        checkinCopy.windowStartDate > checkinCopy.windowEndDate) {
      warnings.push({
        kind: 'inverted_window',
        entityId: checkin.id,
        entityType: 'checkin',
        message: `签到 ${checkin.id} 的 windowStartDate 晚于 windowEndDate，窗口字段已置空`,
      });
      checkinCopy.windowStartDate = undefined;
      checkinCopy.windowEndDate = undefined;
    }

    valid.push(checkinCopy);
  }

  return { checkins: valid, warnings };
};
