// ── Context Explanation Layer v1 ──────────────────────────────────────────────
// Read-only derived types for the personal normal explanation layer.
// These types are NEVER persisted to IndexedDB or included in JSON backup/CSV export.
// All values are computed at runtime from existing data.

import type { PersonalNormalConfidence } from './personalNormalTypes';

export type ContextType =
  | 'sleep'
  | 'stress'
  | 'sex_load'
  | 'recovery'
  | 'porn_use'
  | 'exercise'
  | 'alcohol'
  | 'screen_time'
  | 'training_goals'
  | 'relationship_context';

export type GapType =
  | 'missing_log'
  | 'missing_field'
  | 'missing_event_detail'
  | 'dependency_not_available'
  | 'legacy_value_unclear';

export interface ContextWindowFact {
  contextType: ContextType;
  windowDays: 14 | 30;
  sampleSize: number;
  missingDays: number;
  summary: string;
  confidence: PersonalNormalConfidence;
  limitations: string[];
}

export interface ContextExplanationCard {
  id: string;
  metricId: string;
  contextType: ContextType;
  windowDays: 14 | 30;
  message: string;
  sampleSize: number;
  confidence: PersonalNormalConfidence;
  limitations: string[];
}

export interface ContextExplanationResult {
  generatedAt: string;
  windowDays: 14 | 30;
  changedMetricIds: string[];
  cards: ContextExplanationCard[];
  recordGaps: Array<{ contextType: ContextType; gapType: GapType; detail: string }>;
  limitations: string[];
}
