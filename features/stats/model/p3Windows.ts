import type { UnifiedEvent } from '../../../domain';
import { formatTimeBucketLabel, getConfidenceLevel, type ConfidenceLevel, type TimeBucket } from './p3Scoring';

export interface P3WindowSuggestion {
  label: string;
  weekday: number;
  weekdayLabel: string;
  timeBucket: TimeBucket;
  timeLabel: string;
  averageScore: number;
  lowFatigueRate: number;
  sampleSize: number;
  confidence: ConfidenceLevel;
  compositeScore: number;
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const getTimeBucket = (tags: string[]) => {
  const raw = tags.find((tag) => tag.startsWith('time_bucket:'))?.slice('time_bucket:'.length);
  if (raw === 'late_night' || raw === 'morning' || raw === 'daytime' || raw === 'evening') return raw;
  return 'evening';
};

const getScoredEvents = (events: UnifiedEvent[], domain: 'sex' | 'masturbation') => (
  events.filter((event) => event.type === domain && typeof event.metrics.score === 'number' && typeof event.metrics.fatigueCost === 'number')
);

export const getWindowsFromEvents = (events: UnifiedEvent[], domain: 'sex' | 'masturbation') => {
  const domainEvents = getScoredEvents(events, domain);
  if (domainEvents.length < 8) return [];

  const groups: Record<string, { weekday: number; timeBucket: TimeBucket; scores: number[]; fatigue: number[]; count: number }> = {};

  domainEvents.forEach((event) => {
    const weekday = new Date(event.dateStr).getDay();
    const timeBucket = getTimeBucket(event.tags);
    const key = `${weekday}-${timeBucket}`;

    if (!groups[key]) {
      groups[key] = { weekday, timeBucket, scores: [], fatigue: [], count: 0 };
    }

    groups[key].scores.push(event.metrics.score || 0);
    groups[key].fatigue.push(event.metrics.fatigueCost || 0);
    groups[key].count += 1;
  });

  return Object.values(groups)
    .filter((group) => group.count >= 3)
    .map((group) => {
      const averageScore = group.scores.reduce((sum, value) => sum + value, 0) / group.scores.length;
      const lowFatigueRate = group.fatigue.filter((value) => value < 40).length / group.fatigue.length;
      const compositeScore = (averageScore * 0.7) + (lowFatigueRate * 100 * 0.3);

      return {
        label: `${WEEKDAY_LABELS[group.weekday]} ${formatTimeBucketLabel(group.timeBucket)}`,
        weekday: group.weekday,
        weekdayLabel: WEEKDAY_LABELS[group.weekday],
        timeBucket: group.timeBucket,
        timeLabel: formatTimeBucketLabel(group.timeBucket),
        averageScore: Math.round(averageScore * 10) / 10,
        lowFatigueRate: Math.round(lowFatigueRate * 100) / 10,
        sampleSize: group.count,
        confidence: getConfidenceLevel(group.count),
        compositeScore: Math.round(compositeScore * 10) / 10
      } satisfies P3WindowSuggestion;
    })
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3);
};
