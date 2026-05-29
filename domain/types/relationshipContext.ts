// ── Relationship Context v1 ──────────────────────────────────────────────────
// Per-record relationship context for sex behavior records.
// All fields are optional; context is always skippable.
// Private notes (communicationNote, boundaryNote) are excluded from CSV/report exports by default.

/** Per-record relationship context attached to a sex behavior record or SexEvent. */
export interface RelationshipContext {
  // 1. Relationship Context
  relationshipType?: 'stable' | 'dating' | 'casual' | 'service' | 'unknown';
  familiarity?: 'first_time' | 'familiar' | 'long_term' | 'unknown';
  planned?: 'yes' | 'no' | 'spontaneous' | 'unknown';
  privacyComfort?: 'comfortable' | 'mixed' | 'uncomfortable' | 'unknown';

  // 2. Communication Status
  communicationBefore?: 'clear' | 'partial' | 'none' | 'not_recorded';
  communicationAfter?: 'feedback_shared' | 'no_feedback' | 'not_recorded';
  needsFollowUp?: boolean;
  communicationNote?: string;

  // 3. Boundary and Preference
  boundaryConfirmed?: 'yes' | 'partial' | 'no' | 'not_recorded';
  boundaryIssue?: 'none' | 'minor' | 'uncomfortable' | 'not_recorded';
  preferenceMatched?: 'yes' | 'partial' | 'no' | 'not_recorded';
  boundaryNote?: string;

  // 4. Feedback and Recovery
  partnerFeedback?: 'positive' | 'neutral' | 'mixed' | 'negative' | 'not_recorded';
  selfFeltRespected?: 'yes' | 'mixed' | 'no' | 'not_recorded';
  aftercareQuality?: 'good' | 'partial' | 'missing' | 'not_recorded';
  relationshipStress?: 'low' | 'medium' | 'high' | 'not_recorded';

  // 5. Cycle and Female Sexual Health Care (per-record context only)
  cycleContext?: CycleContextValue;
  cycleComfort?: 'comfortable' | 'discomfort' | 'pain' | 'not_recorded';
  careNeeded?: CareNeededValue;
  cycleContextSource?: 'menstrual_summary' | 'cycle_event' | 'reproductive_profile' | 'manual' | 'unknown';
}

export type CycleContextValue =
  | 'period'
  | 'predicted_period'
  | 'fertile_window'
  | 'trying_to_conceive'
  | 'avoid_pregnancy'
  | 'pregnant'
  | 'recovery'
  | 'unknown';

export type CareNeededValue =
  | 'rest'
  | 'slower_pace'
  | 'avoid_sex'
  | 'aftercare'
  | 'contraception_check'
  | 'not_recorded';

/** Long-term relationship preferences stored on PartnerProfile. */
export interface PartnerRelationshipPreferences {
  communicationStyle?: string;
  preferredPace?: string;
  emotionalNeeds?: string;
  recoveryNeeds?: string;
  boundaryNotes?: string;
  privateNotes?: string;
}

/** Cycle care tracking toggle on PartnerProfile. */
export interface PartnerCycleCareSettings {
  trackingEnabled: boolean;
  currentGoal?: 'recording_only' | 'trying_to_conceive' | 'avoid_pregnancy' | 'pregnant' | 'recovery';
  notes?: string;
}

export const CYCLE_CONTEXT_LABELS: Record<CycleContextValue, string> = {
  period: '经期',
  predicted_period: '预计经期',
  fertile_window: '预计窗口期',
  trying_to_conceive: '备孕中',
  avoid_pregnancy: '避孕中',
  pregnant: '怀孕中',
  recovery: '恢复期',
  unknown: '未知',
};

export const CARE_NEEDED_LABELS: Record<CareNeededValue, string> = {
  rest: '休息',
  slower_pace: '放慢节奏',
  avoid_sex: '避免性行为',
  aftercare: '事后关怀',
  contraception_check: '避孕确认',
  not_recorded: '未记录',
};
