import { describe, it, expect } from 'vitest';
import type { PersonalNormalResult } from '../features/stats/model/personalNormalTypes';
import type { ContextExplanationCard } from '../features/stats/model/contextExplanationTypes';
import { buildStageReview, getMonthRange, getQuarterRange, getPeriodLabel } from '../features/stats/model/stageReviewBuilder';

const makeLogs = (dates: string[]) => dates.map((d) => ({ date: d }));

const makePersonalNormal = (overrides: Partial<PersonalNormalResult> = {}): PersonalNormalResult => ({
  generatedAt: new Date().toISOString(),
  currentWindowDays: 14,
  baselineWindowDays: 90,
  summary: { withinCount: 4, shiftedCount: 1, insufficientCount: 1, confidence: 'low' },
  metrics: [],
  recordGaps: [],
  limitations: [],
  ...overrides,
});

const makeExplanationCard = (overrides: Partial<ContextExplanationCard> = {}): ContextExplanationCard => ({
  id: 'ctx_1',
  metricId: 'hardness',
  contextType: 'sleep',
  windowDays: 14,
  message: '变化窗口内睡眠记录较完整',
  sampleSize: 10,
  confidence: 'low',
  limitations: [],
  ...overrides,
});

describe('stageReviewBuilder', () => {
  describe('date helpers', () => {
    it('getMonthRange returns correct range', () => {
      const range = getMonthRange(2026, 5);
      expect(range.startDate).toBe('2026-05-01');
      expect(range.endDate).toBe('2026-05-31');
    });

    it('getQuarterRange returns correct range', () => {
      const range = getQuarterRange(2026, 2);
      expect(range.startDate).toBe('2026-04-01');
      expect(range.endDate).toBe('2026-06-30');
    });

    it('getPeriodLabel formats month', () => {
      expect(getPeriodLabel('month', '2026-05-01')).toBe('2026 年 5 月');
    });

    it('getPeriodLabel formats quarter', () => {
      expect(getPeriodLabel('quarter', '2026-04-01')).toBe('2026 年 Q2');
    });
  });

  describe('buildStageReview', () => {
    it('builds review with all sections available', () => {
      const logs = makeLogs(['2026-05-01', '2026-05-02', '2026-05-03']);
      const review = buildStageReview({
        periodType: 'month',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        logs,
        personalNormal: makePersonalNormal(),
        explanationCards: [makeExplanationCard()],
        observationPlans: [{ goalId: 'tg_1', title: '观察睡眠', status: 'active', windowDays: 14, startDate: '2026-05-17', endDate: '2026-05-30' }],
        experienceCards: [],
      });
      expect(review.periodType).toBe('month');
      expect(review.startDate).toBe('2026-05-01');
      expect(review.endDate).toBe('2026-05-31');
      // All sections should be available
      const available = review.sections.filter((s) => s.available);
      expect(available.length).toBeGreaterThanOrEqual(4);
    });

    it('hides sections when data is missing', () => {
      const review = buildStageReview({
        periodType: 'month',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        logs: [],
      });
      // Most sections should be hidden
      const hidden = review.sections.filter((s) => !s.available);
      expect(hidden.length).toBeGreaterThanOrEqual(3);
    });

    it('adds coverage limitation for low coverage', () => {
      const review = buildStageReview({
        periodType: 'month',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        logs: makeLogs(['2026-05-01']),
      });
      expect(review.limitations.some((l) => l.includes('覆盖率偏低'))).toBe(true);
    });

    it('always adds disclaimer limitation', () => {
      const review = buildStageReview({
        periodType: 'month',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        logs: [],
      });
      expect(review.limitations.some((l) => l.includes('不表示健康结论'))).toBe(true);
    });

    it('records gaps for missing log days', () => {
      const review = buildStageReview({
        periodType: 'month',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
        logs: makeLogs(['2026-05-01', '2026-05-02']),
      });
      const gapSection = review.sections.find((s) => s.type === 'record_gaps');
      expect(gapSection).toBeDefined();
      expect(gapSection!.available).toBe(true);
      expect((gapSection!.data as string[]).some((g) => g.includes('3 天无记录'))).toBe(true);
    });

    it('hides explanation section when no shifted metrics', () => {
      const review = buildStageReview({
        periodType: 'month',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        logs: makeLogs(['2026-05-01']),
        personalNormal: makePersonalNormal({ summary: { withinCount: 6, shiftedCount: 0, insufficientCount: 0, confidence: 'medium' } }),
      });
      const ctxSection = review.sections.find((s) => s.type === 'context_explanations');
      expect(ctxSection).toBeDefined();
      expect(ctxSection!.available).toBe(false);
      expect(ctxSection!.hiddenReason).toContain('无显著偏离');
    });

    it('summary includes correct counts', () => {
      const review = buildStageReview({
        periodType: 'month',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        logs: makeLogs(['2026-05-01', '2026-05-02', '2026-05-03']),
        personalNormal: makePersonalNormal(),
        observationPlans: [{ goalId: 'tg_1', title: '观察', status: 'active', windowDays: 14, startDate: '2026-05-01', endDate: '2026-05-14' }],
      });
      const summarySection = review.sections.find((s) => s.type === 'summary');
      const summary = summarySection!.data as any;
      expect(summary.totalDays).toBe(31);
      expect(summary.daysWithLogs).toBe(3);
      expect(summary.metricsAtNormal).toBe(4);
      expect(summary.metricsShifted).toBe(1);
      expect(summary.observationPlanCount).toBe(1);
    });
  });
});
