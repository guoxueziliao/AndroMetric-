import type {
  PornUseEvent,
  MasturbationEvent,
  SexEvent,
  AdultBehaviorScale5,
} from '../../../domain';
import type {
  AdultBehaviorReviewInput,
  AdultBehaviorDailyLogInput,
} from './adultBehaviorReviewInput';

// ── Timeline types ───────────────────────────────────────────────────────────

export type ReviewTimelineEventKind =
  | 'porn_use'
  | 'masturbation'
  | 'sex'
  | 'morning_hardness'
  | 'sleep'
  | 'alcohol'
  | 'exercise'
  | 'mood'
  | 'stress'
  | 'fatigue';

export interface ReviewFact {
  key: string;
  value: string | number | boolean | null;
  unit?: string;
}

export interface ReviewTimelineEvent {
  id: string;
  kind: ReviewTimelineEventKind;
  targetDate: string;
  occurredAt?: string;
  sortKey: string;
  sourceId?: string;
  summaryFacts: ReviewFact[];
  linkedEventIds: string[];
  privacyLevel: 'standard' | 'sensitive';
}

export interface ReviewMissingData {
  key: string;
  targetDate?: string;
  severity: 'info' | 'warning';
  affectedMetrics: string[];
}

export interface ReviewTimelineDay {
  targetDate: string;
  events: ReviewTimelineEvent[];
  dayFacts: ReviewFact[];
  missingData: ReviewMissingData[];
}

// ── Window facts types ───────────────────────────────────────────────────────

export interface PornUseWindowFacts {
  count: number;
  totalDurationMinutes: number | null;
  avgDurationMinutes: number | null;
  ejaculationCount: number;
  ledToMasturbationCount: number;
  exceededTimeCount: number;
  controlFeelingSampleSize: number;
}

export interface MasturbationWindowFacts {
  count: number;
  ejaculationCount: number;
  edgingCount: number;
  hardnessSampleSize: number;
  hardnessMean: number | null;
  satisfactionSampleSize: number;
  satisfactionMean: number | null;
}

export interface SexWindowFacts {
  count: number;
  ejaculationCount: number;
  pornInvolvedCount: number;
  hardnessSampleSize: number;
  hardnessMean: number | null;
  satisfactionSampleSize: number;
  satisfactionMean: number | null;
  fatigueSampleSize: number;
  fatigueMean: number | null;
}

export interface RecoveryWindowFacts {
  morningHardnessSampleSize: number;
  morningHardnessMean: number | null;
  sleepSampleSize: number;
  sleepMeanMinutes: number | null;
  fatigueSampleSize: number;
}

export interface AdultBehaviorWindowFacts {
  window: AdultBehaviorReviewInput['window'];
  recordDays: number;
  missingData: ReviewMissingData[];
  pornUse: PornUseWindowFacts;
  masturbation: MasturbationWindowFacts;
  sex: SexWindowFacts;
  recovery: RecoveryWindowFacts;
  timeline: ReviewTimelineDay[];
}

// ── Sort key helpers ─────────────────────────────────────────────────────────

const KIND_ORDER: ReviewTimelineEventKind[] = [
  'sleep', 'morning_hardness', 'porn_use', 'masturbation', 'sex',
  'exercise', 'alcohol', 'mood', 'stress', 'fatigue',
];

const kindOrderIndex = (kind: ReviewTimelineEventKind): number => {
  const idx = KIND_ORDER.indexOf(kind);
  return idx === -1 ? Infinity : idx;
};

const SYNTHETIC_SORT_KEYS: Record<string, string> = {
  sleep: '00:00:00',
  morning_hardness: '06:00:00',
  alcohol: '20:00:00',
  exercise: '18:00:00',
  mood: '21:00:00',
  stress: '21:30:00',
  fatigue: '22:00:00',
};

export const computeSortKey = (kind: ReviewTimelineEventKind, occurredAt?: string): string => {
  if (occurredAt) return occurredAt;
  return SYNTHETIC_SORT_KEYS[kind] ?? '23:00:00';
};

export const compareTimelineEvents = (a: ReviewTimelineEvent, b: ReviewTimelineEvent): number => {
  if (a.sortKey !== b.sortKey) return a.sortKey.localeCompare(b.sortKey);
  return kindOrderIndex(a.kind) - kindOrderIndex(b.kind);
};

// ── Timeline event builders ──────────────────────────────────────────────────

let _idCounter = 0;
const makeId = (prefix: string): string => `${prefix}_tl_${++_idCounter}`;

export const resetTimelineIdCounter = (): void => { _idCounter = 0; };

const scale5ToNumeric = (v: AdultBehaviorScale5 | null | undefined): number | null =>
  typeof v === 'number' ? v : null;

export const buildPornUseTimelineEvent = (event: PornUseEvent): ReviewTimelineEvent => ({
  id: makeId('pu'),
  kind: 'porn_use',
  targetDate: event.targetDate,
  occurredAt: event.startedAt,
  sortKey: computeSortKey('porn_use', event.startedAt),
  sourceId: event.id,
  summaryFacts: [
    ...(event.durationMinutes != null ? [{ key: 'duration', value: event.durationMinutes, unit: 'min' }] : []),
    ...(event.contentTypes.length > 0 ? [{ key: 'contentTypes', value: event.contentTypes.join(', ') }] : []),
    ...(event.ejaculated === true ? [{ key: 'ejaculated', value: true }] : []),
    ...(event.ledToMasturbation === true ? [{ key: 'ledToMasturbation', value: true }] : []),
    ...(scale5ToNumeric(event.controlFeeling) != null ? [{ key: 'controlFeeling', value: scale5ToNumeric(event.controlFeeling)! }] : []),
  ],
  linkedEventIds: [...event.linkedMasturbationEventIds, ...event.linkedSexEventIds],
  privacyLevel: 'sensitive',
});

export const buildMasturbationTimelineEvent = (event: MasturbationEvent): ReviewTimelineEvent => ({
  id: makeId('mb'),
  kind: 'masturbation',
  targetDate: event.targetDate,
  occurredAt: event.startedAt,
  sortKey: computeSortKey('masturbation', event.startedAt),
  sourceId: event.id,
  summaryFacts: [
    ...(event.durationMinutes != null ? [{ key: 'duration', value: event.durationMinutes, unit: 'min' }] : []),
    ...(event.ejaculated === true ? [{ key: 'ejaculated', value: true }] : []),
    ...(event.edging !== 'none' ? [{ key: 'edging', value: event.edging }] : []),
    ...(scale5ToNumeric(event.hardnessLevel) != null ? [{ key: 'hardness', value: scale5ToNumeric(event.hardnessLevel)! }] : []),
    ...(scale5ToNumeric(event.satisfaction) != null ? [{ key: 'satisfaction', value: scale5ToNumeric(event.satisfaction)! }] : []),
  ],
  linkedEventIds: [...event.linkedPornUseEventIds, ...event.linkedSexEventIds],
  privacyLevel: 'sensitive',
});

export const buildSexTimelineEvent = (event: SexEvent): ReviewTimelineEvent => ({
  id: makeId('sx'),
  kind: 'sex',
  targetDate: event.targetDate,
  occurredAt: event.startedAt,
  sortKey: computeSortKey('sex', event.startedAt),
  sourceId: event.id,
  summaryFacts: [
    ...(event.durationMinutes != null ? [{ key: 'duration', value: event.durationMinutes, unit: 'min' }] : []),
    ...(event.ejaculated === true ? [{ key: 'ejaculated', value: true }] : []),
    ...(event.penetration !== 'unknown' ? [{ key: 'penetration', value: event.penetration }] : []),
    ...(scale5ToNumeric(event.hardnessLevel) != null ? [{ key: 'hardness', value: scale5ToNumeric(event.hardnessLevel)! }] : []),
    ...(scale5ToNumeric(event.satisfaction) != null ? [{ key: 'satisfaction', value: scale5ToNumeric(event.satisfaction)! }] : []),
    ...(event.pornInvolved === true ? [{ key: 'pornInvolved', value: true }] : []),
  ],
  linkedEventIds: [...event.linkedPornUseEventIds, ...event.linkedMasturbationEventIds],
  privacyLevel: 'sensitive',
});

export const buildDailyLogTimelineEvents = (log: AdultBehaviorDailyLogInput): ReviewTimelineEvent[] => {
  const events: ReviewTimelineEvent[] = [];

  if (log.sleepDurationMinutes != null || log.sleepQuality != null) {
    events.push({
      id: makeId('sl'),
      kind: 'sleep',
      targetDate: log.targetDate,
      sortKey: computeSortKey('sleep'),
      summaryFacts: [
        ...(log.sleepDurationMinutes != null ? [{ key: 'duration', value: log.sleepDurationMinutes, unit: 'min' }] : []),
        ...(log.sleepQuality != null ? [{ key: 'quality', value: log.sleepQuality }] : []),
      ],
      linkedEventIds: [],
      privacyLevel: 'standard',
    });
  }

  if (log.morningHardness != null) {
    events.push({
      id: makeId('mh'),
      kind: 'morning_hardness',
      targetDate: log.targetDate,
      sortKey: computeSortKey('morning_hardness'),
      summaryFacts: [
        { key: 'hardness', value: log.morningHardness },
      ],
      linkedEventIds: [],
      privacyLevel: 'standard',
    });
  }

  if (log.alcohol === true) {
    events.push({
      id: makeId('al'),
      kind: 'alcohol',
      targetDate: log.targetDate,
      sortKey: computeSortKey('alcohol'),
      summaryFacts: [{ key: 'consumed', value: true }],
      linkedEventIds: [],
      privacyLevel: 'standard',
    });
  }

  if (log.exerciseMinutes != null && log.exerciseMinutes > 0) {
    events.push({
      id: makeId('ex'),
      kind: 'exercise',
      targetDate: log.targetDate,
      sortKey: computeSortKey('exercise'),
      summaryFacts: [{ key: 'duration', value: log.exerciseMinutes, unit: 'min' }],
      linkedEventIds: [],
      privacyLevel: 'standard',
    });
  }

  if (log.moodLevel != null) {
    events.push({
      id: makeId('mo'),
      kind: 'mood',
      targetDate: log.targetDate,
      sortKey: computeSortKey('mood'),
      summaryFacts: [{ key: 'level', value: log.moodLevel }],
      linkedEventIds: [],
      privacyLevel: 'standard',
    });
  }

  if (log.stressLevel != null) {
    events.push({
      id: makeId('st'),
      kind: 'stress',
      targetDate: log.targetDate,
      sortKey: computeSortKey('stress'),
      summaryFacts: [{ key: 'level', value: log.stressLevel }],
      linkedEventIds: [],
      privacyLevel: 'standard',
    });
  }

  return events;
};

// ── Timeline day grouping ────────────────────────────────────────────────────

export const buildTimelineDays = (input: AdultBehaviorReviewInput): ReviewTimelineDay[] => {
  resetTimelineIdCounter();

  const dayMap = new Map<string, ReviewTimelineEvent[]>();

  // Helper to ensure a day exists in the map
  const ensureDay = (date: string) => {
    if (!dayMap.has(date)) dayMap.set(date, []);
  };

  // Add daily log events
  for (const log of input.dailyLogs) {
    ensureDay(log.targetDate);
    const events = buildDailyLogTimelineEvents(log);
    dayMap.get(log.targetDate)!.push(...events);
  }

  // Add adult behavior events
  for (const event of input.pornUseEvents) {
    ensureDay(event.targetDate);
    dayMap.get(event.targetDate)!.push(buildPornUseTimelineEvent(event));
  }
  for (const event of input.masturbationEvents) {
    ensureDay(event.targetDate);
    dayMap.get(event.targetDate)!.push(buildMasturbationTimelineEvent(event));
  }
  for (const event of input.sexEvents) {
    ensureDay(event.targetDate);
    dayMap.get(event.targetDate)!.push(buildSexTimelineEvent(event));
  }

  // Sort days and events within days
  const sortedDates = [...dayMap.keys()].sort();

  // Collect all source IDs across the entire window for cross-day orphan detection
  const windowSourceIds = new Set<string>();
  for (const events of dayMap.values()) {
    for (const e of events) {
      if (e.sourceId) windowSourceIds.add(e.sourceId);
    }
  }

  return sortedDates.map((targetDate) => {
    const events = dayMap.get(targetDate)!.sort(compareTimelineEvents);
    const missingData = buildDayMissingData(targetDate, events, input, windowSourceIds);
    return {
      targetDate,
      events,
      dayFacts: buildDayFacts(events),
      missingData,
    };
  });
};

// ── Day-level facts and missing data ─────────────────────────────────────────

const buildDayFacts = (events: ReviewTimelineEvent[]): ReviewFact[] => {
  const facts: ReviewFact[] = [];
  const adultEvents = events.filter(
    (e) => e.kind === 'porn_use' || e.kind === 'masturbation' || e.kind === 'sex',
  );
  if (adultEvents.length > 0) {
    facts.push({ key: 'adultBehaviorCount', value: adultEvents.length });
  }
  const ejaculations = events.filter((e) =>
    e.summaryFacts.some((f) => f.key === 'ejaculated' && f.value === true),
  );
  if (ejaculations.length > 0) {
    facts.push({ key: 'ejaculationCount', value: ejaculations.length });
  }
  return facts;
};

const buildDayMissingData = (
  targetDate: string,
  events: ReviewTimelineEvent[],
  input: AdultBehaviorReviewInput,
  windowSourceIds: Set<string>,
): ReviewMissingData[] => {
  const missing: ReviewMissingData[] = [];
  const hasLog = input.dailyLogs.some((l) => l.targetDate === targetDate);
  const eventKinds = new Set(events.map((e) => e.kind));

  if (!hasLog) {
    missing.push({
      key: 'no_daily_log',
      targetDate,
      severity: 'warning',
      affectedMetrics: ['morning_hardness', 'sleep', 'stress', 'mood'],
    });
  }

  if (hasLog && !eventKinds.has('morning_hardness')) {
    missing.push({
      key: 'no_morning_hardness',
      targetDate,
      severity: 'info',
      affectedMetrics: ['morning_hardness'],
    });
  }

  if (hasLog && !eventKinds.has('sleep')) {
    missing.push({
      key: 'no_sleep_record',
      targetDate,
      severity: 'info',
      affectedMetrics: ['sleep'],
    });
  }

  // Check orphan linked ids against all source IDs in the window
  for (const event of events) {
    for (const linkedId of event.linkedEventIds) {
      if (!windowSourceIds.has(linkedId)) {
        missing.push({
          key: 'orphan_linked_id',
          targetDate,
          severity: 'info',
          affectedMetrics: ['event_linking'],
        });
        break; // one warning per event is enough
      }
    }
  }

  return missing;
};

// ── Window aggregation ───────────────────────────────────────────────────────

const safeMean = (values: (number | null | undefined)[]): number | null => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

const countTrue = (values: (boolean | null | undefined)[]): number =>
  values.filter((v) => v === true).length;

export const aggregatePornUseFacts = (events: PornUseEvent[]): PornUseWindowFacts => {
  const durations = events.map((e) => e.durationMinutes);
  const validDurations = durations.filter((d): d is number => typeof d === 'number');
  return {
    count: events.length,
    totalDurationMinutes: validDurations.length > 0 ? validDurations.reduce((a, b) => a + b, 0) : null,
    avgDurationMinutes: safeMean(durations),
    ejaculationCount: countTrue(events.map((e) => e.ejaculated)),
    ledToMasturbationCount: countTrue(events.map((e) => e.ledToMasturbation)),
    exceededTimeCount: countTrue(events.map((e) => e.exceededIntendedTime)),
    controlFeelingSampleSize: events.filter((e) => e.controlFeeling != null).length,
  };
};

export const aggregateMasturbationFacts = (events: MasturbationEvent[]): MasturbationWindowFacts => ({
  count: events.length,
  ejaculationCount: countTrue(events.map((e) => e.ejaculated)),
  edgingCount: events.filter((e) => e.edging !== 'none').length,
  hardnessSampleSize: events.filter((e) => e.hardnessLevel != null).length,
  hardnessMean: safeMean(events.map((e) => e.hardnessLevel)),
  satisfactionSampleSize: events.filter((e) => e.satisfaction != null).length,
  satisfactionMean: safeMean(events.map((e) => e.satisfaction)),
});

export const aggregateSexFacts = (events: SexEvent[]): SexWindowFacts => ({
  count: events.length,
  ejaculationCount: countTrue(events.map((e) => e.ejaculated)),
  pornInvolvedCount: countTrue(events.map((e) => e.pornInvolved)),
  hardnessSampleSize: events.filter((e) => e.hardnessLevel != null).length,
  hardnessMean: safeMean(events.map((e) => e.hardnessLevel)),
  satisfactionSampleSize: events.filter((e) => e.satisfaction != null).length,
  satisfactionMean: safeMean(events.map((e) => e.satisfaction)),
  fatigueSampleSize: events.filter((e) => e.fatigueAfter != null).length,
  fatigueMean: safeMean(events.map((e) => e.fatigueAfter)),
});

export const aggregateRecoveryFacts = (
  dailyLogs: AdultBehaviorDailyLogInput[],
  sexEvents: SexEvent[],
  masturbationEvents: MasturbationEvent[],
): RecoveryWindowFacts => {
  const hardnessValues = dailyLogs.map((l) => l.morningHardness);
  const sleepValues = dailyLogs.map((l) => l.sleepDurationMinutes);
  const fatigueValues = [
    ...sexEvents.map((e) => e.fatigueAfter),
    ...masturbationEvents.map((e) => e.fatigueAfter),
  ];

  return {
    morningHardnessSampleSize: hardnessValues.filter((v) => v != null).length,
    morningHardnessMean: safeMean(hardnessValues),
    sleepSampleSize: sleepValues.filter((v) => v != null).length,
    sleepMeanMinutes: safeMean(sleepValues),
    fatigueSampleSize: fatigueValues.filter((v) => v != null).length,
  };
};

// ── Build window facts ───────────────────────────────────────────────────────

export const buildWindowFacts = (input: AdultBehaviorReviewInput): AdultBehaviorWindowFacts => {
  const timeline = buildTimelineDays(input);
  const allMissing = timeline.flatMap((d) => d.missingData);

  return {
    window: input.window,
    recordDays: input.dailyLogs.length,
    missingData: allMissing,
    pornUse: aggregatePornUseFacts(input.pornUseEvents),
    masturbation: aggregateMasturbationFacts(input.masturbationEvents),
    sex: aggregateSexFacts(input.sexEvents),
    recovery: aggregateRecoveryFacts(
      input.dailyLogs,
      input.sexEvents,
      input.masturbationEvents,
    ),
    timeline,
  };
};
