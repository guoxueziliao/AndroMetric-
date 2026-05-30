// ── Training Goal ────────────────────────────────────────────────────────────

export type TrainingGoalStatus = 'active' | 'paused' | 'completed' | 'archived';

export type TrainingGoalCategory =
  | 'record_quality'
  | 'recovery'
  | 'hardness_stability'
  | 'sex_performance_stability'
  | 'ejaculation_control_observation'
  | 'relationship_communication'
  | 'observation';

export type TrainingGoalSource = 'manual' | 'suggested';

export const ALLOWED_GOAL_CATEGORIES: ReadonlySet<TrainingGoalCategory> = new Set([
  'record_quality',
  'recovery',
  'hardness_stability',
  'sex_performance_stability',
  'ejaculation_control_observation',
  'relationship_communication',
  'observation',
]);

export const ALLOWED_GOAL_STATUSES: ReadonlySet<TrainingGoalStatus> = new Set([
  'active', 'paused', 'completed', 'archived',
]);

export const ALLOWED_GOAL_SOURCES: ReadonlySet<TrainingGoalSource> = new Set([
  'manual', 'suggested',
]);

export const ALLOWED_GOAL_WINDOWS: ReadonlySet<number> = new Set([7, 14]);

export const isTrainingGoalCategory = (v: unknown): v is TrainingGoalCategory =>
  typeof v === 'string' && ALLOWED_GOAL_CATEGORIES.has(v as TrainingGoalCategory);

export const isTrainingGoalStatus = (v: unknown): v is TrainingGoalStatus =>
  typeof v === 'string' && ALLOWED_GOAL_STATUSES.has(v as TrainingGoalStatus);

export const isTrainingGoalSource = (v: unknown): v is TrainingGoalSource =>
  typeof v === 'string' && ALLOWED_GOAL_SOURCES.has(v as TrainingGoalSource);

export interface TrainingGoal {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: TrainingGoalStatus;
  category: TrainingGoalCategory;
  title: string;
  description?: string;
  startDate: string;
  targetWindowDays: number;
  source: TrainingGoalSource;
  linkedInsightId?: string;
}

// ── Goal Check-in ────────────────────────────────────────────────────────────

export type GoalCheckinStatus = 'continue' | 'pause' | 'complete' | 'adjust';

export const ALLOWED_CHECKIN_STATUSES: ReadonlySet<GoalCheckinStatus> = new Set([
  'continue', 'pause', 'complete', 'adjust',
]);

export const isGoalCheckinStatus = (v: unknown): v is GoalCheckinStatus =>
  typeof v === 'string' && ALLOWED_CHECKIN_STATUSES.has(v as GoalCheckinStatus);

export interface GoalCheckin {
  id: string;
  goalId: string;
  createdAt: string;
  targetDate: string;
  windowStartDate?: string;
  windowEndDate?: string;
  cycleFeeling?: number;
  status: GoalCheckinStatus;
  note?: string;
}
