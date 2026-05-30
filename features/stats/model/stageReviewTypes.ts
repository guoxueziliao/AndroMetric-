// ── Stage Review Types ───────────────────────────────────────────────────────
// Read-only derived types for monthly/quarterly stage reviews.
// These types are NEVER persisted to IndexedDB or included in JSON backup/CSV export.
// All values are computed at runtime from existing data.

export type PeriodType = 'month' | 'quarter';

export type SectionType =
  | 'summary'
  | 'personal_normal'
  | 'context_explanations'
  | 'observation_plans'
  | 'experience_cards'
  | 'record_gaps';

export interface StageReviewSection {
  type: SectionType;
  title: string;
  available: boolean;
  hiddenReason?: string;
  data: unknown;
}

export interface StageReview {
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  sections: StageReviewSection[];
  limitations: string[];
}

// ── Summary data ─────────────────────────────────────────────────────────────

export interface StageReviewSummary {
  periodLabel: string;
  totalDays: number;
  daysWithLogs: number;
  coverage: number;
  metricsAtNormal: number;
  metricsShifted: number;
  metricsInsufficient: number;
  observationPlanCount: number;
  experienceCardCount: number;
}

// ── Observation plan in review ───────────────────────────────────────────────

export interface ReviewObservationPlan {
  goalId: string;
  title: string;
  status: string;
  windowDays: number;
  startDate: string;
  endDate: string;
}
