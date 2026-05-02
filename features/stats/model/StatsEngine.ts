import type { LogEntry, UnifiedEvent } from '../../../domain';
import { flattenLogsToEvents } from './eventAdapter';
import { calculateHealthScore } from '../../dashboard/model/p1Summary';

// --- Types ---

// We map the old Metric IDs to the new Event types for compatibility
export type MetricId = 'hardness' | 'sleep' | 'alcohol' | 'stress' | 'exercise' | 'masturbation' | 'sexLoad' | 'screenTime' | 'healthScore';

export interface MetricConfig {
    id: MetricId;
    label: string;
    unit: string;
    // New: Filter function for the event stream
    filter: (e: UnifiedEvent) => boolean;
    // New: Value extractor from the event
    getValue: (e: UnifiedEvent) => number;
    // How to aggregate multiple events in one day (e.g. sum of alcohol, avg of stress)
    aggregator: 'sum' | 'avg' | 'max' | 'count';
    
    highThreshold?: number; 
    impactShift: number; 
}

export interface DataPoint {
    date: string; // YYYY-MM-DD
    value: number;
    timestamp: number;
}

// --- Metric Registry (Normalized) ---

export const METRICS: Record<MetricId, MetricConfig> = {
    hardness: {
        id: 'hardness',
        label: '晨勃硬度',
        unit: '级',
        filter: e => e.type === 'morning_wood',
        getValue: e => e.metrics.value || 0,
        aggregator: 'max', // Should be only one per day, but max is safe
        impactShift: 0 
    },
    sleep: {
        id: 'sleep',
        label: '睡眠时长',
        unit: 'h',
        filter: e => e.type === 'sleep',
        getValue: e => e.metrics.duration || 0,
        aggregator: 'sum', // Naps + Main Sleep
        highThreshold: 7, 
        impactShift: 0 
    },
    alcohol: {
        id: 'alcohol',
        label: '饮酒量',
        unit: 'g',
        filter: e => e.type === 'alcohol',
        getValue: e => e.metrics.amount || 0,
        aggregator: 'sum',
        highThreshold: 20,
        impactShift: 1 
    },
    stress: {
        id: 'stress',
        label: '压力等级',
        unit: 'Lv',
        filter: e => e.type === 'stress',
        getValue: e => e.metrics.value || 0,
        aggregator: 'max',
        highThreshold: 3,
        impactShift: 1 
    },
    exercise: {
        id: 'exercise',
        label: '运动时长',
        unit: 'min',
        filter: e => e.type === 'exercise',
        getValue: e => e.metrics.duration || 0,
        aggregator: 'sum',
        highThreshold: 30,
        impactShift: 1 
    },
    masturbation: {
        id: 'masturbation',
        label: '自慰次数',
        unit: '次',
        filter: e => e.type === 'masturbation',
        getValue: () => 1, // Just counting events
        aggregator: 'count',
        highThreshold: 1,
        impactShift: 1
    },
    sexLoad: {
        id: 'sexLoad',
        label: '性负荷',
        unit: 'Load',
        filter: e => e.type === 'sex' || e.type === 'masturbation',
        getValue: e => {
            if (e.type === 'sex') return 1.5 + ((e.flags.ejaculation ? 0.5 : 0));
            if (e.type === 'masturbation') return 1.0;
            return 0;
        },
        aggregator: 'sum',
        highThreshold: 1.5,
        impactShift: 1
    },
    screenTime: {
        id: 'screenTime',
        label: '屏幕时间',
        unit: 'h',
        filter: e => e.type === 'screen_time',
        getValue: e => e.metrics.duration || 0,
        aggregator: 'max',
        highThreshold: 4,
        impactShift: 0
    },
    healthScore: {
        id: 'healthScore',
        label: '健康分',
        unit: '分',
        filter: () => false,
        getValue: () => 0,
        aggregator: 'max',
        highThreshold: 75,
        impactShift: 0
    }
};

// --- The Engine (Refactored) ---

export class StatsEngine {
    private events: UnifiedEvent[];
    private dateMap: Map<string, UnifiedEvent[]>; // Date -> Events[]
    private sortedDates: string[];
    private logMap: Map<string, LogEntry>;

    constructor(logs: LogEntry[]) {
        // 1. Adapter Step: Convert legacy logs to normalized events
        this.events = flattenLogsToEvents(logs);
        this.logMap = new Map();
        
        // 2. Indexing
        this.dateMap = new Map();
        const datesSet = new Set<string>();

        logs.forEach(log => {
            this.logMap.set(log.date, log);
            datesSet.add(log.date);
        });

        this.events.forEach(e => {
            if (!this.dateMap.has(e.dateStr)) {
                this.dateMap.set(e.dateStr, []);
                datesSet.add(e.dateStr);
            }
            this.dateMap.get(e.dateStr)?.push(e);
        });

        this.sortedDates = Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }

    /**
     * Get a clean time series for any defined metric.
     * Logic: Filter events -> Group by Day -> Aggregate -> Return
     */
    getSeries(metricId: MetricId): DataPoint[] {
        const config = METRICS[metricId];
        if (!config) return [];

        if (metricId === 'healthScore') {
            return this.sortedDates.map(date => {
                const log = this.logMap.get(date);
                const score = log ? calculateHealthScore(log).score : null;
                return {
                    date,
                    value: score ?? 0,
                    timestamp: new Date(date).getTime()
                };
            });
        }

        return this.sortedDates.map(date => {
            const dayEvents = this.dateMap.get(date) || [];
            const relevantEvents = dayEvents.filter(config.filter);
            
            if (relevantEvents.length === 0) {
                // Return 0 for sum/count, null for others?
                // For simplicity, we return 0 for additive things, null for scalar things if missing.
                if (config.aggregator === 'sum' || config.aggregator === 'count') {
                    return { date, value: 0, timestamp: new Date(date).getTime() };
                }
                return null;
            }

            let val = 0;
            if (config.aggregator === 'sum') {
                val = relevantEvents.reduce((acc, e) => acc + config.getValue(e), 0);
            } else if (config.aggregator === 'count') {
                val = relevantEvents.length;
            } else if (config.aggregator === 'max') {
                val = Math.max(...relevantEvents.map(config.getValue));
            } else if (config.aggregator === 'avg') {
                val = relevantEvents.reduce((acc, e) => acc + config.getValue(e), 0) / relevantEvents.length;
            }

            return {
                date,
                value: val,
                timestamp: new Date(date).getTime()
            };
        }).filter(Boolean) as DataPoint[];
    }

    /**
     * Calculate Simple Moving Average (SMA)
     */
    getSMA(metricId: MetricId, windowSize: number = 7): (number | null)[] {
        const series = this.getSeries(metricId);
        // Create a map for quick lookup because series might have gaps (if using nulls)
        // But getSeries now fills 0 for sums, so it's mostly continuous for those.
        const dateToValueMap = new Map(series.map(d => [d.date, d.value]));
        
        return this.sortedDates.map((_, i) => {
            if (i < windowSize - 1) return null;

            let sum = 0;
            let count = 0;
            
            for (let j = 0; j < windowSize; j++) {
                const prevDate = this.sortedDates[i - j];
                const val = dateToValueMap.get(prevDate);
                if (val !== undefined) {
                    sum += val;
                    count++;
                }
            }
            
            return count > 0 ? sum / count : null;
        });
    }

    /**
     * Generic Impact Analyzer
     * Using normalized data makes this logic much cleaner.
     */
    analyzeImpact(factorId: MetricId, outcomeId: MetricId = 'hardness') {
        const factorConfig = METRICS[factorId];
        const outcomeConfig = METRICS[outcomeId];
        
        if (!factorConfig || !outcomeConfig) return null;

        const highGroup: number[] = [];
        const lowGroup: number[] = [];
        const shiftDays = factorConfig.impactShift; 

        // We calculate daily values first
        const factorSeries = this.getSeries(factorId);
        const outcomeSeries = this.getSeries(outcomeId);
        
        const factorMap = new Map(factorSeries.map(d => [d.date, d.value]));
        const outcomeMap = new Map(outcomeSeries.map(d => [d.date, d.value]));

        this.sortedDates.forEach(dateStr => {
            const factorVal = factorMap.get(dateStr);
            
            // Target Date
            const targetDate = new Date(dateStr);
            targetDate.setDate(targetDate.getDate() + shiftDays);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            const outcomeVal = outcomeMap.get(targetDateStr);

            if (factorVal === undefined || outcomeVal === undefined) return;

            const threshold = factorConfig.highThreshold || 0;

            if (factorVal > threshold) {
                highGroup.push(outcomeVal);
            } else if (factorVal <= (threshold * 0.5)) { 
                lowGroup.push(outcomeVal);
            }
        });

        if (highGroup.length < 3 || lowGroup.length < 3) return null;

        const avgHigh = highGroup.reduce((a,b)=>a+b,0) / highGroup.length;
        const avgLow = lowGroup.reduce((a,b)=>a+b,0) / lowGroup.length;
        const diff = avgHigh - avgLow;

        return {
            factorLabel: factorConfig.label,
            outcomeLabel: outcomeConfig.label,
            avgHighFactor: avgHigh,
            avgLowFactor: avgLow,
            diff,
            sampleSize: highGroup.length + lowGroup.length
        };
    }
}
