import type { LogEntry } from './log';
import type { PartnerProfile } from './partner';
import type { TagEntry } from './tags';
import type { CycleEvent, PregnancyEvent } from './reproductive';
import type { AppSettings } from './settings';
import type { PornUseEvent, MasturbationEvent, SexEvent } from './adultBehavior';

export interface SnapshotData {
    version: number;
    logs: LogEntry[];
    partners: PartnerProfile[];
    tags: TagEntry[];
    cycleEvents: CycleEvent[];
    pregnancyEvents: PregnancyEvent[];
    pornUseEvents?: PornUseEvent[];
    masturbationEvents?: MasturbationEvent[];
    sexEvents?: SexEvent[];
    snapshots?: Snapshot[];
}

export interface ExportSnapshot {
    appName: '硬度日记';
    /** App build version for display only. Never use this to decide import compatibility. */
    appVersion: string;
    /** Data contract version. This is the only version field that gates import compatibility. */
    dataVersion: number;
    exportDate: string;
    settings: AppSettings | null;
    userName: string | null;
    data: SnapshotData;
}

export interface Snapshot {
    id?: number;
    timestamp: number;
    /** Data contract version. This is the only version field that gates restore/import compatibility. */
    dataVersion: number;
    /** App build version for display only. Never use this to decide restore/import compatibility. */
    appVersion: string;
    description: string;
    kind?: 'manual' | 'auto-safety';
    sizeBytes?: number;
    settings: AppSettings | null;
    userName: string | null;
    data: SnapshotData;
}

export interface StoredData {
    version: number;
    logs: LogEntry[];
    partners?: PartnerProfile[];
    tags?: TagEntry[];
    cycleEvents?: CycleEvent[];
    pregnancyEvents?: PregnancyEvent[];
    pornUseEvents?: PornUseEvent[];
    masturbationEvents?: MasturbationEvent[];
    sexEvents?: SexEvent[];
}
