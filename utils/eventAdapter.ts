
import { LogEntry, UnifiedEvent, EventType } from '../types';
import { analyzeSleep } from './helpers';

const createEvent = (
    type: EventType, 
    dateStr: string, 
    baseTimestamp: number, 
    metrics: UnifiedEvent['metrics'] = {}, 
    flags: UnifiedEvent['flags'] = {}, 
    tags: string[] = [], 
    refId?: string
): UnifiedEvent => {
    return {
        schemaVersion: 1,
        id: `${type}_${dateStr}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        dateStr,
        timestamp: baseTimestamp,
        metrics,
        flags,
        tags,
        refId
    };
};

export const flattenLogsToEvents = (logs: LogEntry[]): UnifiedEvent[] => {
    const events: UnifiedEvent[] = [];

    logs.forEach(log => {
        const dateBase = new Date(log.date + 'T12:00:00').getTime();

        // 1. Morning Wood Event
        const morning = log.morning;
        if (morning && morning.wokeWithErection && morning.hardness) {
            events.push(createEvent(
                'morning_wood',
                log.date,
                morning.timestamp || dateBase,
                { value: morning.hardness, intensity: morning.hardness },
                { isGood: morning.hardness >= 3 },
                [morning.retention || 'normal']
            ));
        }

        // 2. Sleep Event
        const sleep = log.sleep;
        if (sleep && sleep.startTime && sleep.endTime) {
            const analysis = analyzeSleep(sleep.startTime, sleep.endTime);
            if (analysis) {
                const wakeTs = new Date(sleep.endTime).getTime();
                events.push(createEvent(
                    'sleep',
                    log.date,
                    wakeTs,
                    { duration: analysis.durationHours, value: sleep.quality || 3 },
                    { isLate: analysis.isLate, isGood: !analysis.isInsufficient && !analysis.isLate, withPartner: sleep.withPartner },
                    [sleep.preSleepState || 'calm', sleep.attire || 'light']
                ));
            }
        }

        // 3. Alcohol Event
        /* Fix: Aggregate metrics from alcoholRecords array instead of using non-existent single record property */
        if (log.alcoholRecords && log.alcoholRecords.length > 0) {
            const totalGrams = log.alcoholRecords.reduce((acc, r) => acc + r.totalGrams, 0);
            const totalDuration = log.alcoholRecords.reduce((acc, r) => acc + r.durationMinutes, 0);
            const isAnyLate = log.alcoholRecords.some(r => r.isLate);
            
            events.push(createEvent(
                'alcohol',
                log.date,
                dateBase,
                { amount: totalGrams, duration: totalDuration },
                { isLate: isAnyLate },
                log.alcoholRecords.flatMap(r => r.items.map(i => i.name))
            ));
        } else if (log.alcohol && log.alcohol !== 'none') {
            const approxGrams = log.alcohol === 'high' ? 60 : log.alcohol === 'medium' ? 30 : 10;
            events.push(createEvent(
                'alcohol',
                log.date,
                dateBase,
                { amount: approxGrams },
                {},
                ['legacy']
            ));
        }

        // 4. Exercise Events
        if (log.exercise) {
            log.exercise.forEach(ex => {
                let ts = dateBase;
                if (ex.startTime) {
                    const [h, m] = ex.startTime.split(':').map(Number);
                    if (!isNaN(h)) {
                        const d = new Date(log.date);
                        d.setHours(h, m, 0, 0);
                        ts = d.getTime();
                    }
                }
                events.push(createEvent(
                    'exercise',
                    log.date,
                    ts,
                    { duration: ex.duration, amount: ex.steps },
                    {},
                    [ex.type, ex.intensity || 'medium', ...(ex.bodyParts || [])],
                    ex.id
                ));
            });
        }

        // 5. Sex Events
        if (log.sex) {
            log.sex.forEach(s => {
                let ts = dateBase;
                if (s.startTime) {
                    const [h, m] = s.startTime.split(':').map(Number);
                    if (!isNaN(h)) {
                        const d = new Date(log.date);
                        d.setHours(h, m, 0, 0);
                        ts = d.getTime(); 
                    }
                }
                const partners = new Set<string>();
                if(s.interactions) s.interactions.forEach(i => { if(i.partner) partners.add(i.partner); });
                else if(s.partner) partners.add(s.partner);

                events.push(createEvent(
                    'sex',
                    log.date,
                    ts,
                    { duration: s.duration, value: s.partnerScore || 0 },
                    { 
                        orgasm: s.indicators.orgasm, 
                        ejaculation: s.ejaculation, 
                        withPartner: true,
                        isGood: s.indicators.partnerOrgasm 
                    },
                    [...Array.from(partners), ...(s.positions || []), s.protection || ''],
                    s.id
                ));
            });
        }

        // 6. Masturbation Events
        if (log.masturbation) {
            log.masturbation.forEach(m => {
                let ts = dateBase;
                if (m.startTime) {
                    const [h, m_] = m.startTime.split(':').map(Number);
                    if (!isNaN(h)) {
                        const d = new Date(log.date);
                        d.setHours(h, m_, 0, 0);
                        ts = d.getTime();
                    }
                }
                events.push(createEvent(
                    'masturbation',
                    log.date,
                    ts,
                    { duration: m.duration, intensity: m.orgasmIntensity },
                    { ejaculation: m.ejaculation, orgasm: m.orgasmIntensity ? m.orgasmIntensity >= 4 : true },
                    [...(m.assets?.categories || []), ...(m.tools || [])],
                    m.id
                ));
            });
        }

        // 7. Stress Event
        if (log.stressLevel) {
            events.push(createEvent(
                'stress',
                log.date,
                dateBase,
                { value: log.stressLevel },
                { isGood: log.stressLevel <= 2 },
                []
            ));
        }
        
        // 8. Health/Sickness
        if (log.health?.isSick) {
             events.push(createEvent(
                'health',
                log.date,
                dateBase,
                { value: -1 },
                { isGood: false },
                [log.health.illnessType || 'sick']
            ));
        }
    });

    return events.sort((a, b) => a.timestamp - b.timestamp);
};
