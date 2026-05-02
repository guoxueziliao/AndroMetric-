import type { LogEntry } from '../../../domain';
import { analyzeSleep } from '../../../shared/lib';
import { isFieldUsable } from '../../../utils/dataQuality';
import { calculateHealthScore, calculateSexLoad } from '../../dashboard/model/p1Summary';
import { StatsEngine, type MetricId } from '../../stats';

export type StateType = 'peak_ready' | 'stable' | 'recovering' | 'fatigued' | 'risk' | 'insufficient_data';
export type ConfidenceLevel = 'none' | 'low' | 'medium' | 'high';
export type ForecastLabel = '高峰日' | '稳定日' | '恢复日' | '风险日';

export interface StateReason {
  key: string;
  label: string;
  effect: 'positive' | 'negative';
  detail: string;
  weight: number;
}

export interface FactorImpact {
  key: string;
  label: string;
  summary: string;
  delta: number;
  sampleSize: number;
  confidence: ConfidenceLevel;
}

export interface ForecastDay {
  date: string;
  weekday: string;
  predictedHardness: number | null;
  predictedStateScore: number;
  label: ForecastLabel;
  confidence: ConfidenceLevel;
  reasons: string[];
}

export interface ForecastSummary {
  averageHardness: number | null;
  averageStateScore: number;
  peakWindow: string;
  riskWindow: string;
  summary: string;
}

export interface AchievableGoal {
  id: string;
  title: string;
  summary: string;
  currentValue: string;
  targetValue: string;
  progress: number;
  actions: string[];
}

export interface PersonalStateResult {
  currentState: {
    type: StateType;
    label: string;
    stateScore: number;
    hardnessBaseline: number | null;
    trend: 'up' | 'flat' | 'down' | 'unknown';
    reasons: StateReason[];
  };
  influencingFactors: {
    positiveTop5: FactorImpact[];
    negativeTop5: FactorImpact[];
  };
  forecast: {
    weeklySummary: ForecastSummary;
    days: ForecastDay[];
  };
  achievableGoals: AchievableGoal[];
  confidence: {
    level: ConfidenceLevel;
    sampleSize: number;
    message: string;
  };
}

type FactorMode = 'high_good' | 'high_bad';

interface FactorMeta {
  label: string;
  mode: FactorMode;
}

interface DayContribution {
  key: string;
  label: string;
  effect: number;
}

const FACTOR_META: Record<MetricId, FactorMeta> = {
  hardness: { label: '晨勃硬度', mode: 'high_good' },
  sleep: { label: '睡眠时长', mode: 'high_good' },
  alcohol: { label: '饮酒量', mode: 'high_bad' },
  stress: { label: '压力等级', mode: 'high_bad' },
  exercise: { label: '运动时长', mode: 'high_good' },
  masturbation: { label: '自慰次数', mode: 'high_bad' },
  sexLoad: { label: '性负荷', mode: 'high_bad' },
  screenTime: { label: '屏幕时间', mode: 'high_bad' },
  healthScore: { label: '健康分', mode: 'high_good' }
};

const FORECAST_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const average = (values: Array<number | null | undefined>) => {
  const valid = values.filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const weekdayLabel = (dateStr: string) => (
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('zh-CN', { weekday: 'short' })
);

const formatMonthDay = (dateStr: string) => (
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
);

const describeState = (type: StateType) => {
  switch (type) {
    case 'peak_ready':
      return '高峰前';
    case 'stable':
      return '稳定';
    case 'recovering':
      return '恢复中';
    case 'fatigued':
      return '疲劳';
    case 'risk':
      return '风险偏高';
    default:
      return '数据不足';
  }
};

const confidenceFromSamples = (sampleSize: number): PersonalStateResult['confidence'] => {
  if (sampleSize >= 90) {
    return { level: 'high', sampleSize, message: `近90天内有 ${sampleSize} 条有效硬度样本，预测稳定性较高。` };
  }
  if (sampleSize >= 45) {
    return { level: 'medium', sampleSize, message: `当前有 ${sampleSize} 条有效硬度样本，可做中等置信度预测。` };
  }
  if (sampleSize >= 14) {
    return { level: 'low', sampleSize, message: `当前只有 ${sampleSize} 条有效硬度样本，预测应按趋势参考。` };
  }
  return { level: 'none', sampleSize, message: `当前只有 ${sampleSize} 条有效硬度样本，先补齐记录再解锁预测。` };
};

const degradeConfidence = (level: ConfidenceLevel): ConfidenceLevel => {
  if (level === 'high') return 'medium';
  if (level === 'medium') return 'low';
  return level;
};

const factorConfidence = (sampleSize: number): ConfidenceLevel => {
  if (sampleSize >= 24) return 'high';
  if (sampleSize >= 12) return 'medium';
  return 'low';
};

const buildActionList = (
  recentSleepHours: number | null,
  recentExerciseMinutes: number | null,
  recentAlcoholGrams: number,
  recentStress: number | null,
  recentSexLoad: number,
  recentScreenHours: number | null,
  recentlySick: boolean
) => {
  const actions: string[] = [];

  if (recentSleepHours !== null && recentSleepHours < 7) actions.push('连续两晚把睡眠拉回 7 小时以上');
  if ((recentExerciseMinutes ?? 0) < 30) actions.push('安排一次 30 分钟以上的中等强度运动');
  if (recentAlcoholGrams >= 20) actions.push('接下来 48 小时内避免饮酒');
  if (recentStress !== null && recentStress >= 4) actions.push('把最近三天的压力自评压到 2-3 级');
  if (recentSexLoad > 1.5) actions.push('至少留出 1 晚低性负荷恢复窗口');
  if (recentScreenHours !== null && recentScreenHours >= 4) actions.push('睡前 2 小时减少屏幕暴露');
  if (recentlySick) actions.push('优先恢复身体状态，不以冲高为第一目标');

  return actions.slice(0, 3);
};

const computeProgress = (current: number, target: number) => clamp(Math.round((current / target) * 100), 0, 100);

const buildDataSeries = (logs: LogEntry[]) => {
  const validHardnessLogs = logs.filter(
    (log) => log.morning?.wokeWithErection && isFieldUsable(log, 'morning.hardness') && typeof log.morning.hardness === 'number'
  );
  const hardnessValues = validHardnessLogs.map((log) => log.morning?.hardness ?? null);
  const healthOverallValues = logs.map((log) => calculateHealthScore(log).overall);
  const sleepHoursValues = logs.map((log) => {
    const hasSleepRange = isFieldUsable(log, 'sleep.startTime') && isFieldUsable(log, 'sleep.endTime');
    if (!hasSleepRange) return null;
    const sleep = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
    return sleep ? sleep.durationHours : null;
  });
  const exerciseMinutesValues = logs.map((log) => (log.exercise || []).reduce((sum, item) => sum + (item.duration || 0), 0));
  const alcoholValues = logs.map((log) => (log.alcoholRecords || []).reduce((sum, item) => sum + item.totalGrams, 0));
  const stressValues = logs.map((log) => (isFieldUsable(log, 'stressLevel') ? (log.stressLevel ?? null) : null));
  const sexLoadValues = logs.map((log) => calculateSexLoad(log));
  const screenHoursValues = logs.map((log) => (log.screenTime?.totalMinutes ? log.screenTime.totalMinutes / 60 : null));

  return {
    validHardnessLogs,
    hardnessValues,
    healthOverallValues,
    sleepHoursValues,
    exerciseMinutesValues,
    alcoholValues,
    stressValues,
    sexLoadValues,
    screenHoursValues
  };
};

const computeTrend = (
  recentHealth: number | null,
  previousHealth: number | null,
  recentHardness: number | null,
  previousHardness: number | null
): 'up' | 'flat' | 'down' | 'unknown' => {
  if (recentHealth === null && recentHardness === null) return 'unknown';
  const healthDelta = recentHealth !== null && previousHealth !== null ? recentHealth - previousHealth : 0;
  const hardnessDelta = recentHardness !== null && previousHardness !== null ? recentHardness - previousHardness : 0;

  if (healthDelta >= 4 || hardnessDelta >= 0.3) return 'up';
  if (healthDelta <= -4 || hardnessDelta <= -0.3) return 'down';
  return 'flat';
};

const buildCurrentState = (logs: LogEntry[]) => {
  const recent3 = logs.slice(-3);
  const recent7 = logs.slice(-7);
  const previous3 = logs.slice(-6, -3);
  const series = buildDataSeries(logs);

  const recent3Health = average(recent3.map((log) => calculateHealthScore(log).overall));
  const recent7Health = average(recent7.map((log) => calculateHealthScore(log).overall));
  const previous3Health = average(previous3.map((log) => calculateHealthScore(log).overall));

  const recent3Hardness = average(
    recent3.map((log) => (log.morning?.wokeWithErection && isFieldUsable(log, 'morning.hardness') ? log.morning.hardness ?? null : null))
  );
  const previous3Hardness = average(
    previous3.map((log) => (log.morning?.wokeWithErection && isFieldUsable(log, 'morning.hardness') ? log.morning.hardness ?? null : null))
  );
  const baselineHardness = average(series.hardnessValues.slice(-10));

  const recentSleepHours = average(series.sleepHoursValues.slice(-3));
  const recentExerciseMinutes = average(series.exerciseMinutesValues.slice(-3));
  const recentAlcoholGrams = series.alcoholValues.slice(-2).reduce((sum, value) => sum + value, 0);
  const recentStress = average(series.stressValues.slice(-3));
  const recentSexLoad = series.sexLoadValues.slice(-2).reduce((sum, value) => sum + value, 0);
  const recentScreenHours = average(series.screenHoursValues.slice(-3));
  const recentlySick = recent7.some((log) => log.health?.isSick);

  const baseScore = average([recent3Health, recent7Health]) ?? 62;
  const reasons: StateReason[] = [];
  let modifier = 0;

  if (recentSleepHours !== null) {
    if (recentSleepHours >= 7.5) {
      modifier += 5;
      reasons.push({ key: 'sleep', label: '睡眠回升', effect: 'positive', detail: `最近睡眠均值 ${round(recentSleepHours)}h。`, weight: 5 });
    } else if (recentSleepHours < 6) {
      modifier -= 7;
      reasons.push({ key: 'sleep', label: '睡眠不足', effect: 'negative', detail: `最近睡眠均值只有 ${round(recentSleepHours)}h。`, weight: 7 });
    } else if (recentSleepHours < 7) {
      modifier -= 3;
      reasons.push({ key: 'sleep', label: '睡眠偏少', effect: 'negative', detail: `最近睡眠均值 ${round(recentSleepHours)}h，恢复效率偏低。`, weight: 3 });
    }
  }

  if (recentExerciseMinutes !== null) {
    if (recentExerciseMinutes >= 30) {
      modifier += 4;
      reasons.push({ key: 'exercise', label: '运动支撑', effect: 'positive', detail: `最近 3 天单日平均运动 ${round(recentExerciseMinutes)} 分钟。`, weight: 4 });
    } else if (recentExerciseMinutes < 10) {
      modifier -= 2;
      reasons.push({ key: 'exercise', label: '运动偏少', effect: 'negative', detail: '最近几天运动刺激不足。', weight: 2 });
    }
  }

  if (recentStress !== null) {
    if (recentStress >= 4) {
      modifier -= 6;
      reasons.push({ key: 'stress', label: '压力抬升', effect: 'negative', detail: `最近压力均值 ${round(recentStress)} 级。`, weight: 6 });
    } else if (recentStress <= 2) {
      modifier += 3;
      reasons.push({ key: 'stress', label: '压力可控', effect: 'positive', detail: '最近压力维持在可恢复区。', weight: 3 });
    }
  }

  if (recentAlcoholGrams >= 40) {
    modifier -= 6;
    reasons.push({ key: 'alcohol', label: '饮酒拖累', effect: 'negative', detail: `最近两天饮酒约 ${Math.round(recentAlcoholGrams)}g。`, weight: 6 });
  } else if (recentAlcoholGrams === 0) {
    modifier += 2;
    reasons.push({ key: 'alcohol', label: '低饮酒窗口', effect: 'positive', detail: '最近两天没有饮酒负担。', weight: 2 });
  }

  if (recentSexLoad > 3) {
    modifier -= 6;
    reasons.push({ key: 'sexLoad', label: '性负荷偏高', effect: 'negative', detail: `最近两天性负荷 ${round(recentSexLoad)}。`, weight: 6 });
  } else if (recentSexLoad <= 1.5) {
    modifier += 2;
    reasons.push({ key: 'sexLoad', label: '恢复窗口保留', effect: 'positive', detail: '最近性负荷没有持续压住恢复。', weight: 2 });
  }

  if (recentScreenHours !== null && recentScreenHours >= 4) {
    modifier -= 3;
    reasons.push({ key: 'screenTime', label: '屏幕暴露偏高', effect: 'negative', detail: `最近屏幕时间均值 ${round(recentScreenHours)}h。`, weight: 3 });
  }

  if (recentlySick) {
    modifier -= 8;
    reasons.push({ key: 'health', label: '身体恢复中', effect: 'negative', detail: '最近 7 天内有生病记录。', weight: 8 });
  }

  const stateScore = clamp(Math.round(baseScore + modifier), 0, 100);
  const trend = computeTrend(recent3Health, previous3Health, recent3Hardness, previous3Hardness);

  let type: StateType = 'stable';
  if (logs.length < 5) {
    type = 'insufficient_data';
  } else if (stateScore >= 80 && trend !== 'down') {
    type = 'peak_ready';
  } else if (stateScore >= 68 && trend !== 'down') {
    type = 'stable';
  } else if (trend === 'up' && stateScore >= 54) {
    type = 'recovering';
  } else if (stateScore < 45 || (trend === 'down' && stateScore < 58)) {
    type = 'risk';
  } else {
    type = 'fatigued';
  }

  return {
    type,
    label: describeState(type),
    stateScore,
    hardnessBaseline: baselineHardness !== null ? round(baselineHardness) : null,
    trend,
    reasons: reasons.sort((a, b) => b.weight - a.weight).slice(0, 4),
    metrics: {
      recentSleepHours,
      recentExerciseMinutes,
      recentAlcoholGrams,
      recentStress,
      recentSexLoad,
      recentScreenHours,
      recentlySick,
      recent3Health,
      recent7Health,
      recent3Hardness
    }
  };
};

const buildImpactFactors = (logs: LogEntry[]) => {
  const engine = new StatsEngine(logs);
  const metrics: MetricId[] = ['sleep', 'exercise', 'healthScore', 'alcohol', 'stress', 'sexLoad', 'screenTime'];
  const positive: FactorImpact[] = [];
  const negative: FactorImpact[] = [];

  metrics.forEach((metricId) => {
    const impact = engine.analyzeImpact(metricId, 'hardness');
    if (!impact || Math.abs(impact.diff) < 0.15 || impact.sampleSize < 6) return;

    const meta = FACTOR_META[metricId];
    const delta = round(Math.abs(impact.diff));
    const confidence = factorConfidence(impact.sampleSize);

    if (meta.mode === 'high_good') {
      if (impact.diff > 0) {
        positive.push({
          key: `${metricId}-positive`,
          label: meta.label,
          summary: `${meta.label}较高时，次日硬度平均更高 ${delta} 级。`,
          delta,
          sampleSize: impact.sampleSize,
          confidence
        });
        negative.push({
          key: `${metricId}-negative`,
          label: `${meta.label}不足`,
          summary: `${meta.label}不足时，硬度平均更低 ${delta} 级。`,
          delta,
          sampleSize: impact.sampleSize,
          confidence
        });
      } else {
        negative.push({
          key: `${metricId}-negative`,
          label: meta.label,
          summary: `${meta.label}较高时，硬度反而平均更低 ${delta} 级。`,
          delta,
          sampleSize: impact.sampleSize,
          confidence
        });
      }
      return;
    }

    if (impact.diff < 0) {
      positive.push({
        key: `${metricId}-positive`,
        label: `低${meta.label}`,
        summary: `${meta.label}较低时，次日硬度平均更高 ${delta} 级。`,
        delta,
        sampleSize: impact.sampleSize,
        confidence
      });
      negative.push({
        key: `${metricId}-negative`,
        label: `高${meta.label}`,
        summary: `${meta.label}较高时，次日硬度平均更低 ${delta} 级。`,
        delta,
        sampleSize: impact.sampleSize,
        confidence
      });
    } else {
      positive.push({
        key: `${metricId}-positive`,
        label: meta.label,
        summary: `${meta.label}较高时，你的历史表现反而更好 ${delta} 级。`,
        delta,
        sampleSize: impact.sampleSize,
        confidence
      });
    }
  });

  const sorter = (a: FactorImpact, b: FactorImpact) => (b.delta * 10 + b.sampleSize / 10) - (a.delta * 10 + a.sampleSize / 10);

  return {
    positiveTop5: positive.sort(sorter).slice(0, 5),
    negativeTop5: negative.sort(sorter).slice(0, 5)
  };
};

const labelForForecast = (predictedHardness: number, predictedStateScore: number, momentum: number): ForecastLabel => {
  if (predictedHardness >= 4.2 || predictedStateScore >= 82) return '高峰日';
  if (predictedStateScore >= 68 && predictedHardness >= 3.7) return '稳定日';
  if (predictedStateScore >= 56 && momentum >= 0) return '恢复日';
  return '风险日';
};

const buildForecast = (
  logs: LogEntry[],
  currentState: ReturnType<typeof buildCurrentState>,
  confidenceLevel: ConfidenceLevel
) => {
  const today = logs.length > 0 ? new Date(`${logs[logs.length - 1].date}T00:00:00`) : new Date();
  const series = buildDataSeries(logs);
  const validHardnessLogs = series.validHardnessLogs;
  const historicalAverageHardness = average(series.hardnessValues) ?? 3.4;
  const historicalAverageState = average(logs.map((log) => calculateHealthScore(log).overall)) ?? currentState.stateScore;
  const weekdayHardnessMap = new Map<number, number>();
  const weekdayStateMap = new Map<number, number>();

  for (let weekday = 0; weekday < 7; weekday += 1) {
    const weekdayHardness = average(
      validHardnessLogs
        .filter((log) => new Date(`${log.date}T00:00:00`).getDay() === weekday)
        .map((log) => log.morning?.hardness ?? null)
    );
    const weekdayState = average(
      logs
        .filter((log) => new Date(`${log.date}T00:00:00`).getDay() === weekday)
        .map((log) => calculateHealthScore(log).overall)
    );
    if (weekdayHardness !== null) weekdayHardnessMap.set(weekday, weekdayHardness);
    if (weekdayState !== null) weekdayStateMap.set(weekday, weekdayState);
  }

  const recentSleepHours = currentState.metrics.recentSleepHours;
  const recentExerciseMinutes = currentState.metrics.recentExerciseMinutes ?? 0;
  const recentAlcoholGrams = currentState.metrics.recentAlcoholGrams;
  const recentStress = currentState.metrics.recentStress;
  const recentSexLoad = currentState.metrics.recentSexLoad;
  const recentScreenHours = currentState.metrics.recentScreenHours;
  const recentlySick = currentState.metrics.recentlySick;

  if (confidenceLevel === 'none') {
    const days: ForecastDay[] = Array.from({ length: FORECAST_DAYS }, (_, index) => {
      const date = new Date(today.getTime() + (index + 1) * DAY_MS);
      const dateStr = toDateKey(date);
      return {
        date: dateStr,
        weekday: weekdayLabel(dateStr),
        predictedHardness: null,
        predictedStateScore: currentState.stateScore,
        label: currentState.type === 'risk' ? '风险日' : currentState.type === 'recovering' ? '恢复日' : '稳定日',
        confidence: 'none',
        reasons: ['有效硬度样本不足，先补齐记录再解锁数值预测。']
      };
    });

    return {
      days,
      weeklySummary: {
        averageHardness: null,
        averageStateScore: currentState.stateScore,
        peakWindow: '样本不足',
        riskWindow: '样本不足',
        summary: '当前只展示状态趋势，不输出未来 7 天的硬度数字。'
      }
    };
  }

  const days: ForecastDay[] = [];

  for (let index = 0; index < FORECAST_DAYS; index += 1) {
    const offset = index + 1;
    const date = new Date(today.getTime() + offset * DAY_MS);
    const dateStr = toDateKey(date);
    const weekday = date.getDay();
    const weekdayHardness = weekdayHardnessMap.get(weekday) ?? historicalAverageHardness;
    const weekdayState = weekdayStateMap.get(weekday) ?? historicalAverageState;
    const contributions: DayContribution[] = [];

    if (recentSleepHours !== null) {
      if (recentSleepHours >= 7.2) {
        const bonus = offset <= 3 ? 0.22 : 0.1;
        contributions.push({ key: 'sleep', label: '睡眠充足', effect: bonus });
      } else if (recentSleepHours < 6.2) {
        const penalty = offset === 1 ? -0.35 : offset <= 3 ? -0.22 : -0.08;
        contributions.push({ key: 'sleep', label: '睡眠债', effect: penalty });
      }
    }

    if (recentExerciseMinutes >= 30) {
      const bonus = offset >= 2 && offset <= 4 ? 0.24 : 0.08;
      contributions.push({ key: 'exercise', label: '运动恢复', effect: bonus });
    } else if (recentExerciseMinutes < 10) {
      contributions.push({ key: 'exercise', label: '运动刺激不足', effect: -0.08 });
    }

    if (recentAlcoholGrams >= 40) {
      const penalty = offset === 1 ? -0.45 : offset === 2 ? -0.24 : -0.08;
      contributions.push({ key: 'alcohol', label: '饮酒拖累', effect: penalty });
    } else if (recentAlcoholGrams >= 20) {
      const penalty = offset === 1 ? -0.25 : -0.12;
      contributions.push({ key: 'alcohol', label: '酒精余波', effect: penalty });
    }

    if (recentStress !== null) {
      if (recentStress >= 4) {
        const penalty = offset <= 2 ? -0.3 : offset <= 4 ? -0.18 : -0.08;
        contributions.push({ key: 'stress', label: '压力惯性', effect: penalty });
      } else if (recentStress <= 2) {
        contributions.push({ key: 'stress', label: '低压窗口', effect: offset <= 3 ? 0.14 : 0.06 });
      }
    }

    if (recentSexLoad > 3) {
      const effect = offset === 1 ? -0.38 : offset === 2 ? -0.22 : offset === 3 ? -0.1 : 0.05;
      contributions.push({ key: 'sexLoad', label: '高负荷恢复', effect });
    } else if (recentSexLoad > 1.5) {
      const effect = offset === 1 ? -0.18 : offset === 2 ? -0.08 : 0.04;
      contributions.push({ key: 'sexLoad', label: '负荷余波', effect });
    }

    if (recentScreenHours !== null && recentScreenHours >= 4) {
      contributions.push({ key: 'screenTime', label: '晚间屏幕暴露', effect: offset <= 2 ? -0.12 : -0.05 });
    }

    if (recentlySick) {
      const penalty = offset === 1 ? -0.4 : offset === 2 ? -0.26 : offset <= 4 ? -0.12 : -0.05;
      contributions.push({ key: 'health', label: '身体恢复期', effect: penalty });
    }

    const weekdayContribution = (weekdayHardness - historicalAverageHardness) * 0.35;
    contributions.push({ key: 'weekday', label: '历史星期模式', effect: weekdayContribution });

    const totalEffect = contributions.reduce((sum, item) => sum + item.effect, 0);
    const predictedHardness = clamp(
      round((((currentState.hardnessBaseline ?? historicalAverageHardness) * 0.65) + (weekdayHardness * 0.35)) + totalEffect),
      1.5,
      5
    );
    const predictedStateScore = clamp(
      Math.round((currentState.stateScore * 0.62) + (weekdayState * 0.38) + (totalEffect * 22)),
      0,
      100
    );
    const reasons = contributions
      .slice()
      .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
      .slice(0, 2)
      .map((item) => `${item.label}${item.effect >= 0 ? '偏利好' : '偏拖累'}`);

    days.push({
      date: dateStr,
      weekday: weekdayLabel(dateStr),
      predictedHardness,
      predictedStateScore,
      label: labelForForecast(predictedHardness, predictedStateScore, totalEffect),
      confidence: offset <= 3 ? confidenceLevel : degradeConfidence(confidenceLevel),
      reasons
    });
  }

  const averageHardness = average(days.map((day) => day.predictedHardness)) ?? null;
  const averageStateScore = Math.round(average(days.map((day) => day.predictedStateScore)) ?? currentState.stateScore);
  const sortedByHardness = days.slice().sort((a, b) => (b.predictedHardness ?? 0) - (a.predictedHardness ?? 0));
  const peakDays = sortedByHardness.slice(0, 2).map((day) => `${day.weekday} ${formatMonthDay(day.date)}`);
  const riskDays = sortedByHardness.slice(-2).reverse().map((day) => `${day.weekday} ${formatMonthDay(day.date)}`);
  const peakLead = sortedByHardness[0];
  const riskLead = sortedByHardness[sortedByHardness.length - 1];

  return {
    days,
    weeklySummary: {
      averageHardness: averageHardness !== null ? round(averageHardness) : null,
      averageStateScore,
      peakWindow: peakDays.join(' / '),
      riskWindow: riskDays.join(' / '),
      summary: `${peakLead.weekday} 更适合冲高，${riskLead.weekday} 更适合做恢复管理。`
    }
  };
};

const bestRollingHighCount = (logs: LogEntry[]) => {
  let best = 0;
  for (let index = 0; index < logs.length; index += 1) {
    const window = logs.slice(index, index + 7);
    if (window.length === 0) continue;
    const count = window.filter(
      (log) => log.morning?.wokeWithErection && isFieldUsable(log, 'morning.hardness') && (log.morning.hardness ?? 0) >= 4
    ).length;
    best = Math.max(best, count);
  }
  return best;
};

const buildGoals = (
  logs: LogEntry[],
  currentState: ReturnType<typeof buildCurrentState>,
  forecast: { weeklySummary: ForecastSummary; days: ForecastDay[] },
  confidence: PersonalStateResult['confidence']
) => {
  const actions = buildActionList(
    currentState.metrics.recentSleepHours,
    currentState.metrics.recentExerciseMinutes,
    currentState.metrics.recentAlcoholGrams,
    currentState.metrics.recentStress,
    currentState.metrics.recentSexLoad,
    currentState.metrics.recentScreenHours,
    currentState.metrics.recentlySick
  );

  if (confidence.level === 'none') {
    return [
      {
        id: 'unlock-forecast',
        title: '连续记录 14 天，解锁个人预测',
        summary: '先把样本量补到可用区间，再让状态页输出未来 7 天硬度数字。',
        currentValue: `${confidence.sampleSize} 条样本`,
        targetValue: '14 条样本',
        progress: computeProgress(confidence.sampleSize, 14),
        actions: [
          '优先补齐晨勃硬度、睡眠起止时间、压力等级',
          '把屏幕时间和运动也一起记上',
          '先连续记录，不追求复杂分析'
        ]
      }
    ];
  }

  const goals: AchievableGoal[] = [];
  const bestHighCount = bestRollingHighCount(logs.slice(-90));
  const predictedHighCount = forecast.days.filter((day) => (day.predictedHardness ?? 0) >= 4).length;
  const peakDay = forecast.days.reduce((best, day) => ((day.predictedHardness ?? 0) > (best.predictedHardness ?? 0) ? day : best), forecast.days[0]);

  if (currentState.type === 'risk' || currentState.type === 'fatigued' || currentState.type === 'recovering') {
    goals.push({
      id: 'recover-to-stable',
      title: '3 天内回到稳定区',
      summary: '先把状态分拉回 70+，再去争取更高硬度窗口。',
      currentValue: `当前 ${currentState.stateScore} 分`,
      targetValue: '70+ 分',
      progress: computeProgress(currentState.stateScore, 70),
      actions: actions.length > 0 ? actions : ['优先睡眠和恢复，不要继续叠加负荷']
    });
  }

  const highCountTarget = bestHighCount > 0
    ? clamp(Math.max(predictedHighCount + 1, Math.min(bestHighCount, 2)), 1, Math.max(2, bestHighCount))
    : 1;

  goals.push({
    id: 'hardness-window',
    title: bestHighCount > 0 ? `未来 7 天争取 ${highCountTarget} 天硬度 4+` : '未来 7 天争取出现 1 次 4.0+',
    summary: '这是一个偏积极挑战的目标，基于你的历史能力上限做轻度上探。',
    currentValue: `当前预测 ${predictedHighCount} 天`,
    targetValue: bestHighCount > 0 ? `${highCountTarget} 天` : '1 天',
    progress: highCountTarget > 0 ? clamp(Math.round((predictedHighCount / highCountTarget) * 100), 0, 100) : 0,
    actions: actions.length > 0 ? actions : ['把接下来两天的负向暴露压低', '优先睡眠和运动恢复']
  });

  if (peakDay) {
    const stretchTarget = clamp(round((peakDay.predictedHardness ?? 3.8) + 0.3), 3.8, 5);
    goals.push({
      id: 'peak-window',
      title: `${peakDay.weekday} 前把状态推到高峰窗`,
      summary: `预测高点在 ${formatMonthDay(peakDay.date)}，目标是把窗口再向上抬一档。`,
      currentValue: `当前预测 ${peakDay.predictedHardness?.toFixed(1) ?? '--'} 级`,
      targetValue: `${stretchTarget.toFixed(1)} 级`,
      progress: peakDay.predictedHardness ? clamp(Math.round((peakDay.predictedHardness / stretchTarget) * 100), 0, 100) : 0,
      actions: [
        '高峰日前 2 天优先保证完整睡眠',
        '把性负荷和饮酒压在低位',
        '把运动安排在高峰日前 2-3 天'
      ]
    });
  }

  return goals.slice(0, 3);
};

export const analyzePersonalState = (rawLogs: LogEntry[]): PersonalStateResult => {
  const logs = [...rawLogs]
    .filter((log) => log.status === 'completed' && !Number.isNaN(new Date(log.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const validHardnessSamples = logs.filter(
    (log) => log.morning?.wokeWithErection && isFieldUsable(log, 'morning.hardness') && typeof log.morning.hardness === 'number'
  ).length;
  const confidence = confidenceFromSamples(validHardnessSamples);
  const currentState = buildCurrentState(logs);
  const influencingFactors = buildImpactFactors(logs);
  const forecast = buildForecast(logs, currentState, confidence.level);
  const achievableGoals = buildGoals(logs, currentState, forecast, confidence);

  return {
    currentState: {
      type: currentState.type,
      label: currentState.label,
      stateScore: currentState.stateScore,
      hardnessBaseline: currentState.hardnessBaseline,
      trend: currentState.trend,
      reasons: currentState.reasons
    },
    influencingFactors,
    forecast,
    achievableGoals,
    confidence
  };
};
