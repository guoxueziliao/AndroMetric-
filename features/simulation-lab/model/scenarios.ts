import type { ScenarioId, ScenarioSpec, VirtualDayPlan } from './types';

interface ScenarioContext {
  dayIndex: number;
  observedDays: number;
  totalDays: number;
  weekday: number;
}

export const SCENARIO_SPECS: Record<ScenarioId, ScenarioSpec> = {
  baseline: {
    id: 'baseline',
    label: '基线',
    description: '不注入额外扰动，只保留人设本身的节律。',
    primaryFactors: ['hardness', 'sleep', 'exercise', 'alcohol', 'stress'],
    expectedDirection: 'flat'
  },
  sleep_debt_5d: {
    id: 'sleep_debt_5d',
    label: '5天睡眠债',
    description: '最后 5 天连续压缩睡眠并推高压力。',
    primaryFactors: ['sleep', 'stress', 'screenTime'],
    expectedDirection: 'down'
  },
  weekend_binge: {
    id: 'weekend_binge',
    label: '周末暴饮',
    description: '最近一个周末饮酒、晚睡和屏幕暴露同时走高。',
    primaryFactors: ['alcohol', 'sleep', 'screenTime'],
    expectedDirection: 'down'
  },
  exercise_ramp: {
    id: 'exercise_ramp',
    label: '运动爬坡',
    description: '最后两周逐步增加运动刺激与恢复质量。',
    primaryFactors: ['exercise', 'sleep', 'stress'],
    expectedDirection: 'up'
  },
  high_stress_week: {
    id: 'high_stress_week',
    label: '高压周',
    description: '最后 7 天持续高压、熬夜和屏幕暴露。',
    primaryFactors: ['stress', 'sleep', 'screenTime'],
    expectedDirection: 'down'
  },
  recovery_window: {
    id: 'recovery_window',
    label: '恢复窗口',
    description: '先叠加高性负荷，再进入几天低负荷恢复窗。',
    primaryFactors: ['sexLoad', 'sleep', 'exercise'],
    expectedDirection: 'mixed'
  }
};

const isLastObservedWindow = (context: ScenarioContext, days: number) => (
  context.dayIndex >= Math.max(0, context.observedDays - days) && context.dayIndex < context.observedDays
);

export const applyScenarioAdjustments = (
  scenarioId: ScenarioId,
  plan: VirtualDayPlan,
  context: ScenarioContext
): VirtualDayPlan => {
  const next = { ...plan };

  switch (scenarioId) {
    case 'sleep_debt_5d':
      if (isLastObservedWindow(context, 5)) {
        next.sleepHours = next.sleepHours !== null ? Math.max(4.8, next.sleepHours - 1.9) : next.sleepHours;
        next.screenMinutes = next.screenMinutes !== null ? next.screenMinutes + 120 : 120;
        next.stressLevel = next.stressLevel !== null ? Math.min(5, (next.stressLevel + 1) as 1 | 2 | 3 | 4 | 5) : 4;
      }
      break;
    case 'weekend_binge':
      if (isLastObservedWindow(context, 10) && (context.weekday === 5 || context.weekday === 6)) {
        next.alcoholGrams += 30;
        next.sleepHours = next.sleepHours !== null ? Math.max(5, next.sleepHours - 1.4) : next.sleepHours;
        next.screenMinutes = next.screenMinutes !== null ? next.screenMinutes + 90 : 90;
      }
      break;
    case 'exercise_ramp':
      if (context.dayIndex >= Math.max(0, context.observedDays - 14) && context.dayIndex < context.observedDays && context.dayIndex % 3 === 0) {
        next.exerciseMinutes += 35;
        next.sleepHours = next.sleepHours !== null ? next.sleepHours + 0.45 : null;
        next.stressLevel = next.stressLevel !== null ? Math.max(1, (next.stressLevel - 1) as 1 | 2 | 3 | 4 | 5) : 2;
      }
      break;
    case 'high_stress_week':
      if (isLastObservedWindow(context, 7)) {
        next.stressLevel = next.stressLevel !== null ? Math.min(5, (next.stressLevel + 2) as 1 | 2 | 3 | 4 | 5) : 5;
        next.sleepHours = next.sleepHours !== null ? Math.max(5.1, next.sleepHours - 1.2) : next.sleepHours;
        next.exerciseMinutes = Math.max(0, next.exerciseMinutes - 15);
        next.screenMinutes = next.screenMinutes !== null ? next.screenMinutes + 135 : 135;
      }
      break;
    case 'recovery_window':
      if (context.dayIndex >= Math.max(0, context.observedDays - 6) && context.dayIndex < Math.max(0, context.observedDays - 4)) {
        next.sexLoad += 1.5;
        next.sleepHours = next.sleepHours !== null ? Math.max(5.5, next.sleepHours - 0.7) : next.sleepHours;
      } else if (context.dayIndex >= Math.max(0, context.observedDays - 4) && context.dayIndex < context.observedDays) {
        next.sexLoad = Math.max(0, next.sexLoad - 0.75);
        next.sleepHours = next.sleepHours !== null ? next.sleepHours + 0.7 : null;
        next.exerciseMinutes += 20;
        next.alcoholGrams = 0;
      }
      break;
    default:
      break;
  }

  return next;
};
