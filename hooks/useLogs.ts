
import { useCallback, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { StorageService } from '../services/StorageService';
import { LogEntry, SexRecordDetails, MasturbationRecordDetails, PartnerProfile, ExerciseRecord, NapRecord, ChangeRecord, AlcoholRecord } from '../types';
import { hydrateLog } from '../utils/hydrateLog';

export function useLogs() {
    // Raw query from DB
    const rawLogs = useLiveQuery(StorageService.logs.queries.allDesc) || [];
    // Hydrate logs to Schema v1.0
    const logs = useMemo(() => rawLogs.map(hydrateLog), [rawLogs]);
    
    const partners = useLiveQuery(StorageService.partners.queries.all) || [];

    useEffect(() => {
        StorageService.init();
    }, []);

    const addOrUpdatePartner = useCallback(async (partner: PartnerProfile) => {
        try {
            await StorageService.partners.save(partner);
        } catch (error) {
            console.error('Failed to save partner:', error);
            throw new Error('保存伴侣档案失败');
        }
    }, []);

    const deletePartner = useCallback(async (id: string) => {
        try {
            await StorageService.partners.delete(id);
        } catch (error) {
            console.error('Failed to delete partner:', error);
            throw new Error('删除伴侣档案失败');
        }
    }, []);

    const addOrUpdateLog = useCallback(async (log: LogEntry) => {
        try {
            await StorageService.logs.save(log);
        } catch (error: any) {
            console.error('Failed to save log:', error);
            throw new Error(error.message || '保存记录失败，请重试');
        }
    }, []);

    const deleteLog = useCallback(async (date: string) => {
        try {
            await StorageService.logs.delete(date);
        } catch (error) {
            console.error('Failed to delete log:', error);
            throw new Error('删除记录失败');
        }
    }, []);

    const getActivityTargetDate = useCallback(() => {
        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour < 3) {
            now.setDate(now.getDate() - 1);
        }
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const getSleepTargetDate = useCallback(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const targetDate = new Date(now);
        if (currentHour >= 12) {
            targetDate.setDate(now.getDate() + 1);
        }
        const year = targetDate.getFullYear();
        const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
        const day = targetDate.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // --- Action Helpers ---

    const quickAddSex = useCallback(async (record: SexRecordDetails) => {
        const targetDateStr = getActivityTargetDate();
        // Hydration happens at StorageService.logs.get or manually here if needed, 
        // but since we update fields, getting a hydrated log is safer.
        const existingLog = await StorageService.logs.get(targetDateStr);
        
        try {
            if (existingLog) {
                const historyEntry: ChangeRecord = { 
                    timestamp: Date.now(), 
                    summary: '快速记录: 性生活',
                    details: [{ field: '性生活次数', oldValue: String(existingLog.sex?.length || 0), newValue: String((existingLog.sex?.length || 0) + 1) }],
                    type: 'quick'
                };
                await addOrUpdateLog({
                    ...existingLog,
                    sex: [...(existingLog.sex || []), record],
                    changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                });
            } else {
                const historyEntry: ChangeRecord = { 
                    timestamp: Date.now(), 
                    summary: '快速记录: 性生活',
                    details: [{ field: '性生活次数', oldValue: '0', newValue: '1' }],
                    type: 'quick'
                };
                // Use hydrateLog to create a valid empty log structure
                const skeleton = hydrateLog({ date: targetDateStr });
                const newLog: LogEntry = {
                    ...skeleton,
                    status: 'completed',
                    sex: [record],
                    changeHistory: [historyEntry],
                };
                await addOrUpdateLog(newLog);
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const quickAddMasturbation = useCallback(async (record: MasturbationRecordDetails) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const actionType = record.status === 'inProgress' ? '开始自慰' : '快速记录: 自慰';

        try {
            if (existingLog) {
                const historyEntry: ChangeRecord = { 
                    timestamp: Date.now(), 
                    summary: actionType,
                    details: [{ field: '自慰次数', oldValue: String(existingLog.masturbation?.length || 0), newValue: String((existingLog.masturbation?.length || 0) + 1) }],
                    type: 'quick'
                };
                
                // If it's a new record (not editing), append it. If ID exists, replace (though quickAdd usually implies new)
                const newMbList = [...(existingLog.masturbation || [])];
                const existingIdx = newMbList.findIndex(m => m.id === record.id);
                if (existingIdx > -1) newMbList[existingIdx] = record;
                else newMbList.push(record);

                await addOrUpdateLog({
                    ...existingLog,
                    masturbation: newMbList,
                    changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                });
            } else {
                const historyEntry: ChangeRecord = { 
                    timestamp: Date.now(), 
                    summary: actionType,
                    details: [{ field: '自慰次数', oldValue: '0', newValue: '1' }],
                    type: 'quick'
                };
                const skeleton = hydrateLog({ date: targetDateStr });
                const newLog: LogEntry = {
                    ...skeleton,
                    status: 'completed',
                    masturbation: [record],
                    changeHistory: [historyEntry],
                };
                await addOrUpdateLog(newLog);
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const saveExercise = useCallback(async (record: ExerciseRecord) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const actionType = record.ongoing ? '开始运动' : '记录运动';
        
        try {
            if (existingLog) {
                let newExercises = existingLog.exercise ? [...existingLog.exercise] : [];
                const exIdx = newExercises.findIndex(e => e.id === record.id);
                let details = [];
                if (exIdx > -1) {
                     newExercises[exIdx] = record;
                     details.push({ field: '运动更新', oldValue: '...', newValue: `${record.type} (${record.duration}m)` });
                } else {
                     newExercises.push(record);
                     details.push({ field: '运动次数', oldValue: String(existingLog.exercise?.length || 0), newValue: String((existingLog.exercise?.length || 0) + 1) });
                }
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: actionType + ': ' + record.type, details, type: 'quick' };
                await addOrUpdateLog({
                    ...existingLog,
                    exercise: newExercises,
                    changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                });
            } else {
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: actionType + ': ' + record.type, details: [{ field: '运动次数', oldValue: '0', newValue: '1' }], type: 'quick' };
                const skeleton = hydrateLog({ date: targetDateStr });
                const newLog: LogEntry = {
                    ...skeleton,
                    status: 'completed',
                    exercise: [record],
                    changeHistory: [historyEntry],
                };
                await addOrUpdateLog(newLog);
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const saveNap = useCallback(async (record: NapRecord) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        
        try {
            if (existingLog) {
                let newNaps = existingLog.sleep?.naps ? [...existingLog.sleep.naps] : [];
                const napIdx = newNaps.findIndex(n => n.id === record.id);
                if (napIdx > -1) newNaps[napIdx] = record;
                else newNaps.push(record);
                
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '记录午休', details: [], type: 'quick' };
                await addOrUpdateLog({
                    ...existingLog,
                    sleep: { ...existingLog.sleep!, naps: newNaps },
                    changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                });
            } else {
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '记录午休', details: [], type: 'quick' };
                const skeleton = hydrateLog({ date: targetDateStr });
                const newLog: LogEntry = {
                    ...skeleton,
                    status: 'completed',
                    sleep: { ...skeleton.sleep!, naps: [record] },
                    changeHistory: [historyEntry]
                };
                await addOrUpdateLog(newLog);
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const saveAlcoholRecord = useCallback(async (record: AlcoholRecord) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const summaryText = `饮酒: ${record.totalGrams}g纯酒精`;
        const alcoholLevel = record.totalGrams > 50 ? 'high' : record.totalGrams > 20 ? 'medium' : record.totalGrams > 0 ? 'low' : 'none';

        try {
            if (existingLog) {
                const historyEntry: ChangeRecord = { 
                    timestamp: Date.now(), 
                    summary: summaryText,
                    details: [{ field: '酒精摄入', oldValue: existingLog.alcoholRecord ? `${existingLog.alcoholRecord.totalGrams}g` : '0g', newValue: `${record.totalGrams}g` }],
                    type: 'quick'
                };
                await addOrUpdateLog({
                    ...existingLog,
                    alcohol: alcoholLevel,
                    alcoholRecord: record,
                    changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                });
            } else {
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: summaryText, details: [], type: 'quick' };
                const skeleton = hydrateLog({ date: targetDateStr });
                const newLog: LogEntry = {
                    ...skeleton,
                    status: 'completed',
                    alcohol: alcoholLevel,
                    alcoholRecord: record,
                    changeHistory: [historyEntry]
                };
                await addOrUpdateLog(newLog);
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleNap = useCallback(async () => {
        // Use raw query here since we need to check ongoing status across all logs
        const allLogs = await StorageService.logs.getAll(); 
        const ongoingLog = allLogs.find(l => l.sleep?.naps?.some(n => n.ongoing));
        
        try {
            if (ongoingLog) {
                // We found one, let's hydrate it before working on it
                const hydratedOngoingLog = hydrateLog(ongoingLog);
                const ongoingNap = hydratedOngoingLog.sleep!.naps.find(n => n.ongoing)!;
                const now = new Date();
                const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                
                const [startH, startM] = ongoingNap.startTime.split(':').map(Number);
                const startDate = new Date(); startDate.setHours(startH); startDate.setMinutes(startM); startDate.setSeconds(0);
                
                let duration = Math.round((now.getTime() - startDate.getTime()) / 60000);
                if (duration < 0) duration += 24 * 60;
                if (duration === 0) duration = 1;

                const updatedNaps = hydratedOngoingLog.sleep!.naps.map(n => n.id === ongoingNap.id ? { ...n, ongoing: false, duration, endTime: nowStr } : n);
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: `完成午休 (${duration}m)`, details: [], type: 'quick' };

                await addOrUpdateLog({
                    ...hydratedOngoingLog,
                    sleep: { ...hydratedOngoingLog.sleep!, naps: updatedNaps },
                    changeHistory: [...(hydratedOngoingLog.changeHistory||[]), historyEntry]
                });
            } else {
                const targetDateStr = getActivityTargetDate();
                const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                const newNap: NapRecord = { id: Date.now().toString(), startTime: nowStr, ongoing: true, duration: 0, hasDream: false, dreamTypes: [] };
                const existingLog = await StorageService.logs.get(targetDateStr);

                if (existingLog) {
                    const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '开始午休', details: [], type: 'quick' };
                    await addOrUpdateLog({
                        ...existingLog,
                        sleep: { ...existingLog.sleep!, naps: [...(existingLog.sleep?.naps || []), newNap] },
                        changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                    });
                } else {
                    const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '开始午休', details: [], type: 'quick' };
                    const skeleton = hydrateLog({ date: targetDateStr });
                    const newLog: LogEntry = {
                        ...skeleton,
                        status: 'completed',
                        sleep: { ...skeleton.sleep!, naps: [newNap] },
                        changeHistory: [historyEntry]
                    };
                    await addOrUpdateLog(newLog);
                }
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleSleepLog = useCallback(async (pendingLog: LogEntry | undefined) => {
        try {
            if (pendingLog) {
                if (confirm('您确定要取消当前的睡眠记录吗？')) {
                    await deleteLog(pendingLog.date);
                }
            } else {
                const targetDateString = getSleepTargetDate();
                const existingLog = await StorageService.logs.get(targetDateString);
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '记录睡眠时间 (入睡)', details: [], type: 'quick' };

                if (existingLog) {
                    if (confirm(`检测到 ${targetDateString} 已有活动记录。要将睡眠状态合并到该记录中吗？`)) {
                        await addOrUpdateLog({
                            ...existingLog,
                            status: 'pending',
                            sleep: { ...existingLog.sleep!, startTime: new Date().toISOString() },
                            changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                        });
                    }
                } else {
                    const skeleton = hydrateLog({ date: targetDateString });
                    const newLog: LogEntry = {
                        ...skeleton,
                        status: 'pending',
                        // Defaults for new sleep log
                        sleep: { ...skeleton.sleep!, startTime: new Date().toISOString() },
                        changeHistory: [historyEntry]
                    };
                    await addOrUpdateLog(newLog);
                }
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, deleteLog, getSleepTargetDate]);

    const importLogs = useCallback(async (importedLogs: LogEntry[], importedPartners?: PartnerProfile[]) => {
        try {
            // Apply hydration to imported logs before saving
            const hydratedLogs = importedLogs.map(hydrateLog);
            await StorageService.logs.bulkImport(hydratedLogs);
            if (importedPartners && importedPartners.length > 0) {
                await StorageService.partners.bulkImport(importedPartners);
            }
        } catch (error) {
            console.error("Import failed", error);
            throw new Error('导入失败');
        }
    }, []);

    return {
        logs, partners,
        addOrUpdateLog, deleteLog,
        addOrUpdatePartner, deletePartner,
        quickAddSex, quickAddMasturbation,
        saveExercise, saveNap, saveAlcoholRecord,
        toggleNap, toggleSleepLog, importLogs
    };
}
