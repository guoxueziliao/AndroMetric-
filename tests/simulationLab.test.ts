import { describe, expect, it } from 'vitest';
import { generateVirtualCohortRun, runVirtualCohortBacktest } from '../features/simulation-lab';

const nextDayHardnessDelta = (run: ReturnType<typeof generateVirtualCohortRun>, predicate: (index: number) => boolean) => {
  const values = run.dayPlans
    .map((plan, index) => {
      const next = run.dayPlans[index + 1];
      if (!next || next.morningHardness === null || !predicate(index)) return null;
      return next.morningHardness;
    })
    .filter((value): value is number => typeof value === 'number');

  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
};

const summarizeBacktest = (result: ReturnType<typeof runVirtualCohortBacktest>) => ({
  run: {
    preset: result.run.presetId,
    overlay: result.run.overlayId,
    scenario: result.run.scenarioId,
    seed: result.run.seed
  },
  state: result.analysis.currentState.label,
  confidence: result.analysis.confidence.level,
  peakWindow: result.analysis.forecast.weeklySummary.peakWindow,
  riskWindow: result.analysis.forecast.weeklySummary.riskWindow,
  positive: result.analysis.influencingFactors.positiveTop5.map((item) => item.label),
  negative: result.analysis.influencingFactors.negativeTop5.map((item) => item.label),
  usableRates: Object.fromEntries(
    Object.entries(result.availabilitySummary).map(([metricId, summary]) => [metricId, Math.round(summary.usableRate * 100)])
  ),
  evaluation: {
    directionCorrectness: result.evaluation.directionCorrectness,
    factorRankingStability: result.evaluation.factorRankingStability,
    reminderFalsePositiveProxy: result.evaluation.reminderFalsePositiveProxy,
    forecastCalibrationError: result.evaluation.forecastCalibrationError,
    confidenceStepsLost: result.evaluation.missingnessRobustnessDelta.confidenceStepsLost
  }
});

describe('simulation lab', () => {
  it('is deterministic for the same preset, overlay, scenario, seed, and day count', () => {
    const left = runVirtualCohortBacktest({
      presetId: 'steady_healthy',
      overlayId: 'full_logger',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });
    const right = runVirtualCohortBacktest({
      presetId: 'steady_healthy',
      overlayId: 'full_logger',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });

    expect(summarizeBacktest(left)).toEqual(summarizeBacktest(right));
    expect(left.run.observedLogs).toEqual(right.run.observedLogs);
  });

  it('keeps preset baselines directionally sane', () => {
    const healthy = runVirtualCohortBacktest({
      presetId: 'steady_healthy',
      overlayId: 'full_logger',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });
    const stressed = runVirtualCohortBacktest({
      presetId: 'high_stress_sedentary',
      overlayId: 'full_logger',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });

    expect(healthy.analysis.currentState.stateScore).toBeGreaterThan(stressed.analysis.currentState.stateScore);
    expect((healthy.analysis.forecast.weeklySummary.averageHardness ?? 0)).toBeGreaterThan((stressed.analysis.forecast.weeklySummary.averageHardness ?? 0));
  });

  it('pushes sleep-debt and high-stress scenarios in the expected negative direction', () => {
    const sleepDebt = runVirtualCohortBacktest({
      presetId: 'steady_healthy',
      overlayId: 'full_logger',
      scenarioId: 'sleep_debt_5d',
      seed: 1001,
      observedDays: 90
    });
    const stressWeek = runVirtualCohortBacktest({
      presetId: 'steady_healthy',
      overlayId: 'full_logger',
      scenarioId: 'high_stress_week',
      seed: 1001,
      observedDays: 90
    });

    expect(sleepDebt.evaluation.directionCorrectness).toBeGreaterThanOrEqual(1);
    expect(stressWeek.evaluation.directionCorrectness).toBeGreaterThanOrEqual(1);
    expect(sleepDebt.analysis.currentState.stateScore).toBeLessThan(sleepDebt.controlAnalysis.currentState.stateScore);
    expect(stressWeek.analysis.currentState.stateScore).toBeLessThan(stressWeek.controlAnalysis.currentState.stateScore);
  });

  it('shows lagged exercise upside for exercise responders', () => {
    const run = generateVirtualCohortRun({
      presetId: 'exercise_responder',
      overlayId: 'full_logger',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });

    const afterExercise = nextDayHardnessDelta(run, (index) => run.dayPlans[index].exerciseMinutes >= 35);
    const afterRest = nextDayHardnessDelta(run, (index) => run.dayPlans[index].exerciseMinutes === 0);

    expect(afterExercise).toBeGreaterThan(afterRest);
  });

  it('shows stronger next-day recovery cost after high sex load', () => {
    const run = generateVirtualCohortRun({
      presetId: 'high_sexload_recovery',
      overlayId: 'full_logger',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });

    const afterHighLoad = nextDayHardnessDelta(run, (index) => run.dayPlans[index].sexLoad >= 1.5);
    const afterLowLoad = nextDayHardnessDelta(run, (index) => run.dayPlans[index].sexLoad === 0);

    expect(afterHighLoad).toBeLessThan(afterLowLoad);
  });

  it('preserves explicit-none and missing states in generated data quality', () => {
    const fullLoggerRun = generateVirtualCohortRun({
      presetId: 'steady_healthy',
      overlayId: 'full_logger',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });
    const burstRun = generateVirtualCohortRun({
      presetId: 'steady_healthy',
      overlayId: 'burst_logger',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });

    const explicitNone = fullLoggerRun.observedLogs.some((log) => log.dataQuality?.fields?.alcoholRecords?.state === 'none');
    const missing = burstRun.observedLogs.some((log) => log.dataQuality?.fields?.alcoholRecords?.state === 'not_recorded');

    expect(explicitNone).toBe(true);
    expect(missing).toBe(true);
  });

  it('keeps explicit screen-time zero separable from missing screen time in availability summaries', () => {
    const run = runVirtualCohortBacktest({
      presetId: 'steady_healthy',
      overlayId: 'lifestyle_sparse',
      scenarioId: 'baseline',
      seed: 1001,
      observedDays: 90
    });

    const screenSeries = run.availabilitySeries.screenTime;
    expect(screenSeries.some((point) => point.state === 'usable' && point.value === 0)).toBe(true);
    expect(screenSeries.some((point) => point.state === 'missing')).toBe(true);
  });

  it('degrades sparse overlays without fully inverting factor rankings', () => {
    const full = runVirtualCohortBacktest({
      presetId: 'weekend_alcohol_wave',
      overlayId: 'full_logger',
      scenarioId: 'weekend_binge',
      seed: 1001,
      observedDays: 90
    });
    const sparse = runVirtualCohortBacktest({
      presetId: 'weekend_alcohol_wave',
      overlayId: 'lifestyle_sparse',
      scenarioId: 'weekend_binge',
      seed: 1001,
      observedDays: 90
    });

    expect(sparse.evaluation.missingnessRobustnessDelta.averageUsableRateDelta).toBeGreaterThan(0);
    expect(sparse.evaluation.factorRankingStability).toBeGreaterThanOrEqual(0);
    expect(sparse.evaluation.directionCorrectness).toBeGreaterThanOrEqual(0.5);
    expect(sparse.analysis.confidence.level === 'low' || sparse.analysis.confidence.level === 'medium' || sparse.analysis.confidence.level === 'none').toBe(true);
    expect(full.analysis.influencingFactors.negativeTop5.length).toBeGreaterThan(0);
  });

  it('matches baseline snapshots for all preset families and one sparse stressed run', () => {
    const scenarios = [
      runVirtualCohortBacktest({ presetId: 'steady_healthy', overlayId: 'full_logger', scenarioId: 'baseline', seed: 1001, observedDays: 90 }),
      runVirtualCohortBacktest({ presetId: 'high_stress_sedentary', overlayId: 'full_logger', scenarioId: 'baseline', seed: 1001, observedDays: 90 }),
      runVirtualCohortBacktest({ presetId: 'weekend_alcohol_wave', overlayId: 'full_logger', scenarioId: 'baseline', seed: 1001, observedDays: 90 }),
      runVirtualCohortBacktest({ presetId: 'exercise_responder', overlayId: 'full_logger', scenarioId: 'baseline', seed: 1001, observedDays: 90 }),
      runVirtualCohortBacktest({ presetId: 'high_sexload_recovery', overlayId: 'full_logger', scenarioId: 'baseline', seed: 1001, observedDays: 90 }),
      runVirtualCohortBacktest({ presetId: 'high_stress_sedentary', overlayId: 'lifestyle_sparse', scenarioId: 'high_stress_week', seed: 1001, observedDays: 90 })
    ];

    expect(scenarios.map(summarizeBacktest)).toMatchSnapshot();
  });
});
