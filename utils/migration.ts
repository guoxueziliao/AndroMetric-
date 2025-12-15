
import { LogEntry, PartnerProfile } from '../types';
import { hydrateLog } from './hydrateLog';

export const LATEST_VERSION = 29;

export interface MigrationResult {
    logs: LogEntry[];
    partners: PartnerProfile[];
}

export const runMigrations = (data: any): MigrationResult => {
    let logs: LogEntry[] = [];
    let partners: PartnerProfile[] = [];

    // Detect format: Array (Legacy) or Object (Snapshot)
    if (Array.isArray(data)) {
        logs = data;
    } else if (data && typeof data === 'object') {
        logs = Array.isArray(data.logs) ? data.logs : (Array.isArray(data.morningWoodLogs) ? data.morningWoodLogs : []);
        partners = Array.isArray(data.partners) ? data.partners : (Array.isArray(data.sexPartners) ? data.sexPartners : []);
    }

    // Hydrate logs to ensure all required fields (like status, date) exist
    // This prevents "invisible" records in the dashboard
    const hydratedLogs = logs.map(log => {
        // Ensure date is valid, if missing/invalid, skip or fix?
        // We'll trust hydrateLog defaults, but ensuring 'date' is critical.
        if (!log.date) return null;
        return hydrateLog(log);
    }).filter(Boolean) as LogEntry[];

    return {
        logs: hydratedLogs,
        partners: partners
    };
};
