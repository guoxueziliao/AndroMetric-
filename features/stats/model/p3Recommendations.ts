import type { UnifiedEvent } from '../../../domain';
import { getConfidenceLevel, type ConfidenceLevel } from './p3Scoring';

export interface P3Recommendation {
  domain: 'sex' | 'masturbation';
  type: 'tag' | 'tool' | 'position' | 'toy' | 'costume';
  value: string;
  score: number;
  reason: string;
  sampleSize: number;
  confidence: ConfidenceLevel;
}

const RECENT_WINDOW = 30 * 24 * 60 * 60 * 1000;

const parsePrefixedTag = (tag: string, prefix: string) => (
  tag.startsWith(prefix) ? tag.slice(prefix.length) : null
);

const getScoredEvents = (events: UnifiedEvent[], type: 'sex' | 'masturbation') => (
  events
    .filter((event) => event.type === type && typeof event.metrics.score === 'number')
    .sort((a, b) => a.timestamp - b.timestamp)
);

const buildReason = (averageScore: number, averageFatigue: number, count: number) => {
  if (averageScore >= 80 && averageFatigue < 40) return '高质量且低疲劳';
  if (averageScore >= 80) return '体验质量高';
  if (averageFatigue < 40 && count >= 3) return '更稳且不透支';
  return '高频偏好';
};

const buildRecommendationScore = (averageScore: number, averageFatigue: number, count: number, lastUsed: number) => {
  const recentBonus = Date.now() - lastUsed < RECENT_WINDOW ? 6 : 0;
  return Math.round((averageScore * 0.7) + ((100 - averageFatigue) * 0.15) + (count * 4) + recentBonus);
};

const rankPrefixedTags = (
  events: UnifiedEvent[],
  prefix: string,
  type: P3Recommendation['type'],
  domain: P3Recommendation['domain']
) => {
  if (events.length < 5) return [];

  const stats: Record<string, { count: number; scoreSum: number; fatigueSum: number; lastUsed: number }> = {};

  events.forEach((event) => {
    const eventScore = event.metrics.score || 0;
    const fatigueCost = event.metrics.fatigueCost || 0;

    event.tags
      .map((tag) => parsePrefixedTag(tag, prefix))
      .filter((value): value is string => Boolean(value))
      .forEach((value) => {
        if (!stats[value]) {
          stats[value] = { count: 0, scoreSum: 0, fatigueSum: 0, lastUsed: 0 };
        }

        stats[value].count += 1;
        stats[value].scoreSum += eventScore;
        stats[value].fatigueSum += fatigueCost;
        stats[value].lastUsed = Math.max(stats[value].lastUsed, event.timestamp);
      });
  });

  return Object.entries(stats)
    .filter(([, entry]) => entry.count >= 2)
    .map(([value, entry]) => {
      const averageScore = entry.scoreSum / entry.count;
      const averageFatigue = entry.fatigueSum / entry.count;
      return {
        domain,
        type,
        value,
        score: buildRecommendationScore(averageScore, averageFatigue, entry.count, entry.lastUsed),
        reason: buildReason(averageScore, averageFatigue, entry.count),
        sampleSize: entry.count,
        confidence: getConfidenceLevel(events.length)
      } satisfies P3Recommendation;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

export const getMasturbationRecommendationsFromEvents = (events: UnifiedEvent[]) => {
  const domainEvents = getScoredEvents(events, 'masturbation');
  return [
    ...rankPrefixedTags(domainEvents, 'tag:', 'tag', 'masturbation'),
    ...rankPrefixedTags(domainEvents, 'tool:', 'tool', 'masturbation')
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

export const getSexRecommendationsFromEvents = (events: UnifiedEvent[], currentPartner?: string) => {
  const domainEvents = getScoredEvents(events, 'sex').filter((event) => (
    !currentPartner || event.tags.includes(`partner:${currentPartner}`)
  ));

  return [
    ...rankPrefixedTags(domainEvents, 'position:', 'position', 'sex'),
    ...rankPrefixedTags(domainEvents, 'toy:', 'toy', 'sex'),
    ...rankPrefixedTags(domainEvents, 'costume:', 'costume', 'sex')
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};
