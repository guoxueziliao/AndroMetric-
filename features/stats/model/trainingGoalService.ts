import type { TrainingGoal, GoalCheckin, TrainingGoalCategory, TrainingGoalStatus, GoalCheckinStatus } from '../../../domain';
import { isTrainingGoalCategory, ALLOWED_GOAL_WINDOWS } from '../../../domain';

// ── Goal creation ────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  record_quality: '记录质量',
  recovery: '恢复',
  hardness_stability: '硬度稳定',
  sex_performance_stability: '性表现稳定',
  ejaculation_control_observation: '射精控制观察',
  relationship_communication: '关系沟通',
};

const generateId = (): string => {
  try { return `tg_${crypto.randomUUID()}`; } catch { return `tg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }
};

export interface TrainingGoalDraftInput {
  category: TrainingGoalCategory;
  title: string;
  targetWindowDays: number;
  description?: string;
  source?: 'manual' | 'suggested';
  linkedInsightId?: string;
}

export interface TrainingGoalValidationError {
  field: string;
  message: string;
}

export const validateGoalDraft = (draft: TrainingGoalDraftInput): TrainingGoalValidationError[] => {
  const errors: TrainingGoalValidationError[] = [];
  if (!isTrainingGoalCategory(draft.category)) {
    errors.push({ field: 'category', message: `category "${draft.category}" 不在允许列表中` });
  }
  if (!ALLOWED_GOAL_WINDOWS.has(draft.targetWindowDays)) {
    errors.push({ field: 'targetWindowDays', message: `targetWindowDays=${draft.targetWindowDays} 不是 7 或 14` });
  }
  if (!draft.title || draft.title.trim().length === 0) {
    errors.push({ field: 'title', message: '标题不能为空' });
  }
  return errors;
};

export const createGoalFromDraft = (
  draft: TrainingGoalDraftInput,
  startDate: string,
): TrainingGoal => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    status: 'active',
    category: draft.category,
    title: draft.title.trim(),
    description: draft.description?.trim() || undefined,
    startDate,
    targetWindowDays: draft.targetWindowDays,
    source: draft.source ?? 'suggested',
    linkedInsightId: draft.linkedInsightId,
  };
};

// ── Goal status transitions ──────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<TrainingGoalStatus, TrainingGoalStatus[]> = {
  active: ['paused', 'completed', 'archived'],
  paused: ['active', 'archived'],
  completed: ['archived'],
  archived: ['active'],
};

export const canTransitionGoal = (current: TrainingGoalStatus, target: TrainingGoalStatus): boolean =>
  VALID_TRANSITIONS[current]?.includes(target) ?? false;

export const transitionGoal = (goal: TrainingGoal, newStatus: TrainingGoalStatus): TrainingGoal => {
  if (!canTransitionGoal(goal.status, newStatus)) {
    throw new Error(`目标 ${goal.id} 不能从 ${goal.status} 转换到 ${newStatus}`);
  }
  return { ...goal, status: newStatus, updatedAt: new Date().toISOString() };
};

// ── Check-in ─────────────────────────────────────────────────────────────────

const generateCheckinId = (): string => {
  try { return `gc_${crypto.randomUUID()}`; } catch { return `gc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }
};

export interface CheckinInput {
  goalId: string;
  targetDate: string;
  status: GoalCheckinStatus;
  cycleFeeling?: number;
  note?: string;
  windowStartDate?: string;
  windowEndDate?: string;
}

export const createCheckin = (input: CheckinInput): GoalCheckin => {
  const now = new Date().toISOString();
  const cycleFeeling = (input.cycleFeeling != null && input.cycleFeeling >= 1 && input.cycleFeeling <= 5 && Number.isInteger(input.cycleFeeling))
    ? input.cycleFeeling
    : undefined;

  // Inverted window: null both
  let windowStartDate = input.windowStartDate;
  let windowEndDate = input.windowEndDate;
  if (windowStartDate && windowEndDate && windowStartDate > windowEndDate) {
    windowStartDate = undefined;
    windowEndDate = undefined;
  }

  return {
    id: generateCheckinId(),
    goalId: input.goalId,
    createdAt: now,
    targetDate: input.targetDate,
    windowStartDate,
    windowEndDate,
    cycleFeeling,
    status: input.status,
    note: input.note?.trim() || undefined,
  };
};

/**
 * Apply a check-in's status to the goal.
 * - continue → active (no-op if already active)
 * - pause → paused
 * - complete → completed
 * - adjust → no status change (caller should open edit flow)
 */
export const applyCheckinToGoal = (goal: TrainingGoal, checkin: GoalCheckin): TrainingGoal => {
  switch (checkin.status) {
    case 'continue':
      return goal.status === 'active' ? goal : transitionGoal(goal, 'active');
    case 'pause':
      return transitionGoal(goal, 'paused');
    case 'complete':
      return transitionGoal(goal, 'completed');
    case 'adjust':
      return goal; // no status change
  }
};

// ── Check-in due detection ───────────────────────────────────────────────────

export const isGoalDueForCheckin = (goal: TrainingGoal, currentDate: string): boolean => {
  if (goal.status !== 'active') return false;
  const endDate = addDays(goal.startDate, goal.targetWindowDays);
  return currentDate >= endDate;
};

export const getGoalEndDate = (goal: TrainingGoal): string =>
  addDays(goal.startDate, goal.targetWindowDays);

// ── Date helper ──────────────────────────────────────────────────────────────

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// ── Goal query helpers ───────────────────────────────────────────────────────

export const getActiveGoals = (goals: TrainingGoal[]): TrainingGoal[] =>
  goals.filter((g) => g.status === 'active');

export const getPausedGoals = (goals: TrainingGoal[]): TrainingGoal[] =>
  goals.filter((g) => g.status === 'paused');

export const getDueGoals = (goals: TrainingGoal[], currentDate: string): TrainingGoal[] =>
  goals.filter((g) => isGoalDueForCheckin(g, currentDate));

export const getCheckinsForGoal = (checkins: GoalCheckin[], goalId: string): GoalCheckin[] =>
  checkins.filter((c) => c.goalId === goalId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

export const archiveGoal = (goal: TrainingGoal): TrainingGoal =>
  transitionGoal(goal, 'archived');

export const restoreGoal = (goal: TrainingGoal): TrainingGoal =>
  goal.status === 'archived' ? transitionGoal(goal, 'active') : goal;

export const getCompletedGoals = (goals: TrainingGoal[]): TrainingGoal[] =>
  goals.filter((g) => g.status === 'completed');

export const getArchivedGoals = (goals: TrainingGoal[]): TrainingGoal[] =>
  goals.filter((g) => g.status === 'archived');

export const getGoalsByCategory = (goals: TrainingGoal[], category: TrainingGoalCategory): TrainingGoal[] =>
  goals.filter((g) => g.category === category);

export const getOrphanCheckins = (checkins: GoalCheckin[], goals: TrainingGoal[]): GoalCheckin[] => {
  const goalIds = new Set(goals.map((g) => g.id));
  return checkins.filter((c) => !goalIds.has(c.goalId));
};

export const getStatusCounts = (goals: TrainingGoal[]): Record<TrainingGoalStatus, number> => {
  const counts: Record<TrainingGoalStatus, number> = { active: 0, paused: 0, completed: 0, archived: 0 };
  for (const g of goals) counts[g.status]++;
  return counts;
};

export const getCategoryDistribution = (goals: TrainingGoal[]): Record<string, number> => {
  const dist: Record<string, number> = {};
  for (const g of goals) dist[g.category] = (dist[g.category] ?? 0) + 1;
  return dist;
};

export const getCheckinCountPerGoal = (checkins: GoalCheckin[], goalId: string): number =>
  checkins.filter((c) => c.goalId === goalId).length;

export const getGoalsWithCheckins = (goals: TrainingGoal[], checkins: GoalCheckin[]): TrainingGoal[] => {
  const goalIdsWithCheckins = new Set(checkins.map((c) => c.goalId));
  return goals.filter((g) => goalIdsWithCheckins.has(g.id));
};

export const getRecentFocusCategories = (goals: TrainingGoal[], count: number = 4): string[] => {
  const sorted = [...goals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const seen = new Set<string>();
  for (const g of sorted) {
    seen.add(g.category);
    if (seen.size >= count) break;
  }
  return [...seen];
};
