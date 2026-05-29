import Dexie, { Table } from 'dexie';
import { CycleEvent, LogEntry, PartnerProfile, PregnancyEvent, Snapshot, TagEntry, PornUseEvent, MasturbationEvent, SexEvent, TrainingGoal, GoalCheckin } from '../../domain';

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
  cycle_events: Table<CycleEvent, string>;
  pregnancy_events: Table<PregnancyEvent, string>;
  meta: Table<MetaEntry, string>;
  system_logs: Table<SystemLog, number>;
  snapshots: Table<Snapshot, number>;
  tags: Table<TagEntry, [string, string]>; // 复合主键 [name, category]
  porn_use_events: Table<PornUseEvent, string>;
  masturbation_events: Table<MasturbationEvent, string>;
  sex_events: Table<SexEvent, string>;
  training_goals: Table<TrainingGoal, string>;
  goal_checkins: Table<GoalCheckin, string>;
};

const dbInstance = new Dexie('HardnessDiaryDB') as HardnessDiaryDatabase;

dbInstance.version(8).stores({
  logs: '&date, status',
  partners: '&id',
  cycle_events: '&id, partnerId, date, kind, source',
  pregnancy_events: '&id, partnerId, date, kind, source',
  meta: 'key',
  system_logs: '++id, timestamp, level, action',
  snapshots: '++id, timestamp',
  tags: '[name+category], category, dimension',
  porn_use_events: '&id, startedAt, targetDate, status, source',
  masturbation_events: '&id, startedAt, targetDate, status, source',
  sex_events: '&id, startedAt, targetDate, status, source',
  training_goals: '&id, status, category, startDate, updatedAt',
  goal_checkins: '&id, goalId, targetDate, createdAt'
});

// Version 7: Add adult behavior event tables
dbInstance.version(7).stores({
  logs: '&date, status',
  partners: '&id',
  cycle_events: '&id, partnerId, date, kind, source',
  pregnancy_events: '&id, partnerId, date, kind, source',
  meta: 'key',
  system_logs: '++id, timestamp, level, action',
  snapshots: '++id, timestamp',
  tags: '[name+category], category, dimension',
  porn_use_events: '&id, startedAt, targetDate, status, source',
  masturbation_events: '&id, startedAt, targetDate, status, source',
  sex_events: '&id, startedAt, targetDate, status, source'
});

// Version 6: Add cycle_events and pregnancy_events tables
dbInstance.version(6).stores({
  logs: '&date, status',
  partners: '&id',
  cycle_events: '&id, partnerId, date, kind, source',
  pregnancy_events: '&id, partnerId, date, kind, source',
  meta: 'key',
  system_logs: '++id, timestamp, level, action',
  snapshots: '++id, timestamp',
  tags: '[name+category], category, dimension'
});

// Version 5: Add tags table for user-defined tags
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
  // 以前的 LocalStorage 迁移逻辑保持不变
});
