
import { db } from '../db';
import { LogEntry, PartnerProfile, StoredData, Snapshot, Health, ChangeRecord } from '../types';
import { validateLogEntry } from '../utils/validators';
import { runMigrations, LATEST_VERSION } from '../utils/migration';
import { pluginManager } from './PluginManager';
import { Logger } from './LoggerService';
import { hydrateLog } from '../utils/hydrateLog';
import { checkDataHealth, DataHealthReport } from '../utils/dataHealthCheck';
import { repairLogUsingHistory } from '../utils/historyRepair';

/**
 * StorageService
 * 
 * Encapsulates all local storage operations (IndexedDB via Dexie).
 * Adheres to "Local-First" architecture by ensuring all CRUD operations
 * are handled here, including validation, side-effects (like model updating),
 * and version migration.
 */
export const StorageService = {
    
    /**
     * Initializes the storage service.
     * Checks for data versioning and runs migrations if necessary.
     */
    async init() {
        try {
            // Get stored version from meta table
            const metaVersion = await db.meta.get('dataVersion');
            const currentDbVersion = metaVersion ? (metaVersion.value as number) : 0;

            if (currentDbVersion < LATEST_VERSION) {
                Logger.info('StorageService:MigrationStart', { from: currentDbVersion, to: LATEST_VERSION });
                console.log(`[StorageService] Upgrading database content from v${currentDbVersion} to v${LATEST_VERSION}...`);
                
                // 1. Fetch all logs
                const allLogs = await db.logs.toArray();
                
                if (allLogs.length > 0) {
                    // Auto-Backup before migration
                    await StorageService.snapshots.create(`系统自动备份: 升级前 (v${currentDbVersion})`);

                    // 2. Run Migration Logic
                    const migrationResult = runMigrations({ version: currentDbVersion || 1, logs: allLogs });
                    
                    // 3. Write back migrated logs in a transaction
                    await db.transaction('rw', db.logs, db.meta, async () => {
                        await db.logs.clear(); // Clear old structure if needed, or just overwrite
                        await db.logs.bulkPut(migrationResult.logs);
                        await db.meta.put({ key: 'dataVersion', value: LATEST_VERSION });
                    });
                    Logger.info('StorageService:MigrationSuccess', { count: migrationResult.logs.length });
                } else {
                    // If no logs, just update version to latest
                    await db.meta.put({ key: 'dataVersion', value: LATEST_VERSION });
                }
            }
            // Trigger cleanup of old logs occasionally
            Logger.cleanup();
        } catch (err) {
            Logger.error('StorageService:InitFailed', err);
            console.error("[StorageService] Error initializing/migrating DB:", err);
        }
    },

    /**
     * Runs a comprehensive data integrity check.
     */
    async runHealthCheck(): Promise<DataHealthReport> {
        const logs = await db.logs.toArray();
        const partners = await db.partners.toArray();
        
        const report = checkDataHealth(logs, partners);

        if (report.issues.length > 0) {
            Logger.warn('HealthCheck:IssuesFound', { count: report.issues.length, score: report.score });
        } else {
            Logger.info('HealthCheck:Healthy');
        }

        return report;
    },

    /**
     * Attempts to repair common data issues.
     */
    async repairData(): Promise<number> {
        const logs = await db.logs.toArray();
        const partners = await db.partners.toArray();
        const partnerNames = new Set(partners.map(p => p.name));
        const newPartners: PartnerProfile[] = [];
        
        let fixedCount = 0;

        const fixedLogs = logs.map(log => {
            // First pass: Hydrate to ensure structure
            // This fixes missing health, exercise[], etc. automatically
            let newLog = hydrateLog(log);
            let modified = false;

            // Pipeline 1: Historical Repair (Recover from changeHistory)
            const historyRepairResult = repairLogUsingHistory(newLog);
            if (historyRepairResult.repaired) {
                newLog = historyRepairResult.log;
                modified = true;
                
                // Add system trace
                const systemRepairRecord: ChangeRecord = {
                    timestamp: Date.now(),
                    summary: '系统自动修复 (v0.0.4)',
                    details: [{ field: 'System', oldValue: 'Corrupt/Missing', newValue: 'Repaired via History' }],
                    type: 'auto'
                };
                newLog.changeHistory = [...(newLog.changeHistory || []), systemRepairRecord];
            }

            // Pipeline 2: Logical Constraint Repairs
            // REMOVED: Auto-clamping ranges and swapping times violates Data Constitution (Section 5.4).
            // "System must not modify original user data even if it appears logically contradictory."

            // Repair 2.3: Ensure IDs on sub-records
            const ensureId = (arr: any[], prefix: string) => {
                if (!arr) return;
                arr.forEach((item, idx) => {
                    if (!item.id) {
                        item.id = `${prefix}_${newLog.date}_${Date.now()}_${idx}`;
                        modified = true;
                    }
                });
            };
            ensureId(newLog.sex || [], 'sex');
            ensureId(newLog.masturbation || [], 'mb');
            ensureId(newLog.exercise || [], 'ex');
            ensureId(newLog.sleep?.naps || [], 'nap');

            // Repair 2.3.1: Ensure IDs on ContentItems (Allowed System Repair C-H1)
            if (newLog.masturbation) {
                newLog.masturbation.forEach((m, mIdx) => {
                    if (m.contentItems && Array.isArray(m.contentItems)) {
                        const seenIds = new Set<string>();
                        m.contentItems.forEach((c, cIdx) => {
                            if (!c.id || seenIds.has(c.id)) {
                                c.id = `restored_content_${newLog.date}_${Date.now()}_${mIdx}_${cIdx}`;
                                modified = true;
                            }
                            seenIds.add(c.id);
                        });
                    }
                });
            }

            // Repair 2.4: Missing Partner Profiles & Legacy Sex Fields
            if (newLog.sex) {
                newLog.sex.forEach(sex => {
                    // Check for legacy top-level partner/location and migrate to interactions if empty
                    if ((!sex.interactions || sex.interactions.length === 0) && (sex.partner || sex.location)) {
                        sex.interactions = [{
                            id: `auto_mig_${Date.now()}`,
                            partner: sex.partner || '',
                            location: sex.location || '',
                            chain: []
                        }];
                        modified = true;
                    }

                    // Check for missing partner profiles
                    const checkPartner = (name: string) => {
                        if (name && !partnerNames.has(name) && !newPartners.some(p => p.name === name)) {
                            // Queue creation of missing partner
                            newPartners.push({
                                id: `restored_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                                name: name,
                                type: 'casual', // Default to casual
                                notes: '系统自动恢复的关联档案',
                                avatarColor: 'bg-slate-500'
                            });
                            modified = true; 
                        }
                    };

                    if (sex.partner) checkPartner(sex.partner);
                    if (sex.interactions) sex.interactions.forEach(i => i.partner && checkPartner(i.partner));
                });
            }
            
            // Check if log was updated by hydration or repair logic
            if (!log.health || !log.exercise || !log.sex) modified = true;

            if (modified) fixedCount++;
            return newLog;
        });

        // Batch Updates
        await db.transaction('rw', db.logs, db.partners, async () => {
            if (fixedCount > 0) {
                await db.logs.bulkPut(fixedLogs);
            }
            if (newPartners.length > 0) {
                await db.partners.bulkAdd(newPartners);
                Logger.info('DataRepair:PartnersRestored', { count: newPartners.length, names: newPartners.map(p => p.name) });
            }
        });

        Logger.info('DataRepair:Success', { fixedCount, restoredPartners: newPartners.length });
        return fixedCount;
    },

    /**
     * Utility for Snapshots (Backup)
     */
    async createSnapshot(): Promise<string> {
        const logs = await db.logs.toArray();
        const partners = await db.partners.toArray();
        const health = await checkDataHealth(logs, partners);
        
        const snapshot = {
            appName: '硬度日记',
            appVersion: '0.0.6',
            dataVersion: LATEST_VERSION,
            exportDate: new Date().toISOString(),
            dataHealth: {
                score: health.score,
                issues: health.issues.length
            },
            data: {
                version: LATEST_VERSION,
                logs: logs
            },
            partners: partners
        };
        return JSON.stringify(snapshot, null, 2);
    },

    /**
     * Utility for Restore/Import
     */
    async restoreSnapshot(jsonString: string, strategy: 'overwrite' | 'merge' = 'merge'): Promise<void> {
        try {
            const data = JSON.parse(jsonString);
            const migratedData = runMigrations(data.data || data); // Handle both nested and flat formats
            const newLogs = migratedData.logs;
            const newPartners = data.partners || [];

            await db.transaction('rw', db.logs, db.partners, async () => {
                if (strategy === 'overwrite') {
                    await db.logs.clear();
                    await db.partners.clear();
                }
                await db.logs.bulkPut(newLogs);
                if (newPartners.length > 0) await db.partners.bulkPut(newPartners);
            });
            
            Logger.info('StorageService:RestoreSuccess', { count: newLogs.length, strategy });
            pluginManager.notifyDataChange(newLogs);
        } catch (e) {
            Logger.error('StorageService:RestoreFailed', e);
            throw new Error('Snapshot restore failed: ' + (e as Error).message);
        }
    },

    async clearAllData() {
        await db.transaction('rw', db.logs, db.partners, db.meta, db.snapshots, async () => {
            await db.logs.clear();
            await db.partners.clear();
            await db.snapshots.clear();
            await db.meta.clear(); // Will trigger fresh init next time
        });
        Logger.info('StorageService:ClearAll');
    },

    snapshots: {
        queries: {
            all: () => db.snapshots.orderBy('timestamp').reverse().toArray()
        },
        create: async (description: string) => {
            const logs = await db.logs.toArray();
            const partners = await db.partners.toArray();
            const meta = await db.meta.get('dataVersion');
            
            const snapshot: Snapshot = {
                timestamp: Date.now(),
                dataVersion: meta ? meta.value : 0,
                appVersion: '0.0.6',
                description,
                data: { logs, partners }
            };
            
            await db.snapshots.add(snapshot);
            
            // Limit snapshots to last 10
            const count = await db.snapshots.count();
            if (count > 10) {
                const keys = await db.snapshots.orderBy('timestamp').keys();
                await db.snapshots.delete(keys[0] as number); // Delete oldest
            }
            Logger.info('Snapshot:Created', { description });
        },
        restore: async (id: number) => {
            const snapshot = await db.snapshots.get(id);
            if (!snapshot) throw new Error('Snapshot not found');
            
            await db.transaction('rw', db.logs, db.partners, db.meta, async () => {
                await db.logs.clear();
                await db.partners.clear();
                await db.logs.bulkAdd(snapshot.data.logs);
                await db.partners.bulkAdd(snapshot.data.partners);
                await db.meta.put({ key: 'dataVersion', value: snapshot.dataVersion });
            });
            Logger.info('Snapshot:Restored', { id });
            pluginManager.notifyDataChange(snapshot.data.logs);
        },
        delete: async (id: number) => {
            await db.snapshots.delete(id);
        }
    },

    logs: {
        queries: {
            allDesc: () => db.logs.orderBy('date').reverse().toArray(),
            get: (date: string) => db.logs.get(date)
        },

        save: async (log: LogEntry) => {
            try {
                // 1. Validation
                const { valid, errors } = validateLogEntry(log);
                if (!valid) {
                    Logger.warn('LogSave:ValidationFailed', { errors, date: log.date });
                    throw new Error(errors[0]); // Return first error to UI
                }

                // 2. Hydration before Save (Double safety)
                const logToSave = hydrateLog({ ...log, updatedAt: Date.now() });
                
                // 3. Persistence
                await db.logs.put(logToSave);
                Logger.info('LogSave:Success', { date: log.date });
                
                // 4. Side Effects (Plugin System)
                db.logs.toArray().then(allLogs => pluginManager.notifyDataChange(allLogs));
            } catch (e) {
                Logger.error('LogSave:Error', e, { date: log.date });
                throw e;
            }
        },

        get: async (date: string) => {
            const raw = await db.logs.get(date);
            return raw ? hydrateLog(raw) : undefined;
        },

        delete: async (date: string) => {
            try {
                await db.logs.delete(date);
                Logger.info('LogDelete:Success', { date });
                db.logs.toArray().then(allLogs => pluginManager.notifyDataChange(allLogs));
            } catch (e) {
                Logger.error('LogDelete:Error', e, { date });
                throw e;
            }
        },

        bulkImport: async (logs: LogEntry[]) => {
            try {
                Logger.info('BulkImport:Start', { count: logs.length });
                // Hydrate all imported logs
                const cleanLogs = logs.map(hydrateLog);
                await db.logs.bulkPut(cleanLogs);
                Logger.info('BulkImport:Success');
                db.logs.toArray().then(allLogs => pluginManager.notifyDataChange(allLogs));
            } catch (e) {
                Logger.error('BulkImport:Error', e);
                throw e;
            }
        },
        
        getAll: async () => {
            const rawLogs = await db.logs.toArray();
            return rawLogs.map(hydrateLog);
        }
    },

    partners: {
        queries: {
            all: () => db.partners.toArray()
        },

        save: async (partner: PartnerProfile) => {
            try {
                await db.partners.put(partner);
                Logger.info('PartnerSave:Success', { id: partner.id, name: partner.name });
            } catch (e) {
                Logger.error('PartnerSave:Error', e);
                throw e;
            }
        },

        delete: async (id: string) => {
            try {
                await db.partners.delete(id);
                Logger.info('PartnerDelete:Success', { id });
            } catch (e) {
                Logger.error('PartnerDelete:Error', e);
                throw e;
            }
        },

        bulkImport: async (partners: PartnerProfile[]) => {
            try {
                await db.partners.bulkPut(partners);
                Logger.info('PartnerImport:Success', { count: partners.length });
            } catch (e) {
                Logger.error('PartnerImport:Error', e);
                throw e;
            }
        }
    }
};
