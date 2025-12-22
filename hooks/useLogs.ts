
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { StorageService } from '../services/StorageService';
import { LogEntry, SexRecordDetails, MasturbationRecordDetails, PartnerProfile, ExerciseRecord, NapRecord, ChangeRecord, AlcoholRecord, TagEntry, TagType, Supplement } from '../types';
import { hydrateLog } from '../utils/hydrateLog';
import { db } from '../db';

export function useLogs() {
    const rawLogs = useLiveQuery(StorageService.logs.queries.allDesc) || [];
    const logs = useMemo(() => rawLogs.map(hydrateLog), [rawLogs]);
    const partners = useLiveQuery(StorageService.partners.queries.all) || [];
    const userTags = useLiveQuery(() => db.tags.toArray()) || [];
    const supplements = useLiveQuery(() => db.supplements.toArray()) || [];
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const init = async () => {
            await StorageService.init();
            setIsInitializing(false);
        };
        init();
    }, []);

    const addOrUpdateTag = useCallback(async (tag: TagEntry) => {
        await StorageService.tags.add(tag);
    }, []);

    const deleteTag = useCallback(async (name: string, category: TagType) => {
        await StorageService.tags.delete(name, category);
    }, []);

    const addOrUpdateSupplement = useCallback(async (sup: Supplement) => {
        await db.supplements.put(sup);
    }, []);

    const deleteSupplement = useCallback(async (id: string) => {
        await db.supplements.delete(id);
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

    const quickAddSex = useCallback(async (record: SexRecordDetails) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        try {
            if (existingLog) {
                const historyEntry: ChangeRecord = { 
                    timestamp: Date.now(), 
                    summary: '快速记录: 性生活',
                    details: [{ field: '性生活次数', oldValue: String(existingLog.sex?.length || 0), newValue: String((existingLog.sex?.length || 0) + 1), category: 'sex' }],
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
                    details: [{ field: '性生活次数', oldValue: '0', newValue: '1', category: 'sex' }],
                    type: 'quick'
                };
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
                    details: [{ field: '自慰次数', oldValue: String(existingLog.masturbation?.length || 0), newValue: String((existingLog.masturbation?.length || 0) + 1), category: 'masturbation' }],
                    type: 'quick'
                };
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
                    details: [{ field: '自慰次数', oldValue: '0', newValue: '1', category: 'masturbation' }],
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

    const cancelOngoingMasturbation = useCallback(async () => {
        const logToUpdate = logs.find(l => l.masturbation?.some(m => m.status === 'inProgress'));
        if (logToUpdate) {
            const nextMb = logToUpdate.masturbation.filter(m => m.status !== 'inProgress');
            await addOrUpdateLog({ ...logToUpdate, masturbation: nextMb });
        }
    }, [logs, addOrUpdateLog]);

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
                     details.push({ field: '运动更新', oldValue: '...', newValue: `${record.type} (${record.duration}m)`, category: 'exercise' as const });
                } else {
                     newExercises.push(record);
                     details.push({ field: '运动次数', oldValue: String(existingLog.exercise?.length || 0), newValue: String((existingLog.exercise?.length || 0) + 1), category: 'exercise' as const });
                }
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: actionType + ': ' + record.type, details, type: 'quick' };
                await addOrUpdateLog({
                    ...existingLog,
                    exercise: newExercises,
                    changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                });
            } else {
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: actionType + ': ' + record.type, details: [{ field: '运动次数', oldValue: '0', newValue: '1', category: 'exercise' }], type: 'quick' };
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

    const cancelOngoingExercise = useCallback(async () => {
        const logToUpdate = logs.find(l => l.exercise?.some(e => e.ongoing));
        if (logToUpdate) {
            const nextExercises = logToUpdate.exercise.filter(e => !e.ongoing);
            await addOrUpdateLog({ ...logToUpdate, exercise: nextExercises });
        }
    }, [logs, addOrUpdateLog]);

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

    const toggleNap = useCallback(async () => {
        const allLogs = await StorageService.logs.getAll();
        const ongoingNapLog = allLogs.find(l => l.sleep?.naps?.some(n => n.ongoing));
        if (ongoingNapLog) {
            const nap = ongoingNapLog.sleep!.naps.find(n => n.ongoing);
            return nap;
        } else {
            const now = new Date();
            const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const newNap: NapRecord = {
                id: Date.now().toString(),
                startTime: nowStr,
                ongoing: true,
                duration: 0,
                quality: 3
            };
            await saveNap(newNap);
            return null;
        }
    }, [saveNap]);

    const cancelOngoingNap = useCallback(async () => {
        const allLogs = await StorageService.logs.getAll();
        const ongoingLog = allLogs.find(l => l.sleep?.naps?.some(n => n.ongoing));
        if (ongoingLog) {
            const nextNaps = ongoingLog.sleep!.naps.filter(n => !n.ongoing);
            await addOrUpdateLog({
                ...ongoingLog,
                sleep: { ...ongoingLog.sleep!, naps: nextNaps }
            });
        }
    }, [addOrUpdateLog]);

    const saveAlcoholRecord = useCallback(async (record: AlcoholRecord) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const summaryText = record.ongoing ? '酒局计时中' : `饮酒记录: ${record.totalGrams}g纯酒精`;
        try {
            if (existingLog) {
                const currentRecords = existingLog.alcoholRecords || [];
                const exists = currentRecords.find(r => r.id === record.id);
                const nextRecords = exists ? currentRecords.map(r => r.id === record.id ? record : r) : [...currentRecords, record];
                const totalGrams = nextRecords.reduce((s, r) => s + r.totalGrams, 0);
                const alcoholLevel = totalGrams > 50 ? 'high' : totalGrams > 20 ? 'medium' : totalGrams > 0 ? 'low' : 'none';
                const historyEntry: ChangeRecord = { 
                    timestamp: Date.now(), 
                    summary: summaryText,
                    details: [{ field: '总酒精摄入', oldValue: `${existingLog.alcoholRecords?.reduce((s,r) => s+r.totalGrams, 0) || 0}g`, newValue: `${totalGrams}g`, category: 'lifestyle' }],
                    type: 'quick'
                };
                await addOrUpdateLog({
                    ...existingLog,
                    alcohol: alcoholLevel,
                    alcoholRecords: nextRecords,
                    changeHistory: [...(existingLog.changeHistory || []), historyEntry]
                });
            } else {
                const alcoholLevel = record.totalGrams > 50 ? 'high' : record.totalGrams > 20 ? 'medium' : record.totalGrams > 0 ? 'low' : 'none';
                const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: summaryText, details: [], type: 'quick' };
                const skeleton = hydrateLog({ date: targetDateStr });
                const newLog: LogEntry = {
                    ...skeleton,
                    status: 'completed',
                    alcohol: alcoholLevel,
                    alcoholRecords: [record],
                    changeHistory: [historyEntry]
                };
                await addOrUpdateLog(newLog);
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleAlcohol = useCallback(async () => {
        const allLogs = await StorageService.logs.getAll();
        const ongoingLog = allLogs.find(l => l.alcoholRecords?.some(r => r.ongoing));
        if (ongoingLog) {
            return ongoingLog.alcoholRecords.find(r => r.ongoing);
        } else {
            const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const newRecord: AlcoholRecord = {
                id: Date.now().toString(),
                totalGrams: 0,
                durationMinutes: 0,
                isLate: new Date().getHours() < 5,
                items: [],
                startTime: nowStr,
                time: nowStr,
                ongoing: true
            };
            await saveAlcoholRecord(newRecord);
            return null;
        }
    }, [saveAlcoholRecord]);

    const cancelAlcoholRecord = useCallback(async () => {
        const allLogs = await StorageService.logs.getAll();
        const ongoingLog = allLogs.find(l => l.alcoholRecords?.some(r => r.ongoing));
        if (ongoingLog) {
            const nextRecords = ongoingLog.alcoholRecords.filter(r => !r.ongoing);
            const total = nextRecords.reduce((s,r) => s+r.totalGrams, 0);
            await addOrUpdateLog({
                ...ongoingLog,
                alcohol: total > 0 ? (total > 50 ? 'high' : total > 20 ? 'medium' : 'low') : 'none',
                alcoholRecords: nextRecords
            });
        }
    }, [addOrUpdateLog]);

    const toggleSleepLog = useCallback(async (pendingLog?: LogEntry) => {
        if (pendingLog) {
            await deleteLog(pendingLog.date);
        } else {
            const targetDateStr = getSleepTargetDate();
            const skeleton = hydrateLog({ date: targetDateStr });
            const newLog: LogEntry = {
                ...skeleton,
                status: 'pending',
                sleep: { ...skeleton.sleep!, startTime: new Date().toISOString() },
                updatedAt: Date.now(),
                changeHistory: [{ timestamp: Date.now(), summary: '开始睡觉', type: 'quick' }]
            };
            await addOrUpdateLog(newLog);
        }
    }, [addOrUpdateLog, deleteLog, getSleepTargetDate]);

    const importLogs = useCallback(async (importedLogs: LogEntry[], importedPartners?: PartnerProfile[]) => {
        if (importedLogs.length > 0) await StorageService.logs.bulkImport(importedLogs);
        if (importedPartners && importedPartners.length > 0) await StorageService.partners.bulkImport(importedPartners);
    }, []);

    return {
        logs, partners, userTags, supplements, isInitializing,
        addOrUpdateLog, deleteLog,
        addOrUpdatePartner, deletePartner,
        addOrUpdateTag, deleteTag,
        addOrUpdateSupplement, deleteSupplement,
        quickAddSex, quickAddMasturbation, cancelOngoingMasturbation,
        saveExercise, cancelOngoingExercise,
        saveNap, toggleNap, cancelOngoingNap,
        saveAlcoholRecord, toggleAlcohol, cancelAlcoholRecord,
        toggleSleepLog,
        importLogs
    };
}
