import type { TrainingGoal, GoalCheckin } from '../../../domain';
import type { ContextExplanationCard, ContextType } from './contextExplanationTypes';
import { CATEGORY_LABELS } from './trainingGoalService';

// ── Context type to focus field mapping ──────────────────────────────────────

const CONTEXT_FOCUS_FIELDS: Record<ContextType, string[]> = {
  sleep: ['sleep.startTime', 'sleep.endTime', 'sleep.duration', 'sleep.quality'],
  stress: ['stress.level'],
  sex_load: ['sexLoad', 'masturbation'],
  recovery: ['recoveryFeeling', 'fatigueAfter'],
  porn_use: ['pornUse.duration', 'pornUse.count'],
  exercise: ['exercise.duration', 'exercise.type'],
  alcohol: ['alcohol.amount', 'alcohol.time'],
  screen_time: ['screenTime'],
  training_goals: ['goal.status', 'goal.checkin'],
  relationship_context: ['relationshipContext'],
};

const CONTEXT_LABELS: Record<ContextType, string> = {
  sleep: '睡眠',
  stress: '压力',
  sex_load: '性活动负荷',
  recovery: '恢复感受',
  porn_use: '色情使用',
  exercise: '运动',
  alcohol: '饮酒',
  screen_time: '屏幕使用',
  training_goals: '训练目标',
  relationship_context: '关系上下文',
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface ObservationPlanDraft {
  sourceExplanationId?: string;
  sourceMetricId?: string;
  contextType: ContextType;
  windowDays: 7 | 14;
  title: string;
  focusFields: string[];
}

// ── Draft creation ───────────────────────────────────────────────────────────

/**
 * Build an observation plan draft from an explanation card.
 * Pure function — no Dexie, no React.
 */
export const buildDraftFromExplanationCard = (
  card: ContextExplanationCard,
  windowDays: 7 | 14 = 14,
): ObservationPlanDraft => {
  const contextLabel = CONTEXT_LABELS[card.contextType] ?? card.contextType;
  return {
    sourceExplanationId: card.id,
    sourceMetricId: card.metricId,
    contextType: card.contextType,
    windowDays,
    title: `观察${contextLabel}`,
    focusFields: CONTEXT_FOCUS_FIELDS[card.contextType] ?? [],
  };
};

/**
 * Build an observation plan draft for a personal normal metric.
 * Pure function — no Dexie, no React.
 */
export const buildDraftFromMetricId = (
  metricId: string,
  metricLabel: string,
  contextType: ContextType,
  windowDays: 7 | 14 = 14,
): ObservationPlanDraft => ({
  sourceMetricId: metricId,
  contextType,
  windowDays,
  title: `观察${metricLabel}相关的${CONTEXT_LABELS[contextType] ?? contextType}`,
  focusFields: CONTEXT_FOCUS_FIELDS[contextType] ?? [],
});

// ── Goal conversion ──────────────────────────────────────────────────────────

/**
 * Convert a draft to a TrainingGoal-compatible creation input.
 * The caller passes this to the existing goal creation flow.
 */
export const draftToGoalInput = (draft: ObservationPlanDraft) => ({
  category: 'observation' as const,
  title: draft.title,
  targetWindowDays: draft.windowDays,
  description: [
    `观察上下文：${CONTEXT_LABELS[draft.contextType] ?? draft.contextType}`,
    `关注字段：${draft.focusFields.join(', ')}`,
    draft.sourceMetricId ? `来源指标：${draft.sourceMetricId}` : '',
  ].filter(Boolean).join('\n'),
  source: 'manual' as const,
  linkedInsightId: draft.sourceExplanationId,
});

// ── Goal queries ─────────────────────────────────────────────────────────────

/** Filter goals to only observation plans */
export const getObservationPlans = (goals: TrainingGoal[]): TrainingGoal[] =>
  goals.filter((g) => g.category === 'observation');

/** Get active observation plans */
export const getActiveObservationPlans = (goals: TrainingGoal[]): TrainingGoal[] =>
  getObservationPlans(goals).filter((g) => g.status === 'active');

/** Check if a goal is an observation plan */
export const isObservationPlan = (goal: TrainingGoal): boolean =>
  goal.category === 'observation';

// ── Factual review ───────────────────────────────────────────────────────────

export interface ObservationReview {
  goalId: string;
  title: string;
  windowDays: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  checkinDays: number;
  missingDays: number;
  checkins: GoalCheckin[];
  limitations: string[];
}

/**
 * Build a factual review for an observation plan.
 * Pure function — no Dexie, no React.
 */
export const buildObservationReview = (
  goal: TrainingGoal,
  checkins: GoalCheckin[],
): ObservationReview => {
  const planCheckins = checkins
    .filter((c) => c.goalId === goal.id)
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  const start = new Date(goal.startDate + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + goal.targetWindowDays);

  const endDateStr = end.toISOString().slice(0, 10);
  const totalDays = goal.targetWindowDays;
  const checkinDays = planCheckins.length;
  const missingDays = totalDays - checkinDays;

  const limitations: string[] = [];
  if (checkinDays < 3) limitations.push('签到天数较少，事实总结可能不完整。');
  if (missingDays > totalDays * 0.5) limitations.push('记录缺口较多，建议补充更多观察数据。');
  limitations.push('观察结果仅为事实回顾，不做任何结论。');

  return {
    goalId: goal.id,
    title: goal.title,
    windowDays: goal.targetWindowDays,
    startDate: goal.startDate,
    endDate: endDateStr,
    totalDays,
    checkinDays,
    missingDays,
    checkins: planCheckins,
    limitations,
  };
};

/**
 * Get the label for the observation category (for display).
 */
export const getObservationCategoryLabel = (): string =>
  CATEGORY_LABELS['observation'] ?? '短期观察';
