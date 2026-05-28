import type { AdultBehaviorWindowFacts } from './adultBehaviorReviewFacts';

// ── Types ────────────────────────────────────────────────────────────────────

export type ReviewConfidence = 'none' | 'low' | 'medium' | 'high';

// ── Sample size thresholds ───────────────────────────────────────────────────

export const CONFIDENCE_THRESHOLDS = {
  none: { minSample: 0, maxSample: 2 },
  low: { minSample: 3, maxSample: 6 },
  medium: { minSample: 7, maxSample: Infinity },
  // high is not auto-generated in 0.2.3
} as const;

/**
 * Determine confidence from a sample size.
 * 0.2.3 caps at medium — never auto-generates high.
 */
export const sampleToConfidence = (sampleSize: number): ReviewConfidence => {
  if (sampleSize < 3) return 'none';
  if (sampleSize < 7) return 'low';
  return 'medium';
};

/**
 * Downgrade confidence when there are significant missing data warnings.
 */
export const applyMissingDataPenalty = (
  confidence: ReviewConfidence,
  missingDataCount: number,
): ReviewConfidence => {
  if (missingDataCount === 0) return confidence;
  if (confidence === 'none') return 'none';
  if (confidence === 'medium' && missingDataCount >= 3) return 'low';
  if (confidence === 'low' && missingDataCount >= 5) return 'none';
  return confidence;
};

// ── Limitations generator ────────────────────────────────────────────────────

export const generateLimitations = (input: {
  sampleSize: number;
  confidence: ReviewConfidence;
  missingData: AdultBehaviorWindowFacts['missingData'];
}): string[] => {
  const limitations: string[] = [];

  if (input.sampleSize < 3) {
    limitations.push('样本量不足（<3），当前只展示事实，不做趋势判断。');
  } else if (input.sampleSize < 7) {
    limitations.push('样本量较少，观察仅供参考。');
  }

  const warningMissing = input.missingData.filter((m) => m.severity === 'warning');
  if (warningMissing.length > 0) {
    limitations.push(`存在 ${warningMissing.length} 条数据缺口，可能影响复盘完整性。`);
  }

  const noSleep = input.missingData.some((m) => m.key === 'no_sleep_record');
  if (noSleep) {
    limitations.push('睡眠记录缺失，睡眠相关复盘可信度较低。');
  }

  const noHardness = input.missingData.some((m) => m.key === 'no_morning_hardness');
  if (noHardness) {
    limitations.push('晨间硬度记录缺失，硬度相关复盘不完整。');
  }

  const orphans = input.missingData.filter((m) => m.key === 'orphan_linked_id');
  if (orphans.length > 0) {
    limitations.push('存在未补全的事件关联，行为链路可能不完整。');
  }

  if (input.confidence !== 'none') {
    limitations.push('只显示共现关系，不代表因果。');
  }

  return limitations;
};

// ── Gated insight output ─────────────────────────────────────────────────────

export interface GatedInsight {
  id: string;
  metric: string;
  window: string;
  sampleSize: number;
  confidence: ReviewConfidence;
  direction?: 'up' | 'down' | 'mixed' | 'flat';
  summary: string;
  supportingFacts: string[];
  limitations: string[];
}

/**
 * Gate an insight: returns the gated insight if confidence is above 'none',
 * or null if the sample is too small to output any insight.
 */
export const gateInsight = (input: {
  id: string;
  metric: string;
  window: string;
  sampleSize: number;
  direction?: 'up' | 'down' | 'mixed' | 'flat';
  summary: string;
  supportingFacts: string[];
  missingData: AdultBehaviorWindowFacts['missingData'];
}): GatedInsight | null => {
  const confidence = sampleToConfidence(input.sampleSize);
  if (confidence === 'none') return null;

  const adjustedConfidence = applyMissingDataPenalty(
    confidence,
    input.missingData.filter((m) => m.severity === 'warning').length,
  );
  if (adjustedConfidence === 'none') return null;

  const limitations = generateLimitations({
    sampleSize: input.sampleSize,
    confidence: adjustedConfidence,
    missingData: input.missingData,
  });

  return {
    id: input.id,
    metric: input.metric,
    window: input.window,
    sampleSize: input.sampleSize,
    confidence: adjustedConfidence,
    direction: input.direction,
    summary: input.summary,
    supportingFacts: input.supportingFacts,
    limitations,
  };
};

/**
 * Gate multiple insights, filtering out those that don't pass.
 */
export const gateInsights = (
  candidates: Array<{
    id: string;
    metric: string;
    window: string;
    sampleSize: number;
    direction?: 'up' | 'down' | 'mixed' | 'flat';
    summary: string;
    supportingFacts: string[];
  }>,
  missingData: AdultBehaviorWindowFacts['missingData'],
): GatedInsight[] => {
  return candidates
    .map((c) => gateInsight({ ...c, missingData }))
    .filter((r): r is GatedInsight => r !== null);
};
