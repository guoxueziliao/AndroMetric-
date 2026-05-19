/**
 * 纯日期/时间格式化与计算。
 * 不依赖 LogEntry 业务语义,可在任何层使用。
 */

export const getTodayDateString = (): string => {
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = (todayDate.getMonth() + 1).toString().padStart(2, '0');
    const day = todayDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatTime = (isoString?: string | null): string => {
    if (!isoString) return '--:--';
    try {
        if (/^\d{1,2}:\d{2}$/.test(isoString)) return isoString;
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
        return '--:--';
    }
};

export const formatDateFriendly = (dateStr: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
};

export const calculateSleepDuration = (sleepTime?: string | null, wakeTime?: string | null): string | null => {
    if (!sleepTime || !wakeTime) return null;
    const start = new Date(sleepTime).getTime();
    const end = new Date(wakeTime).getTime();
    if (isNaN(start) || isNaN(end)) return null;
    if (end <= start) return null;
    const diffMinutes = Math.round((end - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}小时 ${minutes}分钟`;
};

export const analyzeSleep = (sleepTime?: string | null, wakeTime?: string | null) => {
    if (!sleepTime || !wakeTime) return null;
    const start = new Date(sleepTime);
    const end = new Date(wakeTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    if (end <= start) return null;
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const hour = start.getHours();
    const isLate = hour >= 0 && hour < 5;
    const isInsufficient = durationHours < 6;
    const isExcessive = durationHours > 9;
    return { durationHours, isLate, isInsufficient, isExcessive };
};
