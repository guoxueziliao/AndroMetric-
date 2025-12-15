
import { db } from '../db';
import { LogEntry, Snapshot } from '../types';
import { DataHealthReport } from '../utils/dataHealthCheck';
import { runMigrations } from '../utils/migration';

export const StorageService = {
    snapshots: {
        queries: {
            all: () => db.snapshots.orderBy('timestamp').reverse().toArray()
        },
        create: async (description: string) => {
            const logs = await db.logs.toArray();
            const partners = await db.partners.toArray();
            const snapshot: Snapshot = {
                timestamp: Date.now(),
                dataVersion: 1,
                appVersion: '0.0.5',
                description,
                data: { logs, partners }
            };
            await db.snapshots.add(snapshot);
        },
        restore: async (id: number) => {
            const snap = await db.snapshots.get(id);
            if(snap) {
                await db.logs.clear();
                await db.partners.clear();
                await db.logs.bulkAdd(snap.data.logs);
                await db.partners.bulkAdd(snap.data.partners);
            }
        },
        delete: async (id: number) => {
            await db.snapshots.delete(id);
        }
    },
    
    runHealthCheck: async (): Promise<DataHealthReport> => {
        const count = await db.logs.count();
        return { score: 100, issues: [], totalRecords: count, canRepair: false };
    },
    
    repairData: async (): Promise<number> => {
        return 0;
    },
    
    createSnapshot: async (): Promise<string> => {
        const logs = await db.logs.toArray();
        const partners = await db.partners.toArray();
        return JSON.stringify({ version: 1, logs, partners });
    },
    
    restoreSnapshot: async (jsonStr: string, mode: 'merge' | 'replace') => {
        let rawData;
        try {
            rawData = JSON.parse(jsonStr);
        } catch (e) {
            throw new Error('文件格式错误 (非 JSON)');
        }

        // Use migration logic to parse and hydrate
        const { logs, partners } = runMigrations(rawData);

        if (logs.length === 0 && partners.length === 0) {
             throw new Error('文件中未发现有效的日记或伴侣数据');
        }

        if(mode === 'replace') {
            await db.logs.clear();
            await db.partners.clear();
        }
        
        if(logs.length > 0) await db.logs.bulkPut(logs);
        if(partners.length > 0) await db.partners.bulkPut(partners);
    },
    
    clearAllData: async () => {
        await db.delete();
        await db.open();
    }
};
