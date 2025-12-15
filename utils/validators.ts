import { LogEntry } from '../types';

export const validateLogEntry = (log: LogEntry): { valid: boolean, errors: string[] } => {
    const errors: string[] = [];
    if (!log.date) errors.push('日期不能为空');
    // Add more validation logic
    return { valid: errors.length === 0, errors };
};