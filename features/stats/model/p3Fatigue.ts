import type { UnifiedEvent } from '../../../domain';
import { formatTimeBucketLabel, getConfidenceLevel, type ConfidenceLevel, type TimeBucket } from './p3Scoring';

export type P3FatigueDomain = 'sex' | 'masturbation';
export type P3CurrentState = 'rest' | 'light_intimacy' | 'normal';

export interface P3FatigueSummary {
  domain: P3FatigueDomain;
  sampleSize: number;
  confidence: ConfidenceLevel;
  currentState: P3CurrentState;
  currentStateLabel: string;
  averageScore: number | null;
  averageFatigue: number | null;
  highFatigueDrivers: string[];
  sustainablePatterns: string[];
  lines: [string, string, string];
  insufficient: boolean;
}

const DRIVER_LABELS: Record<string, string> = {
  sleep_insufficient: '睡眠不足',
  high_stress: '高压状态',
  alcohol: '饮酒后',
  sick: '身体不适',
  late_night: '深夜时段',
  long_duration: '持续时间过长',
  high_intensity_exercise: '高强度运动后',
  low_energy: '精力偏低',
  post_fatigue: '事后疲劳明显',
  edging_without_ejaculation: '多次 edging 未射精'
};

const getStateFromFatigue = (score: number): P3CurrentState => {
  if (score >= 70) return 'rest';
  if (score >= 40) return 'light_intimacy';
  return 'normal';
};

const getStateLabel = (state: P3CurrentState) => {
  switch (state) {
    case 'rest':
      return '休息';
    case 'light_intimacy':
      return '轻量亲密';
    case 'normal':
      return '正常性生活';
  }
};

const getScoredDomainEvents = (events: UnifiedEvent[], domain: P3FatigueDomain) => (
  events
    .filter((event) => event.type === domain && typeof event.metrics.score === 'number' && typeof event.metrics.fatigueCost === 'number')
    .sort((a, b) => a.timestamp - b.timestamp)
);

const getDriverCounts = (events: UnifiedEvent[]) => {
  const counts: Record<string, number> = {};

  events.forEach((event) => {
    event.tags
      .filter((tag) => tag.startsWith('driver:'))
      .forEach((tag) => {
        const key = tag.slice('driver:'.length);
        counts[key] = (counts[key] || 0) + 1;
      });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => DRIVER_LABELS[key] || key);
};

const getTimeBucketLabel = (tags: string[]) => {
  const raw = tags.find((tag) => tag.startsWith('time_bucket:'))?.slice('time_bucket:'.length) as TimeBucket | undefined;
  return raw ? formatTimeBucketLabel(raw) : '该时段';
};

const getSustainablePatterns = (events: UnifiedEvent[]) => {
  const lowFatigueHighScore = events.filter((event) => (event.metrics.score || 0) >= 70 && (event.metrics.fatigueCost || 0) < 40);
  if (lowFatigueHighScore.length === 0) return [];

  const byBucket: Record<string, number> = {};
  lowFatigueHighScore.forEach((event) => {
    const label = getTimeBucketLabel(event.tags);
    byBucket[label] = (byBucket[label] || 0) + 1;
  });

  return Object.entries(byBucket)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label, count]) => `${label} 更稳 (${count}次)`);
};

export const getFatigueSummaryFromEvents = (events: UnifiedEvent[], domain: P3FatigueDomain): P3FatigueSummary => {
  const domainEvents = getScoredDomainEvents(events, domain);
  const sampleSize = domainEvents.length;
  const confidence = getConfidenceLevel(sampleSize);
  const insufficient = sampleSize < 6;

  if (insufficient) {
    return {
      domain,
      sampleSize,
      confidence,
      currentState: 'light_intimacy',
      currentStateLabel: '样本不足',
      averageScore: null,
      averageFatigue: null,
      highFatigueDrivers: [],
      sustainablePatterns: [],
      lines: [
        '哪些情况下更容易做完更累：样本不足，暂不生成结论',
        '哪些情况下更满足且不透支：样本不足，暂不生成结论',
        '当前更适合：样本不足，暂不生成结论'
      ],
      insufficient
    };
  }

  const recentEvents = [...domainEvents].slice(-3);
  const currentFatigue = recentEvents.reduce((sum, event) => sum + (event.metrics.fatigueCost || 0), 0) / recentEvents.length;
  const currentState = getStateFromFatigue(currentFatigue);
  const currentStateLabel = getStateLabel(currentState);
  const highFatigueDrivers = getDriverCounts(domainEvents.filter((event) => (event.metrics.fatigueCost || 0) >= 40));
  const sustainablePatterns = getSustainablePatterns(domainEvents);
  const averageScore = domainEvents.reduce((sum, event) => sum + (event.metrics.score || 0), 0) / domainEvents.length;
  const averageFatigue = domainEvents.reduce((sum, event) => sum + (event.metrics.fatigueCost || 0), 0) / domainEvents.length;

  return {
    domain,
    sampleSize,
    confidence,
    currentState,
    currentStateLabel,
    averageScore: Math.round(averageScore * 10) / 10,
    averageFatigue: Math.round(averageFatigue * 10) / 10,
    highFatigueDrivers,
    sustainablePatterns,
    lines: [
      `哪些情况下更容易做完更累：${highFatigueDrivers.length > 0 ? highFatigueDrivers.join('、') : '未发现稳定高疲劳诱因'}`,
      `哪些情况下更满足且不透支：${sustainablePatterns.length > 0 ? sustainablePatterns.join('、') : '暂未发现稳定低疲劳高质量模式'}`,
      `当前更适合：${currentStateLabel}`
    ],
    insufficient
  };
};
