import type { DataQualityState, LogEntry } from '../../../domain';
import type { PersonalStateResult } from '../../state';

export type CohortPresetId =
  | 'steady_healthy'
  | 'high_stress_sedentary'
  | 'weekend_alcohol_wave'
  | 'exercise_responder'
  | 'high_sexload_recovery';

export type RecordingOverlayId =
  | 'full_logger'
  | 'sleep_only'
  | 'lifestyle_sparse'
  | 'burst_logger';

export type ScenarioId =
  | 'baseline'
  | 'sleep_debt_5d'
  | 'weekend_binge'
  | 'exercise_ramp'
  | 'high_stress_week'
  | 'recovery_window';

export type SimulationMetricId =
  | 'hardness'
  | 'sleep'
  | 'alcohol'
  | 'stress'
  | 'exercise'
  | 'masturbation'
  | 'sexLoad'
  | 'screenTime'
  | 'healthScore';

export type SimulationFieldGroup =
  | 'morning'
  | 'sleep'
  | 'stress'
  | 'alcohol'
  | 'exercise'
  | 'sexLoad'
  | 'screenTime'
  | 'health';

export type AvailabilityState = 'usable' | 'none' | 'missing' | 'unknown';

export interface BurstinessConfig {
  streakDays: number;
  gapDays: number;
}

export interface FieldPolicy {
  allowNone: boolean;
  allowUnknown: boolean;
}

export interface MissingnessProfile {
  overlayId: RecordingOverlayId;
  captureRate: Record<SimulationFieldGroup, number>;
  explicitNoneRate: Partial<Record<SimulationFieldGroup, number>>;
  unknownRate: Partial<Record<SimulationFieldGroup, number>>;
  burstiness: BurstinessConfig;
  backfillLagDays: number;
  fieldPolicy: Record<SimulationFieldGroup, FieldPolicy>;
}

export interface VirtualPersonProfile {
  personId: string;
  seed: number;
  days: number;
  presetId: CohortPresetId;
  hardnessBaseline: number;
  hardnessNoiseSd: number;
  weekdaySleepHours: number;
  weekendShiftHours: number;
  stressBaseline: number;
  stressSensitivity: number;
  alcoholSessionsPerWeek: number;
  alcoholGramsPerSession: number;
  alcoholSensitivity: number;
  exerciseSessionsPerWeek: number;
  exerciseMinutesPerSession: number;
  exerciseResponsiveness: number;
  exerciseLagDays: number;
  sexLoadEventsPerWeek: number;
  sexLoadRecoveryDays: number;
  screenHoursWeekday: number;
  screenTimeSensitivity: number;
  illnessProbabilityPer30d: number;
  missingnessProfile: MissingnessProfile;
}

export interface VirtualDayPlan {
  date: string;
  dayIndex: number;
  weekday: number;
  sleepHours: number | null;
  sleepQuality: number | null;
  stressLevel: 1 | 2 | 3 | 4 | 5 | null;
  alcoholGrams: number;
  exerciseMinutes: number;
  sexLoad: number;
  screenMinutes: number | null;
  isSick: boolean;
  wokeWithErection: boolean;
  morningHardness: 1 | 2 | 3 | 4 | 5 | null;
  fieldStates: Partial<Record<string, DataQualityState>>;
}

export interface ScenarioSpec {
  id: ScenarioId;
  label: string;
  description: string;
  primaryFactors: SimulationMetricId[];
  expectedDirection: 'up' | 'down' | 'flat' | 'mixed';
}

export interface GenerateVirtualCohortOptions {
  presetId: CohortPresetId;
  overlayId: RecordingOverlayId;
  scenarioId: ScenarioId;
  seed: number;
  observedDays: number;
  forecastDays?: number;
  startDate?: string;
}

export interface VirtualCohortRun {
  id: string;
  presetId: CohortPresetId;
  overlayId: RecordingOverlayId;
  scenarioId: ScenarioId;
  seed: number;
  observedDays: number;
  forecastDays: number;
  profile: VirtualPersonProfile;
  dayPlans: VirtualDayPlan[];
  observedLogs: LogEntry[];
  futureLogs: LogEntry[];
}

export interface MetricAvailabilityPoint {
  date: string;
  state: AvailabilityState;
  value: number | null;
}

export type MetricAvailabilitySeries = Record<SimulationMetricId, MetricAvailabilityPoint[]>;

export interface MetricAvailabilitySummary {
  usableDays: number;
  noneDays: number;
  missingDays: number;
  unknownDays: number;
  usableRate: number;
}

export interface BacktestEvaluation {
  directionCorrectness: number;
  factorRankingStability: number;
  reminderFalsePositiveProxy: number;
  forecastCalibrationError: number | null;
  missingnessRobustnessDelta: {
    confidenceStepsLost: number;
    averageUsableRateDelta: number;
  };
}

export interface BacktestResult {
  run: VirtualCohortRun;
  analysis: PersonalStateResult;
  controlAnalysis: PersonalStateResult;
  availabilitySeries: MetricAvailabilitySeries;
  availabilitySummary: Record<SimulationMetricId, MetricAvailabilitySummary>;
  evaluation: BacktestEvaluation;
}
