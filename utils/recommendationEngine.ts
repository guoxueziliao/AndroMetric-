import type { LogEntry } from '../types';
import { flattenLogsToEvents } from '../features/stats/model/eventAdapter';
import {
    getMasturbationRecommendationsFromEvents,
    getSexRecommendationsFromEvents,
    type P3Recommendation
} from '../features/stats/model/p3Recommendations';

export interface Recommendation {
    type: 'tag' | 'material' | 'position' | 'toy' | 'tool' | 'costume';
    value: string;
    score: number;
    reason: string;
    confidence?: P3Recommendation['confidence'];
    sampleSize?: number;
}

const mapRecommendation = (recommendation: P3Recommendation): Recommendation => ({
    type: recommendation.type,
    value: recommendation.value,
    score: recommendation.score,
    reason: recommendation.reason,
    confidence: recommendation.confidence,
    sampleSize: recommendation.sampleSize
});

export const getMasturbationRecommendations = (logs: LogEntry[]): Recommendation[] => {
    const events = flattenLogsToEvents(Array.isArray(logs) ? logs : []);
    return getMasturbationRecommendationsFromEvents(events).map(mapRecommendation);
};

export const getSexRecommendations = (logs: LogEntry[], currentPartner?: string): Recommendation[] => {
    const events = flattenLogsToEvents(Array.isArray(logs) ? logs : []);
    return getSexRecommendationsFromEvents(events, currentPartner).map(mapRecommendation);
};
