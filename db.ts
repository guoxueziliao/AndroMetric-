
import Dexie, { Table } from 'dexie';
import { LogEntry, PartnerProfile, Snapshot } from './types';
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
  logs: Table<LogEntry, string>; // Primary key is date (string)
  partners: Table<PartnerProfile, string>; // Primary key is id
  meta: Table<MetaEntry, string>; // Store db version etc.
  system_logs: Table<SystemLog, number>; // New telemetry table
  snapshots: Table<Snapshot, number>; // Restore points
};

const dbInstance = new Dexie('HardnessDiaryDB') as HardnessDiaryDatabase;

// Version 4: Add snapshots
dbInstance.version(4).stores({
  logs: '&date, status',
  partners: '&id',
  meta: 'key',
  system_logs: '++id, timestamp, level, action',
  snapshots: '++id, timestamp'
});

// Version 3: Add system_logs
dbInstance.version(3).stores({
  logs: '&date, status',
  partners: '&id',
  meta: 'key',
  system_logs: '++id, timestamp, level, action'
});

// Define tables and indexes
// Version 2 adds meta table
dbInstance.version(2).stores({
  logs: '&date, status', // Primary key: date
  partners: '&id',
  meta: 'key'
});

// Fallback for V1
dbInstance.version(1).stores({
  logs: '&date, status',
  partners: '&id'
});

export const db = dbInstance;

// Populate / Migrate data from LocalStorage if DB is empty
db.on('populate', async () => {
  const LOGS_KEY = 'morningWoodLogs';
  const PARTNERS_KEY = 'sexPartners';

  const storedLogs = localStorage.getItem(LOGS_KEY);
  const storedPartners = localStorage.getItem(PARTNERS_KEY);

  if (storedLogs) {
    try {
      const parsedData = JSON.parse(storedLogs);
      // Run migrations to ensure data matches current TypeScript definitions
      // This handles the "old data structure" -> "new data structure" conversion
      const migrationResult = runMigrations(parsedData);
      const migratedLogs = migrationResult.logs;

      if (migratedLogs.length > 0) {
        await db.logs.bulkAdd(migratedLogs);
        console.log(`[Migration] Successfully migrated ${migratedLogs.length} logs from LocalStorage to IndexedDB.`);
      }
    } catch (e) {
      console.error("[Migration] Failed to migrate logs:", e);
    }
  }

  if (storedPartners) {
    try {
      const parsedPartners = JSON.parse(storedPartners);
      if (Array.isArray(parsedPartners) && parsedPartners.length > 0) {
        await db.partners.bulkAdd(parsedPartners);
        console.log(`[Migration] Successfully migrated ${parsedPartners.length} partners from LocalStorage to IndexedDB.`);
      }
    } catch (e) {
      console.error("[Migration] Failed to migrate partners:", e);
    }
  }
});
