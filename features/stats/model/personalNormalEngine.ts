import type { DataPoint } from './StatsEngine';
import type {
  PersonalNormalResult,
  PersonalNormalMetric,
  PersonalNormalGap,
  PersonalNormalSummary,
  PersonalNormalState,
  PersonalNormalDirection,
  PersonalNormalConfidence,
  MetricDefinition,
} from './personalNormalTypes';
import { FIRST_LAYER_METRICS, SECONDARY_METRICS } from './personalNormalTypes';

// ── Baseline windows ─────────────────────────────────────────────────────────

const BASELINE_WINDOW_DAYS = 90;

// ── Statistical helpers ──────────────────────────────────────────────────────

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const percentile = (values: number[], p: number): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const mad = (values: number[], med: number): number => {
  if (values.length === 0) return 0;
  const deviations = values.map((v) => Math.abs(v - med));
  return median(deviations) ?? 0;
};

// ── State decision rules ─────────────────────────────────────────────────────

const computeState = (
  currentValue: number | null,
  baselineRange: [number, number] | null,
  baselineMedian: number | null,
  currentSampleSize: number,
  baselineSampleSize: number,
  coverage: number,
): { state: PersonalNormalState; confidence: PersonalNormalConfidence; direction: PersonalNormalDirection } => {
  // Insufficient data conditions
  if (currentValue === null || baselineRange === null || baselineMedian === null) {
    return { state: 'insufficient_data', confidence: 'none', direction: 'unknown' };
  }
  if (currentSampleSize < 5 || baselineSampleSize < 15) {
    return { state: 'insufficient_data', confidence: 'none', direction: 'unknown' };
  }
  if (coverage < 0.5) {
    return { state: 'insufficient_data', confidence: 'none', direction: 'unknown' };
  }

  // Direction
  const direction: PersonalNormalDirection =
    currentValue > baselineRange[1] ? 'above_baseline' :
    currentValue < baselineRange[0] ? 'below_baseline' :
    'within_baseline';

  // Confidence based on sample sizes and coverage
  const confidence: PersonalNormalConfidence =
    baselineSampleSize >= 30 && currentSampleSize >= 15 && coverage >= 0.7
      ? 'medium'
      : 'low';

  // State
  if (direction === 'within_baseline') {
    return { state: 'within_personal_normal', confidence, direction };
  }

  return { state: 'shift_with_limited_confidence', confidence, direction };
};

// ── Series helpers ───────────────────────────────────────────────────────────

const filterByDateRange = (series: DataPoint[], startDate: string, endDate: string): DataPoint[] =>
  series.filter((dp) => dp.date >= startDate && dp.date <= endDate);

const computeCoverage = (series: DataPoint[], totalDays: number): number => {
  if (totalDays <= 0) return 0;
  return series.length / totalDays;
};

// ── Metric computation ───────────────────────────────────────────────────────

const computeMetric = (
  def: MetricDefinition,
  currentSeries: DataPoint[],
  baselineSeries: DataPoint[],
  currentDays: number,
  baselineDays: number,
): PersonalNormalMetric => {
  // Current values — for isScalar metrics, filter out 0 (StatsEngine fills 0 for sum/count on missing days)
  const currentValues = currentSeries.map((dp) => dp.value).filter((v) => v != null && (def.isScalar ? v !== 0 : true)) as number[];
  const baselineValues = baselineSeries.map((dp) => dp.value).filter((v) => v != null && (def.isScalar ? v !== 0 : true)) as number[];

  // Current aggregated value
  const currentValue = currentValues.length > 0
    ? (def.aggregation === 'median' ? median(currentValues) :
       def.aggregation === 'mean' ? currentValues.reduce((a, b) => a + b, 0) / currentValues.length :
       def.aggregation === 'sum' ? currentValues.reduce((a, b) => a + b, 0) :
       currentValues.length)
    : null;

  // Baseline statistics
  const baselineMedianVal = median(baselineValues);
  const p25 = percentile(baselineValues, 25);
  const p75 = percentile(baselineValues, 75);
  const baselineRange: [number, number] | null = (p25 != null && p75 != null)
    ? [p25, p75]
    : baselineMedianVal != null
      ? [baselineMedianVal - mad(baselineValues, baselineMedianVal), baselineMedianVal + mad(baselineValues, baselineMedianVal)]
      : null;

  // Sample sizes
  const currentSampleSize = currentSeries.length;
  const baselineSampleSize = baselineSeries.length;

  // Missing days (days in window without any data point)
  const currentMissing = currentDays - currentSeries.length;
  const baselineMissing = baselineDays - baselineSeries.length;

  // Coverage
  const coverage = computeCoverage(currentSeries, currentDays);

  // State decision
  const { state, confidence, direction } = computeState(
    currentValue,
    baselineRange,
    baselineMedianVal,
    currentSampleSize,
    baselineSampleSize,
    coverage,
  );

  // Limitations
  const limitations: string[] = [];
  if (currentSampleSize < 5) limitations.push('当前窗口样本不足，仅供参考。');
  if (baselineSampleSize < 15) limitations.push('基线样本有限，范围可能不稳定。');
  if (coverage < 0.7) limitations.push('记录覆盖率偏低，缺失数据可能影响结果。');
  if (state === 'shift_with_limited_confidence') limitations.push('偏离个人常态仅表示与自身历史不同，不代表异常。');

  // Record gaps
  const gaps: PersonalNormalGap[] = [];
  if (currentMissing > 0) {
    gaps.push({
      metricId: def.id,
      window: 'current',
      missingDays: currentMissing,
      reason: def.isScalar ? 'missing_field' : 'missing_log',
    });
  }
  if (baselineMissing > 0) {
    gaps.push({
      metricId: def.id,
      window: 'baseline',
      missingDays: baselineMissing,
      reason: def.isScalar ? 'missing_field' : 'missing_log',
    });
  }

  return {
    id: def.id,
    label: def.label,
    layer: def.layer,
    state,
    direction,
    currentValue,
    baselineMedian: baselineMedianVal,
    baselineRange,
    sampleSize: currentSampleSize,
    baselineSampleSize,
    missingDays: currentMissing,
    coverage,
    confidence,
    limitations,
  };
};

// ── Main entry ───────────────────────────────────────────────────────────────

/**
 * Compute personal normal results from metric series.
 * Pure function — no Dexie, no React, no DOM.
 *
 * @param getSeries - function that returns a DataPoint[] for a given metric name
 * @param currentWindowDays - 14 or 30
 * @param today - current date string (YYYY-MM-DD)
 */
export const computePersonalNormal = (
  getSeries: (metricName: string) => DataPoint[],
  currentWindowDays: 14 | 30,
  today: string,
): PersonalNormalResult => {
  // Compute date ranges
  const d = new Date(today + 'T12:00:00');
  const currentStart = new Date(d);
  currentStart.setDate(currentStart.getDate() - currentWindowDays + 1);
  const currentStartStr = currentStart.toISOString().slice(0, 10);

  const baselineEnd = new Date(d);
  baselineEnd.setDate(baselineEnd.getDate() - currentWindowDays);
  const baselineEndStr = baselineEnd.toISOString().slice(0, 10);

  const baselineStart = new Date(baselineEnd);
  baselineStart.setDate(baselineStart.getDate() - BASELINE_WINDOW_DAYS + 1);
  const baselineStartStr = baselineStart.toISOString().slice(0, 10);

  // Compute metrics
  const allDefs = [...FIRST_LAYER_METRICS, ...SECONDARY_METRICS];
  const allGaps: PersonalNormalGap[] = [];
  const metrics: PersonalNormalMetric[] = [];

  for (const def of allDefs) {
    const series = getSeries(def.seriesName);
    const currentSeries = filterByDateRange(series, currentStartStr, today);
    const baselineSeries = filterByDateRange(series, baselineStartStr, baselineEndStr);

    const metric = computeMetric(
      def,
      currentSeries,
      baselineSeries,
      currentWindowDays,
      BASELINE_WINDOW_DAYS,
    );
    metrics.push(metric);

    // Collect gaps
    const currentMissing = currentWindowDays - currentSeries.length;
    const baselineMissing = BASELINE_WINDOW_DAYS - baselineSeries.length;
    if (currentMissing > 0) {
      allGaps.push({
        metricId: def.id,
        window: 'current',
        missingDays: currentMissing,
        reason: def.isScalar ? 'missing_field' : 'missing_log',
      });
    }
    if (baselineMissing > 0) {
      allGaps.push({
        metricId: def.id,
        window: 'baseline',
        missingDays: baselineMissing,
        reason: def.isScalar ? 'missing_field' : 'missing_log',
      });
    }
  }

  // Summary
  const summary: PersonalNormalSummary = {
    withinCount: metrics.filter((m) => m.state === 'within_personal_normal').length,
    shiftedCount: metrics.filter((m) => m.state === 'shift_with_limited_confidence').length,
    insufficientCount: metrics.filter((m) => m.state === 'insufficient_data').length,
    confidence: (() => {
      const mediumCount = metrics.filter((m) => m.confidence === 'medium').length;
      const lowCount = metrics.filter((m) => m.confidence === 'low').length;
      if (mediumCount > 0 && mediumCount >= metrics.length / 2) return 'medium' as const;
      if (mediumCount > 0 || lowCount > 0) return 'low' as const;
      return 'none' as const;
    })(),
  };

  // Global limitations
  const limitations: string[] = [];
  const totalGaps = allGaps.reduce((sum, g) => sum + g.missingDays, 0);
  if (totalGaps > currentWindowDays * 0.5) {
    limitations.push('当前窗口记录缺口较多，建议先补充基础记录。');
  }
  if (metrics.every((m) => m.state === 'insufficient_data')) {
    limitations.push('所有指标数据不足，建议持续记录至少 30 天后再查看。');
  }

  return {
    generatedAt: new Date().toISOString(),
    currentWindowDays,
    baselineWindowDays: BASELINE_WINDOW_DAYS,
    summary,
    metrics,
    recordGaps: allGaps,
    limitations,
  };
};
