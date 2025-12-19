
import Dexie, { Table } from 'dexie';
import { LogEntry, PartnerProfile, Snapshot } from './types';

// Moved from types.ts to db.ts to resolve import errors in services
export interface SystemLog {
    id?: number;
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    action: string;
    details?: any;
}

export interface MetaEntry {
    key: string;
    value: any;
}

export class MyDatabase extends Dexie {
    logs!: Table<LogEntry, string>;
    partners!: Table<PartnerProfile, string>;
    meta!: Table<MetaEntry, string>;
    snapshots!: Table<Snapshot, number>;
    system_logs!: Table<SystemLog, number>;

    constructor() {
        super('HardnessDiaryDB');
        /* Ensure version(1) is called on 'this' to correctly initialize the schema */
        this.version(1).stores({
            logs: 'date, updatedAt, status',
            partners: 'id, name, type',
            meta: 'key',
            snapshots: '++id, timestamp',
            system_logs: '++id, timestamp, level, action'
        });
    }
}

export const db = new MyDatabase();
