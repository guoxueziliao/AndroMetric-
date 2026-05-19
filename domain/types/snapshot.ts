import type { LogEntry } from './log';
import type { PartnerProfile } from './partner';
import type { TagEntry } from './tags';
import type { CycleEvent, PregnancyEvent } from './reproductive';

export interface Snapshot {
    id?: number;
    timestamp: number;
    dataVersion: number;
    appVersion: string;
    description: string;
    data: {
        logs: LogEntry[];
        partners: PartnerProfile[];
        tags?: TagEntry[];
        cycleEvents?: CycleEvent[];
        pregnancyEvents?: PregnancyEvent[];
    };
}

export interface StoredData {
    version: number;
    logs: LogEntry[];
}
