
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
        try {
            const cleanLog = hydrateLog(log);
            await StorageService.logs.save(cleanLog);
        } catch (error: any) {
            throw new Error(error.message || '保存失败');
        }
    }, []);

    const getActivityTargetDate = useCallback(() => {
        const now = new Date();
        // 凌晨 3 点前属于生理上的“昨天”
        if (now.getHours() < 3) now.setDate(now.getDate() - 1);
        return now.toISOString().split('T')[0];
    }, []);

    const getSleepTargetDate = useCallback(() => {
        const now = new Date();
        const targetDate = new Date();
        // 睡眠记录归档逻辑：中午12点后开始的觉，属于“明天”醒来后的那份日记
        if (now.getHours() >= 12) targetDate.setDate(now.getDate() + 1);
        return targetDate.toISOString().split('T')[0];
    }, []);

    const quickAddHistory = (log: LogEntry, summary: string): LogEntry => {
        const historyEntry: ChangeRecord = {
            timestamp: Date.now(),
            summary: summary,
            details: [], // 快速记录通常不记录详细 diff
            type: 'quick'
        };
        return {
            ...log,
            changeHistory: [...(log.changeHistory || []), historyEntry]
        };
    };

    const saveAlcoholRecord = useCallback(async (record: AlcoholRecord) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        
        log.alcoholRecord = record;
        log.alcohol = record.totalGrams > 50 ? 'high' : record.totalGrams > 20 ? 'medium' : record.totalGrams > 0 ? 'low' : 'none';
        log.status = 'completed';
        log = quickAddHistory(log, record.ongoing ? '开始饮酒计时' : `完成饮酒记录 (${record.totalGrams}g)`);
        
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleAlcohol = useCallback(async () => {
        const all = await StorageService.logs.getAll();
        const ongoing = all.find(l => l.alcoholRecord?.ongoing);
        if (ongoing) return false;

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
    }, [saveAlcoholRecord]);

    const quickAddSex = useCallback(async (record: SexRecordDetails) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        
        const newSex = [...(log.sex || [])];
        const idx = newSex.findIndex(s => s.id === record.id);
        if (idx >= 0) newSex[idx] = record;
        else newSex.push(record);
        
        log.sex = newSex;
        log.status = 'completed';
        log = quickAddHistory(log, `记录性爱: ${record.partner || '伴侣'}`);
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    const quickAddMasturbation = useCallback(async (record: MasturbationRecordDetails) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        
        const newMb = [...(log.masturbation || [])];
        const idx = newMb.findIndex(m => m.id === record.id);
        if (idx >= 0) newMb[idx] = record;
        else newMb.push(record);
        
        log.masturbation = newMb;
        log.status = 'completed';
        log = quickAddHistory(log, record.status === 'inProgress' ? '开始自慰计时' : '完成自慰记录');
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    const saveExercise = useCallback(async (record: ExerciseRecord) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        
        const newEx = [...(log.exercise || [])];
        const idx = newEx.findIndex(e => e.id === record.id);
        if (idx >= 0) newEx[idx] = record;
        else newEx.push(record);
        
        log.exercise = newEx;
        log.status = 'completed';
        log = quickAddHistory(log, record.ongoing ? `开始${record.type}` : `完成${record.type}运动`);
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    const saveNap = useCallback(async (record: NapRecord) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        
        const currentNaps = log.sleep?.naps || [];
        const idx = currentNaps.findIndex(n => n.id === record.id);
        const nextNaps = idx >= 0 ? currentNaps.map(n => n.id === record.id ? record : n) : [...currentNaps, record];
        
        log.sleep = { ...(log.sleep || hydrateLog({date: dateStr}).sleep!), naps: nextNaps };
        log = quickAddHistory(log, record.ongoing ? '开始午休计时' : '完成午休记录');
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleNap = useCallback(async () => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        const currentNaps = existing?.sleep?.naps || [];
        const ongoing = currentNaps.find(n => n.ongoing);

        if (ongoing) {
            const startTime = ongoing.startTime;
            const endTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const [h1, m1] = startTime.split(':').map(Number);
            const [h2, m2] = endTime.split(':').map(Number);
            let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (diff < 0) diff += 1440;
            await saveNap({ ...ongoing, ongoing: false, endTime, duration: diff });
        } else {
            await saveNap({
                id: Date.now().toString(),
                startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                ongoing: true,
                quality: 3,
                environment: { location: 'home', temperature: 'comfortable' }
            });
        }
    }, [getActivityTargetDate, saveNap]);

    const toggleSleepLog = useCallback(async () => {
        const targetDateStr = getSleepTargetDate();
        const existing = await StorageService.logs.get(targetDateStr);
        let log = existing || hydrateLog({ date: targetDateStr });
        const isoNow = new Date().toISOString();

        if (log.sleep?.startTime && !log.sleep?.endTime) {
            // Wake up
            log.sleep = { ...log.sleep!, endTime: isoNow };
            log.status = 'completed';
            log = quickAddHistory(log, '起床 (一键完成睡眠)');
        } else {
            // Go to sleep
            log.sleep = { ...log.sleep!, startTime: isoNow, endTime: null };
            log.status = 'pending';
            log = quickAddHistory(log, '入睡 (开始记录今日睡眠)');
        }
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getSleepTargetDate]);

    return {
        logs, partners, isInitializing,
        addOrUpdateLog, deleteLog: StorageService.logs.delete,
        addOrUpdatePartner: StorageService.partners.save, deletePartner: StorageService.partners.delete,
        quickAddSex, quickAddMasturbation,
        saveExercise, saveAlcoholRecord,
        saveNap, toggleAlcohol, toggleNap, toggleSleepLog, 
        importLogs: StorageService.logs.bulkImport
    };
}
