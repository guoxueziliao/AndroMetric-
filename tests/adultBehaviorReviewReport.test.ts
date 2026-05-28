import { describe, it, expect } from 'vitest';
import type { AdultBehaviorWindowFacts } from '../features/stats/model/adultBehaviorReviewFacts';
import type { GatedInsight } from '../features/stats/model/adultBehaviorReviewConfidence';
import {
  buildReviewReport,
  buildMarkdownReport,
  buildReportFileName,
} from '../features/stats/model/adultBehaviorReviewReport';

const makeFacts = (overrides: Partial<AdultBehaviorWindowFacts> = {}): AdultBehaviorWindowFacts => ({
  window: { kind: 'rolling_14d', startDate: '2026-05-15', endDate: '2026-05-28', label: '近 14 天' },
  recordDays: 10,
  missingData: [],
  pornUse: { count: 2, totalDurationMinutes: 60, avgDurationMinutes: 30, ejaculationCount: 1, ledToMasturbationCount: 1, exceededTimeCount: 0, controlFeelingSampleSize: 1 },
  masturbation: { count: 3, ejaculationCount: 2, edgingCount: 1, hardnessSampleSize: 1, hardnessMean: 4, satisfactionSampleSize: 2, satisfactionMean: 3.5 },
  sex: { count: 1, ejaculationCount: 1, pornInvolvedCount: 0, hardnessSampleSize: 1, hardnessMean: 4, satisfactionSampleSize: 1, satisfactionMean: 4, fatigueSampleSize: 0, fatigueMean: null },
  recovery: { morningHardnessSampleSize: 8, morningHardnessMean: 3.6, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
  timeline: [],
  ...overrides,
});

const makeInsight = (overrides: Partial<GatedInsight> = {}): GatedInsight => ({
  id: 'test-1',
  metric: 'test_metric',
  window: '近 14 天',
  sampleSize: 10,
  confidence: 'medium',
  summary: 'Test summary',
  supportingFacts: ['fact 1'],
  limitations: ['只显示共现关系，不代表因果。'],
  ...overrides,
});

// ── buildReviewReport ────────────────────────────────────────────────────────

describe('buildReviewReport', () => {
  it('builds a complete report from facts', () => {
    const facts = makeFacts();
    const insights = [makeInsight()];
    const report = buildReviewReport(facts, insights, 'rolling_14d');

    expect(report.reportType).toBe('复盘');
    expect(report.window.startDate).toBe('2026-05-15');
    expect(report.summary.recordDays).toBe(10);
    expect(report.summary.morningHardnessMean).toBeCloseTo(3.6, 1);
    expect(report.summary.sleepMeanHours).toBeCloseTo(7.5, 1);
    expect(report.adultBehavior.pornUseCount).toBe(2);
    expect(report.adultBehavior.masturbationCount).toBe(3);
    expect(report.adultBehavior.sexCount).toBe(1);
    expect(report.adultBehavior.ejaculationCount).toBe(4); // 1+2+1
    expect(report.adultBehavior.edgingCount).toBe(1);
    expect(report.insights).toHaveLength(1);
  });

  it('week kind produces 周报', () => {
    const facts = makeFacts({ window: { kind: 'week', startDate: '2026-05-25', endDate: '2026-05-28', label: '5月25日周' } });
    const report = buildReviewReport(facts, [], 'week');
    expect(report.reportType).toBe('周报');
  });

  it('month kind produces 月报', () => {
    const facts = makeFacts({ window: { kind: 'month', startDate: '2026-05-01', endDate: '2026-05-28', label: '5月' } });
    const report = buildReviewReport(facts, [], 'month');
    expect(report.reportType).toBe('月报');
  });
});

// ── buildMarkdownReport ──────────────────────────────────────────────────────

describe('buildMarkdownReport', () => {
  const facts = makeFacts();
  const report = buildReviewReport(facts, [makeInsight()], 'rolling_14d');

  it('contains report header', () => {
    const md = buildMarkdownReport(report);
    expect(md).toContain('# 成人行为复盘报告');
    expect(md).toContain('报告类型');
    expect(md).toContain('本报告基于本地记录生成，不是医学诊断。');
  });

  it('contains summary table', () => {
    const md = buildMarkdownReport(report);
    expect(md).toContain('## 本期摘要');
    expect(md).toContain('记录天数');
    expect(md).toContain('晨间硬度均值');
    expect(md).toContain('睡眠均值');
  });

  it('contains adult behavior summary', () => {
    const md = buildMarkdownReport(report);
    expect(md).toContain('## 成人行为摘要');
    expect(md).toContain('Porn use 次数');
    expect(md).toContain('Masturbation 次数');
    expect(md).toContain('Sex 次数');
    expect(md).toContain('射精次数');
    expect(md).toContain('边缘控制次数');
  });

  it('contains insights with sampleSize and confidence', () => {
    const md = buildMarkdownReport(report);
    expect(md).toContain('## 可能关联');
    expect(md).toContain('样本量');
    expect(md).toContain('可信度');
    expect(md).toContain('限制');
    expect(md).toContain('不代表因果');
  });

  it('contains privacy notice', () => {
    const md = buildMarkdownReport(report);
    expect(md).toContain('## 隐私说明');
    expect(md).toContain('请谨慎保存');
  });

  it('does NOT contain notes content', () => {
    const md = buildMarkdownReport(report);
    // The report should not include raw notes
    expect(md).not.toContain('notes全文');
    expect(md).not.toContain('具体平台名');
    expect(md).not.toContain('legacySexRecord');
  });

  it('missing data section present when warnings exist', () => {
    const factsWithMissing = makeFacts({
      missingData: [
        { key: 'no_daily_log', targetDate: '2026-05-20', severity: 'warning', affectedMetrics: ['morning_hardness'] },
        { key: 'orphan_linked_id', targetDate: '2026-05-22', severity: 'warning', affectedMetrics: ['event_linking'] },
      ],
    });
    const r = buildReviewReport(factsWithMissing, [], 'rolling_14d');
    const md = buildMarkdownReport(r);
    expect(md).toContain('## 样本不足与记录缺口');
    expect(md).toContain('缺少日记记录');
    expect(md).toContain('关联事件未补全');
  });

  it('missing data section absent when no warnings', () => {
    const md = buildMarkdownReport(report);
    expect(md).not.toContain('## 样本不足与记录缺口');
  });
});

// ── buildReportFileName ──────────────────────────────────────────────────────

describe('buildReportFileName', () => {
  const window = { kind: 'rolling_14d' as const, startDate: '2026-05-15', endDate: '2026-05-28', label: '' };

  it('week report filename', () => {
    const name = buildReportFileName('周报', { ...window, kind: 'week', startDate: '2026-05-25' });
    expect(name).toBe('andrometric-adult-review-week-2026-05-25.md');
  });

  it('month report filename', () => {
    const name = buildReportFileName('月报', { ...window, kind: 'month', startDate: '2026-05-01' });
    expect(name).toBe('andrometric-adult-review-month-2026-05.md');
  });

  it('generic report filename', () => {
    const name = buildReportFileName('复盘', window);
    expect(name).toBe('andrometric-adult-review-2026-05-15.md');
  });

  it('filename does not contain explicit words', () => {
    const name = buildReportFileName('周报', { ...window, kind: 'week', startDate: '2026-05-25' });
    const prohibited = ['色情', '射精', '伴侣', 'porn', 'ejacul'];
    for (const word of prohibited) {
      expect(name.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });
});
