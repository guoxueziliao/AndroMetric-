

import { LogEntry } from '../types';
import { StatsEngine, METRICS, MetricId } from './StatsEngine';
import { analyzeSleep } from './helpers';

export interface Insight {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning';
    title: string;
    description: string;
    score?: number; // For sorting relevance
    icon?: 'sleep' | 'alcohol' | 'sex' | 'stress' | 'trend';
}

// 1. Generate Correlation Insights (using StatsEngine)
const generateCorrelations = (logs: LogEntry[]): Insight[] => {
    const insights: Insight[] = [];
    const engine = new StatsEngine(logs);
    
    // Factors to analyze against Hardness
    const factors: MetricId[] = ['sleep', 'alcohol', 'stress', 'exercise', 'sexLoad'];

    factors.forEach(factorId => {
        const result = engine.analyzeImpact(factorId, 'hardness');
        if (!result) return;

        // Threshold for significant insight (e.g., difference > 0.3 levels)
        if (Math.abs(result.diff) > 0.3) {
            const isPositiveCorrelation = result.diff > 0;
            const factorConfig = METRICS[factorId];
            
            // Logic: 
            // If factor is 'Good' (like Sleep, Exercise) and Diff > 0 -> Positive Insight
            // If factor is 'Bad' (Alcohol, Stress) and Diff < 0 -> Warning/Negative
            
            let type: Insight['type'] = 'neutral';
            let title = '';
            let desc = '';
            let score = 5;

            if (factorId === 'sleep') {
                type = isPositiveCorrelation ? 'positive' : 'negative';
                title = '睡眠黄金律';
                desc = `当睡眠充足时，晨勃硬度平均${isPositiveCorrelation ? '提升' : '下降'} ${Math.abs(result.diff).toFixed(1)} 级。`;
                score = 10;
            } else if (factorId === 'alcohol') {
                if (result.diff < 0) {
                    type = 'warning';
                    title = '酒精抑制效应';
                    desc = `饮酒次日，晨勃硬度平均下降 ${Math.abs(result.diff).toFixed(1)} 级。`;
                    score = 9;
                }
            } else if (factorId === 'stress') {
                if (result.diff < 0) {
                    type = 'negative';
                    title = '压力过载';
                    desc = `高压状态下，硬度受到明显抑制 (平均 -${Math.abs(result.diff).toFixed(1)} 级)。`;
                    score = 8;
                }
            } else if (factorId === 'exercise') {
                if (result.diff > 0) {
                    type = 'positive';
                    title = '运动助攻';
                    desc = `有运动的日子，次日状态更好 (平均 +${result.diff.toFixed(1)} 级)。`;
                    score = 7;
                }
            }

            if (title) {
                insights.push({
                    id: `${factorId}_impact`,
                    type,
                    title,
                    description: desc,
                    score,
                    icon: factorId === 'alcohol' ? 'alcohol' : factorId === 'sleep' ? 'sleep' : 'trend'
                });
            }
        }
    });

    return insights;
};

// 2. Detect Causal Events (Specific Incidents)
// Keeping manual logic here as it detects *specific dates*, not general trends.
const detectAnomalies = (logs: LogEntry[]): Insight[] => {
    const insights: Insight[] = [];
    // Sort chronological
    const sorted = [...logs].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Look for sudden drops in last 7 days
    const recent = sorted.slice(-7);
    
    for (let i = 1; i < recent.length; i++) {
        const curr = recent[i];
        const prev = recent[i-1];
        
        if (curr.morning?.wokeWithErection && prev.morning?.wokeWithErection && 
            curr.morning?.hardness && prev.morning?.hardness && 
            (prev.morning.hardness - curr.morning.hardness) >= 2) {
            
            const causes = [];
            if (prev.alcoholRecord && prev.alcoholRecord.totalGrams > 40) causes.push(`饮酒 ${prev.alcoholRecord.totalGrams}g`);
            if (prev.stressLevel && prev.stressLevel >= 4) causes.push(`高压状态`);
            
            const sleepAnalysis = analyzeSleep(curr.sleep?.startTime, curr.sleep?.endTime);
            if (sleepAnalysis && sleepAnalysis.isInsufficient) causes.push(`睡眠不足`);

            if (causes.length > 0) {
                insights.push({
                    id: `drop_${curr.date}`,
                    type: 'negative',
                    title: '硬度骤降警报',
                    description: `${curr.date} 硬度下降 ${prev.morning.hardness - curr.morning.hardness} 级。可能原因：${causes.join(' + ')}。`,
                    score: 8,
                    icon: 'trend'
                });
            }
        }
    }
    
    return insights;
};

// 3. Masturbation Causal Loops
// (Currently not in generic engine, specific to finding edging boost)
const analyzeMasturbationLoop = (logs: LogEntry[]): Insight[] => {
    const insights: Insight[] = [];
    // ... Logic kept same as before, specific domain logic ...
    // For brevity, using simplified version or assuming engine could handle this later.
    // Preserving logic to maintain feature parity.
    
    const edgingNextDays: number[] = [];
    const logMap = new Map(logs.map(l => [l.date, l]));
    
    logs.forEach(l => {
        if (!l.masturbation || l.masturbation.length === 0) return;
        const hasMultipleEdging = l.masturbation.some(m => m.edging === 'multiple');
        const hasEjaculation = l.masturbation.some(m => m.ejaculation);
        
        const d = new Date(l.date); d.setDate(d.getDate() + 1);
        const nextLog = logMap.get(d.toISOString().split('T')[0]);
        
        if (nextLog && nextLog.morning?.wokeWithErection && nextLog.morning?.hardness) {
            if (hasMultipleEdging && !hasEjaculation) edgingNextDays.push(nextLog.morning.hardness);
        }
    });
    
    if (edgingNextDays.length >= 3) {
        const valid = logs.filter(l => l.morning?.wokeWithErection && l.morning?.hardness).map(l => l.morning!.hardness || 0);
        const globalAvg = valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 0;
        const edgingAvg = edgingNextDays.reduce((a,b)=>a+b,0) / edgingNextDays.length;
        
        if (edgingAvg > globalAvg + 0.3) {
             insights.push({
                id: 'edging_boost',
                type: 'positive',
                title: '边缘控制效应',
                description: `边缘 (Edging) 后，次日硬度提升 ${(edgingAvg - globalAvg).toFixed(1)} 级。`,
                score: 11,
                icon: 'sex'
            });
        }
    }
    
    return insights;
};

// 4. XP Trends
const analyzeXPChange = (logs: LogEntry[]): Insight[] => {
    const recentLogs = logs.slice(-30);
    if (recentLogs.length < 10) return [];
    
    const countTags = (ls: LogEntry[]) => {
        const counts: Record<string, number> = {};
        let total = 0;
        ls.forEach(l => l.masturbation?.forEach(m => {
            /**
             * Fixed Property access: m.assets?.categories is now defined.
             */
            m.assets?.categories?.forEach(c => {
                counts[c] = (counts[c] || 0) + 1;
                total++;
            });
        }));
        return { counts, total };
    };
    
    const { counts: recentCounts, total: recentTotal } = countTags(recentLogs);
    const { counts: allCounts, total: allTotal } = countTags(logs);
    
    if (recentTotal < 5) return [];

    const insights: Insight[] = [];
    Object.keys(recentCounts).forEach(tag => {
        const recentShare = recentCounts[tag] / recentTotal;
        const allShare = (allCounts[tag] || 0) / allTotal;
        if (recentShare > allShare + 0.2) { 
             insights.push({
                id: `xp_surge_${tag}`,
                type: 'neutral',
                title: '性癖偏好转移',
                description: `最近对「${tag}」兴趣激增 ${Math.round((recentShare - allShare)*100)}%。`,
                score: 7,
                icon: 'trend'
            });
        }
    });
    
    return insights;
};


export const generateInsights = (logs: LogEntry[]): Insight[] => {
    if (!logs || logs.length < 3) return [];
    
    const correlations = generateCorrelations(logs);
    const anomalies = detectAnomalies(logs);
    const loops = analyzeMasturbationLoop(logs);
    const xp = analyzeXPChange(logs);
    
    const all = [...correlations, ...anomalies, ...loops, ...xp];
    return all.sort((a,b) => (b.score || 0) - (a.score || 0));
};
