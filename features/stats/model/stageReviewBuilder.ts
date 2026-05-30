// ── Stage Review Builder ─────────────────────────────────────────────────────
// Pure function that builds a read-only monthly/quarterly stage review
// from existing derived data. No Dexie, no React, no DOM.

import type { PersonalNormalResult } from './personalNormalTypes';
import type { ContextExplanationCard } from './contextExplanationTypes';
import type { ExperienceCard } from './experienceCardService';
import type {
  PeriodType,
  StageReview,
  StageReviewSection,
  StageReviewSummary,
  ReviewObservationPlan,
} from './stageReviewTypes';

// ── Date helpers ─────────────────────────────────────────────────────────────

export const getMonthRange = (year: number, month: number): { startDate: string; endDate: string } => {
  const start = new Date(year, month - 1, 1, 12);
  const end = new Date(year, month, 0, 12);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

export const getQuarterRange = (year: number, quarter: number): { startDate: string; endDate: string } => {
  const startMonth = (quarter - 1) * 3 + 1;
  const start = new Date(year, startMonth - 1, 1, 12);
  const end = new Date(year, startMonth + 2, 0, 12);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

export const getCurrentMonth = (): { year: number; month: number } => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

export const getPreviousMonth = (): { year: number; month: number } => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

export const getPeriodLabel = (periodType: PeriodType, startDate: string): string => {
  const d = new Date(startDate + 'T12:00:00');
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (periodType === 'quarter') {
    const quarter = Math.ceil(month / 3);
    return `${year} 年 Q${quarter}`;
  }
  return `${year} 年 ${month} 月`;
};

// ── Builder inputs ───────────────────────────────────────────────────────────

export interface StageReviewInput {
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  logs: Array<{ date: string }>;
  personalNormal?: PersonalNormalResult;
  explanationCards?: ContextExplanationCard[];
  observationPlans?: ReviewObservationPlan[];
  experienceCards?: ExperienceCard[];
}

// ── Main builder ─────────────────────────────────────────────────────────────

/**
 * Build a stage review from existing derived data.
 * Pure function — no Dexie, no React, no DOM.
 */
export const buildStageReview = (input: StageReviewInput): StageReview => {
  const { periodType, startDate, endDate, logs, personalNormal, explanationCards, observationPlans, experienceCards } = input;
  const sections: StageReviewSection[] = [];
  const limitations: string[] = [];

  // Filter logs in period
  const periodLogs = logs.filter((l) => l.date >= startDate && l.date <= endDate);
  const d = new Date(endDate + 'T12:00:00');
  const s = new Date(startDate + 'T12:00:00');
  const totalDays = Math.round((d.getTime() - s.getTime()) / 86400000) + 1;

  // 1. Summary
  const summary: StageReviewSummary = {
    periodLabel: getPeriodLabel(periodType, startDate),
    totalDays,
    daysWithLogs: periodLogs.length,
    coverage: totalDays > 0 ? periodLogs.length / totalDays : 0,
    metricsAtNormal: personalNormal?.summary.withinCount ?? 0,
    metricsShifted: personalNormal?.summary.shiftedCount ?? 0,
    metricsInsufficient: personalNormal?.summary.insufficientCount ?? 0,
    observationPlanCount: observationPlans?.length ?? 0,
    experienceCardCount: experienceCards?.length ?? 0,
  };
  sections.push({
    type: 'summary',
    title: '本阶段摘要',
    available: true,
    data: summary,
  });

  if (summary.coverage < 0.3) {
    limitations.push('本阶段记录覆盖率偏低，回顾内容可能不完整。');
  }

  // 2. Personal normal
  if (personalNormal && personalNormal.metrics.length > 0) {
    sections.push({
      type: 'personal_normal',
      title: '个人常态变化',
      available: true,
      data: personalNormal,
    });
    if (personalNormal.limitations.length > 0) {
      limitations.push(...personalNormal.limitations);
    }
  } else {
    sections.push({
      type: 'personal_normal',
      title: '个人常态变化',
      available: false,
      hiddenReason: '个人常态数据不足',
      data: null,
    });
  }

  // 3. Context explanations
  if (explanationCards && explanationCards.length > 0) {
    sections.push({
      type: 'context_explanations',
      title: '值得回看的上下文',
      available: true,
      data: explanationCards,
    });
  } else {
    sections.push({
      type: 'context_explanations',
      title: '值得回看的上下文',
      available: false,
      hiddenReason: personalNormal?.summary.shiftedCount === 0
        ? '本阶段无显著偏离指标'
        : '解释卡片数据不足',
      data: [],
    });
  }

  // 4. Observation plans
  if (observationPlans && observationPlans.length > 0) {
    sections.push({
      type: 'observation_plans',
      title: '观察计划',
      available: true,
      data: observationPlans,
    });
  } else {
    sections.push({
      type: 'observation_plans',
      title: '观察计划',
      available: false,
      hiddenReason: '本阶段无观察计划',
      data: [],
    });
  }

  // 5. Experience cards
  if (experienceCards && experienceCards.length > 0) {
    sections.push({
      type: 'experience_cards',
      title: '经验卡',
      available: true,
      data: experienceCards,
    });
  } else {
    sections.push({
      type: 'experience_cards',
      title: '经验卡',
      available: false,
      hiddenReason: '本阶段无经验卡',
      data: [],
    });
  }

  // 6. Record gaps
  const gaps: string[] = [];
  const missingDays = totalDays - periodLogs.length;
  if (missingDays > 0) {
    gaps.push(`${missingDays} 天无记录`);
  }
  if (personalNormal) {
    for (const gap of personalNormal.recordGaps) {
      if (gap.window === 'current') {
        gaps.push(`${gap.metricId}：当前窗口缺 ${gap.missingDays} 天`);
      }
    }
  }
  if (gaps.length > 0) {
    sections.push({
      type: 'record_gaps',
      title: '记录缺口',
      available: true,
      data: gaps,
    });
    limitations.push('记录缺口可能影响回顾的完整性。');
  }

  // Global limitations
  limitations.push('阶段回顾仅供个人回看，不表示健康结论。');

  return {
    periodType,
    startDate,
    endDate,
    sections,
    limitations,
  };
};
