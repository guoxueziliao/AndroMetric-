import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { LogEntry, PartnerProfile } from '../types';
import { getTodayDateString } from '../utils/helpers';
import { hydrateLog } from '../utils/hydrateLog';

export const useLogs = () => {
    const logs = useLiveQuery(() => db.logs.toArray()) || [];
    const partners = useLiveQuery(() => db.partners.toArray()) || [];

    const addOrUpdateLog = async (log: LogEntry) => {
        await db.logs.put(log);
    };

    const deleteLog = async (date: string) => {
        await db.logs.delete(date);
    };

    const addOrUpdatePartner = async (partner: PartnerProfile) => {
        await db.partners.put(partner);
    };

    const deletePartner = async (id: string) => {
        await db.partners.delete(id);
    };

    const quickAddSex = async (record: any) => {
        const date = getTodayDateString();
        const existing = await db.logs.get(date);
        const log = hydrateLog(existing || { date });
        log.sex = [...(log.sex || []), record];
        await db.logs.put(log);
    };

    const quickAddMasturbation = async (record: any) => {
        const date = getTodayDateString();
        const existing = await db.logs.get(date);
        const log = hydrateLog(existing || { date });
        log.masturbation = [...(log.masturbation || []), record];
        await db.logs.put(log);
    };

    const saveExercise = async (record: any) => {
        const date = getTodayDateString();
        const existing = await db.logs.get(date);
        const log = hydrateLog(existing || { date });
        const exList = log.exercise || [];
        // Replace if exists (finish) or add
        const idx = exList.findIndex(e => e.id === record.id);
        if(idx >= 0) exList[idx] = record;
        else exList.push(record);
        
        log.exercise = exList;
        await db.logs.put(log);
    };
    
    const saveAlcoholRecord = async (record: any) => {
        const date = getTodayDateString();
        const existing = await db.logs.get(date);
        const log = hydrateLog(existing || { date });
        log.alcoholRecord = record;
        log.alcohol = record.totalGrams > 0 ? 'medium' : 'none'; // simplified
        await db.logs.put(log);
    };

    const toggleNap = async () => {
        // Mock impl
    };

    const toggleSleepLog = async (pending?: LogEntry) => {
        if(pending) {
            // Cancel/Delete
            await deleteLog(pending.date);
        } else {
            const date = getTodayDateString();
            const log = hydrateLog({ date, status: 'pending' });
            log.sleep = { ...log.sleep!, startTime: new Date().toISOString() };
            await db.logs.put(log);
        }
    };
    
    const saveNap = async (record: any) => {
         const date = getTodayDateString();
         const existing = await db.logs.get(date);
         const log = hydrateLog(existing || { date });
         const naps = log.sleep?.naps || [];
         naps.push(record);
         log.sleep = { ...log.sleep!, naps };
         await db.logs.put(log);
    };

    const importLogs = async (l: LogEntry[], p?: PartnerProfile[]) => {
        await db.logs.bulkPut(l);
        if(p) await db.partners.bulkPut(p);
    };

    return {
        logs, partners, addOrUpdateLog, deleteLog, addOrUpdatePartner, deletePartner,
        quickAddSex, quickAddMasturbation, saveExercise, saveAlcoholRecord, toggleNap, toggleSleepLog, importLogs, saveNap
    };
};