import type { LogEntry, HardnessLevel, SleepAttire, SleepTemperature, MorningWoodRetention } from '../../../domain';

export type SmartField = 'hardness' | 'retention' | 'sleepQuality' | 'sleepAttire' | 'sleepTemperature' | 'exerciseType';

export interface SmartDefaultResult<T> {
  value: T | null;
  confidence: number;
  reason: string;
}

export interface PatternAnalysis {
  totalRecords: number;
  dayOfWeekDistribution: Map<number, number>;
  valueDistribution: Map<string, number>;
  recentTrend: 'increasing' | 'decreasing' | 'stable';
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type DayOfWeek = typeof DAYS[number];

function getDayOfWeek(dateStr: string): DayOfWeek {
  const date = new Date(dateStr);
  return DAYS[date.getDay()];
}

function isWithinLast30Days(dateStr: string): boolean {
  const date = new Date(dateStr);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return date >= thirtyDaysAgo;
}

function calculateWeightedScore(records: { value: number; date: string }[]): number {
  if (records.length === 0) return 0;

  const now = Date.now();
  let totalWeight = 0;
  let weightedSum = 0;

  for (const record of records) {
    const recordTime = new Date(record.date).getTime();
    const daysAgo = (now - recordTime) / (24 * 60 * 60 * 1000);

    const weight = Math.max(0.1, 1 - (daysAgo / 30));
    weightedSum += record.value * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

export function analyzeUserPatterns(
  logs: LogEntry[],
  field: SmartField,
  targetDayOfWeek?: DayOfWeek
): SmartDefaultResult<unknown> {
  if (!logs || logs.length === 0) {
    return { value: null, confidence: 0, reason: 'No historical data available' };
  }

  const recentLogs = logs.filter(log => isWithinLast30Days(log.date));
  if (recentLogs.length === 0) {
    return { value: null, confidence: 0, reason: 'No recent data (last 30 days)' };
  }

  const dayFilteredLogs = targetDayOfWeek
    ? recentLogs.filter(log => getDayOfWeek(log.date) === targetDayOfWeek)
    : recentLogs;

  if (dayFilteredLogs.length < 3) {
    return { value: null, confidence: 0, reason: `Insufficient data for ${targetDayOfWeek || 'this period'}` };
  }

  switch (field) {
    case 'hardness':
      return analyzeHardness(dayFilteredLogs, targetDayOfWeek);
    case 'retention':
      return analyzeRetention(dayFilteredLogs, targetDayOfWeek);
    case 'sleepQuality':
      return analyzeSleepQuality(dayFilteredLogs, targetDayOfWeek);
    case 'sleepAttire':
      return analyzeSleepAttire(dayFilteredLogs, targetDayOfWeek);
    case 'sleepTemperature':
      return analyzeSleepTemperature(dayFilteredLogs, targetDayOfWeek);
    case 'exerciseType':
      return analyzeExerciseType(dayFilteredLogs, targetDayOfWeek);
    default:
      return { value: null, confidence: 0, reason: 'Unknown field type' };
  }
}

function analyzeHardness(logs: LogEntry[], dayOfWeek?: string): SmartDefaultResult<HardnessLevel> {
  const values: { value: number; date: string }[] = [];

  for (const log of logs) {
    if (log.morning?.hardness) {
      values.push({ value: log.morning.hardness, date: log.date });
    }
  }

  if (values.length < 3) {
    return { value: null, confidence: 0, reason: 'Insufficient hardness data' };
  }

  const distribution = new Map<number, number>();
  for (const v of values) {
    distribution.set(v.value, (distribution.get(v.value) || 0) + 1);
  }

  let mostFrequent: number | null = null;
  let maxCount = 0;
  for (const [val, count] of distribution) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = val;
    }
  }

  const weightedScore = calculateWeightedScore(values);
  const finalValue = (weightedScore > 0 ? weightedScore : mostFrequent) as HardnessLevel;
  const confidence = Math.min(0.9, values.length / 10);

  return {
    value: finalValue,
    confidence,
    reason: `Based on ${values.length} records${dayOfWeek ? ` for ${dayOfWeek}` : ''} (most frequent: ${mostFrequent}, weighted: ${weightedScore})`
  };
}

function analyzeRetention(logs: LogEntry[], dayOfWeek?: string): SmartDefaultResult<MorningWoodRetention> {
  const values: MorningWoodRetention[] = [];

  for (const log of logs) {
    if (log.morning?.retention) {
      values.push(log.morning.retention);
    }
  }

  if (values.length < 3) {
    return { value: null, confidence: 0, reason: 'Insufficient retention data' };
  }

  const distribution = new Map<MorningWoodRetention, number>();
  for (const v of values) {
    distribution.set(v, (distribution.get(v) || 0) + 1);
  }

  let mostFrequent: MorningWoodRetention | null = null;
  let maxCount = 0;
  for (const [val, count] of distribution) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = val;
    }
  }

  const confidence = Math.min(0.85, values.length / 8);

  return {
    value: mostFrequent,
    confidence,
    reason: `Based on ${values.length} retention records${dayOfWeek ? ` for ${dayOfWeek}` : ''} (mode: ${mostFrequent})`
  };
}

function analyzeSleepQuality(logs: LogEntry[], dayOfWeek?: string): SmartDefaultResult<number> {
  const values: { value: number; date: string }[] = [];

  for (const log of logs) {
    if (log.sleep?.quality && log.sleep.quality > 0) {
      values.push({ value: log.sleep.quality, date: log.date });
    }
  }

  if (values.length < 3) {
    return { value: null, confidence: 0, reason: 'Insufficient sleep quality data' };
  }

  const weightedScore = calculateWeightedScore(values);
  const confidence = Math.min(0.8, values.length / 12);

  return {
    value: weightedScore,
    confidence,
    reason: `Based on ${values.length} sleep records${dayOfWeek ? ` for ${dayOfWeek}` : ''} (weighted avg: ${weightedScore})`
  };
}

function analyzeSleepAttire(logs: LogEntry[], dayOfWeek?: string): SmartDefaultResult<SleepAttire> {
  const values: SleepAttire[] = [];

  for (const log of logs) {
    if (log.sleep?.attire) {
      values.push(log.sleep.attire);
    }
  }

  if (values.length < 3) {
    return { value: null, confidence: 0, reason: 'Insufficient sleep attire data' };
  }

  const distribution = new Map<SleepAttire, number>();
  for (const v of values) {
    distribution.set(v, (distribution.get(v) || 0) + 1);
  }

  let mostFrequent: SleepAttire | null = null;
  let maxCount = 0;
  for (const [val, count] of distribution) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = val;
    }
  }

  const confidence = Math.min(0.75, values.length / 8);

  return {
    value: mostFrequent,
    confidence,
    reason: `Based on ${values.length} attire records${dayOfWeek ? ` for ${dayOfWeek}` : ''} (mode: ${mostFrequent})`
  };
}

function analyzeSleepTemperature(logs: LogEntry[], dayOfWeek?: string): SmartDefaultResult<SleepTemperature> {
  const values: SleepTemperature[] = [];

  for (const log of logs) {
    if (log.sleep?.environment?.temperature) {
      values.push(log.sleep.environment.temperature);
    }
  }

  if (values.length < 3) {
    return { value: null, confidence: 0, reason: 'Insufficient temperature data' };
  }

  const distribution = new Map<SleepTemperature, number>();
  for (const v of values) {
    distribution.set(v, (distribution.get(v) || 0) + 1);
  }

  let mostFrequent: SleepTemperature | null = null;
  let maxCount = 0;
  for (const [val, count] of distribution) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = val;
    }
  }

  const confidence = Math.min(0.75, values.length / 8);

  return {
    value: mostFrequent,
    confidence,
    reason: `Based on ${values.length} temperature records${dayOfWeek ? ` for ${dayOfWeek}` : ''} (mode: ${mostFrequent})`
  };
}

function analyzeExerciseType(logs: LogEntry[], dayOfWeek?: string): SmartDefaultResult<string> {
  const values: string[] = [];

  for (const log of logs) {
    if (log.exercise && log.exercise.length > 0) {
      for (const ex of log.exercise) {
        if (ex.type) {
          values.push(ex.type);
        }
      }
    }
  }

  if (values.length < 3) {
    return { value: null, confidence: 0, reason: 'Insufficient exercise data' };
  }

  const distribution = new Map<string, number>();
  for (const v of values) {
    distribution.set(v, (distribution.get(v) || 0) + 1);
  }

  let mostFrequent: string | null = null;
  let maxCount = 0;
  for (const [val, count] of distribution) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = val;
    }
  }

  const confidence = Math.min(0.7, values.length / 15);

  return {
    value: mostFrequent,
    confidence,
    reason: `Based on ${values.length} exercise records${dayOfWeek ? ` for ${dayOfWeek}` : ''} (most frequent: ${mostFrequent})`
  };
}

export function getSmartDefaultsForDate(
  logs: LogEntry[],
  dateStr: string
): Record<SmartField, SmartDefaultResult<unknown>> {
  const dayOfWeek = getDayOfWeek(dateStr);

  return {
    hardness: analyzeUserPatterns(logs, 'hardness', dayOfWeek),
    retention: analyzeUserPatterns(logs, 'retention', dayOfWeek),
    sleepQuality: analyzeUserPatterns(logs, 'sleepQuality', dayOfWeek),
    sleepAttire: analyzeUserPatterns(logs, 'sleepAttire', dayOfWeek),
    sleepTemperature: analyzeUserPatterns(logs, 'sleepTemperature', dayOfWeek),
    exerciseType: analyzeUserPatterns(logs, 'exerciseType', dayOfWeek),
  };
}
