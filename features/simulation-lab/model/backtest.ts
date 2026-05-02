import { StatsEngine } from '../../stats';
import { analyzePersonalState } from '../../state';
import type { PersonalStateResult } from '../../state';
import { generateVirtualCohortRun } from './generator';
import { buildMetricAvailabilitySeries, summarizeMetricAvailability, averageUsableRate } from './availability';
import { SCENARIO_SPECS } from './scenarios';
import type {
  BacktestEvaluation,
  BacktestResult,
  GenerateVirtualCohortOptions
} from './types';

const CONFIDENCE_SCORE: Record<PersonalStateResult['confidence']['level'], number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3
};

const overlapScore = (left: string[], right: string[]) => {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);
  if (union.size === 0) return 1;
  let overlap = 0;
  union.forEach((item) => {
    if (leftSet.has(item) && rightSet.has(item)) overlap += 1;
  });
  return overlap / union.size;
};

const scenarioDirectionScore = (
  scenarioId: GenerateVirtualCohortOptions['scenarioId'],
  current: PersonalStateResult,
  control: PersonalStateResult
) => {
  if (scenarioId === 'baseline') return 1;

  const stateDelta = current.currentState.stateScore - control.currentState.stateScore;
  const hardnessDelta = (current.forecast.weeklySummary.averageHardness ?? current.currentState.hardnessBaseline ?? 0)
    - (control.forecast.weeklySummary.averageHardness ?? control.currentState.hardnessBaseline ?? 0);
  const expectation = SCENARIO_SPECS[scenarioId].expectedDirection;

  if (expectation === 'up') {
    return ((stateDelta > 0 ? 1 : 0) + (hardnessDelta > 0 ? 1 : 0)) / 2;
  }
  if (expectation === 'down') {
    return ((stateDelta < 0 ? 1 : 0) + (hardnessDelta < 0 ? 1 : 0)) / 2;
  }

  return Math.abs(stateDelta) < 4 && Math.abs(hardnessDelta) < 0.25 ? 1 : 0.5;
};

const reminderFalsePositiveProxy = (analysis: PersonalStateResult) => {
  const riskDays = analysis.forecast.days.filter((day) => day.label === '风险日').length / Math.max(1, analysis.forecast.days.length);
  const stableLike = analysis.currentState.type === 'stable' || analysis.currentState.type === 'peak_ready';
  return stableLike ? Math.round(riskDays * 1000) / 1000 : 0;
};

const calibrationError = (analysis: PersonalStateResult, futureLogs: BacktestResult['run']['futureLogs']) => {
  const pairs = analysis.forecast.days.map((day, index) => {
    const actual = futureLogs[index];
    if (!actual?.morning?.wokeWithErection || typeof actual.morning.hardness !== 'number') return null;
    if (typeof day.predictedHardness !== 'number') return null;
    return Math.abs(day.predictedHardness - actual.morning.hardness);
  }).filter((value): value is number => typeof value === 'number');

  if (pairs.length === 0) return null;
  return Math.round((pairs.reduce((sum, value) => sum + value, 0) / pairs.length) * 100) / 100;
};

const factorRankingStability = (current: PersonalStateResult, reference: PersonalStateResult) => {
  const positive = overlapScore(
    current.influencingFactors.positiveTop5.map((item) => item.label),
    reference.influencingFactors.positiveTop5.map((item) => item.label)
  );
  const negative = overlapScore(
    current.influencingFactors.negativeTop5.map((item) => item.label),
    reference.influencingFactors.negativeTop5.map((item) => item.label)
  );

  return Math.round((((positive + negative) / 2) * 1000)) / 1000;
};

const buildEvaluation = (
  options: GenerateVirtualCohortOptions,
  analysis: PersonalStateResult,
  controlAnalysis: PersonalStateResult,
  futureLogs: BacktestResult['run']['futureLogs'],
  currentAvailability: ReturnType<typeof summarizeMetricAvailability>,
  fullLoggerAvailability: ReturnType<typeof summarizeMetricAvailability>,
  fullLoggerAnalysis: PersonalStateResult
): BacktestEvaluation => {
  const confidenceStepsLost = CONFIDENCE_SCORE[fullLoggerAnalysis.confidence.level] - CONFIDENCE_SCORE[analysis.confidence.level];
  return {
    directionCorrectness: Math.round(scenarioDirectionScore(options.scenarioId, analysis, controlAnalysis) * 1000) / 1000,
    factorRankingStability: factorRankingStability(analysis, fullLoggerAnalysis),
    reminderFalsePositiveProxy: reminderFalsePositiveProxy(analysis),
    forecastCalibrationError: calibrationError(analysis, futureLogs),
    missingnessRobustnessDelta: {
      confidenceStepsLost,
      averageUsableRateDelta: Math.round((averageUsableRate(fullLoggerAvailability) - averageUsableRate(currentAvailability)) * 1000) / 1000
    }
  };
};

export const runVirtualCohortBacktest = (options: GenerateVirtualCohortOptions): BacktestResult => {
  const run = generateVirtualCohortRun(options);
  const controlRun = generateVirtualCohortRun({ ...options, scenarioId: 'baseline' });
  const fullLoggerRun = generateVirtualCohortRun({ ...options, overlayId: 'full_logger' });

  const analysis = analyzePersonalState(run.observedLogs);
  const controlAnalysis = analyzePersonalState(controlRun.observedLogs);
  const fullLoggerAnalysis = analyzePersonalState(fullLoggerRun.observedLogs);
  const availabilitySeries = buildMetricAvailabilitySeries(run.observedLogs);
  const availabilitySummary = summarizeMetricAvailability(availabilitySeries);
  const fullLoggerAvailability = summarizeMetricAvailability(buildMetricAvailabilitySeries(fullLoggerRun.observedLogs));

  return {
    run,
    analysis,
    controlAnalysis,
    availabilitySeries,
    availabilitySummary,
    evaluation: buildEvaluation(
      options,
      analysis,
      controlAnalysis,
      run.futureLogs,
      availabilitySummary,
      fullLoggerAvailability,
      fullLoggerAnalysis
    )
  };
};
