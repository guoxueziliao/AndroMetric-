
import { db } from '../db';
import { SystemLog } from '../types';

export type LogLevel = 'info' | 'warn' | 'error';

export const Logger = {
    /**
     * Internal method to write to DB
     */
    async log(level: LogLevel, action: string, details?: any) {
        try {
            // Context capture (basic)
            const logEntry: SystemLog = {
                timestamp: Date.now(),
                level,
                action,
                // Serialize details to ensure it's safe for IndexedDB and JSON export
                details: details ? JSON.parse(JSON.stringify(details, (key, value) => {
                    if (key === 'password' || key === 'token') return '***'; // Basic redaction
                    return value;
                })) : undefined
            };

            await db.system_logs.add(logEntry);
            
            // Mirror to console for dev mode
            if (process.env.NODE_ENV === 'development') {
                const style = level === 'error' ? 'color: red' : level === 'warn' ? 'color: orange' : 'color: cyan';
                console.log(`%c[${action}]`, style, details || '');
            }
        } catch (e) {
            // If logger fails, fallback to console to ensure we don't lose the error entirely
            console.error("LoggerService failed to write log:", e);
        }
    },

    info: (action: string, details?: any) => Logger.log('info', action, details),
    
    warn: (action: string, details?: any) => Logger.log('warn', action, details),
    
    error: (action: string, error: any, context?: any) => {
        const details = {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ...context
        };
        return Logger.log('error', action, details);
    },

    /**
     * Retrieve recent logs for export/debugging
     */
    async getRecentLogs(limit = 200) {
        return await db.system_logs.orderBy('timestamp').reverse().limit(limit).toArray();
    },

    /**
     * Clean up old logs to save space
     */
    async cleanup() {
        const count = await db.system_logs.count();
        if (count > 1000) {
            // Keep last 500
            const keys = await db.system_logs.orderBy('timestamp').keys();
            const keysToDelete = keys.slice(0, keys.length - 500);
            await db.system_logs.bulkDelete(keysToDelete as number[]);
        }
    }
};
