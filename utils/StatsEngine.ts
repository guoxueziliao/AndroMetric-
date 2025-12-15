
export type MetricId = 'sleep' | 'alcohol' | 'exercise' | 'stress' | 'hardness';

export const METRICS: Record<string, any> = {
    sleep: { label: '睡眠', unit: 'h' },
    alcohol: { label: '酒精', unit: 'g' },
    exercise: { label: '运动', unit: 'min' },
    stress: { label: '压力', unit: 'lv' }
};

export class StatsEngine {
    constructor(private logs: any[]) {}
    
    getSeries(metric: MetricId) {
        return this.logs.map(l => ({ date: l.date, value: 0 }));
    }
    
    getSMA(metric: MetricId, period: number) {
        return this.logs.map(() => 0);
    }
}
