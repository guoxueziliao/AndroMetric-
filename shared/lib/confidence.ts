// ── Insight confidence calibration (0.2.16) ──────────────────────────────────
// Single source of truth for how engine confidence levels are expressed to the
// user. Engines (PersonalState / PersonalNormal / ContextExplanation / review)
// already emit a confidence level plus their own `limitations` reasons; this
// module only standardises the *label* so every surface speaks the same language.
//
// Pure module: no React, no Dexie, no DOM. Never persisted or exported.

/** Confidence level emitted by the analysis engines. */
export type InsightConfidence = 'none' | 'low' | 'medium' | 'high';

/** Three-tier viewing guidance shown to long-term users. */
export type ConfidenceTier = 'viewable' | 'cautious' | 'not_yet';

const CONFIDENCE_TIER_MAP: Record<InsightConfidence, ConfidenceTier> = {
  none: 'not_yet',
  low: 'cautious',
  medium: 'viewable',
  high: 'viewable',
};

const CONFIDENCE_TIER_LABEL: Record<ConfidenceTier, string> = {
  viewable: '可看',
  cautious: '谨慎看',
  not_yet: '暂不看',
};

/**
 * Short badge shown right next to an insight. Empty for `none` so low-signal
 * cards stay quiet rather than shouting an error.
 */
const CONFIDENCE_BADGE_LABEL: Record<InsightConfidence, string> = {
  none: '',
  low: '样本有限',
  medium: '初步可看',
  high: '可稳定参考',
};

/** Map an engine confidence level to its viewing tier. */
export const confidenceTier = (confidence: InsightConfidence): ConfidenceTier =>
  CONFIDENCE_TIER_MAP[confidence];

/** `可看 / 谨慎看 / 暂不看` label for a confidence level. */
export const confidenceTierLabel = (confidence: InsightConfidence): string =>
  CONFIDENCE_TIER_LABEL[CONFIDENCE_TIER_MAP[confidence]];

/** Short label placed next to the insight; empty string for `none`. */
export const confidenceBadgeLabel = (confidence: InsightConfidence): string =>
  CONFIDENCE_BADGE_LABEL[confidence] ?? '';
