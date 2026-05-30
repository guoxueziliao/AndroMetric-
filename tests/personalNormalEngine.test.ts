import { describe, it, expect } from 'vitest';
import { computePersonalNormal } from '../features/stats/model/personalNormalEngine';
import type { DataPoint } from '../features/stats/model/StatsEngine';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeSeries = (days: number, startValue: number, variance: number, startDate = '2026-01-01'): DataPoint[] => {
  const points: DataPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const value = startValue + (Math.sin(i) * variance);
    points.push({ date, value, timestamp: d.getTime() });
  }
  return points;
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('computePersonalNormal', () => {
  it('returns insufficient_data when no series data', () => {
    const result = computePersonalNormal(() => [], 14, '2026-05-20');
    expect(result.summary.insufficientCount).toBe(result.metrics.length);
    expect(result.summary.withinCount).toBe(0);
    expect(result.summary.shiftedCount).toBe(0);
    expect(result.summary.confidence).toBe('none');
  });

  it('returns insufficient_data when baseline is too short', () => {
    // Only 10 days of baseline data (need 15+)
    const series = makeSeries(10, 3.0, 0.5, '2026-03-01');
    const result = computePersonalNormal(() => series, 14, '2026-05-20');
    const hardness = result.metrics.find((m) => m.id === 'hardness');
    expect(hardness?.state).toBe('insufficient_data');
  });

  it('returns within_personal_normal when current is within range', () => {
    // 90 days of baseline with consistent values
    const baseline = makeSeries(90, 3.5, 0.3, '2026-02-01');
    // 14 days of current with similar values
    const current = makeSeries(14, 3.5, 0.2, '2026-05-07');
    const allData = [...baseline, ...current];

    const result = computePersonalNormal(() => allData, 14, '2026-05-20');
    const hardness = result.metrics.find((m) => m.id === 'hardness');
    expect(hardness?.state).toBe('within_personal_normal');
  });

  it('detects shift when current is significantly above baseline', () => {
    // Baseline: low values
    const baseline = makeSeries(90, 2.0, 0.2, '2026-02-01');
    // Current: high values
    const current = makeSeries(14, 4.0, 0.1, '2026-05-07');
    const allData = [...baseline, ...current];

    const result = computePersonalNormal(() => allData, 14, '2026-05-20');
    const hardness = result.metrics.find((m) => m.id === 'hardness');
    expect(hardness?.state).toBe('shift_with_limited_confidence');
    expect(hardness?.direction).toBe('above_baseline');
  });

  it('produces correct summary counts', () => {
    const baseline = makeSeries(90, 3.0, 0.3, '2026-02-01');
    const current = makeSeries(14, 3.0, 0.2, '2026-05-07');
    const allData = [...baseline, ...current];

    const result = computePersonalNormal(() => allData, 14, '2026-05-20');
    expect(result.summary.withinCount + result.summary.shiftedCount + result.summary.insufficientCount)
      .toBe(result.metrics.length);
  });

  it('generates record gaps for missing days', () => {
    // Sparse data: only 50 days out of 104 total
    const sparse = makeSeries(50, 3.0, 0.3, '2026-02-01');
    const result = computePersonalNormal(() => sparse, 14, '2026-05-20');
    expect(result.recordGaps.length).toBeGreaterThan(0);
    expect(result.recordGaps.some((g) => g.window === 'baseline')).toBe(true);
  });

  it('respects 14 vs 30 day current window', () => {
    const data = makeSeries(120, 3.0, 0.3, '2026-01-01');
    const result14 = computePersonalNormal(() => data, 14, '2026-05-20');
    const result30 = computePersonalNormal(() => data, 30, '2026-05-20');

    expect(result14.currentWindowDays).toBe(14);
    expect(result30.currentWindowDays).toBe(30);
    // 30-day window should have more sample points
    const h14 = result14.metrics.find((m) => m.id === 'hardness');
    const h30 = result30.metrics.find((m) => m.id === 'hardness');
    expect(h30!.sampleSize).toBeGreaterThanOrEqual(h14!.sampleSize);
  });

  it('includes all first-layer and secondary metrics', () => {
    const data = makeSeries(120, 3.0, 0.3, '2026-01-01');
    const result = computePersonalNormal(() => data, 14, '2026-05-20');
    const ids = result.metrics.map((m) => m.id);
    expect(ids).toContain('hardness');
    expect(ids).toContain('sleep');
    expect(ids).toContain('stress');
    expect(ids).toContain('sexLoad');
    expect(ids).toContain('exercise');
    expect(ids).toContain('masturbation');
  });

  it('baselineRange uses P25-P75', () => {
    const data = makeSeries(120, 3.0, 0.5, '2026-01-01');
    const result = computePersonalNormal(() => data, 14, '2026-05-20');
    const hardness = result.metrics.find((m) => m.id === 'hardness');
    if (hardness?.baselineRange) {
      expect(hardness.baselineRange[0]).toBeLessThan(hardness.baselineRange[1]);
      expect(hardness.baselineMedian).toBeGreaterThanOrEqual(hardness.baselineRange[0]);
      expect(hardness.baselineMedian).toBeLessThanOrEqual(hardness.baselineRange[1]);
    }
  });

  it('global limitations include coverage warning when too many gaps', () => {
    // Very sparse data
    const sparse = makeSeries(10, 3.0, 0.3, '2026-01-01');
    const result = computePersonalNormal(() => sparse, 14, '2026-05-20');
    expect(result.limitations.some((l) => l.includes('记录缺口'))).toBe(true);
  });
});
