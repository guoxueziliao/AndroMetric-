
import { LogEntry, Health, MorningRecord, SleepRecord, AlcoholRecord } from '../types';

export const hydrateLog = (raw: any): LogEntry => {
    if (!raw) raw = {};
    const date = raw.date || new Date().toISOString().split('T')[0];

    // 1. Basic Structure
    const log: LogEntry = {
        date,
        status: raw.status || 'completed',
        updatedAt: raw.updatedAt || Date.now(),
        location: raw.location ?? null,
        weather: raw.weather ?? null,
        mood: raw.mood ?? null,
        stressLevel: raw.stressLevel ?? null,
        alcohol: raw.alcohol ?? null,
        pornConsumption: raw.pornConsumption ?? null,
        caffeineIntake: raw.caffeineIntake ?? null,
        dailyEvents: Array.isArray(raw.dailyEvents) ? raw.dailyEvents : [],
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        notes: raw.notes ?? null,
        exercise: Array.isArray(raw.exercise) ? raw.exercise : [],
        sex: Array.isArray(raw.sex) ? raw.sex : [],
        masturbation: Array.isArray(raw.masturbation) ? raw.masturbation : [],
        changeHistory: Array.isArray(raw.changeHistory) ? raw.changeHistory : [],
    };

    // 2. Caffeine
    if (!raw.caffeineRecord) {
        log.caffeineRecord = { totalCount: 0, items: [] };
    } else {
        const items = Array.isArray(raw.caffeineRecord.items) ? raw.caffeineRecord.items.map((i: any) => ({
            ...i,
            count: i.count ?? 1,
            volume: i.volume ?? 350 
        })) : [];
        log.caffeineRecord = { totalCount: raw.caffeineRecord.totalCount ?? items.length, items };
    }

    // 3. Morning Wood
    const defaultMorning: MorningRecord = {
        id: raw.morning?.id || `mr_${date}_${Date.now()}`,
        timestamp: raw.morning?.timestamp || Date.now(),
        wokeWithErection: raw.morning?.wokeWithErection ?? raw.wokeWithErection ?? true,
        hardness: raw.morning?.hardness ?? raw.hardness ?? null,
        retention: raw.morning?.retention ?? raw.retention ?? null,
        wokenByErection: raw.morning?.wokenByErection ?? raw.wokenByErection ?? false,
        durationImpression: raw.morning?.durationImpression ?? raw.durationImpression ?? null
    };
    // 确保 spreading 时，由 hydration 生成的完整对象优于原始可能缺失的对象
    log.morning = { ...defaultMorning, ...(raw.morning || {}) };

    // 4. Sleep & Naps
    let rawNaps = [];
    if (raw.sleep && Array.isArray(raw.sleep.naps)) rawNaps = raw.sleep.naps;
    else if (Array.isArray(raw.naps)) rawNaps = raw.naps;
    
    const processedNaps = rawNaps.map((n: any) => ({
        ...n,
        id: n.id || `nap_${Date.now()}_${Math.random()}`,
        hasDream: n.hasDream ?? false,
        dreamTypes: n.dreamTypes ?? [],
        wokeWithErection: n.wokeWithErection ?? false,
        hardness: n.hardness ?? null,
        quality: n.quality || 3,
        environment: n.environment || { location: 'home', temperature: 'comfortable' }
    }));

    const defaultSleep: SleepRecord = {
        id: raw.sleep?.id || `sr_${date}_${Date.now()}`,
        startTime: raw.sleep?.startTime ?? raw.sleepDateTime ?? null,
        endTime: raw.sleep?.endTime ?? raw.wakeUpDateTime ?? null,
        quality: raw.sleep?.quality ?? raw.sleepQuality ?? 3,
        attire: raw.sleep?.attire ?? raw.sleepAttire ?? null,
        naturalAwakening: raw.sleep?.naturalAwakening ?? raw.naturalAwakening ?? false,
        nocturnalEmission: raw.sleep?.nocturnalEmission ?? raw.nocturnalEmission ?? false,
        withPartner: raw.sleep?.withPartner ?? raw.sleepWithPartner ?? false,
        preSleepState: raw.sleep?.preSleepState ?? raw.preSleepState ?? null,
        naps: processedNaps,
        hasDream: raw.sleep?.hasDream ?? false,
        dreamTypes: Array.isArray(raw.sleep?.dreamTypes) ? raw.sleep.dreamTypes : [],
        environment: raw.sleep?.environment || { location: 'home', temperature: 'comfortable' }
    };
    // 关键修复：显式传递 processedNaps，防止被 raw.sleep 中的空值覆盖
    log.sleep = { ...defaultSleep, ...(raw.sleep || {}), naps: processedNaps };

    // 5. Health
    const defaultHealth: Health = {
        isSick: raw.health?.isSick ?? false,
        feeling: raw.health?.isSick ? 'bad' : 'normal',
        discomfortLevel: raw.health?.discomfortLevel || null,
        symptoms: Array.isArray(raw.health?.symptoms) ? raw.health.symptoms : [],
        medications: Array.isArray(raw.health?.medications) ? raw.health.medications : []
    };
    log.health = { ...defaultHealth, ...(raw.health || {}) };

    // 6. Alcohol
    if (raw.alcoholRecord) {
        log.alcoholRecord = {
            ...raw.alcoholRecord,
            id: raw.alcoholRecord.id || `alc_${date}_${Date.now()}`,
            drunkLevel: raw.alcoholRecord.drunkLevel || 'none',
            ongoing: raw.alcoholRecord.ongoing ?? false,
            location: raw.alcoholRecord.location || '家',
            people: raw.alcoholRecord.people || '独自',
            reason: raw.alcoholRecord.reason || '放松'
        };
    } else {
        log.alcoholRecord = null;
    }

    return log;
};
