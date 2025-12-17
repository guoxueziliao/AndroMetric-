
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { StorageService } from '../services/StorageService';
import { LogEntry, SexRecordDetails, MasturbationRecordDetails, PartnerProfile, ExerciseRecord, NapRecord, ChangeRecord, AlcoholRecord } from '../types';
import { hydrateLog } from '../utils/hydrateLog';

export function useLogs() {
    const rawLogs = useLiveQuery(StorageService.logs.queries.allDesc) || [];
    const logs = useMemo(() => rawLogs.map(hydrateLog), [rawLogs]);
    const partners = useLiveQuery(StorageService.partners.queries.all) || [];
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const init = async () => {
            await StorageService.init();
            setIsInitializing(false);
        };
        init();
    }, []);

    const addOrUpdateLog = useCallback(async (log: LogEntry) => {
        try { await StorageService.logs.save(log); } catch (error: any) { throw new Error(error.message || '保存失败'); }
    }, []);

    const getActivityTargetDate = useCallback(() => {
        const now = new Date();
        // 凌晨 3 点前属于“昨天”的生理日
        if (now.getHours() < 3) now.setDate(now.getDate() - 1);
        return now.toISOString().split('T')[0];
    }, []);

    const getSleepTargetDate = useCallback(() => {
        const now = new Date();
        const targetDate = new Date();
        // 中午 12 点后的睡眠属于“明天”的觉（即明早醒来的记录）
        if (now.getHours() >= 12) {
            targetDate.setDate(now.getDate() + 1);
        }
        return targetDate.toISOString().split('T')[0];
    }, []);

    const saveAlcoholRecord = useCallback(async (record: AlcoholRecord) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const alcoholLevel = record.totalGrams > 50 ? 'high' : record.totalGrams > 20 ? 'medium' : record.totalGrams > 0 ? 'low' : 'none';

        try {
            if (existingLog) {
                const historyEntry: ChangeRecord = { 
                    timestamp: Date.now(), 
                    summary: record.ongoing ? '开始饮酒' : `完成饮酒 (${record.totalGrams}g)`,
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
                const skeleton = hydrateLog({ date: targetDateStr });
                await addOrUpdateLog({
                    ...skeleton,
                    status: 'completed',
                    alcohol: alcoholLevel,
                    alcoholRecord: record,
                    changeHistory: [{ timestamp: Date.now(), summary: '快速记录饮酒', details: [], type: 'quick' }]
                });
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleAlcohol = useCallback(async () => {
        const allLogs = await StorageService.logs.getAll();
        const ongoingLog = allLogs.find(l => l.alcoholRecord?.ongoing);
        
        if (!ongoingLog) {
            const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            await saveAlcoholRecord({
                id: Date.now().toString(),
                startTime: nowStr,
                ongoing: true,
                totalGrams: 0,
                durationMinutes: 0,
                items: [],
                isLate: false,
                drunkLevel: 'none',
                location: '家',
                people: '独自',
                reason: '放松',
                time: nowStr
            });
            return true;
        }
        return false;
    }, [saveAlcoholRecord]);

    const quickAddSex = useCallback(async (record: SexRecordDetails) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const log = existingLog || hydrateLog({ date: targetDateStr });
        const newSex = [...(log.sex || [])];
        const idx = newSex.findIndex(s => s.id === record.id);
        if (idx >= 0) newSex[idx] = record;
        else newSex.push(record);
        await addOrUpdateLog({ ...log, sex: newSex, status: 'completed' });
    }, [addOrUpdateLog, getActivityTargetDate]);

    const quickAddMasturbation = useCallback(async (record: MasturbationRecordDetails) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const log = existingLog || hydrateLog({ date: targetDateStr });
        const newMb = [...(log.masturbation || [])];
        const idx = newMb.findIndex(m => m.id === record.id);
        if (idx >= 0) newMb[idx] = record;
        else newMb.push(record);
        await addOrUpdateLog({ ...log, masturbation: newMb, status: 'completed' });
    }, [addOrUpdateLog, getActivityTargetDate]);

    const saveExercise = useCallback(async (record: ExerciseRecord) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const log = existingLog || hydrateLog({ date: targetDateStr });
        const newEx = [...(log.exercise || [])];
        const idx = newEx.findIndex(e => e.id === record.id);
        if (idx >= 0) newEx[idx] = record;
        else newEx.push(record);
        await addOrUpdateLog({ ...log, exercise: newEx, status: 'completed' });
    }, [addOrUpdateLog, getActivityTargetDate]);

    const saveNap = useCallback(async (record: NapRecord) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const log = existingLog || hydrateLog({ date: targetDateStr });
        const currentNaps = log.sleep?.naps || [];
        const idx = currentNaps.findIndex(n => n.id === record.id);
        const nextNaps = idx >= 0 ? currentNaps.map(n => n.id === record.id ? record : n) : [...currentNaps, record];
        await addOrUpdateLog({
            ...log,
            sleep: { ...(log.sleep || hydrateLog({date: targetDateStr}).sleep!), naps: nextNaps }
        });
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleNap = useCallback(async () => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const log = existingLog || hydrateLog({ date: targetDateStr });
        const currentNaps = log.sleep?.naps || [];
        const ongoing = currentNaps.find(n => n.ongoing);

        if (ongoing) {
            const startTime = ongoing.startTime;
            const endTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const [h1, m1] = startTime.split(':').map(Number);
            const [h2, m2] = endTime.split(':').map(Number);
            let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (diff < 0) diff += 1440;
            const updated = { ...ongoing, ongoing: false, endTime, duration: diff };
            await saveNap(updated);
        } else {
            const newNap: NapRecord = {
                id: Date.now().toString(),
                startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                ongoing: true,
                quality: 3,
                environment: { location: 'home', temperature: 'comfortable' }
            };
            await saveNap(newNap);
        }
    }, [getActivityTargetDate, saveNap]);

    const toggleSleepLog = useCallback(async (pendingLog?: LogEntry) => {
        const targetDateStr = getSleepTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        const log = existingLog || hydrateLog({ date: targetDateStr });
        const isoNow = new Date().toISOString();

        if (log.sleep?.startTime && !log.sleep?.endTime) {
            // Wake up
            await addOrUpdateLog({
                ...log,
                sleep: { ...log.sleep!, endTime: isoNow },
                status: 'completed'
            });
        } else {
            // Go to sleep
            await addOrUpdateLog({
                ...log,
                sleep: { ...log.sleep!, startTime: isoNow, endTime: null },
                status: 'pending'
            });
        }
    }, [addOrUpdateLog, getSleepTargetDate]);

    const importLogs = useCallback(async (importedLogs: LogEntry[], importedPartners?: PartnerProfile[]) => {
        try {
            if (importedLogs.length > 0) await StorageService.logs.bulkImport(importedLogs);
            if (importedPartners && importedPartners.length > 0) await StorageService.partners.bulkImport(importedPartners);
        } catch (e) { throw e; }
    }, []);

    return {
        logs, partners, isInitializing,
        addOrUpdateLog, deleteLog: StorageService.logs.delete,
        addOrUpdatePartner: StorageService.partners.save, deletePartner: StorageService.partners.delete,
        quickAddSex, quickAddMasturbation,
        saveExercise, saveAlcoholRecord,
        saveNap,
        toggleAlcohol, toggleNap, toggleSleepLog, importLogs
    };
}
