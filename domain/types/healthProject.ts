// ── Health Project ───────────────────────────────────────────────────────────

export type HealthProjectType = 'supplement' | 'sunlight' | 'stretching' | 'rehab' | 'sleep_routine' | 'other_habit';

export type HealthProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export type ScheduleType = 'daily' | 'every_other_day' | 'weekly' | 'consecutive_days' | 'as_needed';

export type TimeLabel = 'morning' | 'noon' | 'evening' | 'bedtime' | 'before_meal' | 'after_meal' | 'anytime';

export type SupplementUnit = 'mg' | 'g' | 'mcg' | 'IU' | 'capsule' | 'tablet' | 'ml' | 'drop' | 'custom';

export type ProjectLogStatus = 'done' | 'skipped';

export const ALLOWED_PROJECT_TYPES: ReadonlySet<HealthProjectType> = new Set([
  'supplement', 'sunlight', 'stretching', 'rehab', 'sleep_routine', 'other_habit',
]);

export const ALLOWED_PROJECT_STATUSES: ReadonlySet<HealthProjectStatus> = new Set([
  'active', 'paused', 'completed', 'archived',
]);

export const ALLOWED_SCHEDULE_TYPES: ReadonlySet<ScheduleType> = new Set([
  'daily', 'every_other_day', 'weekly', 'consecutive_days', 'as_needed',
]);

export const ALLOWED_TIME_LABELS: ReadonlySet<TimeLabel> = new Set([
  'morning', 'noon', 'evening', 'bedtime', 'before_meal', 'after_meal', 'anytime',
]);

export const ALLOWED_SUPPLEMENT_UNITS: ReadonlySet<SupplementUnit> = new Set([
  'mg', 'g', 'mcg', 'IU', 'capsule', 'tablet', 'ml', 'drop', 'custom',
]);

export const isHealthProjectType = (v: unknown): v is HealthProjectType =>
  typeof v === 'string' && ALLOWED_PROJECT_TYPES.has(v as HealthProjectType);

export const isHealthProjectStatus = (v: unknown): v is HealthProjectStatus =>
  typeof v === 'string' && ALLOWED_PROJECT_STATUSES.has(v as HealthProjectStatus);

export const isScheduleType = (v: unknown): v is ScheduleType =>
  typeof v === 'string' && ALLOWED_SCHEDULE_TYPES.has(v as ScheduleType);

// ── Health Project ───────────────────────────────────────────────────────────

export interface HealthProject {
  id: string;
  type: HealthProjectType;
  name: string;
  status: HealthProjectStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Health Project Plan ──────────────────────────────────────────────────────

export interface HealthProjectPlan {
  id: string;
  projectId: string;
  scheduleType: ScheduleType;
  startDate: string;
  endDate?: string;
  // Schedule params
  weeklyDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (for 'weekly')
  consecutiveDays?: number; // for 'consecutive_days'
  // Supplement config (optional)
  dose?: number;
  unit?: SupplementUnit;
  timeLabels?: TimeLabel[];
  note?: string;
}

// ── Health Project Log ───────────────────────────────────────────────────────

export interface HealthProjectLog {
  id: string;
  projectId: string;
  targetDate: string;
  status: ProjectLogStatus;
  takenAt?: string;
  note?: string;
}

// ── Label maps ───────────────────────────────────────────────────────────────

export const PROJECT_TYPE_LABELS: Record<HealthProjectType, string> = {
  supplement: '补剂',
  sunlight: '晒太阳',
  stretching: '拉伸',
  rehab: '康复',
  sleep_routine: '作息干预',
  other_habit: '其他习惯',
};

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  daily: '每日',
  every_other_day: '隔日',
  weekly: '每周若干天',
  consecutive_days: '连续 N 天',
  as_needed: '按需',
};

export const TIME_LABEL_LABELS: Record<TimeLabel, string> = {
  morning: '早晨',
  noon: '中午',
  evening: '傍晚',
  bedtime: '睡前',
  before_meal: '饭前',
  after_meal: '饭后',
  anytime: '随时',
};

export const SUPPLEMENT_UNIT_LABELS: Record<SupplementUnit, string> = {
  mg: 'mg',
  g: 'g',
  mcg: 'mcg',
  IU: 'IU',
  capsule: '粒',
  tablet: '片',
  ml: 'ml',
  drop: '滴',
  custom: '自定义',
};

export const PROJECT_STATUS_LABELS: Record<HealthProjectStatus, string> = {
  active: '进行中',
  paused: '已暂停',
  completed: '已结束',
  archived: '已归档',
};

// ── Valid status transitions ─────────────────────────────────────────────────

export const VALID_PROJECT_TRANSITIONS: Record<HealthProjectStatus, HealthProjectStatus[]> = {
  active: ['paused', 'completed', 'archived'],
  paused: ['active', 'completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

export const canTransitionProject = (current: HealthProjectStatus, target: HealthProjectStatus): boolean =>
  VALID_PROJECT_TRANSITIONS[current]?.includes(target) ?? false;
