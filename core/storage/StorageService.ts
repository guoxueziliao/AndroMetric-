import { db } from './db';
import { CycleEvent, LogEntry, PartnerProfile, PregnancyEvent, Snapshot, TagEntry, DataQualitySource, type AppSettings, type SnapshotData, type ExportSnapshot, type PornUseEvent, type MasturbationEvent, type SexEvent, type TrainingGoal, type GoalCheckin, type HealthProject, type HealthProjectPlan, type HealthProjectLog } from '../../domain';
import { validateLogEntry } from '../../utils/validators';
import { runMigrations, runPartnerMigrations, LATEST_VERSION } from './migration';
import { pluginManager } from '../../services/PluginManager';
import { Logger } from '../../services/LoggerService';
import { hydrateLog } from '../../utils/hydrateLog';
import { checkDataHealth, DataHealthReport } from '../../utils/dataHealthCheck';
import { repairLogUsingHistory } from '../../utils/historyRepair';
import { backupService } from '../../services/BackupService';
import { prepareLogForSave } from '../../utils/dataQuality';
import { APP_VERSION } from '../../app/appConfig';
import { getSnapshotIdsToPruneForRetention, getSnapshotSizeBytes, normalizeBackupRetention } from './snapshotRetention';
import { addSnapshotWithReadbackCheck } from './snapshotIntegrity';
import { getIdleAutoBackupStatus, LAST_AUTO_BACKUP_META_KEY } from './autoBackup';

const autoBackupAll = async (allLogs: LogEntry[], allPartners: PartnerProfile[], allTags: TagEntry[], allCycleEvents: CycleEvent[], allPregnancyEvents: PregnancyEvent[]) => {
  const [pu, mb, sx] = await Promise.all([db.porn_use_events.toArray(), db.masturbation_events.toArray(), db.sex_events.toArray()]);
  backupService.autoBackup(allLogs, allPartners, allTags, allCycleEvents, allPregnancyEvents, pu, mb, sx).catch(err => {
    Logger.warn('StorageService:AutoBackupFailed', err);
  });
};
import { mergeLogsForImport, mergeEventsForImport, normalizeTrainingGoals, normalizeGoalCheckins, type ImportConflictResolution } from './importMerge';
import { assertStorageCanCreateSnapshot, notifyStorageUsageChanged } from './storageEstimate';

const readSnapshotLocalState = (): Pick<ExportSnapshot, 'settings' | 'userName'> => {
    let settings: AppSettings | null = null;
    let userName: string | null = null;

    try {
        const settingsStr = localStorage.getItem('appSettings');
        settings = settingsStr ? JSON.parse(settingsStr) as AppSettings : null;
        userName = localStorage.getItem('userName');
    } catch (e) {
        Logger.error('StorageService:ReadSnapshotLocalStateFailed', e);
    }

    return { settings, userName };
};

const buildSnapshotData = (
    logs: LogEntry[],
    partners: PartnerProfile[],
    tags: TagEntry[],
    cycleEvents: CycleEvent[],
    pregnancyEvents: PregnancyEvent[],
    pornUseEvents: PornUseEvent[] = [],
    masturbationEvents: MasturbationEvent[] = [],
    sexEvents: SexEvent[] = [],
    trainingGoals: TrainingGoal[] = [],
    goalCheckins: GoalCheckin[] = [],
    healthProjects: HealthProject[] = [],
    healthProjectPlans: HealthProjectPlan[] = [],
    healthProjectLogs: HealthProjectLog[] = []
): SnapshotData => ({
    version: LATEST_VERSION,
    logs,
    partners,
    tags,
    cycleEvents,
    pregnancyEvents,
    pornUseEvents,
    masturbationEvents,
    sexEvents,
    trainingGoals,
    goalCheckins,
    healthProjects,
    healthProjectPlans,
    healthProjectLogs
});

const normalizeImportedSnapshots = (snapshots: unknown[]): Snapshot[] => (
    snapshots
        .filter((snapshot): snapshot is Snapshot => (
            typeof snapshot === 'object'
            && snapshot !== null
            && 'timestamp' in snapshot
            && 'data' in snapshot
        ))
        .map((snapshot) => {
            const { id: _id, ...rest } = snapshot;
            return {
                ...rest,
                timestamp: typeof rest.timestamp === 'number' ? rest.timestamp : Date.now(),
                dataVersion: typeof rest.dataVersion === 'number' ? rest.dataVersion : LATEST_VERSION,
                appVersion: typeof rest.appVersion === 'string' ? rest.appVersion : APP_VERSION,
                description: typeof rest.description === 'string' ? rest.description : '导入的快照',
                kind: rest.kind === 'auto-safety' ? 'auto-safety' : 'manual',
                sizeBytes: typeof rest.sizeBytes === 'number' ? rest.sizeBytes : JSON.stringify(rest.data).length,
                settings: rest.settings ?? null,
                userName: rest.userName ?? null,
                data: {
                    version: typeof rest.data.version === 'number' ? rest.data.version : LATEST_VERSION,
                    logs: Array.isArray(rest.data.logs) ? rest.data.logs : [],
                    partners: Array.isArray(rest.data.partners) ? rest.data.partners : [],
                    tags: Array.isArray(rest.data.tags) ? rest.data.tags : [],
                    cycleEvents: Array.isArray(rest.data.cycleEvents) ? rest.data.cycleEvents : [],
                    pregnancyEvents: Array.isArray(rest.data.pregnancyEvents) ? rest.data.pregnancyEvents : [],
                    pornUseEvents: Array.isArray(rest.data.pornUseEvents) ? rest.data.pornUseEvents : [],
                    masturbationEvents: Array.isArray(rest.data.masturbationEvents) ? rest.data.masturbationEvents : [],
                    sexEvents: Array.isArray(rest.data.sexEvents) ? rest.data.sexEvents : [],
                    trainingGoals: Array.isArray(rest.data.trainingGoals) ? rest.data.trainingGoals : [],
                    goalCheckins: Array.isArray(rest.data.goalCheckins) ? rest.data.goalCheckins : []
                }
            };
        })
);

export const StorageService = {
    async init() {
        try {
            const metaVersion = await db.meta.get('dataVersion');
            const currentDbVersion = metaVersion ? (metaVersion.value as number) : 0;

            if (currentDbVersion < LATEST_VERSION) {
                Logger.info('StorageService:MigrationStart', { from: currentDbVersion, to: LATEST_VERSION });
                const allLogs = await db.logs.toArray();
                const allPartners = await db.partners.toArray();
                if (allLogs.length > 0) {
                    await StorageService.snapshots.create(`系统自动备份: 升级前 (v${currentDbVersion})`, 'auto-safety');
                    const migrationResult = runMigrations({ version: currentDbVersion || 1, logs: allLogs });
                    const migratedPartners = runPartnerMigrations(allPartners, currentDbVersion || 1);
                    await db.transaction('rw', db.logs, db.partners, db.meta, async () => {
                        await db.logs.clear();
                        await db.logs.bulkPut(migrationResult.logs);
                        if (allPartners.length > 0) {
                            await db.partners.clear();
                            await db.partners.bulkPut(migratedPartners);
                        }
                        await db.meta.put({ key: 'dataVersion', value: LATEST_VERSION });
                    });
                } else {
                    if (allPartners.length > 0) {
                        const migratedPartners = runPartnerMigrations(allPartners, currentDbVersion || 1);
                        await db.partners.clear();
                        await db.partners.bulkPut(migratedPartners);
                    }
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
        const cycleEvents = await db.cycle_events.toArray();
        const pregnancyEvents = await db.pregnancy_events.toArray();
        const pornUseEvents = await db.porn_use_events.toArray();
        const masturbationEvents = await db.masturbation_events.toArray();
        const sexEvents = await db.sex_events.toArray();
        const trainingGoals = await db.training_goals.toArray();
        const goalCheckins = await db.goal_checkins.toArray();
        const healthProjects = await db.health_projects.toArray();
        const healthProjectPlans = await db.health_project_plans.toArray();
        const healthProjectLogs = await db.health_project_logs.toArray();
        const localState = readSnapshotLocalState();

        const snapshot: ExportSnapshot = {
            appName: '硬度日记',
            appVersion: APP_VERSION,
            dataVersion: LATEST_VERSION,
            exportDate: new Date().toISOString(),
            settings: localState.settings,
            userName: localState.userName,
            data: buildSnapshotData(logs, partners, tags, cycleEvents, pregnancyEvents, pornUseEvents, masturbationEvents, sexEvents, trainingGoals, goalCheckins, healthProjects, healthProjectPlans, healthProjectLogs)
        };
        return JSON.stringify(snapshot, null, 2);
    },

    async restoreSnapshot(
        jsonString: string,
        strategy: 'overwrite' | 'merge' = 'merge',
        conflictResolution: ImportConflictResolution = 'use-import'
    ): Promise<void> {
        try {
            const parsed = JSON.parse(jsonString);
            const data = parsed.data || parsed;

            // 1. 数据迁移与升级
            const migratedData = runMigrations(data);
            const newLogs = migratedData.logs;
            const importVersion = typeof data.version === 'number' ? data.version : LATEST_VERSION;
            const newPartners = runPartnerMigrations(data.partners || [], importVersion);
            const newTags = data.tags || [];
            const newCycleEvents = Array.isArray(data.cycleEvents) ? data.cycleEvents : [];
            const newPregnancyEvents = Array.isArray(data.pregnancyEvents) ? data.pregnancyEvents : [];
            const newSnapshots = normalizeImportedSnapshots(Array.isArray(data.snapshots) ? data.snapshots : []);
            // 三类成人行为事件（来自 migration 或导入数据）
            const newPornUseEvents: PornUseEvent[] = migratedData.pornUseEvents ?? [];
            const newMasturbationEvents: MasturbationEvent[] = migratedData.masturbationEvents ?? [];
            const newSexEvents: SexEvent[] = migratedData.sexEvents ?? [];
            const newTrainingGoals: TrainingGoal[] = migratedData.trainingGoals ?? [];
            const newGoalCheckins: GoalCheckin[] = migratedData.goalCheckins ?? [];
            const newHealthProjects: HealthProject[] = Array.isArray(data.healthProjects) ? data.healthProjects : [];
            const newHealthProjectPlans: HealthProjectPlan[] = Array.isArray(data.healthProjectPlans) ? data.healthProjectPlans : [];
            const newHealthProjectLogs: HealthProjectLog[] = Array.isArray(data.healthProjectLogs) ? data.healthProjectLogs : [];

            // Normalize training data before persisting
            const goalNorm = normalizeTrainingGoals(newTrainingGoals);
            const goalIds = new Set(goalNorm.goals.map((g) => g.id));
            const checkinNorm = normalizeGoalCheckins(newGoalCheckins, goalIds);

            const logsToImport = strategy === 'merge'
                ? mergeLogsForImport(await db.logs.toArray(), newLogs, conflictResolution)
                : newLogs;
            // 三类事件按 id 合并（merge 时）或直接覆盖
            const [existingPU, existingMB, existingSX] = strategy === 'merge'
                ? await Promise.all([db.porn_use_events.toArray(), db.masturbation_events.toArray(), db.sex_events.toArray()])
                : [[], [], []] as [PornUseEvent[], MasturbationEvent[], SexEvent[]];
            const puToImport = strategy === 'merge' ? mergeEventsForImport(existingPU, newPornUseEvents, conflictResolution) : newPornUseEvents;
            const mbToImport = strategy === 'merge' ? mergeEventsForImport(existingMB, newMasturbationEvents, conflictResolution) : newMasturbationEvents;
            const sxToImport = strategy === 'merge' ? mergeEventsForImport(existingSX, newSexEvents, conflictResolution) : newSexEvents;
            const [existingTG, existingGC] = strategy === 'merge'
                ? await Promise.all([db.training_goals.toArray(), db.goal_checkins.toArray()])
                : [[], []] as [TrainingGoal[], GoalCheckin[]];
            const tgToImport = strategy === 'merge' ? mergeEventsForImport(existingTG, goalNorm.goals, conflictResolution) : goalNorm.goals;
            const gcToImport = strategy === 'merge' ? mergeEventsForImport(existingGC, checkinNorm.checkins, conflictResolution) : checkinNorm.checkins;
            const [existingHP, existingHPL, existingHPLG] = strategy === 'merge'
                ? await Promise.all([db.health_projects.toArray(), db.health_project_plans.toArray(), db.health_project_logs.toArray()])
                : [[], [], []] as [HealthProject[], HealthProjectPlan[], HealthProjectLog[]];
            const hpToImport = strategy === 'merge' ? mergeEventsForImport(existingHP, newHealthProjects, conflictResolution) : newHealthProjects;
            const hplToImport = strategy === 'merge' ? mergeEventsForImport(existingHPL, newHealthProjectPlans, conflictResolution) : newHealthProjectPlans;
            const hplgToImport = strategy === 'merge' ? mergeEventsForImport(existingHPLG, newHealthProjectLogs, conflictResolution) : newHealthProjectLogs;

            // 2. 写入数据库
            await db.transaction('rw', [db.logs, db.partners, db.tags, db.meta, db.cycle_events, db.pregnancy_events, db.snapshots, db.porn_use_events, db.masturbation_events, db.sex_events, db.training_goals, db.goal_checkins, db.health_projects, db.health_project_plans, db.health_project_logs], async () => {
                if (strategy === 'overwrite') {
                    await db.logs.clear();
                    await db.partners.clear();
                    await db.tags.clear();
                    await db.cycle_events.clear();
                    await db.pregnancy_events.clear();
                    await db.porn_use_events.clear();
                    await db.masturbation_events.clear();
                    await db.sex_events.clear();
                    await db.training_goals.clear();
                    await db.goal_checkins.clear();
                    await db.health_projects.clear();
                    await db.health_project_plans.clear();
                    await db.health_project_logs.clear();
                }
                await db.logs.bulkPut(logsToImport);
                if (newPartners.length > 0) await db.partners.bulkPut(newPartners);
                if (newTags.length > 0) await db.tags.bulkPut(newTags);
                if (newCycleEvents.length > 0) await db.cycle_events.bulkPut(newCycleEvents);
                if (newPregnancyEvents.length > 0) await db.pregnancy_events.bulkPut(newPregnancyEvents);
                if (newSnapshots.length > 0) await db.snapshots.bulkAdd(newSnapshots);
                if (puToImport.length > 0) await db.porn_use_events.bulkPut(puToImport);
                if (mbToImport.length > 0) await db.masturbation_events.bulkPut(mbToImport);
                if (sxToImport.length > 0) await db.sex_events.bulkPut(sxToImport);
                if (tgToImport.length > 0) await db.training_goals.bulkPut(tgToImport);
                if (gcToImport.length > 0) await db.goal_checkins.bulkPut(gcToImport);
                if (hpToImport.length > 0) await db.health_projects.bulkPut(hpToImport);
                if (hplToImport.length > 0) await db.health_project_plans.bulkPut(hplToImport);
                if (hplgToImport.length > 0) await db.health_project_logs.bulkPut(hplgToImport);

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
        await db.transaction('rw', [db.logs, db.partners, db.meta, db.system_logs, db.snapshots, db.tags, db.cycle_events, db.pregnancy_events, db.porn_use_events, db.masturbation_events, db.sex_events, db.training_goals, db.goal_checkins, db.health_projects, db.health_project_plans, db.health_project_logs], async () => {
            await Promise.all([
                db.logs.clear(),
                db.partners.clear(),
                db.meta.clear(),
                db.system_logs.clear(),
                db.snapshots.clear(),
                db.tags.clear(),
                db.cycle_events.clear(),
                db.pregnancy_events.clear(),
                db.porn_use_events.clear(),
                db.masturbation_events.clear(),
                db.sex_events.clear(),
                db.training_goals.clear(),
                db.goal_checkins.clear(),
                db.health_projects.clear(),
                db.health_project_plans.clear(),
                db.health_project_logs.clear()
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
            all: async () => {
                const snapshots = await db.snapshots.orderBy('timestamp').reverse().toArray();
                return snapshots.map((snapshot) => (
                    typeof snapshot.sizeBytes === 'number' ? snapshot : { ...snapshot, sizeBytes: getSnapshotSizeBytes(snapshot) }
                ));
            }
        },
        getIdleAutoBackupStatus: async (intervalHours?: unknown) => {
            const [logCount, metaEntry, snapshots] = await Promise.all([
                db.logs.count(),
                db.meta.get(LAST_AUTO_BACKUP_META_KEY),
                db.snapshots.toArray()
            ]);
            const latestAutoSafetySnapshotAt = snapshots.reduce<number | null>((latest, snapshot) => {
                if (snapshot.kind !== 'auto-safety') return latest;
                return latest === null || snapshot.timestamp > latest ? snapshot.timestamp : latest;
            }, null);
            const metaTimestamp = typeof metaEntry?.value === 'number' ? metaEntry.value : null;
            const lastAutoBackupAt = Math.max(metaTimestamp || 0, latestAutoSafetySnapshotAt || 0) || null;

            return getIdleAutoBackupStatus({
                hasLogs: logCount > 0,
                lastAutoBackupAt,
                intervalHours
            });
        },
        createIdleAutoBackup: async (intervalHours?: unknown) => {
            const status = await StorageService.snapshots.getIdleAutoBackupStatus(intervalHours);
            if (!status.shouldCreate) return false;

            await StorageService.snapshots.create('24 小时定期自动备份', 'auto-safety');
            return true;
        },
        create: async (description: string, kind: Snapshot['kind'] = 'manual') => {
            await assertStorageCanCreateSnapshot();
            const logs = await db.logs.toArray();
            const partners = await db.partners.toArray();
            const tags = await db.tags.toArray();
            const cycleEvents = await db.cycle_events.toArray();
            const pregnancyEvents = await db.pregnancy_events.toArray();
            const pornUseEvents = await db.porn_use_events.toArray();
            const masturbationEvents = await db.masturbation_events.toArray();
            const sexEvents = await db.sex_events.toArray();
            const trainingGoals = await db.training_goals.toArray();
            const goalCheckins = await db.goal_checkins.toArray();
            const healthProjects = await db.health_projects.toArray();
            const healthProjectPlans = await db.health_project_plans.toArray();
            const healthProjectLogs = await db.health_project_logs.toArray();
            const meta = await db.meta.get('dataVersion');
            const dataVersion = meta ? meta.value : LATEST_VERSION;
            const localState = readSnapshotLocalState();
            const snapshotData = buildSnapshotData(logs, partners, tags, cycleEvents, pregnancyEvents, pornUseEvents, masturbationEvents, sexEvents, trainingGoals, goalCheckins, healthProjects, healthProjectPlans, healthProjectLogs);

            const snapshot: Snapshot = {
                timestamp: Date.now(),
                dataVersion,
                appVersion: APP_VERSION,
                description,
                kind,
                sizeBytes: JSON.stringify(snapshotData).length,
                settings: localState.settings,
                userName: localState.userName,
                data: snapshotData
            };

            await addSnapshotWithReadbackCheck(snapshot, db.snapshots);
            notifyStorageUsageChanged('snapshot-created');
            if (kind === 'auto-safety') {
                await db.meta.put({ key: LAST_AUTO_BACKUP_META_KEY, value: snapshot.timestamp });
                const retention = normalizeBackupRetention(localState.settings?.backupRetention);
                const pruneIds = getSnapshotIdsToPruneForRetention(await db.snapshots.toArray(), retention);
                if (pruneIds.length > 0) await db.snapshots.bulkDelete(pruneIds);
            }
        },
        applyRetention: async (retention: unknown) => {
            const pruneIds = getSnapshotIdsToPruneForRetention(await db.snapshots.toArray(), retention);
            if (pruneIds.length > 0) await db.snapshots.bulkDelete(pruneIds);
            return pruneIds.length;
        },
        restore: async (id: number) => {
            const snapshot = await db.snapshots.get(id);
            if (!snapshot) throw new Error('Snapshot not found');
            const data = snapshot.data;
            const normalizedPartners = runPartnerMigrations(data.partners || [], snapshot.dataVersion || LATEST_VERSION);

            await db.transaction('rw', [db.logs, db.partners, db.tags, db.meta, db.cycle_events, db.pregnancy_events, db.porn_use_events, db.masturbation_events, db.sex_events, db.training_goals, db.goal_checkins, db.health_projects, db.health_project_plans, db.health_project_logs], async () => {
                await db.logs.clear();
                await db.partners.clear();
                await db.tags.clear();
                await db.cycle_events.clear();
                await db.pregnancy_events.clear();
                await db.porn_use_events.clear();
                await db.masturbation_events.clear();
                await db.sex_events.clear();
                await db.training_goals.clear();
                await db.goal_checkins.clear();
                await db.health_projects.clear();
                await db.health_project_plans.clear();
                await db.health_project_logs.clear();
                await db.logs.bulkAdd(data.logs);
                if (normalizedPartners.length > 0) await db.partners.bulkAdd(normalizedPartners);
                if (data.tags) await db.tags.bulkAdd(data.tags);
                if (data.cycleEvents) await db.cycle_events.bulkAdd(data.cycleEvents);
                if (data.pregnancyEvents) await db.pregnancy_events.bulkAdd(data.pregnancyEvents);
                if (data.pornUseEvents && data.pornUseEvents.length > 0) await db.porn_use_events.bulkAdd(data.pornUseEvents);
                if (data.masturbationEvents && data.masturbationEvents.length > 0) await db.masturbation_events.bulkAdd(data.masturbationEvents);
                if (data.sexEvents && data.sexEvents.length > 0) await db.sex_events.bulkAdd(data.sexEvents);
                if (data.trainingGoals && data.trainingGoals.length > 0) await db.training_goals.bulkAdd(data.trainingGoals);
                if (data.goalCheckins && data.goalCheckins.length > 0) await db.goal_checkins.bulkAdd(data.goalCheckins);
                if (data.healthProjects && data.healthProjects.length > 0) await db.health_projects.bulkAdd(data.healthProjects);
                if (data.healthProjectPlans && data.healthProjectPlans.length > 0) await db.health_project_plans.bulkAdd(data.healthProjectPlans);
                if (data.healthProjectLogs && data.healthProjectLogs.length > 0) await db.health_project_logs.bulkAdd(data.healthProjectLogs);
                await db.meta.put({ key: 'dataVersion', value: snapshot.dataVersion });
            });

            // 内部快照还原也写回 LocalStorage
            if (snapshot.settings) {
                localStorage.setItem('appSettings', JSON.stringify(snapshot.settings));
                setTimeout(() => window.location.reload(), 500);
            }
            if (snapshot.userName) {
                localStorage.setItem('userName', snapshot.userName);
            }

            pluginManager.notifyDataChange(data.logs);
        },
        delete: (id: number) => db.snapshots.delete(id)
    },

    partners: {
        queries: {
            all: () => db.partners.toArray(),
            byId: (id: string) => db.partners.get(id)
        },
        save: (partner: PartnerProfile) => db.partners.put(runPartnerMigrations([partner], LATEST_VERSION)[0]),
        delete: (id: string) => db.partners.delete(id),
        bulkImport: (partners: PartnerProfile[]) => db.partners.bulkPut(runPartnerMigrations(partners, LATEST_VERSION))
    },

    cycleEvents: {
        queries: {
            all: () => db.cycle_events.orderBy('date').reverse().toArray(),
            byPartner: (partnerId: string) => db.cycle_events.where('partnerId').equals(partnerId).sortBy('date'),
            byPartnerInRange: async (partnerId: string, fromDate?: string, toDate?: string) => {
                const events = await db.cycle_events.where('partnerId').equals(partnerId).toArray();
                return events
                    .filter((event) => (!fromDate || event.date >= fromDate) && (!toDate || event.date <= toDate))
                    .sort((left, right) => left.date.localeCompare(right.date));
            }
        },
        save: async (event: CycleEvent) => {
            await db.cycle_events.put(event);
            const allLogs = await db.logs.toArray();
            pluginManager.notifyDataChange(allLogs);
            const allPartners = await db.partners.toArray();
            const allTags = await db.tags.toArray();
            const allCycleEvents = await db.cycle_events.toArray();
            const allPregnancyEvents = await db.pregnancy_events.toArray();
            autoBackupAll(allLogs, allPartners, allTags, allCycleEvents, allPregnancyEvents);
        },
        delete: async (id: string) => {
            await db.cycle_events.delete(id);
            const allLogs = await db.logs.toArray();
            pluginManager.notifyDataChange(allLogs);
            const allPartners = await db.partners.toArray();
            const allTags = await db.tags.toArray();
            const allCycleEvents = await db.cycle_events.toArray();
            const allPregnancyEvents = await db.pregnancy_events.toArray();
            autoBackupAll(allLogs, allPartners, allTags, allCycleEvents, allPregnancyEvents);
        },
        bulkImport: (events: CycleEvent[]) => db.cycle_events.bulkPut(events)
    },

    pregnancyEvents: {
        queries: {
            all: () => db.pregnancy_events.orderBy('date').reverse().toArray(),
            byPartner: (partnerId: string) => db.pregnancy_events.where('partnerId').equals(partnerId).sortBy('date'),
            byPartnerInRange: async (partnerId: string, fromDate?: string, toDate?: string) => {
                const events = await db.pregnancy_events.where('partnerId').equals(partnerId).toArray();
                return events
                    .filter((event) => (!fromDate || event.date >= fromDate) && (!toDate || event.date <= toDate))
                    .sort((left, right) => left.date.localeCompare(right.date));
            }
        },
        save: async (event: PregnancyEvent) => {
            await db.pregnancy_events.put(event);
            const allLogs = await db.logs.toArray();
            pluginManager.notifyDataChange(allLogs);
            const allPartners = await db.partners.toArray();
            const allTags = await db.tags.toArray();
            const allCycleEvents = await db.cycle_events.toArray();
            const allPregnancyEvents = await db.pregnancy_events.toArray();
            autoBackupAll(allLogs, allPartners, allTags, allCycleEvents, allPregnancyEvents);
        },
        delete: async (id: string) => {
            await db.pregnancy_events.delete(id);
            const allLogs = await db.logs.toArray();
            pluginManager.notifyDataChange(allLogs);
            const allPartners = await db.partners.toArray();
            const allTags = await db.tags.toArray();
            const allCycleEvents = await db.cycle_events.toArray();
            const allPregnancyEvents = await db.pregnancy_events.toArray();
            autoBackupAll(allLogs, allPartners, allTags, allCycleEvents, allPregnancyEvents);
        },
        bulkImport: (events: PregnancyEvent[]) => db.pregnancy_events.bulkPut(events)
    },

    pornUseEvents: {
        queries: {
            all: () => db.porn_use_events.orderBy('startedAt').reverse().toArray(),
            byTargetDate: (targetDate: string) => db.porn_use_events.where('targetDate').equals(targetDate).sortBy('startedAt'),
            byId: (id: string) => db.porn_use_events.get(id),
        },
        save: async (event: PornUseEvent) => {
            await db.porn_use_events.put(event);
        },
        delete: async (id: string) => {
            await db.porn_use_events.delete(id);
        },
        bulkImport: (events: PornUseEvent[]) => db.porn_use_events.bulkPut(events),
        clear: () => db.porn_use_events.clear(),
    },

    masturbationEvents: {
        queries: {
            all: () => db.masturbation_events.orderBy('startedAt').reverse().toArray(),
            byTargetDate: (targetDate: string) => db.masturbation_events.where('targetDate').equals(targetDate).sortBy('startedAt'),
            byId: (id: string) => db.masturbation_events.get(id),
        },
        save: async (event: MasturbationEvent) => {
            await db.masturbation_events.put(event);
        },
        delete: async (id: string) => {
            await db.masturbation_events.delete(id);
        },
        bulkImport: (events: MasturbationEvent[]) => db.masturbation_events.bulkPut(events),
        clear: () => db.masturbation_events.clear(),
    },

    sexEvents: {
        queries: {
            all: () => db.sex_events.orderBy('startedAt').reverse().toArray(),
            byTargetDate: (targetDate: string) => db.sex_events.where('targetDate').equals(targetDate).sortBy('startedAt'),
            byId: (id: string) => db.sex_events.get(id),
        },
        save: async (event: SexEvent) => {
            await db.sex_events.put(event);
        },
        delete: async (id: string) => {
            await db.sex_events.delete(id);
        },
        bulkImport: (events: SexEvent[]) => db.sex_events.bulkPut(events),
        clear: () => db.sex_events.clear(),
    },

    trainingGoals: {
        queries: {
            all: () => db.training_goals.orderBy('updatedAt').reverse().toArray(),
            byStatus: (status: string) => db.training_goals.where('status').equals(status).toArray(),
            byId: (id: string) => db.training_goals.get(id),
        },
        save: async (goal: TrainingGoal) => { await db.training_goals.put(goal); },
        delete: async (id: string) => { await db.training_goals.delete(id); },
        bulkImport: (goals: TrainingGoal[]) => db.training_goals.bulkPut(goals),
        clear: () => db.training_goals.clear(),
    },

    goalCheckins: {
        queries: {
            all: () => db.goal_checkins.orderBy('createdAt').reverse().toArray(),
            byGoalId: (goalId: string) => db.goal_checkins.where('goalId').equals(goalId).toArray(),
            byId: (id: string) => db.goal_checkins.get(id),
        },
        save: async (checkin: GoalCheckin) => { await db.goal_checkins.put(checkin); },
        delete: async (id: string) => { await db.goal_checkins.delete(id); },
        bulkImport: (checkins: GoalCheckin[]) => db.goal_checkins.bulkPut(checkins),
        clear: () => db.goal_checkins.clear(),
    },

    healthProjects: {
        queries: {
            all: () => db.health_projects.orderBy('updatedAt').reverse().toArray(),
            byStatus: (status: string) => db.health_projects.where('status').equals(status).toArray(),
            byId: (id: string) => db.health_projects.get(id),
        },
        save: async (project: HealthProject) => { await db.health_projects.put(project); },
        delete: async (id: string) => { await db.health_projects.delete(id); },
        bulkImport: (projects: HealthProject[]) => db.health_projects.bulkPut(projects),
        clear: () => db.health_projects.clear(),
    },

    healthProjectPlans: {
        queries: {
            all: () => db.health_project_plans.toArray(),
            byProjectId: (projectId: string) => db.health_project_plans.where('projectId').equals(projectId).toArray(),
            byId: (id: string) => db.health_project_plans.get(id),
        },
        save: async (plan: HealthProjectPlan) => { await db.health_project_plans.put(plan); },
        delete: async (id: string) => { await db.health_project_plans.delete(id); },
        bulkImport: (plans: HealthProjectPlan[]) => db.health_project_plans.bulkPut(plans),
        clear: () => db.health_project_plans.clear(),
    },

    healthProjectLogs: {
        queries: {
            all: () => db.health_project_logs.orderBy('targetDate').reverse().toArray(),
            byProjectId: (projectId: string) => db.health_project_logs.where('projectId').equals(projectId).toArray(),
            byDate: (targetDate: string) => db.health_project_logs.where('targetDate').equals(targetDate).toArray(),
            byId: (id: string) => db.health_project_logs.get(id),
        },
        save: async (log: HealthProjectLog) => { await db.health_project_logs.put(log); },
        delete: async (id: string) => { await db.health_project_logs.delete(id); },
        bulkImport: (logs: HealthProjectLog[]) => db.health_project_logs.bulkPut(logs),
        clear: () => db.health_project_logs.clear(),
    },

    logs: {
        queries: {
            allDesc: () => db.logs.orderBy('date').reverse().toArray(),
            get: (date: string) => db.logs.get(date)
        },
        get: (date: string) => db.logs.get(date),
save: async (log: LogEntry, source: DataQualitySource = 'manual') => {
      const { valid, errors } = validateLogEntry(log);
      if (!valid) throw new Error(errors[0]);
      const hydratedLog = hydrateLog({ ...log, updatedAt: Date.now() });
      const logToSave = prepareLogForSave(hydratedLog, source, Date.now());
      await db.logs.put(logToSave);
      notifyStorageUsageChanged('log-saved');

      const allLogs = await db.logs.toArray();
      pluginManager.notifyDataChange(allLogs);

      const allPartners = await db.partners.toArray();
      const allTags = await db.tags.toArray();
      const allCycleEvents = await db.cycle_events.toArray();
      const allPregnancyEvents = await db.pregnancy_events.toArray();

      autoBackupAll(allLogs, allPartners, allTags, allCycleEvents, allPregnancyEvents);
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
