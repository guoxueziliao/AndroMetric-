import type { AdultBehaviorWindowFacts, ReviewTimelineDay } from './adultBehaviorReviewFacts';
import type { GatedInsight } from './adultBehaviorReviewConfidence';
import type { ReviewWindow, ReviewWindowKind } from './adultBehaviorReviewInput';

// ── Report data types ────────────────────────────────────────────────────────

export interface ReviewReportData {
  reportType: '周报' | '月报' | '复盘';
  window: ReviewWindow;
  generatedAt: string;
  summary: {
    recordDays: number;
    morningHardnessMean: number | null;
    morningHardnessSampleSize: number;
    activityLoad: number;
    sleepMeanHours: number | null;
    sleepSampleSize: number;
  };
  adultBehavior: {
    pornUseCount: number;
    pornUseTotalMinutes: number | null;
    masturbationCount: number;
    sexCount: number;
    ejaculationCount: number;
    edgingCount: number;
  };
  insights: GatedInsight[];
  missingData: AdultBehaviorWindowFacts['missingData'];
  timeline: ReviewTimelineDay[];
}

// ── Report builder ───────────────────────────────────────────────────────────

export const buildReviewReport = (
  facts: AdultBehaviorWindowFacts,
  insights: GatedInsight[],
  windowKind: ReviewWindowKind,
): ReviewReportData => {
  const reportType: ReviewReportData['reportType'] =
    windowKind === 'week' ? '周报' :
    windowKind === 'month' ? '月报' :
    '复盘';

  const totalEjaculations =
    facts.pornUse.ejaculationCount +
    facts.masturbation.ejaculationCount +
    facts.sex.ejaculationCount;

  return {
    reportType,
    window: facts.window,
    generatedAt: new Date().toISOString(),
    summary: {
      recordDays: facts.recordDays,
      morningHardnessMean: facts.recovery.morningHardnessMean,
      morningHardnessSampleSize: facts.recovery.morningHardnessSampleSize,
      activityLoad: facts.pornUse.count + facts.masturbation.count + facts.sex.count,
      sleepMeanHours: facts.recovery.sleepMeanMinutes != null
        ? Math.round((facts.recovery.sleepMeanMinutes / 60) * 10) / 10
        : null,
      sleepSampleSize: facts.recovery.sleepSampleSize,
    },
    adultBehavior: {
      pornUseCount: facts.pornUse.count,
      pornUseTotalMinutes: facts.pornUse.totalDurationMinutes,
      masturbationCount: facts.masturbation.count,
      sexCount: facts.sex.count,
      ejaculationCount: totalEjaculations,
      edgingCount: facts.masturbation.edgingCount,
    },
    insights,
    missingData: facts.missingData,
    timeline: facts.timeline,
  };
};

// ── Markdown builder ─────────────────────────────────────────────────────────

const SENSITIVE_DISCLAIMER = '该报告包含敏感成人健康数据，可能涉及硬度、性行为、自淫/自慰、色情使用、射精、睡眠和恢复。请只保存在你信任的位置。';

export const SENSITIVE_EXPORT_WARNING = SENSITIVE_DISCLAIMER;

export const buildMarkdownReport = (report: ReviewReportData): string => {
  const lines: string[] = [];

  // Header
  lines.push(`# 成人行为复盘报告`);
  lines.push('');
  lines.push(`- 报告类型：${report.reportType}`);
  lines.push(`- 时间范围：${report.window.startDate} 至 ${report.window.endDate}`);
  lines.push(`- 生成时间：${report.generatedAt.replace('T', ' ').slice(0, 16)}`);
  lines.push(`- 数据说明：本报告基于本地记录生成，不是医学诊断。`);
  lines.push('');

  // Summary table
  lines.push('## 本期摘要');
  lines.push('');
  lines.push('| 指标 | 数值 | 样本量 |');
  lines.push('|---|---:|---:|');
  lines.push(`| 记录天数 | ${report.summary.recordDays} | ${report.summary.recordDays} |`);
  if (report.summary.morningHardnessMean != null) {
    lines.push(`| 晨间硬度均值 | ${report.summary.morningHardnessMean.toFixed(1)} / 5 | ${report.summary.morningHardnessSampleSize} |`);
  }
  lines.push(`| 性活动负荷 | ${report.summary.activityLoad} | ${report.summary.activityLoad} |`);
  if (report.summary.sleepMeanHours != null) {
    lines.push(`| 睡眠均值 | ${report.summary.sleepMeanHours} 小时 | ${report.summary.sleepSampleSize} |`);
  }
  lines.push('');

  // Adult behavior summary
  lines.push('## 成人行为摘要');
  lines.push('');
  lines.push('| 指标 | 数值 | 样本量 |');
  lines.push('|---|---:|---:|');
  lines.push(`| Porn use 次数 | ${report.adultBehavior.pornUseCount} | ${report.adultBehavior.pornUseCount} |`);
  if (report.adultBehavior.pornUseTotalMinutes != null) {
    lines.push(`| Porn use 总时长 | ${report.adultBehavior.pornUseTotalMinutes} 分钟 | ${report.adultBehavior.pornUseCount} |`);
  }
  lines.push(`| Masturbation 次数 | ${report.adultBehavior.masturbationCount} | ${report.adultBehavior.masturbationCount} |`);
  lines.push(`| Sex 次数 | ${report.adultBehavior.sexCount} | ${report.adultBehavior.sexCount} |`);
  lines.push(`| 射精次数 | ${report.adultBehavior.ejaculationCount} | ${report.adultBehavior.ejaculationCount} |`);
  lines.push(`| 边缘控制次数 | ${report.adultBehavior.edgingCount} | ${report.adultBehavior.edgingCount} |`);
  lines.push('');

  // Insights
  if (report.insights.length > 0) {
    lines.push('## 可能关联');
    lines.push('');
    for (const insight of report.insights) {
      lines.push(`### ${insight.metric}`);
      lines.push('');
      lines.push(`- 样本量：${insight.sampleSize}`);
      lines.push(`- 可信度：${insight.confidence}`);
      if (insight.supportingFacts.length > 0) {
        lines.push('- 事实依据：');
        for (const fact of insight.supportingFacts) {
          lines.push(`  - ${fact}`);
        }
      }
      if (insight.limitations.length > 0) {
        lines.push('- 限制：');
        for (const lim of insight.limitations) {
          lines.push(`  - ${lim}`);
        }
      }
      lines.push('');
    }
  }

  // Missing data
  const warningMissing = report.missingData.filter((m) => m.severity === 'warning');
  if (warningMissing.length > 0) {
    lines.push('## 样本不足与记录缺口');
    lines.push('');
    const grouped = new Map<string, number>();
    for (const m of warningMissing) {
      grouped.set(m.key, (grouped.get(m.key) ?? 0) + 1);
    }
    for (const [key, count] of grouped) {
      if (key === 'no_daily_log') {
        lines.push(`- 缺少日记记录：${count} 天`);
      } else if (key === 'orphan_linked_id') {
        lines.push(`- 关联事件未补全：${count} 条`);
      } else {
        lines.push(`- ${key}：${count}`);
      }
    }
    lines.push('');
  }

  // Privacy notice
  lines.push('## 隐私说明');
  lines.push('');
  lines.push('本报告只在本地生成。请谨慎保存、同步或分享。');

  return lines.join('\n');
};

// ── File name builder ────────────────────────────────────────────────────────

export const buildReportFileName = (
  reportType: ReviewReportData['reportType'],
  window: ReviewWindow,
): string => {
  const date = window.startDate;
  if (reportType === '周报') {
    return `andrometric-adult-review-week-${date}.md`;
  }
  if (reportType === '月报') {
    return `andrometric-adult-review-month-${date.slice(0, 7)}.md`;
  }
  return `andrometric-adult-review-${date}.md`;
};
