
import { LogEntry, ChangeRecord, StressLevel } from '../types';
import { LABELS } from './helpers';

// Reverse lookup maps for restoring data from human-readable history
const REVERSE_LABELS = {
    // "3星" -> 3
    sleepQuality: { '1星': 1, '2星': 2, '3星': 3, '4星': 4, '5星': 5 } as Record<string, number>,
    // "还好" -> 2
    stress: Object.entries(LABELS.stress).reduce((acc, [k, v]) => ({ ...acc, [v]: Number(k) }), {} as Record<string, number>),
    // "生病" -> true
    health: { '生病': true, '健康': false } as Record<string, boolean>
};

/**
 * Repairs a LogEntry by looking at its modification history.
 * Only fills fields that are currently null/undefined/empty using evidence from changeHistory.
 */
export const repairLogUsingHistory = (log: LogEntry): { log: LogEntry; repaired: boolean } => {
    if (!log.changeHistory || log.changeHistory.length === 0) {
        return { log, repaired: false };
    }

    const newLog = JSON.parse(JSON.stringify(log)); // Deep clone
    let repaired = false;

    // Helper to find latest valid value for a field in history
    const findLatestInHistory = (fieldNames: string[]): string | null => {
        // Iterate backwards to find the most recent value
        const reversedHistory = [...newLog.changeHistory].reverse();
        for (const entry of reversedHistory) {
            if (!entry.details) continue;
            for (const detail of entry.details) {
                if (fieldNames.includes(detail.field) && detail.newValue && detail.newValue !== '空' && detail.newValue !== 'undefined' && detail.newValue !== 'null') {
                    return detail.newValue;
                }
            }
        }
        return null;
    };

    // --- 1. Repair Sleep Times ---
    // Rule: Sleep Start > 12:00 implies Day-1. Start < 12:00 implies Day.
    // Rule: Sleep End is usually Day.
    if (!newLog.sleep.startTime) {
        const historyVal = findLatestInHistory(['入睡时间', 'sleepDateTime']);
        if (historyVal && historyVal.includes(':') && !historyVal.includes('NaN')) {
             const [h, m] = historyVal.split(':').map(Number);
             if (!isNaN(h) && !isNaN(m)) {
                 const d = new Date(newLog.date);
                 if (h >= 12) d.setDate(d.getDate() - 1);
                 
                 d.setHours(h, m, 0, 0);
                 newLog.sleep.startTime = d.toISOString();
                 repaired = true;
             }
        }
    }

    if (!newLog.sleep.endTime) {
        const historyVal = findLatestInHistory(['起床时间', 'wakeUpDateTime']);
        if (historyVal && historyVal.includes(':') && !historyVal.includes('NaN')) {
             const [h, m] = historyVal.split(':').map(Number);
             if (!isNaN(h) && !isNaN(m)) {
                 const d = new Date(newLog.date);
                 d.setHours(h, m, 0, 0);
                 newLog.sleep.endTime = d.toISOString();
                 repaired = true;
             }
        }
    }

    // --- 2. Repair Sleep Quality ---
    // History usually stores "3星" or "3"
    if (newLog.sleep.quality === undefined || newLog.sleep.quality === null || newLog.sleep.quality === 0) {
        const historyVal = findLatestInHistory(['睡眠质量', 'sleepQuality']);
        if (historyVal) {
            const match = historyVal.match(/(\d+)星/);
            if (match) {
                newLog.sleep.quality = parseInt(match[1]);
                repaired = true;
            } else if (!isNaN(parseInt(historyVal))) {
                newLog.sleep.quality = parseInt(historyVal);
                repaired = true;
            }
        }
        // Fallback default for Schema v1.0 compliance if purely missing
        if (!newLog.sleep.quality) {
            newLog.sleep.quality = 3;
            repaired = true;
        }
    }

    // --- 3. Repair Stress Level ---
    if (newLog.stressLevel === undefined || newLog.stressLevel === null) {
        const historyVal = findLatestInHistory(['压力', 'stressLevel']);
        if (historyVal) {
            const val = REVERSE_LABELS.stress[historyVal];
            if (val) {
                newLog.stressLevel = val;
                repaired = true;
            } else if (!isNaN(parseInt(historyVal))) {
                newLog.stressLevel = parseInt(historyVal) as StressLevel;
                repaired = true;
            }
        }
    }

    // --- 4. Repair Health (Sick Status) ---
    if (!newLog.health.isSick) {
        const historyVal = findLatestInHistory(['生病状态']);
        if (historyVal === '生病') {
            newLog.health.isSick = true;
            repaired = true;
        }
    }

    return { log: newLog, repaired };
};
