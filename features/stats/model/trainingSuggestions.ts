import type { TrainingGoalCategory } from '../../../domain';
import type { AdultBehaviorWindowFacts } from './adultBehaviorReviewFacts';
import type { GatedInsight } from './adultBehaviorReviewConfidence';

// ── Types ────────────────────────────────────────────────────────────────────

export type TrainingSuggestionDimension = TrainingGoalCategory;

export type TrainingSuggestionAction =
  | 'keep_recording'
  | 'start_goal_candidate'
  | 'review_missing_data'
  | 'prioritize_recovery'
  | 'review_relationship_context';

export interface TrainingGoalDraft {
  category: TrainingGoalCategory;
  title: string;
  targetWindowDays: 7 | 14;
  description?: string;
}

export interface TrainingSuggestion {
  id: string;
  dimension: TrainingSuggestionDimension;
  trigger: string;
  confidence: 'none' | 'low' | 'medium';
  message: string;
  nextAction: TrainingSuggestionAction;
  suggestedGoal?: TrainingGoalDraft;
  limitations: string[];
}

export interface TrainingSuggestionInput {
  facts: AdultBehaviorWindowFacts;
  insights: GatedInsight[];
  activeGoalCount: number;
  hasHighLoad: boolean;
  hasLowRecovery: boolean;
}

// ── Recommendation priority ──────────────────────────────────────────────────

const DIMENSION_PRIORITY: TrainingSuggestionDimension[] = [
  'recovery',
  'record_quality',
  'hardness_stability',
  'ejaculation_control_observation',
  'relationship_communication',
  'sex_performance_stability',
];

const sortByPriority = (suggestions: TrainingSuggestion[]): TrainingSuggestion[] =>
  [...suggestions].sort((a, b) => {
    const aIdx = DIMENSION_PRIORITY.indexOf(a.dimension);
    const bIdx = DIMENSION_PRIORITY.indexOf(b.dimension);
    return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx);
  });

// ── Rule 1: Insufficient sample ──────────────────────────────────────────────

const buildInsufficientSampleRule = (input: TrainingSuggestionInput): TrainingSuggestion | null => {
  const { facts, insights } = input;
  const { recovery } = facts;

  const noHardness = recovery.morningHardnessSampleSize < 3;
  const noSleep = recovery.sleepSampleSize < 3;
  const totalAdultEvents = facts.pornUse.count + facts.masturbation.count + facts.sex.count;
  const noAdultEvents = totalAdultEvents < 3;
  const allInsightsNone = insights.length > 0 && insights.every((i) => i.confidence === 'none');

  if (!noHardness && !noSleep && !noAdultEvents && !allInsightsNone) return null;

  const gaps: string[] = [];
  if (noHardness) gaps.push('晨间硬度');
  if (noSleep) gaps.push('睡眠');
  if (noAdultEvents) gaps.push('成人行为');

  return {
    id: 'insufficient_sample',
    dimension: 'record_quality',
    trigger: `${gaps.join('、')}样本不足`,
    confidence: 'none',
    message: `当前${gaps.join('、')}记录不足，建议继续记录 7-14 天后再看复盘。`,
    nextAction: 'keep_recording',
    suggestedGoal: {
      category: 'record_quality',
      title: '持续记录 7 天',
      targetWindowDays: 7,
    },
    limitations: ['样本不足，不做趋势判断。'],
  };
};

// ── Rule 2: High load / low recovery ─────────────────────────────────────────

const buildHighLoadRecoveryRule = (input: TrainingSuggestionInput): TrainingSuggestion | null => {
  const { hasHighLoad, hasLowRecovery } = input;

  if (!hasHighLoad && !hasLowRecovery) return null;

  const triggerParts: string[] = [];
  if (hasHighLoad) triggerParts.push('行为负荷偏高');
  if (hasLowRecovery) triggerParts.push('恢复偏慢');

  return {
    id: 'high_load_recovery',
    dimension: 'recovery',
    trigger: triggerParts.join('，'),
    confidence: 'low',
    message: `近期${triggerParts.join('、')}，建议优先关注恢复，暂停追求表现数据。`,
    nextAction: 'prioritize_recovery',
    suggestedGoal: {
      category: 'recovery',
      title: '7 天恢复观察',
      targetWindowDays: 7,
    },
    limitations: ['高负荷期间不推荐表现提升目标。'],
  };
};

// ── Rule 3: Hardness stability ───────────────────────────────────────────────

const buildHardnessStabilityRule = (input: TrainingSuggestionInput): TrainingSuggestion | null => {
  const { facts, insights } = input;
  const { recovery } = facts;

  if (recovery.morningHardnessSampleSize < 7) return null;

  const hardnessInsight = insights.find(
    (i) => i.metric === 'sleep_morning_hardness' || i.metric === 'porn_use_next_day_hardness',
  );
  if (!hardnessInsight || hardnessInsight.confidence === 'none') return null;

  return {
    id: 'hardness_stability',
    dimension: 'hardness_stability',
    trigger: `硬度样本 ${recovery.morningHardnessSampleSize}，${hardnessInsight.metric === 'sleep_morning_hardness' ? '与睡眠有关联观察' : '与行为因素有关联观察'}`,
    confidence: hardnessInsight.confidence === 'medium' ? 'medium' : 'low',
    message: `硬度样本初步可看，建议持续记录硬度、睡眠和疲劳，观察稳定性。`,
    nextAction: 'start_goal_candidate',
    suggestedGoal: {
      category: 'hardness_stability',
      title: '14 天硬度稳定观察',
      targetWindowDays: 14,
    },
    limitations: [...hardnessInsight.limitations],
  };
};

// ── Rule 4: Ejaculation control observation ──────────────────────────────────

const buildEjaculationControlRule = (input: TrainingSuggestionInput): TrainingSuggestion | null => {
  const { facts } = input;
  const totalEjaculations =
    facts.pornUse.ejaculationCount +
    facts.masturbation.ejaculationCount +
    facts.sex.ejaculationCount;
  const edgingCount = facts.masturbation.edgingCount;

  if (totalEjaculations < 5 && edgingCount < 3) return null;

  return {
    id: 'ejaculation_control',
    dimension: 'ejaculation_control_observation',
    trigger: `射精 ${totalEjaculations} 次，边缘控制 ${edgingCount} 次`,
    confidence: totalEjaculations >= 7 ? 'medium' : 'low',
    message: `射精控制和边缘控制样本初步可看，建议同时观察疲劳、满意度和恢复。`,
    nextAction: 'start_goal_candidate',
    suggestedGoal: {
      category: 'ejaculation_control_observation',
      title: '14 天射精控制观察',
      targetWindowDays: 14,
    },
    limitations: ['只观察模式，不做能力评定或挑战。'],
  };
};

// ── Rule 5: Relationship communication ───────────────────────────────────────

const buildRelationshipRule = (input: TrainingSuggestionInput): TrainingSuggestion | null => {
  const { facts } = input;
  const { sex } = facts;

  // Higher threshold since no relationship-specific data exists yet.
  // 刀 6 will add relationship context and refine this rule.
  if (sex.count < 5) return null;
  if (sex.satisfactionSampleSize < 5) return null;

  return {
    id: 'relationship_communication',
    dimension: 'relationship_communication',
    trigger: `性爱 ${sex.count} 次，满意度样本 ${sex.satisfactionSampleSize}`,
    confidence: 'low',
    message: `有性爱记录但关系沟通记录不足，建议补充伴侣反馈和关系氛围记录。`,
    nextAction: 'review_relationship_context',
    suggestedGoal: {
      category: 'relationship_communication',
      title: '14 天关系沟通记录',
      targetWindowDays: 14,
    },
    limitations: ['不评价伴侣，不做伴侣排名。'],
  };
};

// ── Rule 6: Sex duration stability ───────────────────────────────────────────

const buildSexDurationRule = (input: TrainingSuggestionInput): TrainingSuggestion | null => {
  const { facts } = input;
  const { sex } = facts;

  if (sex.count < 5) return null;

  return {
    id: 'sex_duration_stability',
    dimension: 'sex_performance_stability',
    trigger: `性爱 ${sex.count} 次`,
    confidence: sex.count >= 7 ? 'medium' : 'low',
    message: `性爱样本初步可看，建议同时观察时长、硬度、满意度和恢复。`,
    nextAction: 'start_goal_candidate',
    suggestedGoal: {
      category: 'sex_performance_stability',
      title: '14 天性表现稳定观察',
      targetWindowDays: 14,
    },
    limitations: ['时长需和满意度、硬度、恢复一起看，不做最长时长目标。'],
  };
};

// ── Safety Rails filter ──────────────────────────────────────────────────────

const FORBIDDEN_CATEGORIES = new Set([
  'sex_count_challenge', 'ejaculation_count_challenge', 'partner_count_challenge',
  'porn_duration_challenge', 'porn_stimulation_challenge', 'longest_sex_challenge',
  'partner_ranking', 'partner_score',
]);

const FORBIDDEN_COPY_PATTERNS = [
  /诊断/, /成瘾/, /导致/, /你应该/, /你应该克制/,
  /排名/, /评分/, /能力评分/, /挑战.*久/, /越久越好/,
  /最好.*伴侣/, /最差.*伴侣/, /伴侣.*导致/,
];

const safetyRailsCheck = (suggestion: TrainingSuggestion): boolean => {
  // Check forbidden category
  if (suggestion.suggestedGoal && FORBIDDEN_CATEGORIES.has(suggestion.suggestedGoal.category)) {
    console.warn(`[SafetyRails] Blocked suggestion ${suggestion.id}: forbidden category ${suggestion.suggestedGoal.category}`);
    return false;
  }

  // Check forbidden window
  if (suggestion.suggestedGoal &&
      suggestion.suggestedGoal.targetWindowDays !== 7 &&
      suggestion.suggestedGoal.targetWindowDays !== 14) {
    console.warn(`[SafetyRails] Blocked suggestion ${suggestion.id}: invalid window ${suggestion.suggestedGoal.targetWindowDays}`);
    return false;
  }

  // Check forbidden copy in message
  const allCopy = `${suggestion.message} ${suggestion.trigger} ${suggestion.limitations.join(' ')}`;
  for (const pattern of FORBIDDEN_COPY_PATTERNS) {
    if (pattern.test(allCopy)) {
      console.warn(`[SafetyRails] Blocked suggestion ${suggestion.id}: forbidden copy pattern ${pattern}`);
      return false;
    }
  }

  return true;
};

// ── High-load restriction ────────────────────────────────────────────────────

const highLoadFilter = (suggestion: TrainingSuggestion, hasHighLoad: boolean): boolean => {
  if (!hasHighLoad) return true;
  // High load: only recovery and record_quality allowed
  return suggestion.dimension === 'recovery' || suggestion.dimension === 'record_quality';
};

// ── Main entry point ─────────────────────────────────────────────────────────

export const generateTrainingSuggestions = (input: TrainingSuggestionInput): TrainingSuggestion[] => {
  const candidates: TrainingSuggestion[] = [];

  // Always check insufficient sample first
  const rule1 = buildInsufficientSampleRule(input);
  if (rule1) {
    candidates.push(rule1);
    // If sample is insufficient, only suggest keep_recording
    return sortByPriority(candidates.filter(safetyRailsCheck)).slice(0, 3);
  }

  // Build all rule candidates
  const rules = [
    buildHighLoadRecoveryRule,
    buildHardnessStabilityRule,
    buildEjaculationControlRule,
    buildRelationshipRule,
    buildSexDurationRule,
  ];

  for (const rule of rules) {
    const suggestion = rule(input);
    if (suggestion) {
      candidates.push(suggestion);
    }
  }

  // Apply high-load filter
  const filtered = candidates.filter((s) => highLoadFilter(s, input.hasHighLoad));

  // Apply safety rails
  const safe = filtered.filter(safetyRailsCheck);

  // Suppress start_goal_candidate when user already has enough active goals
  const gated = input.activeGoalCount >= 3
    ? safe.map((s) => s.nextAction === 'start_goal_candidate'
      ? { ...s, nextAction: 'keep_recording' as const, message: `${s.message} 当前已有 ${input.activeGoalCount} 个活跃目标，建议先完成现有目标。`, suggestedGoal: undefined }
      : s)
    : safe;

  // Sort by priority and limit to 3
  return sortByPriority(gated).slice(0, 3);
};

// ── Build suggestion input from facts ────────────────────────────────────────

export const buildSuggestionInput = (
  facts: AdultBehaviorWindowFacts,
  insights: GatedInsight[],
  activeGoalCount: number,
): TrainingSuggestionInput => {
  const { recovery, pornUse, masturbation, sex } = facts;

  // Detect high load
  const totalActivity = pornUse.count + masturbation.count + sex.count;
  const totalEjaculations = pornUse.ejaculationCount + masturbation.ejaculationCount + sex.ejaculationCount;
  const hasHighLoad = totalActivity >= 7 || totalEjaculations >= 7;

  // Detect low recovery — must check actual values, not just sample existence
  const hasLowRecovery =
    (recovery.sleepMeanMinutes !== null && recovery.sleepMeanMinutes < 360) ? true :
    (recovery.morningHardnessSampleSize >= 3 && recovery.morningHardnessMean !== null && recovery.morningHardnessMean < 3) ? true :
    false;

  return {
    facts,
    insights,
    activeGoalCount,
    hasHighLoad,
    hasLowRecovery,
  };
};
