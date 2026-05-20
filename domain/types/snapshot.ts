import type { LogEntry } from './log';
import type { PartnerProfile } from './partner';
import type { TagEntry } from './tags';
import type { CycleEvent, PregnancyEvent } from './reproductive';
import type { AppSettings } from './settings';

export interface SnapshotData {
    version: number;
    logs: LogEntry[];
    partners: PartnerProfile[];
    tags: TagEntry[];
    cycleEvents: CycleEvent[];
    pregnancyEvents: PregnancyEvent[];
}

export interface ExportSnapshot {
    appName: '硬度日记';
    appVersion: string;
    dataVersion: number;
    exportDate: string;
    settings: AppSettings | null;
    userName: string | null;
    data: SnapshotData;
}

export interface Snapshot {
    id?: number;
    timestamp: number;
    dataVersion: number;
    appVersion: string;
    description: string;
    settings: AppSettings | null;
    userName: string | null;
    data: SnapshotData;
}

export interface StoredData {
    version: number;
    logs: LogEntry[];
}
