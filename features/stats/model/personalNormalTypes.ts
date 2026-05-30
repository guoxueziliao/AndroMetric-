// ── Personal Normal System v1 ────────────────────────────────────────────────
// Read-only derived types for the personal normal baseline system.
// These types are NEVER persisted to IndexedDB or included in JSON backup/CSV export.
// All values are computed at runtime from existing data.

export type PersonalNormalState = 'within_personal_normal' | 'shift_with_limited_confidence' | 'insufficient_data';
export type PersonalNormalDirection = 'above_baseline' | 'below_baseline' | 'within_baseline' | 'mixed' | 'unknown';
export type PersonalNormalConfidence = 'none' | 'low' | 'medium';
export type PersonalNormalLayer = 'primary' | 'secondary';
export type GapWindow = 'current' | 'baseline';
export type GapReason = 'missing_log' | 'missing_field' | 'legacy_value' | 'insufficient_event_detail';

export interface PersonalNormalMetric {
  id: string;
  label: string;
  layer: PersonalNormalLayer;
  state: PersonalNormalState;
  direction: PersonalNormalDirection;
  currentValue: number | null;
  baselineMedian: number | null;
  baselineRange: [number, number] | null;
  sampleSize: number;
  baselineSampleSize: number;
  missingDays: number;
  coverage: number;
  confidence: PersonalNormalConfidence;
  limitations: string[];
}

export interface PersonalNormalGap {
  metricId: string;
  window: GapWindow;
  missingDays: number;
  reason: GapReason;
}

export interface PersonalNormalSummary {
  withinCount: number;
  shiftedCount: number;
  insufficientCount: number;
  confidence: PersonalNormalConfidence;
}

export interface PersonalNormalResult {
  generatedAt: string;
  currentWindowDays: 14 | 30;
  baselineWindowDays: 90;
  summary: PersonalNormalSummary;
  metrics: PersonalNormalMetric[];
  recordGaps: PersonalNormalGap[];
  limitations: string[];
}

// ── Metric definitions ───────────────────────────────────────────────────────

export interface MetricDefinition {
  id: string;
  label: string;
  layer: PersonalNormalLayer;
  seriesName: string;
  aggregation: 'median' | 'mean' | 'sum' | 'count';
  /** true = days with no data produce null (scalar); false = days with no data produce 0 (count/load) */
  isScalar: boolean;
}

export const FIRST_LAYER_METRICS: MetricDefinition[] = [
  { id: 'hardness', label: '晨间硬度', layer: 'primary', seriesName: 'hardness', aggregation: 'median', isScalar: true },
  { id: 'sleep', label: '睡眠时长', layer: 'primary', seriesName: 'sleep', aggregation: 'median', isScalar: true },
  { id: 'stress', label: '压力水平', layer: 'primary', seriesName: 'stress', aggregation: 'median', isScalar: true },
  { id: 'sexLoad', label: '性活动负荷', layer: 'primary', seriesName: 'sexLoad', aggregation: 'median', isScalar: true },
];

export const SECONDARY_METRICS: MetricDefinition[] = [
  { id: 'exercise', label: '运动时长', layer: 'secondary', seriesName: 'exercise', aggregation: 'median', isScalar: true },
  { id: 'masturbation', label: '自慰次数', layer: 'secondary', seriesName: 'masturbation', aggregation: 'median', isScalar: true },
];
