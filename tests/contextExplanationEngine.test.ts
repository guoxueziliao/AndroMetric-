import { describe, it, expect } from 'vitest';
import type { DataPoint } from '../features/stats/model/StatsEngine';
import type { PersonalNormalResult } from '../features/stats/model/personalNormalTypes';
import { computeContextExplanations } from '../features/stats/model/contextExplanationEngine';

const makeDp = (date: string, value: number): DataPoint => ({ date, value, timestamp: 0 });

const makeShiftedMetric = (id: string, label: string) => ({
  id,
  label,
  layer: 'primary' as const,
  state: 'shift_with_limited_confidence' as const,
  direction: 'below_baseline' as const,
  currentValue: 3,
  baselineMedian: 5,
  baselineRange: [4, 6] as [number, number],
  sampleSize: 10,
  baselineSampleSize: 30,
  missingDays: 4,
  coverage: 0.6,
  confidence: 'low' as const,
  limitations: ['偏离个人常态仅表示与自身历史不同，不代表异常。'],
});

const makeNormalResult = (windowDays: 14 | 30, metrics: PersonalNormalResult['metrics']): PersonalNormalResult => ({
  generatedAt: new Date().toISOString(),
  currentWindowDays: windowDays,
  baselineWindowDays: 90,
  summary: {
    withinCount: 0,
    shiftedCount: metrics.filter((m) => m.state === 'shift_with_limited_confidence').length,
    insufficientCount: 0,
    confidence: 'low',
  },
  metrics,
  recordGaps: [],
  limitations: [],
});

describe('computeContextExplanations', () => {
  const today = '2026-05-30';

  it('returns empty cards when no metrics are shifted', () => {
    const result = makeNormalResult(14, [{
      id: 'hardness', label: '晨间硬度', layer: 'primary',
      state: 'within_personal_normal', direction: 'within_baseline',
      currentValue: 5, baselineMedian: 5, baselineRange: [4, 6],
      sampleSize: 14, baselineSampleSize: 30, missingDays: 0,
      coverage: 1, confidence: 'medium', limitations: [],
    }]);
    const res = computeContextExplanations(result, () => [], today);
    expect(res.cards).toHaveLength(0);
    expect(res.changedMetricIds).toHaveLength(0);
    expect(res.limitations[0]).toContain('无显著偏离');
  });

  it('generates cards for shifted hardness metric', () => {
    const result = makeNormalResult(14, [makeShiftedMetric('hardness', '晨间硬度')]);
    const seriesMap: Record<string, DataPoint[]> = {};
    for (let i = 0; i < 14; i++) {
      const d = `2026-05-${(17 + i).toString().padStart(2, '0')}`;
      seriesMap.sleep = [...(seriesMap.sleep ?? []), makeDp(d, 7)];
      seriesMap.stress = [...(seriesMap.stress ?? []), makeDp(d, 2)];
      seriesMap.exercise = [...(seriesMap.exercise ?? []), makeDp(d, 30)];
    }
    const res = computeContextExplanations(
      result,
      (name) => seriesMap[name] ?? [],
      today,
    );
    expect(res.changedMetricIds).toEqual(['hardness']);
    expect(res.cards.length).toBeGreaterThan(0);
    expect(res.cards.length).toBeLessThanOrEqual(3);
    // Cards should mention 晨间硬度
    for (const card of res.cards) {
      expect(card.message).toContain('晨间硬度');
    }
  });

  it('caps at 3 cards per metric', () => {
    const result = makeNormalResult(14, [makeShiftedMetric('hardness', '晨间硬度')]);
    const fullSeries: DataPoint[] = [];
    for (let i = 0; i < 14; i++) {
      const d = `2026-05-${(17 + i).toString().padStart(2, '0')}`;
      fullSeries.push(makeDp(d, 1));
    }
    const res = computeContextExplanations(
      result,
      () => fullSeries,
      today,
    );
    expect(res.cards.length).toBeLessThanOrEqual(3);
  });

  it('generates gaps for contexts with insufficient data', () => {
    const result = makeNormalResult(14, [makeShiftedMetric('hardness', '晨间硬度')]);
    // Only sleep has data, everything else empty
    const sleepSeries: DataPoint[] = [];
    for (let i = 0; i < 14; i++) {
      const d = `2026-05-${(17 + i).toString().padStart(2, '0')}`;
      sleepSeries.push(makeDp(d, 7));
    }
    const res = computeContextExplanations(
      result,
      (name) => (name === 'sleep' ? sleepSeries : []),
      today,
    );
    expect(res.recordGaps.length).toBeGreaterThan(0);
    // Gaps should mention 晨间硬度
    for (const gap of res.recordGaps) {
      expect(gap.detail).toContain('晨间硬度');
    }
  });

  it('no high confidence cards', () => {
    const result = makeNormalResult(30, [makeShiftedMetric('stress', '压力水平')]);
    const fullSeries: DataPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const d = `2026-05-${(1 + i).toString().padStart(2, '0')}`;
      fullSeries.push(makeDp(d, 1));
    }
    const res = computeContextExplanations(
      result,
      () => fullSeries,
      today,
    );
    for (const card of res.cards) {
      expect(card.confidence).not.toBe('high');
    }
  });

  it('window days match personal normal result', () => {
    const result = makeNormalResult(30, [makeShiftedMetric('sleep', '睡眠时长')]);
    const res = computeContextExplanations(result, () => [], today);
    expect(res.windowDays).toBe(30);
  });

  it('every card has sampleSize and limitations', () => {
    const result = makeNormalResult(14, [makeShiftedMetric('hardness', '晨间硬度')]);
    const fullSeries: DataPoint[] = [];
    for (let i = 0; i < 14; i++) {
      const d = `2026-05-${(17 + i).toString().padStart(2, '0')}`;
      fullSeries.push(makeDp(d, 1));
    }
    const res = computeContextExplanations(result, () => fullSeries, today);
    for (const card of res.cards) {
      expect(card.sampleSize).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(card.limitations)).toBe(true);
    }
  });

  it('global limitations always include disclaimer', () => {
    const result = makeNormalResult(14, [makeShiftedMetric('hardness', '晨间硬度')]);
    const res = computeContextExplanations(result, () => [], today);
    expect(res.limitations.some((l) => l.includes('不表示因果关系'))).toBe(true);
  });

  it('handles multiple shifted metrics', () => {
    const result = makeNormalResult(14, [
      makeShiftedMetric('hardness', '晨间硬度'),
      makeShiftedMetric('sleep', '睡眠时长'),
    ]);
    const fullSeries: DataPoint[] = [];
    for (let i = 0; i < 14; i++) {
      const d = `2026-05-${(17 + i).toString().padStart(2, '0')}`;
      fullSeries.push(makeDp(d, 1));
    }
    const res = computeContextExplanations(result, () => fullSeries, today);
    expect(res.changedMetricIds).toEqual(['hardness', 'sleep']);
    // Should have cards for both metrics (up to 3 each)
    const hardnessCards = res.cards.filter((c) => c.metricId === 'hardness');
    const sleepCards = res.cards.filter((c) => c.metricId === 'sleep');
    expect(hardnessCards.length).toBeGreaterThan(0);
    expect(sleepCards.length).toBeGreaterThan(0);
  });
});
