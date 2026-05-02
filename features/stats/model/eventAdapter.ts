import type { CycleEvent, LogEntry, PregnancyEvent, UnifiedEvent, EventType } from '../../../domain';
import { analyzeSleep } from '../../../shared/lib';
import { isFieldUsable } from '../../../utils/dataQuality';
import {
    assessMasturbationFatigue,
    assessSexFatigue,
    getTimeBucket,
    scoreMasturbationRecord,
    scoreSexRecord
} from './p3Scoring';

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

export interface EventAdapterOptions {
    cycleEvents?: CycleEvent[];
    pregnancyEvents?: PregnancyEvent[];
}

export const flattenLogsToEvents = (logs: LogEntry[], options: EventAdapterOptions = {}): UnifiedEvent[] => {
    const events: UnifiedEvent[] = [];

    logs.forEach(log => {
        const dateBase = new Date(log.date + 'T12:00:00').getTime();

        // 1. Morning Wood Event
        const morning = log.morning;
        if (morning && morning.wokeWithErection && isFieldUsable(log, 'morning.hardness') && typeof morning.hardness === 'number') {
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
        if (sleep && isFieldUsable(log, 'sleep.startTime') && isFieldUsable(log, 'sleep.endTime') && sleep.startTime && sleep.endTime) {
            const analysis = analyzeSleep(sleep.startTime, sleep.endTime);
            if (analysis) {
                const wakeTs = new Date(sleep.endTime).getTime();
                events.push(createEvent(
                    'sleep',
                    log.date,
                    wakeTs,
                    { duration: analysis.durationHours, value: isFieldUsable(log, 'sleep.quality') ? (sleep.quality || 3) : undefined },
                    { isLate: analysis.isLate, isGood: !analysis.isInsufficient && !analysis.isLate, withPartner: sleep.withPartner },
                    [sleep.preSleepState || 'calm', sleep.attire || 'light']
                ));
            }
        }

        // 3. Alcohol Event
        /* Fix: Aggregate metrics from alcoholRecords array instead of using non-existent single record property */
        if (log.alcoholRecords && Array.isArray(log.alcoholRecords) && log.alcoholRecords.length > 0) {
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
        if (log.exercise && Array.isArray(log.exercise)) {
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
        if (log.sex && Array.isArray(log.sex)) {
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
                const positions = new Set<string>();
                const toys = new Set<string>();
                const costumes = new Set<string>();

                if (s.interactions && Array.isArray(s.interactions)) {
                    s.interactions.forEach(i => {
                        if (i.partner) partners.add(i.partner);
                        (i.toys || []).forEach(item => toys.add(item));
                        (i.costumes || []).forEach(item => costumes.add(item));
                        (i.chain || []).forEach(action => {
                            if (action.type === 'position' && action.name) positions.add(action.name);
                        });
                    });
                } else if (s.partner) {
                    partners.add(s.partner);
                }

                (s.positions || []).forEach(position => positions.add(position));

                const sexScore = scoreSexRecord(log, s);
                const timeBucket = getTimeBucket(s.startTime);
                const sleepAnalysis = isFieldUsable(log, 'sleep.startTime') && isFieldUsable(log, 'sleep.endTime')
                    ? analyzeSleep(log.sleep?.startTime, log.sleep?.endTime)
                    : null;
                const alcoholGrams = Array.isArray(log.alcoholRecords)
                    ? log.alcoholRecords.reduce((sum, item) => sum + item.totalGrams, 0)
                    : 0;
                const fatigue = assessSexFatigue({
                    sleepInsufficient: Boolean(sleepAnalysis?.isInsufficient),
                    stressLevel: isFieldUsable(log, 'stressLevel') ? (log.stressLevel ?? null) : null,
                    alcoholGrams,
                    isSick: Boolean(log.health?.isSick),
                    timeBucket,
                    durationMinutes: s.duration,
                    hasHighIntensityExercise: Array.isArray(log.exercise) && log.exercise.some(ex => ex.intensity === 'high')
                });
                const sexTags = [
                    `time_bucket:${timeBucket}`,
                    ...Array.from(partners).map(partner => `partner:${partner}`),
                    ...Array.from(positions).map(position => `position:${position}`),
                    ...Array.from(toys).map(item => `toy:${item}`),
                    ...Array.from(costumes).map(item => `costume:${item}`),
                    `protection:${s.protection || 'unknown'}`,
                    ...fatigue.reasons.map(reason => `driver:${reason}`)
                ];

                events.push(createEvent(
                    'sex',
                    log.date,
                    ts,
                    {
                        duration: s.duration,
                        value: s.partnerScore || 0,
                        score: sexScore.totalScore ?? undefined,
                        qualityScore: sexScore.qualityScore ?? undefined,
                        satisfactionScore: sexScore.satisfactionScore ?? undefined,
                        fatigueCost: fatigue.score
                    },
                    { 
                        orgasm: s.indicators.orgasm, 
                        ejaculation: s.ejaculation, 
                        withPartner: true,
                        isGood: s.indicators.partnerOrgasm 
                    },
                    sexTags,
                    s.id
                ));
            });
        }

        // 6. Masturbation Events
        if (log.masturbation && Array.isArray(log.masturbation)) {
            log.masturbation.forEach(m => {
                if (m.status !== 'completed') return;
                let ts = dateBase;
                if (m.startTime) {
                    const [h, m_] = m.startTime.split(':').map(Number);
                    if (!isNaN(h)) {
                        const d = new Date(log.date);
                        d.setHours(h, m_, 0, 0);
                        ts = d.getTime();
                    }
                }
                const masturbationScore = scoreMasturbationRecord(log, m);
                const timeBucket = getTimeBucket(m.startTime);
                const sleepAnalysis = isFieldUsable(log, 'sleep.startTime') && isFieldUsable(log, 'sleep.endTime')
                    ? analyzeSleep(log.sleep?.startTime, log.sleep?.endTime)
                    : null;
                const alcoholGrams = Array.isArray(log.alcoholRecords)
                    ? log.alcoholRecords.reduce((sum, item) => sum + item.totalGrams, 0)
                    : 0;
                const fatigue = assessMasturbationFatigue({
                    sleepInsufficient: Boolean(sleepAnalysis?.isInsufficient),
                    stressLevel: isFieldUsable(log, 'stressLevel') ? (log.stressLevel ?? null) : null,
                    alcoholGrams,
                    isSick: Boolean(log.health?.isSick),
                    timeBucket,
                    durationMinutes: m.duration,
                    hasHighIntensityExercise: Array.isArray(log.exercise) && log.exercise.some(ex => ex.intensity === 'high'),
                    energyLevel: isFieldUsable(log, `masturbation.${m.id}.energyLevel`) ? m.energyLevel : null,
                    energyLevelUsable: isFieldUsable(log, `masturbation.${m.id}.energyLevel`),
                    fatigueText: isFieldUsable(log, `masturbation.${m.id}.fatigue`) ? m.fatigue : undefined,
                    postFatigueText: m.postFatigue,
                    edging: m.edging,
                    ejaculation: m.ejaculation
                });
                const masturbationTags = [
                    `time_bucket:${timeBucket}`,
                    ...(m.contentItems || []).flatMap(item => (item.xpTags || []).map(tag => `tag:${tag}`)),
                    ...(m.assets?.categories || []).map(tag => `tag:${tag}`),
                    ...(m.tools || []).map(tool => `tool:${tool}`),
                    ...fatigue.reasons.map(reason => `driver:${reason}`)
                ];

                events.push(createEvent(
                    'masturbation',
                    log.date,
                    ts,
                    {
                        duration: m.duration,
                        intensity: m.orgasmIntensity,
                        score: masturbationScore.totalScore ?? undefined,
                        qualityScore: masturbationScore.qualityScore ?? undefined,
                        satisfactionScore: masturbationScore.satisfactionScore ?? undefined,
                        fatigueCost: fatigue.score
                    },
                    { ejaculation: m.ejaculation, orgasm: m.orgasmIntensity ? m.orgasmIntensity >= 4 : true },
                    masturbationTags,
                    m.id
                ));
            });
        }

        // 7. Stress Event
        if (isFieldUsable(log, 'stressLevel') && log.stressLevel) {
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

        if (log.screenTime && typeof log.screenTime.totalMinutes === 'number' && log.screenTime.totalMinutes > 0) {
            events.push(createEvent(
                'screen_time',
                log.date,
                dateBase,
                { duration: log.screenTime.totalMinutes / 60, value: log.screenTime.totalMinutes },
                { isGood: log.screenTime.totalMinutes <= 240 },
                [log.screenTime.source],
                'screenTime'
            ));
        }
    });

    (options.cycleEvents || []).forEach((event) => {
        const baseTs = new Date(`${event.date}T12:00:00`).getTime();
        if (event.kind === 'period_start' || event.kind === 'period_end' || event.kind === 'spotting' || event.kind === 'flow' || event.kind === 'cramp') {
            events.push(createEvent(
                'menstrual',
                event.date,
                baseTs,
                {
                    value: event.kind === 'cramp' ? event.payload?.crampLevel : event.kind === 'flow'
                        ? (event.payload?.flow === 'heavy' ? 3 : event.payload?.flow === 'medium' ? 2 : 1)
                        : 1
                },
                { isGood: event.kind !== 'cramp' || (event.payload?.crampLevel || 0) <= 2 },
                [event.kind, `partner:${event.partnerId}`],
                event.id
            ));
        }

        if (event.kind === 'ovulation_test') {
            events.push(createEvent(
                'ovulation_test',
                event.date,
                baseTs,
                {
                    value: event.payload?.ovulationTest === 'peak' ? 3 : event.payload?.ovulationTest === 'high' ? 2 : 1
                },
                { isGood: event.payload?.ovulationTest === 'peak' },
                [event.payload?.ovulationTest || 'negative', `partner:${event.partnerId}`],
                event.id
            ));
        }
    });

    (options.pregnancyEvents || []).forEach((event) => {
        const baseTs = new Date(`${event.date}T12:00:00`).getTime();
        if (event.kind === 'pregnancy_test') {
            events.push(createEvent(
                'pregnancy_test',
                event.date,
                baseTs,
                {
                    value: ['positive', 'faint_positive'].includes(event.payload?.pregnancyTest || '') ? 1 : 0
                },
                { isGood: event.payload?.pregnancyTest === 'negative' },
                [event.payload?.pregnancyTest || 'invalid', `partner:${event.partnerId}`],
                event.id
            ));
        }

        if (event.kind === 'pregnancy_outcome') {
            events.push(createEvent(
                'pregnancy_outcome',
                event.date,
                baseTs,
                { value: 1 },
                { isGood: event.payload?.pregnancyOutcome === 'ongoing' },
                [event.payload?.pregnancyOutcome || 'unknown', `partner:${event.partnerId}`],
                event.id
            ));
        }
    });

    return events.sort((a, b) => a.timestamp - b.timestamp);
};
