
import Dexie, { Table } from 'dexie';
import { LogEntry, PartnerProfile, Snapshot, TagEntry, Supplement } from './types';
import { runMigrations } from './utils/migration';

export interface MetaEntry {
  key: string;
  value: any;
}

export interface SystemLog {
  id?: number;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  action: string;
  details?: any;
}

export type HardnessDiaryDatabase = Dexie & {
  logs: Table<LogEntry, string>;
  partners: Table<PartnerProfile, string>;
  meta: Table<MetaEntry, string>;
  system_logs: Table<SystemLog, number>;
  snapshots: Table<Snapshot, number>;
  tags: Table<TagEntry, [string, string]>; 
  supplements: Table<Supplement, string>; // New in v7
};

const dbInstance = new Dexie('HardnessDiaryDB') as HardnessDiaryDatabase;

// Version 7: Add supplements table
dbInstance.version(7).stores({
  logs: '&date, status',
  partners: '&id',
  meta: 'key',
  system_logs: '++id, timestamp, level, action',
  snapshots: '++id, timestamp',
  tags: '[name+category], category, dimension',
  supplements: '&id, isActive'
});

dbInstance.version(5).stores({
  logs: '&date, status',
  partners: '&id',
  meta: 'key',
  system_logs: '++id, timestamp, level, action',
  snapshots: '++id, timestamp',
  tags: '[name+category], category, dimension'
});

dbInstance.version(4).stores({
  logs: '&date, status',
  partners: '&id',
  meta: 'key',
  system_logs: '++id, timestamp, level, action',
  snapshots: '++id, timestamp'
});

export const db = dbInstance;

db.on('populate', async () => {
});
