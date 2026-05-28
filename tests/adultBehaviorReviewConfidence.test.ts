import { describe, it, expect } from 'vitest';
import type { ReviewMissingData } from '../features/stats/model/adultBehaviorReviewFacts';
import {
  sampleToConfidence,
  applyMissingDataPenalty,
  generateLimitations,
  gateInsight,
  gateInsights,
} from '../features/stats/model/adultBehaviorReviewConfidence';

const emptyMissing: ReviewMissingData[] = [];

const warningMissing: ReviewMissingData[] = [
  { key: 'no_daily_log', targetDate: '2026-05-26', severity: 'warning', affectedMetrics: ['morning_hardness', 'sleep'] },
  { key: 'no_daily_log', targetDate: '2026-05-27', severity: 'warning', affectedMetrics: ['morning_hardness', 'sleep'] },
  { key: 'no_daily_log', targetDate: '2026-05-28', severity: 'warning', affectedMetrics: ['morning_hardness', 'sleep'] },
  { key: 'no_daily_log', targetDate: '2026-05-29', severity: 'warning', affectedMetrics: ['morning_hardness', 'sleep'] },
  { key: 'no_daily_log', targetDate: '2026-05-30', severity: 'warning', affectedMetrics: ['morning_hardness', 'sleep'] },
];

const sleepMissing: ReviewMissingData[] = [
  { key: 'no_sleep_record', targetDate: '2026-05-26', severity: 'info', affectedMetrics: ['sleep'] },
];

const hardnessMissing: ReviewMissingData[] = [
  { key: 'no_morning_hardness', targetDate: '2026-05-26', severity: 'info', affectedMetrics: ['morning_hardness'] },
];

const orphanMissing: ReviewMissingData[] = [
  { key: 'orphan_linked_id', targetDate: '2026-05-26', severity: 'info', affectedMetrics: ['event_linking'] },
];

// ── sampleToConfidence ───────────────────────────────────────────────────────

describe('sampleToConfidence', () => {
  it('sampleSize 0 → none', () => {
    expect(sampleToConfidence(0)).toBe('none');
  });

  it('sampleSize 1 → none', () => {
    expect(sampleToConfidence(1)).toBe('none');
  });

  it('sampleSize 2 → none', () => {
    expect(sampleToConfidence(2)).toBe('none');
  });

  it('sampleSize 3 → low', () => {
    expect(sampleToConfidence(3)).toBe('low');
  });

  it('sampleSize 6 → low', () => {
    expect(sampleToConfidence(6)).toBe('low');
  });

  it('sampleSize 7 → medium', () => {
    expect(sampleToConfidence(7)).toBe('medium');
  });

  it('sampleSize 100 → medium (not high in 0.2.3)', () => {
    expect(sampleToConfidence(100)).toBe('medium');
  });
});

// ── applyMissingDataPenalty ──────────────────────────────────────────────────

describe('applyMissingDataPenalty', () => {
  it('no missing data → no penalty', () => {
    expect(applyMissingDataPenalty('medium', 0)).toBe('medium');
  });

  it('medium + 3 warnings → low', () => {
    expect(applyMissingDataPenalty('medium', 3)).toBe('low');
  });

  it('medium + 2 warnings → medium (below threshold)', () => {
    expect(applyMissingDataPenalty('medium', 2)).toBe('medium');
  });

  it('low + 5 warnings → none', () => {
    expect(applyMissingDataPenalty('low', 5)).toBe('none');
  });

  it('none stays none regardless', () => {
    expect(applyMissingDataPenalty('none', 10)).toBe('none');
  });
});

// ── generateLimitations ──────────────────────────────────────────────────────

describe('generateLimitations', () => {
  it('sample < 3 includes insufficient sample limitation', () => {
    const lims = generateLimitations({ sampleSize: 2, confidence: 'none', missingData: emptyMissing });
    expect(lims.some((l) => l.includes('样本量不足'))).toBe(true);
  });

  it('sample 3-6 includes limited sample note', () => {
    const lims = generateLimitations({ sampleSize: 5, confidence: 'low', missingData: emptyMissing });
    expect(lims.some((l) => l.includes('样本量较少'))).toBe(true);
  });

  it('always includes causal disclaimer when not none', () => {
    const lims = generateLimitations({ sampleSize: 10, confidence: 'medium', missingData: emptyMissing });
    expect(lims.some((l) => l.includes('不代表因果'))).toBe(true);
  });

  it('warning missing data generates gap limitation', () => {
    const lims = generateLimitations({ sampleSize: 5, confidence: 'low', missingData: warningMissing });
    expect(lims.some((l) => l.includes('数据缺口'))).toBe(true);
  });

  it('sleep missing generates sleep limitation', () => {
    const lims = generateLimitations({ sampleSize: 5, confidence: 'low', missingData: sleepMissing });
    expect(lims.some((l) => l.includes('睡眠记录缺失'))).toBe(true);
  });

  it('hardness missing generates hardness limitation', () => {
    const lims = generateLimitations({ sampleSize: 5, confidence: 'low', missingData: hardnessMissing });
    expect(lims.some((l) => l.includes('晨间硬度记录缺失'))).toBe(true);
  });

  it('orphan linked ids generate linking limitation', () => {
    const lims = generateLimitations({ sampleSize: 5, confidence: 'low', missingData: orphanMissing });
    expect(lims.some((l) => l.includes('未补全的事件关联'))).toBe(true);
  });

  it('limitations never empty', () => {
    const lims = generateLimitations({ sampleSize: 10, confidence: 'medium', missingData: emptyMissing });
    expect(lims.length).toBeGreaterThan(0);
  });
});

// ── gateInsight ──────────────────────────────────────────────────────────────

describe('gateInsight', () => {
  const base = {
    id: 'test-1',
    metric: 'sleep_hardness',
    window: '14d',
    summary: 'Test summary',
    supportingFacts: ['fact 1'],
    missingData: emptyMissing,
  };

  it('returns null when sampleSize < 3', () => {
    const result = gateInsight({ ...base, sampleSize: 2 });
    expect(result).toBeNull();
  });

  it('returns insight when sampleSize >= 3', () => {
    const result = gateInsight({ ...base, sampleSize: 5 });
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe('low');
    expect(result!.sampleSize).toBe(5);
    expect(result!.limitations.length).toBeGreaterThan(0);
  });

  it('returns medium confidence for sampleSize >= 7', () => {
    const result = gateInsight({ ...base, sampleSize: 10 });
    expect(result!.confidence).toBe('medium');
  });

  it('returns null when missing data penalties push to none', () => {
    const result = gateInsight({ ...base, sampleSize: 5, missingData: warningMissing });
    expect(result).toBeNull(); // low + 3 warnings → none
  });

  it('preserves direction', () => {
    const result = gateInsight({ ...base, sampleSize: 10, direction: 'down' });
    expect(result!.direction).toBe('down');
  });

  it('preserves supporting facts', () => {
    const result = gateInsight({ ...base, sampleSize: 10 });
    expect(result!.supportingFacts).toEqual(['fact 1']);
  });
});

// ── gateInsights ─────────────────────────────────────────────────────────────

describe('gateInsights', () => {
  it('filters out insights that fail gating', () => {
    const candidates = [
      { id: 'a', metric: 'm1', window: '14d', sampleSize: 10, summary: 'A', supportingFacts: ['f1'] },
      { id: 'b', metric: 'm2', window: '14d', sampleSize: 1, summary: 'B', supportingFacts: ['f2'] },
      { id: 'c', metric: 'm3', window: '14d', sampleSize: 5, summary: 'C', supportingFacts: ['f3'] },
    ];
    const result = gateInsights(candidates, emptyMissing);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a');
    expect(result[1].id).toBe('c');
  });

  it('returns empty when all fail', () => {
    const candidates = [
      { id: 'a', metric: 'm1', window: '14d', sampleSize: 0, summary: 'A', supportingFacts: [] },
    ];
    const result = gateInsights(candidates, emptyMissing);
    expect(result).toHaveLength(0);
  });
});
