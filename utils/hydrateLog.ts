
import { LogEntry, Health, MorningRecord, SleepRecord, AlcoholRecord } from '../types';
import { buildDataQualityForLog, markDisplayDefaults } from './dataQuality';

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
        dataQuality: raw.dataQuality,
        
        // Environment & State
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
        exercise: Array.isArray(raw.exercise) ? raw.exercise.map((e: any) => ({
            ...e, 
            feeling: e.feeling || 'ok',
            bodyParts: Array.isArray(e.bodyParts) ? e.bodyParts : []
        })) : [],
        
        sex: Array.isArray(raw.sex) ? raw.sex.map((s: any) => ({
            ...s,
            interactions: Array.isArray(s.interactions) ? s.interactions.map((i: any) => ({
                ...i,
                costumes: Array.isArray(i.costumes) ? i.costumes : [],
                toys: Array.isArray(i.toys) ? i.toys : [],
                chain: Array.isArray(i.chain) ? i.chain : []
            })) : [],
            positions: Array.isArray(s.positions) ? s.positions : []
        })) : [],

        masturbation: Array.isArray(raw.masturbation) ? raw.masturbation.map((m: any) => ({
            ...m, 
            status: m.status || 'completed',
            satisfactionLevel: m.satisfactionLevel ?? (m.ejaculation ? 3 : 1), // Default based on ejaculation
            contentItems: Array.isArray(m.contentItems) ? m.contentItems.map((c: any) => ({
                ...c,
                xpTags: Array.isArray(c.xpTags) ? c.xpTags : []
            })) : [],
            assets: m.assets ? {
                ...m.assets,
                sources: Array.isArray(m.assets.sources) ? m.assets.sources : [],
                platforms: Array.isArray(m.assets.platforms) ? m.assets.platforms : [],
                categories: Array.isArray(m.assets.categories) ? m.assets.categories : [],
                actors: Array.isArray(m.assets.actors) ? m.assets.actors : []
            } : { sources: [], platforms: [], categories: [], target: '', actors: [] },
            tools: Array.isArray(m.tools) ? m.tools : [],
            materials: Array.isArray(m.materials) ? m.materials : [],
            props: Array.isArray(m.props) ? m.props : [],
            materialsList: Array.isArray(m.materialsList) ? m.materialsList : []
        })) : [],
        
        // New Alcohol Array Support
        alcoholRecords: Array.isArray(raw.alcoholRecords) ? raw.alcoholRecords : [],
        screenTime: raw.screenTime ? {
            totalMinutes: raw.screenTime.totalMinutes ?? 0,
            source: raw.screenTime.source || 'manual',
            notes: raw.screenTime.notes ?? ''
        } : null,
        supplements: Array.isArray(raw.supplements) ? raw.supplements.map((item: any) => ({
            id: item.id || `supp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: item.name || '',
            taken: item.taken !== false,
            notes: item.notes ?? ''
        })) : [],
        menstrual: raw.menstrual ? {
            status: raw.menstrual.status || 'unknown',
            notes: raw.menstrual.notes ?? ''
        } : null,
        
        changeHistory: Array.isArray(raw.changeHistory) ? raw.changeHistory : [],
    };

    // v0.0.6 Caffeine Record (Cups)
    if (!raw.caffeineRecord) {
        log.caffeineRecord = { totalCount: 0, items: [] };
    } else {
        const items = Array.isArray(raw.caffeineRecord.items) ? raw.caffeineRecord.items.map((i: any) => ({
            ...i,
            count: i.count ?? (i.mg ? (i.mg > 10 ? 1 : i.mg) : 1),
            volume: i.volume ?? 350 
        })) : [];
        
        log.caffeineRecord = {
            totalCount: raw.caffeineRecord.totalCount ?? raw.caffeineRecord.totalMg ?? 0,
            items
        };
    }

    // 2. Domain Object: MorningRecord
    const wokeWithErection = raw.morning?.wokeWithErection ?? raw.wokeWithErection ?? true;
    const defaultMorning: MorningRecord = {
        id: raw.morning?.id || `mr_${log.date}_${Date.now()}`,
        timestamp: raw.morning?.timestamp || Date.now(),
        wokeWithErection,
        hardness: raw.morning?.hardness ?? raw.hardness ?? (wokeWithErection ? 3 : null),
        retention: raw.morning?.retention ?? raw.retention ?? (wokeWithErection ? 'normal' : null),
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
        dreamTypes: n.dreamTypes ?? []
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

    // 5. Alcohol Record Migration (Legacy -> Array)
    if (raw.alcoholRecord && log.alcoholRecords.length === 0) {
        log.alcoholRecords.push({
            ...raw.alcoholRecord,
            id: raw.alcoholRecord.id || `alc_mig_${Date.now()}`,
            drunkLevel: raw.alcoholRecord.drunkLevel || 'none',
            alcoholScene: raw.alcoholRecord.alcoholScene || '',
            time: raw.alcoholRecord.time || '20:00',
            ongoing: raw.alcoholRecord.ongoing || false
        });
    }

    log.dataQuality = markDisplayDefaults({
        ...log,
        dataQuality: raw.dataQuality || buildDataQualityForLog(log, 'migration')
    }, raw);

    return log;
};
