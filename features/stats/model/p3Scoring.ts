import type { LogEntry, MasturbationRecordDetails, SexRecordDetails } from '../../../domain';
import { isFieldUsable } from '../../../utils/dataQuality';

export type P3Domain = 'sex' | 'masturbation';
export type ConfidenceLevel = 'none' | 'low' | 'medium' | 'high';
export type TimeBucket = 'late_night' | 'morning' | 'daytime' | 'evening';

export interface P3ScoreBreakdown {
  qualityScore: number | null;
  satisfactionScore: number | null;
  totalScore: number | null;
  usableWeight: number;
  totalWeight: number;
  confidenceRatio: number;
}

export interface FatigueAssessment {
  score: number;
  reasons: string[];
}

export interface SexFatigueContext {
  sleepInsufficient: boolean;
  stressLevel?: number | null;
  alcoholGrams: number;
  isSick: boolean;
  timeBucket: TimeBucket;
  durationMinutes: number;
  hasHighIntensityExercise: boolean;
}

export interface MasturbationFatigueContext extends SexFatigueContext {
  energyLevel?: number | null;
  energyLevelUsable: boolean;
  fatigueText?: string;
  postFatigueText?: string;
  edging: MasturbationRecordDetails['edging'];
  ejaculation: boolean;
}

const round = (value: number) => Math.round(value * 10) / 10;

const SEX_TOTAL_WEIGHT = 100;
const MASTURBATION_TOTAL_WEIGHT = 100;
const MIN_USABLE_RATIO = 0.5;

const moodScoreMap: Record<SexRecordDetails['mood'], number> = {
  excited: 10,
  happy: 9,
  neutral: 6,
  anxious: 3,
  sad: 2,
  angry: 1
};

const postMoodScoreMap: Record<string, number> = {
  '满足/愉悦': 10,
  '平静/贤者': 8,
  '空虚/后悔': 3,
  '焦虑/负罪': 2,
  '恶心/厌恶': 0
};

const fatigueRecoveryScoreMap: Record<string, number> = {
  '精神焕发': 20,
  '无明显疲劳': 16,
  '轻微困倦': 8,
  '身体沉重': 3,
  '秒睡': 0
};

const fatigueBurdenScoreMap: Record<string, number> = {
  '精神焕发': 0,
  '无明显疲劳': 0,
  '轻微困倦': 10,
  '身体沉重': 16,
  '秒睡': 20
};

const normalizeWeightedScore = (
  items: Array<{ weight: number; usable: boolean; contribution: number }>,
  totalWeight: number
): P3ScoreBreakdown => {
  const usableWeight = items.reduce((sum, item) => sum + (item.usable ? item.weight : 0), 0);
  const rawScore = items.reduce((sum, item) => sum + (item.usable ? item.contribution : 0), 0);
  const confidenceRatio = totalWeight > 0 ? usableWeight / totalWeight : 0;

  if (confidenceRatio < MIN_USABLE_RATIO || usableWeight === 0) {
    return {
      qualityScore: null,
      satisfactionScore: null,
      totalScore: null,
      usableWeight,
      totalWeight,
      confidenceRatio
    };
  }

  return {
    qualityScore: null,
    satisfactionScore: null,
    totalScore: round((rawScore / usableWeight) * 100),
    usableWeight,
    totalWeight,
    confidenceRatio
  };
};

const normalizeSectionScore = (
  items: Array<{ weight: number; usable: boolean; contribution: number }>
) => {
  const usableWeight = items.reduce((sum, item) => sum + (item.usable ? item.weight : 0), 0);
  if (usableWeight === 0) return null;
  const rawScore = items.reduce((sum, item) => sum + (item.usable ? item.contribution : 0), 0);
  return round((rawScore / usableWeight) * 100);
};

const getSexDurationScore = (duration: number) => {
  if (duration >= 10 && duration <= 45) return 10;
  if (duration >= 5 && duration <= 60) return 7;
  if (duration > 0) return 4;
  return 0;
};

const getEnergyPenalty = (energyLevel?: number | null) => {
  if (typeof energyLevel !== 'number') return 0;
  if (energyLevel <= 2) return 20;
  if (energyLevel === 3) return 10;
  return 0;
};

const getFatigueBurden = (value?: string) => {
  if (!value) return 0;
  return fatigueBurdenScoreMap[value] ?? 10;
};

const getFatigueRecovery = (value?: string) => {
  if (!value) return 0;
  return fatigueRecoveryScoreMap[value] ?? 8;
};

export const getConfidenceLevel = (sampleSize: number): ConfidenceLevel => {
  if (sampleSize >= 15) return 'high';
  if (sampleSize >= 8) return 'medium';
  if (sampleSize >= 5) return 'low';
  return 'none';
};

export const getTimeBucket = (startTime?: string): TimeBucket => {
  const [hourText] = (startTime || '').split(':');
  const hour = Number(hourText);

  if (Number.isNaN(hour)) return 'evening';
  if (hour >= 23 || hour < 3) return 'late_night';
  if (hour < 11) return 'morning';
  if (hour < 17) return 'daytime';
  return 'evening';
};

export const formatTimeBucketLabel = (bucket: TimeBucket) => {
  switch (bucket) {
    case 'late_night':
      return '深夜';
    case 'morning':
      return '早晨';
    case 'daytime':
      return '白天';
    case 'evening':
      return '晚间';
  }
};

export const scoreSexRecord = (log: LogEntry, record: SexRecordDetails): P3ScoreBreakdown => {
  const qualityItems = [
    {
      weight: 35,
      usable: isFieldUsable(log, `sex.${record.id}.partnerScore`) && typeof record.partnerScore === 'number',
      contribution: ((record.partnerScore ?? 0) / 5) * 35
    },
    {
      weight: 15,
      usable: typeof record.indicators?.partnerOrgasm === 'boolean',
      contribution: record.indicators?.partnerOrgasm ? 15 : 0
    },
    {
      weight: 10,
      usable: isFieldUsable(log, `sex.${record.id}.duration`) && typeof record.duration === 'number',
      contribution: getSexDurationScore(record.duration)
    }
  ];

  const satisfactionItems = [
    {
      weight: 20,
      usable: typeof record.indicators?.orgasm === 'boolean',
      contribution: record.indicators?.orgasm ? 20 : 0
    },
    {
      weight: 10,
      usable: isFieldUsable(log, `sex.${record.id}.mood`) && typeof record.mood === 'string',
      contribution: moodScoreMap[record.mood] ?? 5
    },
    {
      weight: 10,
      usable: isFieldUsable(log, `sex.${record.id}.ejaculation`) && typeof record.ejaculation === 'boolean',
      contribution: record.ejaculation ? 10 : 0
    }
  ];

  const allItems = [...qualityItems, ...satisfactionItems];
  const normalized = normalizeWeightedScore(allItems, SEX_TOTAL_WEIGHT);

  return {
    ...normalized,
    qualityScore: normalizeSectionScore(qualityItems),
    satisfactionScore: normalizeSectionScore(satisfactionItems)
  };
};

export const scoreMasturbationRecord = (log: LogEntry, record: MasturbationRecordDetails): P3ScoreBreakdown => {
  const fatigueText = record.postFatigue || record.fatigue;

  const qualityItems = [
    {
      weight: 25,
      usable: isFieldUsable(log, `masturbation.${record.id}.satisfactionLevel`) && typeof record.satisfactionLevel === 'number',
      contribution: ((record.satisfactionLevel ?? 0) / 5) * 25
    },
    {
      weight: 20,
      usable: isFieldUsable(log, `masturbation.${record.id}.orgasmIntensity`) && typeof record.orgasmIntensity === 'number',
      contribution: (record.orgasmIntensity / 5) * 20
    },
    {
      weight: 15,
      usable: typeof record.status === 'string' && typeof record.interrupted === 'boolean',
      contribution: record.status === 'completed' && !record.interrupted ? 15 : 0
    }
  ];

  const satisfactionItems = [
    {
      weight: 10,
      usable: isFieldUsable(log, `masturbation.${record.id}.ejaculation`) && typeof record.ejaculation === 'boolean',
      contribution: record.ejaculation ? 10 : 0
    },
    {
      weight: 10,
      usable: typeof record.postMood === 'string' && record.postMood.trim().length > 0,
      contribution: postMoodScoreMap[record.postMood || ''] ?? 5
    },
    {
      weight: 20,
      usable: typeof fatigueText === 'string' && fatigueText.trim().length > 0,
      contribution: getFatigueRecovery(fatigueText)
    }
  ];

  const allItems = [...qualityItems, ...satisfactionItems];
  const normalized = normalizeWeightedScore(allItems, MASTURBATION_TOTAL_WEIGHT);

  return {
    ...normalized,
    qualityScore: normalizeSectionScore(qualityItems),
    satisfactionScore: normalizeSectionScore(satisfactionItems)
  };
};

export const assessSexFatigue = (context: SexFatigueContext): FatigueAssessment => {
  const reasons: string[] = [];
  let score = 0;

  if (context.sleepInsufficient) {
    score += 25;
    reasons.push('sleep_insufficient');
  }
  if ((context.stressLevel ?? 0) >= 4) {
    score += 20;
    reasons.push('high_stress');
  }
  if (context.alcoholGrams > 0) {
    score += 15;
    reasons.push('alcohol');
  }
  if (context.isSick) {
    score += 15;
    reasons.push('sick');
  }
  if (context.timeBucket === 'late_night') {
    score += 10;
    reasons.push('late_night');
  }
  if (context.durationMinutes > 60) {
    score += 10;
    reasons.push('long_duration');
  }
  if (context.hasHighIntensityExercise) {
    score += 5;
    reasons.push('high_intensity_exercise');
  }

  return { score: Math.min(100, score), reasons };
};

export const assessMasturbationFatigue = (context: MasturbationFatigueContext): FatigueAssessment => {
  const reasons: string[] = [];
  let score = 0;

  if (context.sleepInsufficient) {
    score += 20;
    reasons.push('sleep_insufficient');
  }
  if ((context.stressLevel ?? 0) >= 4) {
    score += 15;
    reasons.push('high_stress');
  }
  if (context.alcoholGrams > 0) {
    score += 5;
    reasons.push('alcohol');
  }
  if (context.timeBucket === 'late_night') {
    score += 10;
    reasons.push('late_night');
  }
  if (context.energyLevelUsable) {
    const penalty = getEnergyPenalty(context.energyLevel);
    if (penalty > 0) {
      score += penalty;
      reasons.push('low_energy');
    }
  }

  const burden = Math.max(getFatigueBurden(context.fatigueText), getFatigueBurden(context.postFatigueText));
  if (burden > 0) {
    score += burden;
    reasons.push('post_fatigue');
  }

  if (context.edging === 'multiple' && !context.ejaculation) {
    score += 10;
    reasons.push('edging_without_ejaculation');
  }

  return { score: Math.min(100, score), reasons };
};
