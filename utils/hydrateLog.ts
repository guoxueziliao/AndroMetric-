
import { LogEntry, Health, MorningRecord, SleepRecord, AlcoholRecord } from '../types';

/**
 * HYDRATE LOG (Schema v1.0 Enforcer)
 * 
 * This function takes any object (partial log, legacy log, or new log)
 * and returns a guaranteed valid LogEntry matching Schema v1.0.
 * 
 * Rules:
 * 1. Missing arrays -> []
 * 2. Missing objects (health, morning, sleep) -> Default Objects
 * 3. Undefined optional fields -> null
 * 4. Legacy flat fields -> Mapped to Domain Objects
 */
export const hydrateLog = (raw: any): LogEntry => {
    if (!raw) raw = {};

    // 1. Basic Metadata
    const log: LogEntry = {
        date: raw.date || new Date().toISOString().split('T')[0],
        status: raw.status || 'completed',
        updatedAt: raw.updatedAt || Date.now(),
        
        // Environment & State (Force undefined to null)
        location: raw.location ?? null,
        weather: raw.weather ?? null,
        mood: raw.mood ?? null,
        stressLevel: raw.stressLevel ?? null,
        
        // Lifestyle
        alcohol: raw.alcohol ?? null,
        pornConsumption: raw.pornConsumption ?? null,
        
        // v0.0.5 New Fields
        caffeineIntake: raw.caffeineIntake ?? null,
        dailyEvents: Array.isArray(raw.dailyEvents) ? raw.dailyEvents : [],
        
        // Arrays (Ensure Array)
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        notes: raw.notes ?? null,
        
        // Activity Arrays
        exercise: Array.isArray(raw.exercise) ? raw.exercise.map((e: any) => ({...e, feeling: e.feeling || 'ok'})) : [],
        sex: Array.isArray(raw.sex) ? raw.sex : [],
        masturbation: Array.isArray(raw.masturbation) ? raw.masturbation.map((m: any) => ({...m, status: m.status || 'completed'})) : [],
        
        changeHistory: Array.isArray(raw.changeHistory) ? raw.changeHistory : [],
    };

    // 2. Domain Object: MorningRecord
    const defaultMorning: MorningRecord = {
        id: raw.morning?.id || `mr_${log.date}_${Date.now()}`,
        timestamp: raw.morning?.timestamp || Date.now(),
        // Fallback to legacy flat fields if sub-object is missing
        wokeWithErection: raw.morning?.wokeWithErection ?? raw.wokeWithErection ?? true,
        hardness: raw.morning?.hardness ?? raw.hardness ?? null,
        retention: raw.morning?.retention ?? raw.retention ?? null,
        wokenByErection: raw.morning?.wokenByErection ?? raw.wokenByErection ?? false,
        durationImpression: raw.morning?.durationImpression ?? raw.durationImpression ?? null
    };
    log.morning = { ...defaultMorning, ...(raw.morning || {}) };

    // 3. Domain Object: SleepRecord
    // Helper to get naps
    let naps = [];
    if (raw.sleep && Array.isArray(raw.sleep.naps)) naps = raw.sleep.naps;
    else if (Array.isArray(raw.naps)) naps = raw.naps; // Legacy flat naps
    
    // Ensure naps have v0.0.5 structure
    naps = naps.map((n: any) => ({
        ...n,
        hasDream: n.hasDream ?? false,
        dreamTypes: n.dreamTypes ?? []
    }));

    const defaultSleep: SleepRecord = {
        id: raw.sleep?.id || `sr_${log.date}_${Date.now()}`,
        // Fallback to legacy flat fields
        startTime: raw.sleep?.startTime ?? raw.sleepDateTime ?? null,
        endTime: raw.sleep?.endTime ?? raw.wakeUpDateTime ?? null,
        quality: raw.sleep?.quality ?? raw.sleepQuality ?? 3,
        attire: raw.sleep?.attire ?? raw.sleepAttire ?? null,
        naturalAwakening: raw.sleep?.naturalAwakening ?? raw.naturalAwakening ?? false,
        nocturnalEmission: raw.sleep?.nocturnalEmission ?? raw.nocturnalEmission ?? false,
        withPartner: raw.sleep?.withPartner ?? raw.sleepWithPartner ?? false,
        preSleepState: raw.sleep?.preSleepState ?? raw.preSleepState ?? null,
        naps: naps,
        // v0.0.5
        hasDream: raw.sleep?.hasDream ?? false,
        dreamTypes: Array.isArray(raw.sleep?.dreamTypes) ? raw.sleep.dreamTypes : [],
        environment: raw.sleep?.environment || { location: 'home', temperature: 'comfortable' }
    };
    log.sleep = { ...defaultSleep, ...(raw.sleep || {}) };

    // 4. Domain Object: Health
    // Ensure structure exists even if empty
    const defaultHealth: Health = {
        isSick: false,
        illnessType: null,
        medicationTaken: null,
        medicationName: null,
        // v0.0.5
        feeling: raw.health?.isSick ? 'bad' : 'normal',
        symptoms: [],
        medications: []
    };
    log.health = { ...defaultHealth, ...(raw.health || {}) };

    // 5. Alcohol Record (Special Handling for Object)
    if (raw.alcoholRecord) {
        log.alcoholRecord = {
            ...raw.alcoholRecord,
            drunkLevel: raw.alcoholRecord.drunkLevel || 'none',
            alcoholScene: raw.alcoholRecord.alcoholScene || ''
        };
    } else {
        log.alcoholRecord = null;
    }

    return log;
};
