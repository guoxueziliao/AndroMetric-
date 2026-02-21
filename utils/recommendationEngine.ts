import { LogEntry, MasturbationRecordDetails, SexRecordDetails } from '../types';

export interface Recommendation {
    type: 'tag' | 'material' | 'position' | 'toy' | 'tool' | 'costume';
    value: string;
    score: number;
    reason: string;
}

// Helper to calculate score based on frequency and rating
const calculateScore = (count: number, avgRating: number, recentBonus: number) => {
    // Base score from frequency
    let score = count * 10;
    
    // Multiplier from rating (1-5)
    if (avgRating > 0) {
        score *= (avgRating / 3); // 3 is neutral
    }

    // Bonus for recent usage
    score += recentBonus;

    return Math.round(score);
};

export const getMasturbationRecommendations = (logs: LogEntry[]): Recommendation[] => {
    if (!Array.isArray(logs)) return [];
    const tagStats: Record<string, { count: number, totalRating: number, lastUsed: number }> = {};
    const toolStats: Record<string, { count: number, totalRating: number, lastUsed: number }> = {};
    
    try {
        logs.forEach(log => {
            if (log.masturbation && Array.isArray(log.masturbation)) {
                log.masturbation.forEach(m => {
                    const rating = m.orgasmIntensity || 3;
                    const timestamp = new Date((log.date || new Date().toISOString().split('T')[0]) + 'T' + (m.startTime || '00:00')).getTime();

                    // Tags
                    const tags = [
                        ...(m.contentItems?.flatMap(c => c.xpTags || []) || []),
                        ...(m.assets?.categories || [])
                    ];
                    tags.forEach(tag => {
                        if (!tagStats[tag]) tagStats[tag] = { count: 0, totalRating: 0, lastUsed: 0 };
                        tagStats[tag].count++;
                        tagStats[tag].totalRating += rating;
                        if (timestamp > tagStats[tag].lastUsed) tagStats[tag].lastUsed = timestamp;
                    });

                    // Tools
                    if (m.tools && Array.isArray(m.tools)) {
                        m.tools.forEach(tool => {
                            if (!toolStats[tool]) toolStats[tool] = { count: 0, totalRating: 0, lastUsed: 0 };
                            toolStats[tool].count++;
                            toolStats[tool].totalRating += rating;
                            if (timestamp > toolStats[tool].lastUsed) toolStats[tool].lastUsed = timestamp;
                        });
                    }
                });
            }
        });
    } catch (e) {
        console.error("Error generating masturbation recommendations:", e);
        return [];
    }

    const recommendations: Recommendation[] = [];
    const now = Date.now();
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

    // Process Tags
    Object.entries(tagStats).forEach(([tag, stats]) => {
        const avgRating = stats.totalRating / stats.count;
        const isRecent = (now - stats.lastUsed) < ONE_MONTH;
        const score = calculateScore(stats.count, avgRating, isRecent ? 20 : 0);
        
        if (score > 30) { // Threshold
            recommendations.push({
                type: 'tag',
                value: tag,
                score,
                reason: avgRating >= 4 ? '高爽度' : '常用'
            });
        }
    });

    // Process Tools
    Object.entries(toolStats).forEach(([tool, stats]) => {
        if (tool === '手') return; // Skip default
        const avgRating = stats.totalRating / stats.count;
        const isRecent = (now - stats.lastUsed) < ONE_MONTH;
        const score = calculateScore(stats.count, avgRating, isRecent ? 15 : 0);

        if (score > 20) {
            recommendations.push({
                type: 'tool',
                value: tool,
                score,
                reason: avgRating >= 4 ? '高爽度' : '常用'
            });
        }
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
};

export const getSexRecommendations = (logs: LogEntry[], currentPartner?: string): Recommendation[] => {
    if (!Array.isArray(logs)) return [];
    const posStats: Record<string, { count: number, totalScore: number, lastUsed: number }> = {};
    const toyStats: Record<string, { count: number, totalScore: number, lastUsed: number }> = {};
    const costumeStats: Record<string, { count: number, totalScore: number, lastUsed: number }> = {};

    try {
        logs.forEach(log => {
            if (log.sex && Array.isArray(log.sex)) {
                log.sex.forEach(s => {
                    // Calculate a "session score" based on orgasm and partner score
                    let sessionScore = 3;
                    if (s.indicators?.orgasm) sessionScore += 1;
                    if (s.indicators?.partnerOrgasm) sessionScore += 1;
                    if (s.partnerScore) sessionScore += (s.partnerScore - 3); // Adjust around neutral

                    const timestamp = new Date((log.date || new Date().toISOString().split('T')[0]) + 'T' + (s.startTime || '00:00')).getTime();

                    if (s.interactions && Array.isArray(s.interactions)) {
                        s.interactions.forEach(i => {
                            // Filter by partner if specified
                            if (currentPartner && i.partner !== currentPartner && s.partner !== currentPartner) return;

                            // Positions - Safe access to chain
                            if (i.chain && Array.isArray(i.chain)) {
                                i.chain.filter(a => a.type === 'position').forEach(p => {
                                    if (!posStats[p.name]) posStats[p.name] = { count: 0, totalScore: 0, lastUsed: 0 };
                                    posStats[p.name].count++;
                                    posStats[p.name].totalScore += sessionScore;
                                    if (timestamp > posStats[p.name].lastUsed) posStats[p.name].lastUsed = timestamp;
                                });
                            }

                            // Toys
                            if (i.toys && Array.isArray(i.toys)) {
                                i.toys.forEach(t => {
                                    if (!toyStats[t]) toyStats[t] = { count: 0, totalScore: 0, lastUsed: 0 };
                                    toyStats[t].count++;
                                    toyStats[t].totalScore += sessionScore;
                                    if (timestamp > toyStats[t].lastUsed) toyStats[t].lastUsed = timestamp;
                                });
                            }

                            // Costumes
                            if (i.costumes && Array.isArray(i.costumes)) {
                                i.costumes.forEach(c => {
                                    if (!costumeStats[c]) costumeStats[c] = { count: 0, totalScore: 0, lastUsed: 0 };
                                    costumeStats[c].count++;
                                    costumeStats[c].totalScore += sessionScore;
                                    if (timestamp > costumeStats[c].lastUsed) costumeStats[c].lastUsed = timestamp;
                                });
                            }
                        });
                    }
                });
            }
        });
    } catch (e) {
        console.error("Error generating sex recommendations:", e);
        return [];
    }

    const recommendations: Recommendation[] = [];
    const now = Date.now();
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

    // Helper to process stats
    const process = (stats: Record<string, any>, type: Recommendation['type']) => {
        Object.entries(stats).forEach(([val, stat]) => {
            const avgScore = stat.totalScore / stat.count;
            const isRecent = (now - stat.lastUsed) < ONE_MONTH;
            const score = calculateScore(stat.count, avgScore, isRecent ? 20 : 0);
            
            if (score > 25) {
                recommendations.push({
                    type,
                    value: val,
                    score,
                    reason: avgScore >= 4 ? '体验极佳' : '经常使用'
                });
            }
        });
    };

    process(posStats, 'position');
    process(toyStats, 'toy');
    process(costumeStats, 'costume');

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
};
