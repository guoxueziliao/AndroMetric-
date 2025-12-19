
import Dexie, { Table } from 'dexie';
import { LogEntry, PartnerProfile, Snapshot } from './types';

// Define and export SystemLog interface used by LoggerService
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
  meta: Table<{key: string, value: any}, string>;
  snapshots: Table<Snapshot, number>;
  // Add system_logs table to the database type definition
  system_logs: Table<SystemLog, number>;
};

const dbInstance = new Dexie('HardnessDiaryDB') as HardnessDiaryDatabase;

// Bumped version from 4 to 5 to include the new system_logs table
dbInstance.version(5).stores({
  logs: '&date, status',
  partners: '&id',
  meta: 'key',
  snapshots: '++id, timestamp',
  // Defined system_logs with an auto-incrementing id and indexed timestamp/level
  system_logs: '++id, timestamp, level'
});

export const db = dbInstance;
