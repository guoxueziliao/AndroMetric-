
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { StorageService } from '../services/StorageService';
import { LogEntry, SexRecordDetails, MasturbationRecordDetails, PartnerProfile, ExerciseRecord, NapRecord, ChangeRecord, AlcoholRecord, ChangeDetail } from '../types';
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
            const logToSave = hydrateLog(log);
            await StorageService.logs.save(logToSave);
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
        // 中午 12 点后属于“明天”的记录（醒来的那份日记）
        if (now.getHours() >= 12) targetDate.setDate(now.getDate() + 1);
        return targetDate.toISOString().split('T')[0];
    }, []);

    const logChange = (log: LogEntry, summary: string, details: ChangeDetail[] = [], type: 'manual' | 'quick' | 'auto' = 'quick'): LogEntry => {
        const historyEntry: ChangeRecord = {
            timestamp: Date.now(),
            summary,
            details,
            type
        };
        return {
            ...log,
            changeHistory: [...(log.changeHistory || []), historyEntry]
        };
    };

    // 1. Alcohol
    const saveAlcoholRecord = useCallback(async (record: AlcoholRecord) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        log.alcoholRecord = record;
        log.alcohol = record.totalGrams > 50 ? 'high' : record.totalGrams > 20 ? 'medium' : record.totalGrams > 0 ? 'low' : 'none';
        log.status = 'completed';
        log = logChange(log, record.ongoing ? '开始饮酒计时' : `完成饮酒记录 (${record.totalGrams}g)`);
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    const toggleAlcohol = useCallback(async () => {
        const all = await StorageService.logs.getAll();
        const ongoing = all.find(l => l.alcoholRecord?.ongoing);
        if (ongoing) return false;
        const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        await saveAlcoholRecord({
            id: Date.now().toString(), startTime: nowStr, ongoing: true, totalGrams: 0, durationMinutes: 0, items: [], isLate: false, drunkLevel: 'none', location: '家', people: '独自', reason: '放松', time: nowStr
        });
        return true;
    }, [saveAlcoholRecord]);

    // 2. Masturbation
    const quickAddMasturbation = useCallback(async (record: MasturbationRecordDetails, cancelled?: boolean, reason?: string) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        
        if (cancelled) {
            log.masturbation = (log.masturbation || []).filter(m => m.id !== record.id);
            log = logChange(log, `取消自慰: ${reason || '无理由'}`);
        } else {
            const newList = [...(log.masturbation || [])];
            const idx = newList.findIndex(m => m.id === record.id);
            if (idx >= 0) newList[idx] = record;
            else newList.push(record);
            log.masturbation = newList;
            log.status = 'completed';
            log = logChange(log, record.status === 'inProgress' ? '开始自慰计时' : '完成自慰详情');
        }
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    // 3. Sex
    const quickAddSex = useCallback(async (record: SexRecordDetails, cancelled?: boolean) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        
        if (cancelled) {
            log.sex = (log.sex || []).filter(s => s.id !== record.id);
            log = logChange(log, '取消性爱计时');
        } else {
            const newList = [...(log.sex || [])];
            const idx = newList.findIndex(s => s.id === record.id);
            if (idx >= 0) newList[idx] = record;
            else newList.push(record);
            log.sex = newList;
            log.status = 'completed';
            log = logChange(log, record.ongoing ? '开始性爱计时' : `记录性爱: ${record.partner || '伴侣'}`);
        }
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    // 4. Exercise
    const saveExercise = useCallback(async (record: ExerciseRecord) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        const newList = [...(log.exercise || [])];
        const idx = newList.findIndex(e => e.id === record.id);
        if (idx >= 0) newList[idx] = record;
        else newList.push(record);
        log.exercise = newList;
        log.status = 'completed';
        log = logChange(log, record.ongoing ? `开始${record.type}` : `完成${record.type}`);
        await addOrUpdateLog(log);
    }, [addOrUpdateLog, getActivityTargetDate]);

    // 5. Sleep
    const toggleSleepLog = useCallback(async () => {
        const targetDateStr = getSleepTargetDate();
        const existing = await StorageService.logs.get(targetDateStr);
        let log = existing || hydrateLog({ date: targetDateStr });
        const isoNow = new Date().toISOString();

        if (log.sleep?.startTime && !log.sleep?.endTime) {
            log.sleep = { ...log.sleep!, endTime: isoNow };
            log.status = 'completed';
            log = logChange(log, '起床 (一键完成睡眠)', [], 'quick');
        } else {
            log.sleep = { ...log.sleep!, startTime: isoNow, endTime: null };
            log.status = 'pending';
            log = logChange(log, '入睡 (开始标记睡眠)', [], 'quick');
        }
        await addOrUpdateLog(log);
        return targetDateStr;
    }, [addOrUpdateLog, getSleepTargetDate]);

    // 6. Nap
    const saveNap = useCallback(async (record: NapRecord) => {
        const dateStr = getActivityTargetDate();
        const existing = await StorageService.logs.get(dateStr);
        let log = existing || hydrateLog({ date: dateStr });
        const currentNaps = log.sleep?.naps || [];
        const idx = currentNaps.findIndex(n => n.id === record.id);
        const nextNaps = idx >= 0 ? currentNaps.map(n => n.id === record.id ? record : n) : [...currentNaps, record];
        log.sleep = { ...(log.sleep || hydrateLog({date: dateStr}).sleep!), naps: nextNaps };
        log = logChange(log, record.ongoing ? '开始午休计时' : '完成午休记录');
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

    return {
        logs, partners, isInitializing,
        addOrUpdateLog, deleteLog: StorageService.logs.delete,
        addOrUpdatePartner: StorageService.partners.save, deletePartner: StorageService.partners.delete,
        quickAddSex, quickAddMasturbation,
        saveExercise, saveAlcoholRecord,
        saveNap, toggleAlcohol, toggleNap, toggleSleepLog, 
        importLogs: StorageService.logs.bulkImport,
        getSleepTargetDate, getActivityTargetDate
    };
}
