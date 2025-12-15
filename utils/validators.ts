
import { LogEntry, MorningRecord, SleepRecord } from '../types';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    fieldErrors: Record<string, string>;
}

// Helper to check if a number is an integer within range
const isIntRange = (val: any, min: number, max: number) => {
    return typeof val === 'number' && Number.isInteger(val) && val >= min && val <= max;
};

// Helper to validate date ISO string
const isValidDate = (dateStr?: string) => {
    if (!dateStr) return true; // Optional fields can be empty
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
};

export const validateLogEntry = (log: LogEntry): ValidationResult => {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    // 1. Core Identity
    if (!log.date || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) {
        errors.push("无效的日期格式 (YYYY-MM-DD)");
        fieldErrors['date'] = "日期格式错误";
    }

    // 2. Morning Validation
    if (log.morning) {
        const { hardness, wokeWithErection } = log.morning;
        // Fix: Allow null (not set yet) even if wokeWithErection is true
        if (wokeWithErection && hardness !== undefined && hardness !== null) {
            if (!isIntRange(hardness, 1, 5)) {
                errors.push("硬度等级必须在 1-5 之间");
                fieldErrors['morning.hardness'] = "范围: 1-5";
            }
        }
    }

    // 3. Sleep Validation
    if (log.sleep) {
        const { quality, startTime, endTime } = log.sleep;
        
        // Fix: Allow null
        if (quality !== undefined && quality !== null && !isIntRange(quality, 1, 5)) {
            errors.push("睡眠质量评分必须在 1-5 之间");
            fieldErrors['sleep.quality'] = "范围: 1-5";
        }

        if (startTime && !isValidDate(startTime)) {
            errors.push("入睡时间格式无效");
            fieldErrors['sleep.startTime'] = "时间无效";
        }
        if (endTime && !isValidDate(endTime)) {
            errors.push("起床时间格式无效");
            fieldErrors['sleep.endTime'] = "时间无效";
        }

        // Logic Check: End > Start
        if (startTime && endTime) {
            const start = new Date(startTime).getTime();
            const end = new Date(endTime).getTime();
            
            if (end <= start) {
                const msg = "起床时间不能早于入睡时间";
                errors.push(msg);
                fieldErrors['sleep.time'] = msg;
            } else if ((end - start) > 24 * 3600 * 1000) {
                const msg = "睡眠时长异常 (>24小时)";
                errors.push(msg);
                fieldErrors['sleep.duration'] = msg;
            }
        }
    }

    // 4. Global State Validation
    // Fix: Allow null
    if (log.stressLevel !== undefined && log.stressLevel !== null && !isIntRange(log.stressLevel, 1, 5)) {
        errors.push("压力等级必须在 1-5 之间");
        fieldErrors['stressLevel'] = "范围: 1-5";
    }

    return { 
        valid: errors.length === 0, 
        errors,
        fieldErrors
    };
};
