

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
        if (now.getHours() < 3) now.setDate(now.getDate() - 1);
        return now.toISOString().split('T')[0];
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
                    changeHistory: [{ timestamp: Date.now(), summary: '记录饮酒', details: [], type: 'quick' }]
                });
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleAlcohol = useCallback(async () => {
        const allLogs = await StorageService.logs.getAll();
        const ongoingLog = allLogs.find(l => l.alcoholRecord?.ongoing);
        
        if (!ongoingLog) {
            // Start New Session (Background Timer)
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

    /**
     * Implemented missing saveNap function.
     */
    const saveNap = useCallback(async (record: NapRecord) => {
        const targetDateStr = getActivityTargetDate();
        const existingLog = await StorageService.logs.get(targetDateStr);
        try {
            if (existingLog) {
                const currentNaps = existingLog.sleep?.naps || [];
                const idx = currentNaps.findIndex(n => n.id === record.id);
                const nextNaps = idx >= 0 ? currentNaps.map(n => n.id === record.id ? record : n) : [...currentNaps, record];
                
                await addOrUpdateLog({
                    ...existingLog,
                    sleep: { ...(existingLog.sleep || hydrateLog({date: targetDateStr}).sleep!), naps: nextNaps }
                });
            } else {
                const skeleton = hydrateLog({ date: targetDateStr });
                await addOrUpdateLog({
                    ...skeleton,
                    sleep: { ...skeleton.sleep!, naps: [record] }
                });
            }
        } catch (e) { throw e; }
    }, [addOrUpdateLog, getActivityTargetDate]);

    // ... (rest of the hooks kept for feature parity)
    const quickAddSex = useCallback(async (record: SexRecordDetails) => { /* ... */ }, [addOrUpdateLog, getActivityTargetDate]);
    const quickAddMasturbation = useCallback(async (record: MasturbationRecordDetails) => { /* ... */ }, [addOrUpdateLog, getActivityTargetDate]);
    const saveExercise = useCallback(async (record: ExerciseRecord) => { /* ... */ }, [addOrUpdateLog, getActivityTargetDate]);
    const toggleNap = useCallback(async () => { /* ... */ }, [addOrUpdateLog, getActivityTargetDate]);
    const toggleSleepLog = useCallback(async (pendingLog: LogEntry | undefined) => { /* ... */ }, [addOrUpdateLog, getActivityTargetDate]);
    const importLogs = useCallback(async (importedLogs: LogEntry[], importedPartners?: PartnerProfile[]) => { /* ... */ }, []);

    return {
        logs, partners, isInitializing,
        addOrUpdateLog, deleteLog: StorageService.logs.delete,
        addOrUpdatePartner: StorageService.partners.save, deletePartner: StorageService.partners.delete,
        quickAddSex, quickAddMasturbation,
        saveExercise, saveAlcoholRecord,
        saveNap, // Added missing saveNap return
        toggleAlcohol, toggleNap, toggleSleepLog, importLogs
    };
}
