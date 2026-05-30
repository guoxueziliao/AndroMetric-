import type { DataPoint } from './StatsEngine';
import type { PersonalNormalResult } from './personalNormalTypes';
import type {
  ContextType,
  ContextWindowFact,
  ContextExplanationCard,
  ContextExplanationResult,
  GapType,
} from './contextExplanationTypes';

// ── Context priority (lower = shown first) ───────────────────────────────────

const CONTEXT_PRIORITY: Record<ContextType, number> = {
  sleep: 1,
  stress: 2,
  sex_load: 3,
  recovery: 4,
  porn_use: 5,
  exercise: 6,
  alcohol: 7,
  screen_time: 8,
  training_goals: 9,
  relationship_context: 10,
};

const MAX_CARDS_PER_METRIC = 3;

// ── Context definitions ──────────────────────────────────────────────────────

interface ContextDef {
  type: ContextType;
  label: string;
  threshold: number;
  highMessage: (label: string, metricLabel: string) => string;
  lowMessage: (label: string, metricLabel: string) => string;
  gapDetail: string;
}

const CONTEXT_DEFS: ContextDef[] = [
  {
    type: 'sleep',
    label: '睡眠',
    threshold: 0.7,
    highMessage: (l, m) => `变化窗口内${l}记录较完整，建议结合${m}一起观察。`,
    lowMessage: (l, m) => `${l}记录缺口较多，暂不判断${m}的变化趋势。`,
    gapDetail: '当前窗口睡眠记录不足',
  },
  {
    type: 'stress',
    label: '压力',
    threshold: 0.5,
    highMessage: (l, m) => `变化窗口内${l}记录较多，建议结合${m}一起回看。`,
    lowMessage: (l, m) => `${l}记录较少，暂无法判断${m}变化的上下文。`,
    gapDetail: '当前窗口压力记录不足',
  },
  {
    type: 'sex_load',
    label: '性活动负荷',
    threshold: 0.3,
    highMessage: (l, m) => `${l}变化和${m}可以放在同一窗口观察。`,
    lowMessage: (l, m) => `${l}记录较少，暂不提供${m}变化的上下文。`,
    gapDetail: '当前窗口性活动记录不足',
  },
  {
    type: 'exercise',
    label: '运动',
    threshold: 0.3,
    highMessage: (l, m) => `变化窗口内${l}记录可作为${m}观察的参考。`,
    lowMessage: (l, m) => `${l}记录较少，暂不提供${m}变化的上下文。`,
    gapDetail: '当前窗口运动记录不足',
  },
  {
    type: 'alcohol',
    label: '饮酒',
    threshold: 0.3,
    highMessage: (l, m) => `变化窗口内${l}记录可与${m}一起回看。`,
    lowMessage: (l, m) => `${l}记录较少，暂不提供${m}变化的上下文。`,
    gapDetail: '当前窗口饮酒记录不足',
  },
  {
    type: 'screen_time',
    label: '屏幕使用',
    threshold: 0.5,
    highMessage: (l, m) => `${l}记录可作为${m}观察的参考上下文。`,
    lowMessage: (l, m) => `${l}记录较少，暂不提供${m}变化的上下文。`,
    gapDetail: '当前窗口屏幕使用记录不足',
  },
];

// ── Metric-to-context mapping ────────────────────────────────────────────────

const METRIC_CONTEXT_MAP: Record<string, ContextType[]> = {
  hardness: ['sleep', 'stress', 'sex_load', 'exercise', 'alcohol', 'screen_time'],
  sleep: ['stress', 'screen_time', 'alcohol', 'exercise'],
  stress: ['sleep', 'exercise', 'sex_load', 'alcohol'],
  sexLoad: ['stress', 'sleep', 'exercise', 'alcohol'],
  exercise: ['sleep', 'stress', 'alcohol'],
  masturbation: ['sex_load', 'stress', 'sleep', 'screen_time'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const filterByDateRange = (series: DataPoint[], startDate: string, endDate: string): DataPoint[] =>
  series.filter((dp) => dp.date >= startDate && dp.date <= endDate);

const computeCoverage = (series: DataPoint[], totalDays: number): number =>
  totalDays <= 0 ? 0 : series.length / totalDays;

const deriveConfidence = (coverage: number): 'none' | 'low' | 'medium' =>
  coverage >= 0.7 ? 'medium' : coverage >= 0.5 ? 'low' : 'none';

const generateId = (): string =>
  `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Context fact builder ─────────────────────────────────────────────────────

const buildContextFact = (
  def: ContextDef,
  series: DataPoint[],
  windowDays: 14 | 30,
): { fact: ContextWindowFact; usable: boolean; gap: { contextType: ContextType; gapType: GapType; detail: string } | null } => {
  const coverage = computeCoverage(series, windowDays);
  const missingDays = windowDays - series.length;
  const confidence = deriveConfidence(coverage);

  const limitations: string[] = [];
  if (series.length < 5) limitations.push(`${def.label}样本有限，仅供参考。`);
  if (coverage < 0.7) limitations.push(`${def.label}记录覆盖率偏低。`);

  const fact: ContextWindowFact = {
    contextType: def.type,
    windowDays: windowDays as 14 | 30,
    sampleSize: series.length,
    missingDays,
    summary: '',
    confidence,
    limitations,
  };

  if (series.length < 3 || coverage < def.threshold) {
    return {
      fact: { ...fact, summary: `${def.label}记录不足` },
      usable: false,
      gap: { contextType: def.type, gapType: 'missing_log', detail: def.gapDetail },
    };
  }

  return {
    fact: { ...fact, summary: `${def.label}记录 n=${series.length}` },
    usable: true,
    gap: null,
  };
};

// ── Main entry ───────────────────────────────────────────────────────────────

/**
 * Compute context explanation cards for changed metrics in a personal normal result.
 * Pure function — no Dexie, no React, no DOM.
 *
 * @param result - 0.2.8 PersonalNormalResult
 * @param getSeries - function that returns DataPoint[] for a given metric name
 * @param today - current date string (YYYY-MM-DD)
 */
export const computeContextExplanations = (
  result: PersonalNormalResult,
  getSeries: (metricName: string) => DataPoint[],
  today: string,
): ContextExplanationResult => {
  const windowDays = result.currentWindowDays;

  // Date range
  const d = new Date(today + 'T12:00:00');
  const windowStart = new Date(d);
  windowStart.setDate(windowStart.getDate() - windowDays + 1);
  const windowStartStr = windowStart.toISOString().slice(0, 10);

  // Changed metrics
  const changedMetrics = result.metrics.filter((m) => m.state === 'shift_with_limited_confidence');
  const changedMetricIds = changedMetrics.map((m) => m.id);

  const allCards: ContextExplanationCard[] = [];
  const allGaps: ContextExplanationResult['recordGaps'] = [];
  const globalLimitations: string[] = [];

  if (changedMetrics.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      windowDays,
      changedMetricIds,
      cards: [],
      recordGaps: [],
      limitations: ['当前窗口无显著偏离指标，无需查看解释。'],
    };
  }

  for (const metric of changedMetrics) {
    const contextTypes = METRIC_CONTEXT_MAP[metric.id] ?? [];
    const metricCards: ContextExplanationCard[] = [];

    for (const ctxType of contextTypes) {
      const def = CONTEXT_DEFS.find((d) => d.type === ctxType);
      if (!def) continue;

      const series = filterByDateRange(getSeries(ctxType), windowStartStr, today);
      const factResult = buildContextFact(def, series, windowDays);

      if (factResult.gap) {
        allGaps.push({ ...factResult.gap, detail: `${metric.label}：${factResult.gap.detail}` });
      }

      if (factResult.usable) {
        metricCards.push({
          id: generateId(),
          metricId: metric.id,
          contextType: ctxType,
          windowDays,
          message: factResult.fact.confidence === 'medium'
            ? def.highMessage(def.label, metric.label)
            : def.lowMessage(def.label, metric.label),
          sampleSize: series.length,
          confidence: factResult.fact.confidence,
          limitations: factResult.fact.limitations,
        });
      }
    }

    // Sort by priority and cap
    metricCards.sort((a, b) => (CONTEXT_PRIORITY[a.contextType] ?? 99) - (CONTEXT_PRIORITY[b.contextType] ?? 99));
    allCards.push(...metricCards.slice(0, MAX_CARDS_PER_METRIC));
  }

  // Global limitations
  if (allGaps.length > allCards.length) {
    globalLimitations.push('多个上下文记录不足，解释卡片可能不完整。');
  }
  globalLimitations.push('解释卡片仅供观察参考，不表示因果关系。');

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    changedMetricIds,
    cards: allCards,
    recordGaps: allGaps,
    limitations: globalLimitations,
  };
};
