import type {
  LogEntry,
  MenstrualStatus,
  ScreenTimeRecord,
  SupplementRecord
} from '../../../domain';
import { analyzeSleep, calculateDataQuality } from '../../../shared/lib';

export type TodayTileKey =
  | 'date'
  | 'sleep'
  | 'health'
  | 'sexual'
  | 'exercise'
  | 'menstrual'
  | 'rest'
  | 'healthScore'
  | 'overall';

export type HeatmapMetric = 'healthScore' | 'hardness' | 'sleep' | 'exercise' | 'sexLoad' | 'dataQuality';

export interface TileDetail {
  label: string;
  value: string;
}

export interface TodayTile {
  key: TodayTileKey;
  label: string;
  value: string;
  status: string;
  tone: 'blue' | 'emerald' | 'amber' | 'pink' | 'violet' | 'slate';
  details: TileDetail[];
}

export interface HealthScoreBreakdown {
  score: number | null;
  completeness: number;
  overall: number | null;
  grade: string;
  contributors: Array<{ label: string; score: number; weight: number }>;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number) => Math.round(value);

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatMinutes = (minutes?: number | null): string => {
  if (!minutes || minutes <= 0) return '未记录';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest}分`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h${rest}`;
};

export const getMenstrualStatusLabel = (status?: MenstrualStatus | null): string => {
  switch (status) {
    case 'none':
      return '非经期';
    case 'period':
      return '经期中';
    case 'fertile_window':
      return '窗口期';
    default:
      return '未记录';
  }
};

export const getTakenSupplements = (supplements?: SupplementRecord[]): SupplementRecord[] => (
  Array.isArray(supplements) ? supplements.filter((item) => item.taken && item.name.trim().length > 0) : []
);

export const getScreenTimeSummary = (screenTime?: ScreenTimeRecord | null): string => (
  screenTime && screenTime.totalMinutes > 0 ? formatMinutes(screenTime.totalMinutes) : '未记录'
);

export const calculateSexLoad = (log: LogEntry): number => (
  (log.sex || []).reduce((sum, item) => sum + 1.5 + (item.ejaculation ? 0.5 : 0), 0) +
  (log.masturbation || []).length
);

const scoreSleep = (log: LogEntry): number | null => {
  const analysis = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
  const quality = log.sleep?.quality;

  if (!analysis && !quality) return null;

  let score = 70;
  if (analysis) {
    const durationTarget = 8;
    const durationPenalty = Math.abs(analysis.durationHours - durationTarget) * 12;
    score = 100 - durationPenalty;
    if (analysis.isLate) score -= 12;
    if (analysis.isInsufficient) score -= 15;
    if (analysis.isExcessive) score -= 8;
  }

  if (quality) {
    score = (score * 0.55) + (((quality / 5) * 100) * 0.45);
  }

  return clamp(round(score), 0, 100);
};

const scoreExercise = (log: LogEntry): number | null => {
  const totalMinutes = (log.exercise || []).reduce((sum, item) => sum + (item.duration || 0), 0);
  const totalSteps = (log.exercise || []).reduce((sum, item) => sum + (item.steps || 0), 0);

  if (totalMinutes <= 0 && totalSteps <= 0) return null;

  const minuteScore = clamp((totalMinutes / 45) * 100, 0, 100);
  const stepScore = totalSteps > 0 ? clamp((totalSteps / 8000) * 100, 0, 100) : minuteScore;
  return round((minuteScore * 0.75) + (stepScore * 0.25));
};

const scoreStressHealth = (log: LogEntry): number | null => {
  const hasStress = typeof log.stressLevel === 'number' && log.stressLevel > 0;
  const hasHealth = !!log.health?.isSick || (log.health?.symptoms?.length || 0) > 0;

  if (!hasStress && !hasHealth) return null;

  const stressScore = hasStress ? clamp(100 - (((log.stressLevel || 1) - 1) * 22), 10, 100) : 100;
  let healthScore = 100;
  if (log.health?.isSick) {
    healthScore = log.health.discomfortLevel === 'severe' ? 20 : log.health.discomfortLevel === 'moderate' ? 45 : 65;
  }

  return round((stressScore * 0.55) + (healthScore * 0.45));
};

const scoreLifestyle = (log: LogEntry): number | null => {
  const alcoholGrams = (log.alcoholRecords || []).reduce((sum, item) => sum + item.totalGrams, 0);
  const sexLoad = calculateSexLoad(log);
  const hasLifestyle = alcoholGrams > 0 || sexLoad > 0;

  if (!hasLifestyle) return null;

  const alcoholScore = alcoholGrams <= 0 ? 100 : clamp(100 - (alcoholGrams * 1.2), 10, 100);
  const loadScore = sexLoad <= 0 ? 100 : clamp(100 - (Math.max(0, sexLoad - 1) * 18), 25, 100);
  return round((alcoholScore * 0.65) + (loadScore * 0.35));
};

const scoreScreenTime = (log: LogEntry): number | null => {
  const totalMinutes = log.screenTime?.totalMinutes;
  if (!totalMinutes || totalMinutes <= 0) return null;
  return round(clamp(100 - ((Math.max(0, totalMinutes - 120) / 240) * 100), 10, 100));
};

export const calculateHealthScore = (log: LogEntry): HealthScoreBreakdown => {
  const contributors: Array<{ label: string; score: number; weight: number }> = [];
  const sleep = scoreSleep(log);
  const exercise = scoreExercise(log);
  const stressHealth = scoreStressHealth(log);
  const lifestyle = scoreLifestyle(log);
  const screenTime = scoreScreenTime(log);

  if (sleep !== null) contributors.push({ label: '睡眠', score: sleep, weight: 35 });
  if (exercise !== null) contributors.push({ label: '运动', score: exercise, weight: 25 });
  if (stressHealth !== null) contributors.push({ label: '压力/身体', score: stressHealth, weight: 20 });
  if (lifestyle !== null) contributors.push({ label: '酒精/性负荷', score: lifestyle, weight: 10 });
  if (screenTime !== null) contributors.push({ label: '屏幕时间', score: screenTime, weight: 10 });

  const completeness = calculateDataQuality(log);
  if (contributors.length === 0) {
    return { score: null, completeness, overall: null, grade: '--', contributors: [] };
  }

  const totalWeight = contributors.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore = contributors.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
  const score = round(weightedScore);
  const overall = round((score * 0.8) + (completeness * 0.2));
  const grade = overall >= 85 ? 'A' : overall >= 70 ? 'B' : overall >= 55 ? 'C' : 'D';

  return {
    score,
    completeness,
    overall,
    grade,
    contributors
  };
};

export const buildTodayTiles = (log: LogEntry): TodayTile[] => {
  const sleepAnalysis = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
  const napMinutes = (log.sleep?.naps || []).reduce((sum, item) => sum + (item.duration || 0), 0);
  const exerciseMinutes = (log.exercise || []).reduce((sum, item) => sum + (item.duration || 0), 0);
  const steps = (log.exercise || []).reduce((sum, item) => sum + (item.steps || 0), 0);
  const supplements = getTakenSupplements(log.supplements);
  const score = calculateHealthScore(log);
  const sexLoad = calculateSexLoad(log);

  return [
    {
      key: 'date',
      label: '日期',
      value: new Date(`${log.date}T00:00:00`).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      status: new Date(`${log.date}T00:00:00`).toLocaleDateString('zh-CN', { weekday: 'long' }),
      tone: 'slate',
      details: [
        { label: '记录状态', value: log.status === 'pending' ? '进行中' : '已归档' },
        { label: '完整度', value: `${score.completeness}%` }
      ]
    },
    {
      key: 'sleep',
      label: '睡眠',
      value: sleepAnalysis ? `${sleepAnalysis.durationHours.toFixed(1)}h` : '未记录',
      status: log.sleep?.quality ? `质量${log.sleep.quality}/5` : (napMinutes > 0 ? `午休${napMinutes}分` : '未记录'),
      tone: 'blue',
      details: [
        { label: '夜间睡眠', value: sleepAnalysis ? `${sleepAnalysis.durationHours.toFixed(1)}小时` : '未记录' },
        { label: '午休', value: napMinutes > 0 ? `${napMinutes}分钟` : '无' },
        { label: '睡眠质量', value: log.sleep?.quality ? `${log.sleep.quality}/5` : '未记录' }
      ]
    },
    {
      key: 'health',
      label: '生病/补剂',
      value: log.health?.isSick ? '不适' : '健康',
      status: supplements.length > 0 ? `补剂${supplements.length}项` : '无补剂',
      tone: 'amber',
      details: [
        { label: '身体状态', value: log.health?.isSick ? '身体不适' : '无明显不适' },
        { label: '症状', value: (log.health?.symptoms || []).length > 0 ? (log.health?.symptoms || []).join('、') : '无' },
        { label: '补剂', value: supplements.length > 0 ? supplements.map((item) => item.name).join('、') : '无' }
      ]
    },
    {
      key: 'sexual',
      label: '自慰/性爱',
      value: `${log.masturbation.length}/${log.sex.length}`,
      status: sexLoad > 0 ? `负荷${sexLoad.toFixed(1)}` : '无记录',
      tone: 'pink',
      details: [
        { label: '自慰', value: `${log.masturbation.length}次` },
        { label: '性爱', value: `${log.sex.length}次` },
        { label: '性负荷', value: sexLoad > 0 ? sexLoad.toFixed(1) : '未记录' }
      ]
    },
    {
      key: 'exercise',
      label: '锻炼',
      value: exerciseMinutes > 0 ? `${exerciseMinutes}分` : '未记录',
      status: steps > 0 ? `${steps}步` : `${log.exercise.length}次`,
      tone: 'emerald',
      details: [
        { label: '运动次数', value: `${log.exercise.length}次` },
        { label: '总时长', value: exerciseMinutes > 0 ? `${exerciseMinutes}分钟` : '未记录' },
        { label: '步数', value: steps > 0 ? `${steps}步` : '未记录' }
      ]
    },
    {
      key: 'menstrual',
      label: '经期',
      value: getMenstrualStatusLabel(log.menstrual?.status),
      status: log.menstrual?.notes?.trim() ? '有备注' : '手动状态',
      tone: 'violet',
      details: [
        { label: '周期状态', value: getMenstrualStatusLabel(log.menstrual?.status) },
        { label: '备注', value: log.menstrual?.notes?.trim() || '无' }
      ]
    },
    {
      key: 'rest',
      label: '高效休息',
      value: napMinutes > 0 ? `${napMinutes}分` : (sleepAnalysis && !sleepAnalysis.isLate ? '正常' : '待改善'),
      status: sleepAnalysis?.isLate ? '熬夜' : (sleepAnalysis?.isInsufficient ? '不足' : '平稳'),
      tone: 'slate',
      details: [
        { label: '午休', value: napMinutes > 0 ? `${napMinutes}分钟` : '无' },
        { label: '入睡节律', value: sleepAnalysis?.isLate ? '偏晚' : '正常' },
        { label: '恢复状态', value: sleepAnalysis?.isInsufficient ? '睡眠不足' : '尚可' }
      ]
    },
    {
      key: 'healthScore',
      label: '健康分数',
      value: score.score !== null ? `${score.score}` : '--',
      status: score.contributors.length > 0 ? `${score.contributors.length}项参与` : '数据不足',
      tone: 'emerald',
      details: score.contributors.length > 0
        ? score.contributors.map((item) => ({ label: item.label, value: `${item.score}` }))
        : [{ label: '状态', value: '记录不足，暂不评分' }]
    },
    {
      key: 'overall',
      label: '总分',
      value: score.grade,
      status: score.overall !== null ? `${score.overall} / 完整度${score.completeness}%` : '未形成评估',
      tone: 'amber',
      details: [
        { label: '综合得分', value: score.overall !== null ? `${score.overall}` : '--' },
        { label: '健康分', value: score.score !== null ? `${score.score}` : '--' },
        { label: '数据完整度', value: `${score.completeness}%` }
      ]
    }
  ];
};

export interface WeekDaySummary {
  date: string;
  weekday: string;
  sleepHours: number | null;
  exerciseMinutes: number;
  screenMinutes: number | null;
  sexLoad: number;
  healthScore: number | null;
}

export const buildWeekSummary = (logs: LogEntry[]): WeekDaySummary[] => {
  const logsMap = new Map(logs.map((log) => [log.date, log]));
  const days: WeekDaySummary[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const dateStr = toDateKey(date);
    const log = logsMap.get(dateStr);
    const sleepAnalysis = log ? analyzeSleep(log.sleep?.startTime, log.sleep?.endTime) : null;
    const healthScore = log ? calculateHealthScore(log).score : null;

    days.push({
      date: dateStr,
      weekday: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      sleepHours: sleepAnalysis ? Number(sleepAnalysis.durationHours.toFixed(1)) : null,
      exerciseMinutes: log ? (log.exercise || []).reduce((sum, item) => sum + (item.duration || 0), 0) : 0,
      screenMinutes: log?.screenTime?.totalMinutes || null,
      sexLoad: log ? calculateSexLoad(log) : 0,
      healthScore
    });
  }

  return days;
};

export const getHeatmapMetricValue = (log: LogEntry | undefined, metric: HeatmapMetric): number | null => {
  if (!log) return null;

  switch (metric) {
    case 'healthScore':
      return calculateHealthScore(log).score;
    case 'hardness':
      return log.morning?.wokeWithErection && typeof log.morning.hardness === 'number' ? log.morning.hardness : null;
    case 'sleep': {
      const analysis = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
      return analysis ? Number(analysis.durationHours.toFixed(1)) : null;
    }
    case 'exercise':
      return (log.exercise || []).reduce((sum, item) => sum + (item.duration || 0), 0) || null;
    case 'sexLoad': {
      const load = calculateSexLoad(log);
      return load > 0 ? Number(load.toFixed(1)) : null;
    }
    case 'dataQuality':
      return calculateDataQuality(log);
    default:
      return null;
  }
};
