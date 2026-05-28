import type { AdultBehaviorWindowFacts } from './adultBehaviorReviewFacts';
import type { AdultBehaviorDailyLogInput } from './adultBehaviorReviewInput';
import { addDays } from './adultBehaviorReviewInput';
import {
  gateInsights,
  type GatedInsight,
} from './adultBehaviorReviewConfidence';

// ── Insight candidate builder ────────────────────────────────────────────────

interface InsightCandidate {
  id: string;
  metric: string;
  window: string;
  sampleSize: number;
  direction?: 'up' | 'down' | 'mixed' | 'flat';
  summary: string;
  supportingFacts: string[];
}

// ── Helper: compare two subsets ──────────────────────────────────────────────

const meanOf = (values: (number | null | undefined)[]): number | null => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

// ── 1. Sleep & Morning Hardness ──────────────────────────────────────────────

const buildSleepHardnessInsight = (
  facts: AdultBehaviorWindowFacts,
): InsightCandidate | null => {
  const { recovery } = facts;
  if (recovery.sleepSampleSize === 0 || recovery.morningHardnessSampleSize === 0) return null;

  const sleepThreshold = 420; // 7 hours in minutes

  // Split days into short-sleep and adequate-sleep groups
  const shortSleepDays: number[] = [];
  const adequateSleepDays: number[] = [];

  for (const day of facts.timeline) {
    const sleepEvent = day.events.find((e) => e.kind === 'sleep');
    const durFact = sleepEvent?.summaryFacts.find((f) => f.key === 'duration');
    const mhEvent = day.events.find((e) => e.kind === 'morning_hardness');
    const mhFact = mhEvent?.summaryFacts.find((f) => f.key === 'hardness');
    if (!durFact || typeof durFact.value !== 'number' || !mhFact || typeof mhFact.value !== 'number') continue;

    if (durFact.value < sleepThreshold) {
      shortSleepDays.push(mhFact.value as number);
    } else {
      adequateSleepDays.push(mhFact.value as number);
    }
  }

  const shortMean = meanOf(shortSleepDays);
  const adequateMean = meanOf(adequateSleepDays);
  const sampleSize = shortSleepDays.length + adequateSleepDays.length;

  if (sampleSize < 3 || shortMean === null || adequateMean === null) return null;

  const diff = adequateMean - shortMean;
  if (Math.abs(diff) < 0.3) return null;

  const factsList: string[] = [];
  if (shortSleepDays.length > 0) {
    factsList.push(`短睡眠日（<7h）晨间硬度均值 ${shortMean.toFixed(1)} / 5，样本 ${shortSleepDays.length}`);
  }
  if (adequateSleepDays.length > 0) {
    factsList.push(`充足睡眠日晨间硬度均值 ${adequateMean.toFixed(1)} / 5，样本 ${adequateSleepDays.length}`);
  }

  return {
    id: 'sleep_hardness_correlation',
    metric: 'sleep_morning_hardness',
    window: facts.window.label,
    sampleSize,
    direction: diff > 0 ? 'down' : 'up',
    summary: diff > 0
      ? `短睡眠日的晨间硬度均值偏低（${shortMean.toFixed(1)} vs ${adequateMean.toFixed(1)}），样本有限，仅供观察。`
      : `短睡眠日的晨间硬度均值反而更高（${shortMean.toFixed(1)} vs ${adequateMean.toFixed(1)}），样本有限，仅供观察。`,
    supportingFacts: factsList,
  };
};

// ── 2. Activity Load & Fatigue ───────────────────────────────────────────────

const buildActivityFatigueInsight = (
  facts: AdultBehaviorWindowFacts,
): InsightCandidate | null => {
  const { masturbation, sex, recovery } = facts;
  const totalEjaculations = masturbation.ejaculationCount + sex.ejaculationCount;
  const totalActivity = masturbation.count + sex.count;
  const fatigueSampleSize = recovery.fatigueSampleSize;

  if (totalActivity === 0 || fatigueSampleSize === 0) return null;

  if (totalActivity < 3) return null;

  const factsList: string[] = [];
  factsList.push(`窗口内性活动 ${totalActivity} 次`);
  if (totalEjaculations > 0) {
    factsList.push(`射精 ${totalEjaculations} 次`);
  }

  return {
    id: 'activity_fatigue',
    metric: 'activity_load_fatigue',
    window: facts.window.label,
    sampleSize: totalActivity,
    summary: `近 ${facts.window.label} 性活动 ${totalActivity} 次，射精 ${totalEjaculations} 次。疲劳样本 ${fatigueSampleSize}，继续记录可获得更稳定观察。`,
    supportingFacts: factsList,
  };
};

// ── 3. Porn Use & Next-day Hardness ──────────────────────────────────────────

const buildPornHardnessInsight = (
  facts: AdultBehaviorWindowFacts,
): InsightCandidate | null => {
  const { pornUse, recovery } = facts;
  if (pornUse.count === 0 || recovery.morningHardnessSampleSize === 0) return null;

  // Check if there's a day after porn use with morning hardness
  const pornDates = new Set(
    facts.timeline
      .filter((d) => d.events.some((e) => e.kind === 'porn_use'))
      .map((d) => d.targetDate),
  );

  const nextDayHardnessAfterPorn: number[] = [];
  const nextDayHardnessNoPorn: number[] = [];

  for (const day of facts.timeline) {
    const mhEvent = day.events.find((e) => e.kind === 'morning_hardness');
    const mhFact = mhEvent?.summaryFacts.find((f) => f.key === 'hardness');
    if (!mhFact || typeof mhFact.value !== 'number') continue;

    // Check if the previous calendar day had porn use
    const prevDate = addDays(day.targetDate, -1);
    const prevDayHasPorn = pornDates.has(prevDate);

    if (prevDayHasPorn) {
      nextDayHardnessAfterPorn.push(mhFact.value as number);
    } else {
      nextDayHardnessNoPorn.push(mhFact.value as number);
    }
  }

  const afterMean = meanOf(nextDayHardnessAfterPorn);
  const noPornMean = meanOf(nextDayHardnessNoPorn);
  const sampleSize = nextDayHardnessAfterPorn.length + nextDayHardnessNoPorn.length;

  if (sampleSize < 3 || afterMean === null) return null;

  const factsList: string[] = [];
  if (pornUse.totalDurationMinutes != null) {
    factsList.push(`窗口内色情使用总时长 ${pornUse.totalDurationMinutes} 分钟，${pornUse.count} 次`);
  }
  factsList.push(`色情使用后次日晨间硬度样本 ${nextDayHardnessAfterPorn.length}`);
  if (afterMean != null) {
    factsList.push(`色情使用后次日晨间硬度均值 ${afterMean.toFixed(1)} / 5`);
  }
  if (noPornMean != null && nextDayHardnessNoPorn.length > 0) {
    factsList.push(`无色情使用日晨间硬度均值 ${noPornMean.toFixed(1)} / 5，样本 ${nextDayHardnessNoPorn.length}`);
  }

  const diff = noPornMean != null ? noPornMean - afterMean : 0;

  return {
    id: 'porn_hardness_correlation',
    metric: 'porn_use_next_day_hardness',
    window: facts.window.label,
    sampleSize,
    direction: Math.abs(diff) >= 0.3 ? (diff > 0 ? 'down' : 'up') : 'flat',
    summary: pornUse.count > 0 && afterMean != null
      ? `色情使用后次日晨间硬度均值 ${afterMean.toFixed(1)} / 5，样本有限，仅供观察。`
      : `色情使用与次日硬度关联记录较少，链路复盘不完整。`,
    supportingFacts: factsList,
  };
};

// ── 4. Masturbation & Satisfaction/Recovery ──────────────────────────────────

const buildMasturbationInsight = (
  facts: AdultBehaviorWindowFacts,
): InsightCandidate | null => {
  const { masturbation } = facts;
  if (masturbation.count === 0) return null;

  const factsList: string[] = [];
  factsList.push(`窗口内自慰 ${masturbation.count} 次`);
  if (masturbation.ejaculationCount > 0) {
    factsList.push(`射精 ${masturbation.ejaculationCount} 次`);
  }
  if (masturbation.edgingCount > 0) {
    factsList.push(`边缘控制 ${masturbation.edgingCount} 次`);
  }
  if (masturbation.hardnessSampleSize > 0 && masturbation.hardnessMean != null) {
    factsList.push(`自慰中硬度样本 ${masturbation.hardnessSampleSize}，均值 ${masturbation.hardnessMean.toFixed(1)} / 5`);
  }
  if (masturbation.satisfactionSampleSize > 0 && masturbation.satisfactionMean != null) {
    factsList.push(`满意度样本 ${masturbation.satisfactionSampleSize}，均值 ${masturbation.satisfactionMean.toFixed(1)} / 5`);
  }

  const sampleSize = masturbation.count;
  const summaryParts: string[] = [`自慰 ${masturbation.count} 次`];
  if (masturbation.ejaculationCount > 0) summaryParts.push(`射精 ${masturbation.ejaculationCount} 次`);
  if (masturbation.satisfactionSampleSize > 0 && masturbation.satisfactionMean != null) {
    summaryParts.push(`满意度 ${masturbation.satisfactionMean.toFixed(1)} / 5`);
  } else {
    summaryParts.push('满意度样本较少');
  }

  return {
    id: 'masturbation_summary',
    metric: 'masturbation_satisfaction_recovery',
    window: facts.window.label,
    sampleSize,
    direction: 'flat' as const,
    summary: `窗口内 ${summaryParts.join('，')}。`,
    supportingFacts: factsList,
  };
};

// ── 5. Sex & Hardness/Satisfaction/Recovery ──────────────────────────────────

const buildSexInsight = (
  facts: AdultBehaviorWindowFacts,
): InsightCandidate | null => {
  const { sex } = facts;
  if (sex.count === 0) return null;

  const factsList: string[] = [];
  factsList.push(`窗口内性爱 ${sex.count} 次`);
  if (sex.ejaculationCount > 0) {
    factsList.push(`射精 ${sex.ejaculationCount} 次`);
  }
  if (sex.pornInvolvedCount > 0) {
    factsList.push(`有色情参与 ${sex.pornInvolvedCount} 次`);
  }
  if (sex.hardnessSampleSize > 0 && sex.hardnessMean != null) {
    factsList.push(`性爱中硬度样本 ${sex.hardnessSampleSize}，均值 ${sex.hardnessMean.toFixed(1)} / 5`);
  }
  if (sex.satisfactionSampleSize > 0 && sex.satisfactionMean != null) {
    factsList.push(`满意度样本 ${sex.satisfactionSampleSize}，均值 ${sex.satisfactionMean.toFixed(1)} / 5`);
  }

  const summaryParts: string[] = [`性爱 ${sex.count} 次`];
  if (sex.hardnessSampleSize > 0 && sex.hardnessMean != null) {
    summaryParts.push(`硬度 ${sex.hardnessMean.toFixed(1)} / 5`);
  } else {
    summaryParts.push('硬度样本不足');
  }
  if (sex.satisfactionSampleSize > 0 && sex.satisfactionMean != null) {
    summaryParts.push(`满意度 ${sex.satisfactionMean.toFixed(1)} / 5`);
  } else {
    summaryParts.push('满意度样本较少');
  }

  return {
    id: 'sex_summary',
    metric: 'sex_hardness_satisfaction_recovery',
    window: facts.window.label,
    sampleSize: sex.count,
    direction: 'flat' as const,
    summary: `窗口内 ${summaryParts.join('，')}。`,
    supportingFacts: factsList,
  };
};

// ── 6. Record Quality ────────────────────────────────────────────────────────

const buildRecordQualityInsight = (
  facts: AdultBehaviorWindowFacts,
  dailyLogs: AdultBehaviorDailyLogInput[],
): InsightCandidate | null => {
  const totalDays = dailyLogs.length;
  const daysWithHardness = dailyLogs.filter((l) => l.morningHardness != null).length;
  const daysWithSleep = dailyLogs.filter((l) => l.sleepDurationMinutes != null).length;
  const totalDaysInWindow = (() => {
    const dates = new Set(dailyLogs.map((l) => l.targetDate));
    for (const d of facts.timeline) dates.add(d.targetDate);
    return dates.size;
  })();

  const warningCount = facts.missingData.filter((m) => m.severity === 'warning').length;
  const orphanCount = facts.missingData.filter((m) => m.key === 'orphan_linked_id').length;

  const factsList: string[] = [];
  factsList.push(`记录天数 ${totalDays}`);
  factsList.push(`有晨间硬度 ${daysWithHardness} 天`);
  factsList.push(`有睡眠记录 ${daysWithSleep} 天`);
  if (warningCount > 0) {
    factsList.push(`数据缺口 ${warningCount} 条`);
  }
  if (orphanCount > 0) {
    factsList.push(`未补全关联 ${orphanCount} 条`);
  }

  const gaps: string[] = [];
  if (totalDays < totalDaysInWindow) gaps.push('部分日期无记录');
  if (daysWithHardness < totalDays) gaps.push('晨间硬度记录不完整');
  if (daysWithSleep < totalDays) gaps.push('睡眠记录不完整');

  const summary = gaps.length > 0
    ? `本期记录缺口：${gaps.join('、')}。补充记录后，后续复盘会更稳定。`
    : `本期记录完整，复盘可信度较好。`;

  return {
    id: 'record_quality',
    metric: 'record_quality',
    window: facts.window.label,
    sampleSize: totalDays,
    summary,
    supportingFacts: factsList,
  };
};

// ── Generate all insights ────────────────────────────────────────────────────

export const generateReviewInsights = (
  facts: AdultBehaviorWindowFacts,
  dailyLogs: AdultBehaviorDailyLogInput[],
): GatedInsight[] => {
  const candidates: InsightCandidate[] = [];

  const sleepHardness = buildSleepHardnessInsight(facts);
  if (sleepHardness) candidates.push(sleepHardness);

  const activityFatigue = buildActivityFatigueInsight(facts);
  if (activityFatigue) candidates.push(activityFatigue);

  const pornHardness = buildPornHardnessInsight(facts);
  if (pornHardness) candidates.push(pornHardness);

  const masturbation = buildMasturbationInsight(facts);
  if (masturbation) candidates.push(masturbation);

  const sex = buildSexInsight(facts);
  if (sex) candidates.push(sex);

  const recordQuality = buildRecordQualityInsight(facts, dailyLogs);
  if (recordQuality) candidates.push(recordQuality);

  return gateInsights(candidates, facts.missingData);
};
