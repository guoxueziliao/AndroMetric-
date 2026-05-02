import type { LogEntry } from '../../../domain';
import { calculateHealthScore } from '../../dashboard/model/p1Summary';
import { isFieldUsable } from '../../../utils/dataQuality';
import type {
  AvailabilityState,
  MetricAvailabilityPoint,
  MetricAvailabilitySeries,
  MetricAvailabilitySummary,
  SimulationMetricId
} from './types';

const summarize = (points: MetricAvailabilityPoint[]): MetricAvailabilitySummary => {
  const usableDays = points.filter((point) => point.state === 'usable').length;
  const noneDays = points.filter((point) => point.state === 'none').length;
  const missingDays = points.filter((point) => point.state === 'missing').length;
  const unknownDays = points.filter((point) => point.state === 'unknown').length;
  const total = Math.max(1, points.length);

  return {
    usableDays,
    noneDays,
    missingDays,
    unknownDays,
    usableRate: Math.round((usableDays / total) * 1000) / 1000
  };
};

const stateFromPath = (log: LogEntry, path: string): AvailabilityState => {
  const quality = log.dataQuality?.fields?.[path]?.state;
  if (quality === 'none') return 'none';
  if (quality === 'unknown') return 'unknown';
  if (quality === 'recorded' || quality === 'inferred') return 'usable';
  return 'missing';
};

const buildPoint = (date: string, state: AvailabilityState, value: number | null): MetricAvailabilityPoint => ({
  date,
  state,
  value
});

const availabilityForMetric = (metricId: SimulationMetricId, log: LogEntry): MetricAvailabilityPoint => {
  switch (metricId) {
    case 'hardness': {
      const state = stateFromPath(log, 'morning.hardness');
      return buildPoint(log.date, state, state === 'usable' ? log.morning?.hardness ?? null : null);
    }
    case 'sleep': {
      const startState = stateFromPath(log, 'sleep.startTime');
      const endState = stateFromPath(log, 'sleep.endTime');
      const state = startState === 'unknown' || endState === 'unknown'
        ? 'unknown'
        : startState === 'usable' && endState === 'usable'
          ? 'usable'
          : startState === 'none' || endState === 'none'
            ? 'none'
            : 'missing';
      const value = state === 'usable' && isFieldUsable(log, 'sleep.startTime') && isFieldUsable(log, 'sleep.endTime') && log.sleep?.startTime && log.sleep?.endTime
        ? ((new Date(log.sleep.endTime).getTime() - new Date(log.sleep.startTime).getTime()) / (1000 * 60 * 60))
        : null;
      return buildPoint(log.date, state, value !== null ? Math.round(value * 10) / 10 : null);
    }
    case 'alcohol': {
      const state = stateFromPath(log, 'alcoholRecords');
      const value = state === 'usable' ? log.alcoholRecords.reduce((sum, item) => sum + item.totalGrams, 0) : state === 'none' ? 0 : null;
      return buildPoint(log.date, state, value);
    }
    case 'exercise': {
      const state = stateFromPath(log, 'exercise');
      const value = state === 'usable' ? log.exercise.reduce((sum, item) => sum + (item.duration || 0), 0) : state === 'none' ? 0 : null;
      return buildPoint(log.date, state, value);
    }
    case 'masturbation': {
      const state = stateFromPath(log, 'masturbation');
      const value = state === 'usable' ? log.masturbation.length : state === 'none' ? 0 : null;
      return buildPoint(log.date, state, value);
    }
    case 'sexLoad': {
      const sexState = stateFromPath(log, 'sex');
      const mbState = stateFromPath(log, 'masturbation');
      const state = sexState === 'usable' || mbState === 'usable'
        ? 'usable'
        : sexState === 'none' && mbState === 'none'
          ? 'none'
          : sexState === 'unknown' || mbState === 'unknown'
            ? 'unknown'
            : 'missing';
      const value = state === 'usable'
        ? (log.sex.reduce((sum, item) => sum + 1.5 + (item.ejaculation ? 0.5 : 0), 0) + log.masturbation.length)
        : state === 'none'
          ? 0
          : null;
      return buildPoint(log.date, state, value);
    }
    case 'screenTime': {
      const state = stateFromPath(log, 'screenTime.totalMinutes');
      const value = state === 'usable' ? log.screenTime?.totalMinutes ?? 0 : null;
      return buildPoint(log.date, state, value);
    }
    case 'stress': {
      const state = stateFromPath(log, 'stressLevel');
      return buildPoint(log.date, state, state === 'usable' ? log.stressLevel ?? null : null);
    }
    case 'healthScore': {
      const value = calculateHealthScore(log).overall;
      const state = value === null ? 'missing' : 'usable';
      return buildPoint(log.date, state, value);
    }
    default:
      return buildPoint(log.date, 'missing', null);
  }
};

export const buildMetricAvailabilitySeries = (logs: LogEntry[]): MetricAvailabilitySeries => {
  const metrics: SimulationMetricId[] = ['hardness', 'sleep', 'alcohol', 'stress', 'exercise', 'masturbation', 'sexLoad', 'screenTime', 'healthScore'];

  return metrics.reduce((acc, metricId) => {
    acc[metricId] = logs.map((log) => availabilityForMetric(metricId, log));
    return acc;
  }, {} as MetricAvailabilitySeries);
};

export const summarizeMetricAvailability = (
  series: MetricAvailabilitySeries
): Record<SimulationMetricId, MetricAvailabilitySummary> => (
  Object.entries(series).reduce((acc, [metricId, points]) => {
    acc[metricId as SimulationMetricId] = summarize(points);
    return acc;
  }, {} as Record<SimulationMetricId, MetricAvailabilitySummary>)
);

export const averageUsableRate = (summary: Record<SimulationMetricId, MetricAvailabilitySummary>): number => {
  const values = Object.values(summary).map((item) => item.usableRate);
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
};
