

import { LogEntry, Health, MorningRecord, SleepRecord, AlcoholRecord } from '../types';

/**
 * HYDRATE LOG (Schema v1.0 Enforcer)
 */
export const hydrateLog = (raw: any): LogEntry => {
    if (!raw) raw = {};

    // 1. Basic Metadata
    const log: LogEntry = {
        date: raw.date || new Date().toISOString().split('T')[0],
        status: raw.status || 'completed',
        updatedAt: raw.updatedAt || Date.now(),
        
        // Environment & State
        location: raw.location ?? null,
        weather: raw.weather ?? null,
        mood: raw.mood ?? null,
        stressLevel: raw.stressLevel ?? null,
        
        // Lifestyle
        alcohol: raw.alcohol ?? null,
        pornConsumption: raw.pornConsumption ?? null,
        
        // v0.0.5 New Fields
        /**
         * Fixed caffeineIntake assignment.
         */
        caffeineIntake: raw.caffeineIntake ?? null,
        dailyEvents: Array.isArray(raw.dailyEvents) ? raw.dailyEvents : [],
        
        // Arrays (Ensure Array)
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        notes: raw.notes ?? null,
        
        // Activity Arrays
        exercise: Array.isArray(raw.exercise) ? raw.exercise.map((e: any) => ({...e, feeling: e.feeling || 'ok'})) : [],
        sex: Array.isArray(raw.sex) ? raw.sex : [],
        masturbation: Array.isArray(raw.masturbation) ? raw.masturbation.map((m: any) => ({
            ...m, 
            status: m.status || 'completed',
            // v0.0.6 ContentItems
            contentItems: Array.isArray(m.contentItems) ? m.contentItems : [] 
        })) : [],
        
        changeHistory: Array.isArray(raw.changeHistory) ? raw.changeHistory : [],
    };

    // v0.0.6 Caffeine Record (Cups)
    if (!raw.caffeineRecord) {
        log.caffeineRecord = { totalCount: 0, items: [] };
    } else {
        // Migration from mg (old) to count (new) if needed, otherwise default
        const items = Array.isArray(raw.caffeineRecord.items) ? raw.caffeineRecord.items.map((i: any) => ({
            ...i,
            // If old 'mg' exists but no 'count', convert (assume 1 cup if undefined)
            count: i.count ?? (i.mg ? (i.mg > 10 ? 1 : i.mg) : 1),
            // Default volume if missing (standard cup 350ml)
            volume: i.volume ?? 350 
        })) : [];
        
        log.caffeineRecord = {
            totalCount: raw.caffeineRecord.totalCount ?? raw.caffeineRecord.totalMg ?? 0,
            items
        };
    }

    // 2. Domain Object: MorningRecord
    const defaultMorning: MorningRecord = {
        id: raw.morning?.id || `mr_${log.date}_${Date.now()}`,
        timestamp: raw.morning?.timestamp || Date.now(),
        wokeWithErection: raw.morning?.wokeWithErection ?? raw.wokeWithErection ?? true,
        hardness: raw.morning?.hardness ?? raw.hardness ?? null,
        retention: raw.morning?.retention ?? raw.retention ?? null,
        wokenByErection: raw.morning?.wokenByErection ?? raw.wokenByErection ?? false,
        durationImpression: raw.morning?.durationImpression ?? raw.durationImpression ?? null
    };
    log.morning = { ...defaultMorning, ...(raw.morning || {}) };

    // 3. Domain Object: SleepRecord
    let naps = [];
    if (raw.sleep && Array.isArray(raw.sleep.naps)) naps = raw.sleep.naps;
    else if (Array.isArray(raw.naps)) naps = raw.naps;
    
    naps = naps.map((n: any) => ({
        ...n,
        hasDream: n.hasDream ?? false,
        dreamTypes: n.dreamTypes ?? [],
        wokeWithErection: n.wokeWithErection ?? false,
        hardness: n.hardness ?? null,
        quality: n.quality || 3,
        environment: n.environment || { location: 'home', temperature: 'comfortable' }
    }));

    const defaultSleep: SleepRecord = {
        id: raw.sleep?.id || `sr_${log.date}_${Date.now()}`,
        startTime: raw.sleep?.startTime ?? raw.sleepDateTime ?? null,
        endTime: raw.sleep?.endTime ?? raw.wakeUpDateTime ?? null,
        quality: raw.sleep?.quality ?? raw.sleepQuality ?? 3,
        attire: raw.sleep?.attire ?? raw.sleepAttire ?? null,
        naturalAwakening: raw.sleep?.naturalAwakening ?? raw.naturalAwakening ?? false,
        nocturnalEmission: raw.sleep?.nocturnalEmission ?? raw.nocturnalEmission ?? false,
        withPartner: raw.sleep?.withPartner ?? raw.sleepWithPartner ?? false,
        preSleepState: raw.sleep?.preSleepState ?? raw.preSleepState ?? null,
        naps: naps,
        hasDream: raw.sleep?.hasDream ?? false,
        dreamTypes: Array.isArray(raw.sleep?.dreamTypes) ? raw.sleep.dreamTypes : [],
        environment: raw.sleep?.environment || { location: 'home', temperature: 'comfortable' }
    };
    log.sleep = { ...defaultSleep, ...(raw.sleep || {}) };

    // 4. Domain Object: Health
    /**
     * Updated properties for Health object initialization.
     */
    const defaultHealth: Health = {
        isSick: false,
        illnessType: null,
        medicationTaken: null,
        medicationName: null,
        feeling: raw.health?.isSick ? 'bad' : 'normal',
        discomfortLevel: null,
        symptoms: [],
        medications: []
    };
    log.health = { ...defaultHealth, ...(raw.health || {}) };

    // 5. Alcohol Record (Updated v0.0.9)
    if (raw.alcoholRecord) {
        log.alcoholRecord = {
            ...raw.alcoholRecord,
            id: raw.alcoholRecord.id || `alc_${log.date}_${Date.now()}`,
            drunkLevel: raw.alcoholRecord.drunkLevel || 'none',
            alcoholScene: raw.alcoholRecord.alcoholScene || '', // Legacy
            time: raw.alcoholRecord.time || '20:00', // Legacy fallback
            ongoing: raw.alcoholRecord.ongoing ?? false,
            // New v0.0.9 fields default
            location: raw.alcoholRecord.location || (raw.alcoholRecord.alcoholScene === '独自' ? '家' : raw.alcoholRecord.alcoholScene) || '家',
            people: raw.alcoholRecord.people || '独自',
            reason: raw.alcoholRecord.reason || '放松'
        };
    } else {
        log.alcoholRecord = null;
    }

    return log;
};
