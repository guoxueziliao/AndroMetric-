import { LogEntry, ChangeDetail, HistoryEventType, SleepRecord } from '../types';

export const getTodayDateString = (): string => {
    const now = new Date();
    // Physiological Day Logic: If before 3 AM, count as previous day
    if (now.getHours() < 3) {
        now.setDate(now.getDate() - 1);
    }
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const formatTime = (isoOrTime?: string | null): string => {
    if (!isoOrTime) return '--:--';
    if (isoOrTime.includes('T')) {
        return new Date(isoOrTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return isoOrTime.substring(0, 5);
};

export const calculateSleepDuration = (start?: string | null, end?: string | null): string => {
    if (!start || !end) return '';
    
    // Handle ISO strings or HH:MM
    const getDate = (str: string) => {
        if(str.includes('T')) return new Date(str);
        const [h, m] = str.split(':').map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0);
        return d;
    };

    let s = getDate(start);
    let e = getDate(end);

    // Adjustment for crossing midnight if using HH:MM
    if (!start.includes('T') && e < s) {
        e.setDate(e.getDate() + 1);
    }

    const diff = e.getTime() - s.getTime();
    if (diff < 0) return '';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`;
};

export const analyzeSleep = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const durationStr = calculateSleepDuration(start, end);
    const hoursMatch = durationStr.match(/(\d+)小时/);
    const minutesMatch = durationStr.match(/(\d+)分钟/);
    const h = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const m = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const totalHours = h + (m / 60);

    // Late sleep check (if start is after 1 AM)
    let isLate = false;
    if (start.includes('T')) {
        const sDate = new Date(start);
        isLate = sDate.getHours() >= 1 && sDate.getHours() < 5;
    } else {
        const [sh] = start.split(':').map(Number);
        isLate = sh >= 1 && sh < 5;
    }

    return {
        durationHours: totalHours,
        isInsufficient: totalHours < 6,
        isLate
    };
};

export const generateLogSummary = (log: LogEntry): Array<{label: string, value: string}> => {
    const summary = [];
    summary.push({ label: '日期', value: log.date });
    if (log.morning?.wokeWithErection) {
        summary.push({ label: '晨勃', value: `${log.morning.hardness}级 (${log.morning.retention || '未知'})` });
    } else {
        summary.push({ label: '晨勃', value: '无' });
    }
    
    if (log.sleep?.quality) summary.push({ label: '睡眠质量', value: `${log.sleep.quality}/5` });
    
    if (log.sex?.length) summary.push({ label: '性生活', value: `${log.sex.length}次` });
    if (log.masturbation?.length) summary.push({ label: '自慰', value: `${log.masturbation.length}次` });
    
    return summary;
};

export const calculateLogDiff = (oldLog: LogEntry, newLog: LogEntry): ChangeDetail[] => {
    // Simplified diff logic for brevity
    const changes: ChangeDetail[] = [];
    // ... Implement detailed diffing if needed
    return changes;
};

export const formatHistoryValue = (field: string, value: any): string => {
    if (typeof value === 'boolean') return value ? '是' : '否';
    if (!value) return '无';
    return String(value);
};

export const inferHistoryEventType = (summary: string): HistoryEventType => {
    if (summary.includes('快速') || summary.includes('一键')) return 'quick';
    if (summary.includes('修复') || summary.includes('自动')) return 'auto';
    return 'manual';
};