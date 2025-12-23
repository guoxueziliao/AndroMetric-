
import { db } from '../db';
import { LogEntry, PartnerProfile, Snapshot, Health, ChangeRecord, TagEntry } from '../types';
import { validateLogEntry } from '../utils/validators';
import { runMigrations, LATEST_VERSION } from '../utils/migration';
import { pluginManager } from './PluginManager';
import { Logger } from './LoggerService';
import { hydrateLog } from '../utils/hydrateLog';
import { checkDataHealth, DataHealthReport } from '../utils/dataHealthCheck';
import { repairLogUsingHistory } from '../utils/historyRepair';

export const StorageService = {
    async init() {
        try {
            const metaVersion = await db.meta.get('dataVersion');
            const currentDbVersion = metaVersion ? (metaVersion.value as number) : 0;

            if (currentDbVersion < LATEST_VERSION) {
                Logger.info('StorageService:MigrationStart', { from: currentDbVersion, to: LATEST_VERSION });
                const allLogs = await db.logs.toArray();
                if (allLogs.length > 0) {
                    await StorageService.snapshots.create(`系统自动备份: 升级前 (v${currentDbVersion})`);
                    const migrationResult = runMigrations({ version: currentDbVersion || 1, logs: allLogs });
                    await db.transaction('rw', db.logs, db.meta, async () => {
                        await db.logs.clear();
                        await db.logs.bulkPut(migrationResult.logs);
                        await db.meta.put({ key: 'dataVersion', value: LATEST_VERSION });
                    });
                } else {
                    await db.meta.put({ key: 'dataVersion', value: LATEST_VERSION });
                }
            }
            Logger.cleanup();
        } catch (err) {
            Logger.error('StorageService:InitFailed', err);
        }
    },

    async createSnapshot(): Promise<string> {
        const logs = await db.logs.toArray();
        const partners = await db.partners.toArray();
        const tags = await db.tags.toArray();
        
        // 抓取 LocalStorage 中的非数据库设置
        let appSettings = null;
        let userName = null;
        try {
            const settingsStr = localStorage.getItem('appSettings');
            appSettings = settingsStr ? JSON.parse(settingsStr) : null;
            userName = localStorage.getItem('userName');
        } catch (e) {
            console.error('Failed to capture localStorage for snapshot');
        }
        
        const snapshot = {
            appName: '硬度日记',
            appVersion: '0.0.6',
            dataVersion: LATEST_VERSION,
            exportDate: new Date().toISOString(),
            settings: appSettings,
            userName: userName,
            data: {
                version: LATEST_VERSION,
                logs: logs,
                partners: partners,
                tags: tags
            }
        };
        return JSON.stringify(snapshot, null, 2);
    },

    async restoreSnapshot(jsonString: string, strategy: 'overwrite' | 'merge' = 'merge'): Promise<void> {
        try {
            const parsed = JSON.parse(jsonString);
            const data = parsed.data || parsed;
            
            // 1. 数据迁移与升级
            const migratedData = runMigrations(data);
            const newLogs = migratedData.logs;
            const newPartners = data.partners || [];
            const newTags = data.tags || [];

            // 2. 写入数据库
            await db.transaction('rw', [db.logs, db.partners, db.tags, db.meta], async () => {
                if (strategy === 'overwrite') {
                    await db.logs.clear();
                    await db.partners.clear();
                    await db.tags.clear();
                }
                await db.logs.bulkPut(newLogs);
                if (newPartners.length > 0) await db.partners.bulkPut(newPartners);
                if (newTags.length > 0) await db.tags.bulkPut(newTags);
                
                // 同步数据版本号，避免导入后再次触发 migration
                await db.meta.put({ key: 'dataVersion', value: LATEST_VERSION });
            });

            // 3. 恢复应用设置 (LocalStorage)
            if (parsed.settings) {
                localStorage.setItem('appSettings', JSON.stringify(parsed.settings));
            }
            if (parsed.userName) {
                localStorage.setItem('userName', parsed.userName);
            }
            
            Logger.info('StorageService:RestoreSuccess', { count: newLogs.length, strategy });
            pluginManager.notifyDataChange(newLogs);
            
            // 如果恢复了设置，提示用户刷新以应用主题等变更
            if (parsed.settings || parsed.userName) {
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (e) {
            Logger.error('StorageService:RestoreFailed', e);
            throw new Error('快照还原失败: ' + (e as Error).message);
        }
    },

    /**
     * Runs a comprehensive health check on all data.
     */
    async runHealthCheck(): Promise<DataHealthReport> {
        const logs = await db.logs.toArray();
        const partners = await db.partners.toArray();
        return checkDataHealth(logs, partners);
    },

    /**
     * Attempts to repair corrupted or missing data using changeHistory and logical defaults.
     */
    async repairData(): Promise<number> {
        const logs = await db.logs.toArray();
        let repairCount = 0;
        const repairedLogs: LogEntry[] = [];

        for (const log of logs) {
            const { log: repaired, repaired: isRepaired } = repairLogUsingHistory(log);
            if (isRepaired) {
                repairedLogs.push(repaired);
                repairCount++;
            }
        }

        if (repairedLogs.length > 0) {
            await db.logs.bulkPut(repairedLogs);
            pluginManager.notifyDataChange(await db.logs.toArray());
        }

        return repairCount;
    },

    /**
     * Clears all data from IndexedDB.
     */
    async clearAllData(): Promise<void> {
        await db.transaction('rw', [db.logs, db.partners, db.meta, db.system_logs, db.snapshots, db.tags], async () => {
            await Promise.all([
                db.logs.clear(),
                db.partners.clear(),
                db.meta.clear(),
                db.system_logs.clear(),
                db.snapshots.clear(),
                db.tags.clear()
            ]);
        });
    },

    tags: {
        getAll: () => db.tags.toArray(),
        getByCategory: (cat: string) => db.tags.where('category').equals(cat).toArray(),
        add: (tag: TagEntry) => db.tags.put(tag),
        delete: (name: string, category: string) => db.tags.delete([name, category]),
        bulkAdd: (tags: TagEntry[]) => db.tags.bulkPut(tags)
    },

    snapshots: {
        queries: {
            all: () => db.snapshots.orderBy('timestamp').reverse().toArray()
        },
        create: async (description: string) => {
            const logs = await db.logs.toArray();
            const partners = await db.partners.toArray();
            const tags = await db.tags.toArray();
            const meta = await db.meta.get('dataVersion');
            
            // 内部快照也记录设置信息，确保回滚时设置也一致
            let appSettings = null;
            try {
                const s = localStorage.getItem('appSettings');
                appSettings = s ? JSON.parse(s) : null;
            } catch(e){}

            const snapshot: Snapshot = {
                timestamp: Date.now(),
                dataVersion: meta ? meta.value : LATEST_VERSION,
                appVersion: '0.0.6',
                description,
                data: { logs, partners, tags } as any // 快照结构扩展
            };
            // 将设置信息存入快照对象的冗余字段
            (snapshot as any).settings = appSettings;

            await db.snapshots.add(snapshot);
        },
        restore: async (id: number) => {
            const snapshot = await db.snapshots.get(id);
            if (!snapshot) throw new Error('Snapshot not found');
            const data = snapshot.data as any;
            
            await db.transaction('rw', [db.logs, db.partners, db.tags, db.meta], async () => {
                await db.logs.clear();
                await db.partners.clear();
                await db.tags.clear();
                await db.logs.bulkAdd(data.logs);
                await db.partners.bulkAdd(data.partners);
                if (data.tags) await db.tags.bulkAdd(data.tags);
                await db.meta.put({ key: 'dataVersion', value: snapshot.dataVersion });
            });

            // 内部快照还原也写回 LocalStorage
            if ((snapshot as any).settings) {
                localStorage.setItem('appSettings', JSON.stringify((snapshot as any).settings));
                setTimeout(() => window.location.reload(), 500);
            }

            pluginManager.notifyDataChange(data.logs);
        },
        delete: (id: number) => db.snapshots.delete(id)
    },

    partners: {
        queries: {
            all: () => db.partners.toArray()
        },
        save: (partner: PartnerProfile) => db.partners.put(partner),
        delete: (id: string) => db.partners.delete(id),
        bulkImport: (partners: PartnerProfile[]) => db.partners.bulkPut(partners)
    },

    logs: {
        queries: {
            allDesc: () => db.logs.orderBy('date').reverse().toArray(),
            get: (date: string) => db.logs.get(date)
        },
        get: (date: string) => db.logs.get(date),
        save: async (log: LogEntry) => {
            const { valid, errors } = validateLogEntry(log);
            if (!valid) throw new Error(errors[0]);
            const logToSave = hydrateLog({ ...log, updatedAt: Date.now() });
            await db.logs.put(logToSave);
            db.logs.toArray().then(allLogs => pluginManager.notifyDataChange(allLogs));
        },
        delete: async (date: string) => {
            await db.logs.delete(date);
            db.logs.toArray().then(allLogs => pluginManager.notifyDataChange(allLogs));
        },
        getAll: async () => {
            const rawLogs = await db.logs.toArray();
            return rawLogs.map(hydrateLog);
        },
        bulkImport: (logs: LogEntry[]) => db.logs.bulkPut(logs)
    }
};
