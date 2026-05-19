import type { LogEntry } from '../types';
import { isFieldUsable } from '../../utils/dataQuality';

/**
 * 根据 LogEntry 字段完整度打分(0-100)。
 * 仅依赖 domain 类型 + dataQuality usable 判定,不输出 UI 字符串。
 */
export const calculateDataQuality = (log: Partial<LogEntry>): number => {
    let score = 0;
    const maxScore = 100;
    const usable = (path: string) => isFieldUsable(log as LogEntry, path);

    // Morning: 20pts
    if (usable('morning.wokeWithErection')) score += 10;
    if (usable('morning.hardness')) score += 10;

    // Sleep: 30pts
    if (usable('sleep.startTime') && usable('sleep.endTime')) score += 15;
    if (usable('sleep.quality')) score += 5;
    if (usable('sleep.hasDream')) score += 5;
    if (usable('sleep.environment.temperature')) score += 5;

    // Lifestyle: 20pts
    if (usable('weather')) score += 5;
    if (usable('stressLevel')) score += 5;
    if (usable('mood')) score += 5;
    if (usable('caffeineRecord.totalCount') || (log.caffeineRecord?.totalCount || 0) > 0) score += 5;
    if (usable('screenTime.totalMinutes')) score += 5;
    if (usable('menstrual.status')) score += 5;

    // Activities (Bonus up to 30)
    if (log.sex && log.sex.length > 0) score += 10;
    if (log.masturbation && log.masturbation.length > 0) score += 10;
    if (log.exercise && log.exercise.length > 0) score += 10;
    if (log.alcoholRecords && log.alcoholRecords.length > 0) score += 5;
    if (log.supplements && log.supplements.some(item => item.taken)) score += 5;

    // Health Check Penalty (New in v0.0.6)
    if (log.health?.isSick) {
        if (usable('health.discomfortLevel')) score += 5;
        else score -= 5;
    } else {
        score += 5; // Healthy bonus
    }

    return Math.min(maxScore, Math.max(0, score));
};
