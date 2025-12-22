
import Dexie, { Table } from 'dexie';
import { LogEntry, PartnerProfile, Snapshot, TagEntry, Supplement } from './types';

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
  supplements: Table<Supplement, string>; // 新增表
};

const dbInstance = new Dexie('HardnessDiaryDB') as HardnessDiaryDatabase;

// 版本 6：新增补剂表
dbInstance.version(6).stores({
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

export const db = dbInstance;

db.on('populate', async () => {
});
