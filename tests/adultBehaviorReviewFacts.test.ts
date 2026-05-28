import { describe, it, expect } from 'vitest';
import type {
  PornUseEvent,
  MasturbationEvent,
  SexEvent,
} from '../domain';
import type { AdultBehaviorReviewInput } from '../features/stats/model/adultBehaviorReviewInput';
import {
  computeSortKey,
  compareTimelineEvents,
  buildPornUseTimelineEvent,
  buildMasturbationTimelineEvent,
  buildSexTimelineEvent,
  buildTimelineDays,
  buildWindowFacts,
  aggregatePornUseFacts,
  aggregateMasturbationFacts,
  aggregateSexFacts,
  aggregateRecoveryFacts,
  resetTimelineIdCounter,
} from '../features/stats/model/adultBehaviorReviewFacts';
import type { ReviewTimelineEvent } from '../features/stats/model/adultBehaviorReviewFacts';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makePu = (targetDate: string, overrides: Partial<PornUseEvent> = {}): PornUseEvent => ({
  id: `pu_${targetDate}`,
  startedAt: `${targetDate}T20:00:00`,
  targetDate,
  createdAt: `${targetDate}T20:00:00`,
  updatedAt: `${targetDate}T20:00:00`,
  status: 'completed',
  source: 'manual',
  durationMinutes: 30,
  contentTypes: ['video'],
  sourceTypes: [],
  arousalLevel: null,
  ledToMasturbation: null,
  ejaculated: null,
  afterState: [],
  motives: [],
  controlFeeling: null,
  exceededIntendedTime: null,
  edging: 'none',
  orgasmIntensity: null,
  fatigueAfter: null,
  satisfaction: null,
  sleepImpact: null,
  linkedMasturbationEventIds: [],
  linkedSexEventIds: [],
  ...overrides,
});

const makeMb = (targetDate: string, overrides: Partial<MasturbationEvent> = {}): MasturbationEvent => ({
  id: `mb_${targetDate}`,
  startedAt: `${targetDate}T21:00:00`,
  targetDate,
  createdAt: `${targetDate}T21:00:00`,
  updatedAt: `${targetDate}T21:00:00`,
  status: 'completed',
  source: 'manual',
  durationMinutes: 15,
  ejaculated: true,
  orgasmIntensity: null,
  edging: 'none',
  hardnessLevel: null,
  arousalLevel: null,
  stimulationSources: [],
  afterState: [],
  satisfaction: null,
  fatigueAfter: null,
  sleepImpact: null,
  controlFeeling: null,
  exceededIntendedTime: null,
  sessionCount: 1,
  ejaculationCount: 1,
  linkedPornUseEventIds: [],
  linkedSexEventIds: [],
  ...overrides,
});

const makeSx = (targetDate: string, overrides: Partial<SexEvent> = {}): SexEvent => ({
  id: `sx_${targetDate}`,
  startedAt: `${targetDate}T22:00:00`,
  targetDate,
  createdAt: `${targetDate}T22:00:00`,
  updatedAt: `${targetDate}T22:00:00`,
  status: 'completed',
  source: 'manual',
  durationMinutes: 45,
  partnerIds: [],
  interactionTypes: [],
  penetration: 'unknown',
  hardnessLevel: null,
  ejaculated: null,
  ejaculationContext: null,
  orgasmIntensity: null,
  satisfaction: null,
  afterState: [],
  pornInvolved: null,
  linkedPornUseEventIds: [],
  linkedMasturbationEventIds: [],
  ...overrides,
});

const makeInput = (overrides: Partial<AdultBehaviorReviewInput>): AdultBehaviorReviewInput => ({
  generatedAt: new Date().toISOString(),
  window: { kind: 'rolling_14d', startDate: '2026-05-15', endDate: '2026-05-28', label: '近 14 天' },
  physiologicalDayBoundaryHour: 3,
  pornUseEvents: [],
  masturbationEvents: [],
  sexEvents: [],
  dailyLogs: [],
  ...overrides,
});

// ── computeSortKey ───────────────────────────────────────────────────────────

describe('computeSortKey', () => {
  it('uses occurredAt when provided', () => {
    expect(computeSortKey('porn_use', '2026-05-28T20:00:00')).toBe('2026-05-28T20:00:00');
  });

  it('uses synthetic key when no occurredAt', () => {
    expect(computeSortKey('sleep')).toBe('00:00:00');
    expect(computeSortKey('morning_hardness')).toBe('06:00:00');
    expect(computeSortKey('porn_use')).toBe('23:00:00');
  });
});

// ── compareTimelineEvents ────────────────────────────────────────────────────

describe('compareTimelineEvents', () => {
  it('sorts by sortKey first', () => {
    const a: ReviewTimelineEvent = { id: 'a', kind: 'sleep', targetDate: '2026-05-28', sortKey: '00:00:00', summaryFacts: [], linkedEventIds: [], privacyLevel: 'standard' };
    const b: ReviewTimelineEvent = { id: 'b', kind: 'porn_use', targetDate: '2026-05-28', sortKey: '20:00:00', summaryFacts: [], linkedEventIds: [], privacyLevel: 'sensitive' };
    expect(compareTimelineEvents(a, b)).toBeLessThan(0);
  });

  it('sorts by kind order when sortKey is equal', () => {
    const a: ReviewTimelineEvent = { id: 'a', kind: 'sleep', targetDate: '2026-05-28', sortKey: '12:00:00', summaryFacts: [], linkedEventIds: [], privacyLevel: 'standard' };
    const b: ReviewTimelineEvent = { id: 'b', kind: 'porn_use', targetDate: '2026-05-28', sortKey: '12:00:00', summaryFacts: [], linkedEventIds: [], privacyLevel: 'sensitive' };
    expect(compareTimelineEvents(a, b)).toBeLessThan(0); // sleep before porn_use
  });

  it('same kind and sortKey returns 0', () => {
    const a: ReviewTimelineEvent = { id: 'a', kind: 'sleep', targetDate: '2026-05-28', sortKey: '00:00:00', summaryFacts: [], linkedEventIds: [], privacyLevel: 'standard' };
    expect(compareTimelineEvents(a, { ...a, id: 'b' })).toBe(0);
  });
});

// ── Timeline event builders ──────────────────────────────────────────────────

describe('buildPornUseTimelineEvent', () => {
  it('builds a timeline event with duration and contentTypes', () => {
    resetTimelineIdCounter();
    const event = makePu('2026-05-28', { durationMinutes: 45, contentTypes: ['video', 'image'], ejaculated: true });
    const tl = buildPornUseTimelineEvent(event);
    expect(tl.kind).toBe('porn_use');
    expect(tl.targetDate).toBe('2026-05-28');
    expect(tl.sourceId).toBe('pu_2026-05-28');
    expect(tl.privacyLevel).toBe('sensitive');
    expect(tl.summaryFacts).toContainEqual({ key: 'duration', value: 45, unit: 'min' });
    expect(tl.summaryFacts).toContainEqual({ key: 'ejaculated', value: true });
    expect(tl.summaryFacts).toContainEqual({ key: 'contentTypes', value: 'video, image' });
  });

  it('omits null/empty facts', () => {
    resetTimelineIdCounter();
    const event = makePu('2026-05-28', { durationMinutes: null, ejaculated: null, controlFeeling: null, ledToMasturbation: null });
    const tl = buildPornUseTimelineEvent(event);
    expect(tl.summaryFacts).toHaveLength(1); // contentTypes only
  });
});

describe('buildMasturbationTimelineEvent', () => {
  it('includes edging when not none', () => {
    resetTimelineIdCounter();
    const event = makeMb('2026-05-28', { edging: 'multiple' });
    const tl = buildMasturbationTimelineEvent(event);
    expect(tl.summaryFacts).toContainEqual({ key: 'edging', value: 'multiple' });
  });
});

describe('buildSexTimelineEvent', () => {
  it('includes pornInvolved', () => {
    resetTimelineIdCounter();
    const event = makeSx('2026-05-28', { pornInvolved: true });
    const tl = buildSexTimelineEvent(event);
    expect(tl.summaryFacts).toContainEqual({ key: 'pornInvolved', value: true });
  });
});

// ── buildTimelineDays ────────────────────────────────────────────────────────

describe('buildTimelineDays', () => {
  it('groups events by targetDate', () => {
    const input = makeInput({
      dailyLogs: [
        { targetDate: '2026-05-26', morningHardness: 3, sleepDurationMinutes: 400, sleepQuality: 3 },
        { targetDate: '2026-05-28', morningHardness: 4, sleepDurationMinutes: 480, sleepQuality: 4 },
      ],
      pornUseEvents: [makePu('2026-05-26')],
    });
    const days = buildTimelineDays(input);
    expect(days).toHaveLength(2);
    expect(days[0].targetDate).toBe('2026-05-26');
    expect(days[1].targetDate).toBe('2026-05-28');
    // Day 06 has sleep + morning_hardness + porn_use = 3 events
    expect(days[0].events).toHaveLength(3);
  });

  it('sorts events within a day by sortKey', () => {
    const input = makeInput({
      dailyLogs: [
        { targetDate: '2026-05-28', morningHardness: 4, sleepDurationMinutes: 480, sleepQuality: 4 },
      ],
      sexEvents: [makeSx('2026-05-28', { startedAt: '2026-05-28T22:00:00' })],
    });
    const days = buildTimelineDays(input);
    const events = days[0].events;
    expect(events[0].kind).toBe('sleep'); // sortKey 00:00
    expect(events[1].kind).toBe('morning_hardness'); // sortKey 06:00
    expect(events[2].kind).toBe('sex'); // sortKey 22:00
  });

  it('linked ids enter timeline but no causal field', () => {
    const input = makeInput({
      pornUseEvents: [makePu('2026-05-28', { linkedMasturbationEventIds: ['mb_2026-05-28'] })],
      masturbationEvents: [makeMb('2026-05-28', { linkedPornUseEventIds: ['pu_2026-05-28'] })],
    });
    const days = buildTimelineDays(input);
    const puEvent = days[0].events.find((e) => e.kind === 'porn_use')!;
    expect(puEvent.linkedEventIds).toContain('mb_2026-05-28');
    expect((puEvent as unknown as Record<string, unknown>).causedBy).toBeUndefined();
  });

  it('orphan linked ids produce missing data', () => {
    const input = makeInput({
      pornUseEvents: [makePu('2026-05-28', { linkedMasturbationEventIds: ['mb_nonexistent'] })],
    });
    const days = buildTimelineDays(input);
    const orphan = days[0].missingData.find((m) => m.key === 'orphan_linked_id');
    expect(orphan).toBeTruthy();
    expect(orphan!.affectedMetrics).toContain('event_linking');
  });

  it('cross-day linked ids are NOT flagged as orphans', () => {
    const input = makeInput({
      pornUseEvents: [makePu('2026-05-26', { linkedMasturbationEventIds: ['mb_2026-05-27'] })],
      masturbationEvents: [makeMb('2026-05-27', { linkedPornUseEventIds: ['pu_2026-05-26'] })],
    });
    const days = buildTimelineDays(input);
    const day26 = days.find((d) => d.targetDate === '2026-05-26')!;
    const orphans = day26.missingData.filter((m) => m.key === 'orphan_linked_id');
    expect(orphans).toHaveLength(0);
  });

  it('missing daily log produces warning', () => {
    const input = makeInput({
      pornUseEvents: [makePu('2026-05-28')],
    });
    const days = buildTimelineDays(input);
    const noLog = days[0].missingData.find((m) => m.key === 'no_daily_log');
    expect(noLog).toBeTruthy();
    expect(noLog!.severity).toBe('warning');
  });

  it('missing morning hardness produces info', () => {
    const input = makeInput({
      dailyLogs: [
        { targetDate: '2026-05-28', sleepDurationMinutes: 480, sleepQuality: 4 },
      ],
    });
    const days = buildTimelineDays(input);
    const noMH = days[0].missingData.find((m) => m.key === 'no_morning_hardness');
    expect(noMH).toBeTruthy();
    expect(noMH!.severity).toBe('info');
  });
});

// ── Window aggregation ───────────────────────────────────────────────────────

describe('aggregatePornUseFacts', () => {
  it('empty events returns zeros and nulls', () => {
    const facts = aggregatePornUseFacts([]);
    expect(facts.count).toBe(0);
    expect(facts.totalDurationMinutes).toBeNull();
    expect(facts.avgDurationMinutes).toBeNull();
    expect(facts.ejaculationCount).toBe(0);
  });

  it('aggregates correctly', () => {
    const events = [
      makePu('2026-05-26', { durationMinutes: 30, ejaculated: true, ledToMasturbation: true, exceededIntendedTime: false, controlFeeling: 3 }),
      makePu('2026-05-27', { durationMinutes: 60, ejaculated: false, ledToMasturbation: false, exceededIntendedTime: true, controlFeeling: 2 }),
    ];
    const facts = aggregatePornUseFacts(events);
    expect(facts.count).toBe(2);
    expect(facts.totalDurationMinutes).toBe(90);
    expect(facts.avgDurationMinutes).toBe(45);
    expect(facts.ejaculationCount).toBe(1);
    expect(facts.ledToMasturbationCount).toBe(1);
    expect(facts.exceededTimeCount).toBe(1);
    expect(facts.controlFeelingSampleSize).toBe(2);
  });

  it('null durationMinutes not counted in mean', () => {
    const events = [
      makePu('2026-05-26', { durationMinutes: null }),
      makePu('2026-05-27', { durationMinutes: 40 }),
    ];
    const facts = aggregatePornUseFacts(events);
    expect(facts.avgDurationMinutes).toBe(40);
  });
});

describe('aggregateMasturbationFacts', () => {
  it('aggregates edging', () => {
    const events = [
      makeMb('2026-05-26', { edging: 'multiple', hardnessLevel: 4, satisfaction: 3 }),
      makeMb('2026-05-27', { edging: 'none', hardnessLevel: null, satisfaction: null }),
    ];
    const facts = aggregateMasturbationFacts(events);
    expect(facts.count).toBe(2);
    expect(facts.edgingCount).toBe(1);
    expect(facts.hardnessSampleSize).toBe(1);
    expect(facts.hardnessMean).toBe(4);
    expect(facts.satisfactionSampleSize).toBe(1);
  });
});

describe('aggregateSexFacts', () => {
  it('aggregates pornInvolved', () => {
    const events = [
      makeSx('2026-05-26', { pornInvolved: true, fatigueAfter: 3 }),
      makeSx('2026-05-27', { pornInvolved: false, fatigueAfter: 2 }),
    ];
    const facts = aggregateSexFacts(events);
    expect(facts.count).toBe(2);
    expect(facts.pornInvolvedCount).toBe(1);
    expect(facts.fatigueSampleSize).toBe(2);
    expect(facts.fatigueMean).toBe(2.5);
  });
});

describe('aggregateRecoveryFacts', () => {
  it('aggregates from daily logs and adult behavior events', () => {
    const logs = [
      { targetDate: '2026-05-26', morningHardness: 3, sleepDurationMinutes: 420, sleepQuality: 3 },
      { targetDate: '2026-05-27', morningHardness: 4, sleepDurationMinutes: 480, sleepQuality: 4 },
      { targetDate: '2026-05-28', morningHardness: null, sleepDurationMinutes: null, sleepQuality: null },
    ];
    const sx = [makeSx('2026-05-26', { fatigueAfter: 3 })];
    const facts = aggregateRecoveryFacts(logs, sx, []);
    expect(facts.morningHardnessSampleSize).toBe(2);
    expect(facts.morningHardnessMean).toBe(3.5);
    expect(facts.sleepSampleSize).toBe(2);
    expect(facts.sleepMeanMinutes).toBe(450);
    expect(facts.fatigueSampleSize).toBe(1);
  });

  it('empty input returns zeros and nulls', () => {
    const facts = aggregateRecoveryFacts([], [], []);
    expect(facts.morningHardnessSampleSize).toBe(0);
    expect(facts.morningHardnessMean).toBeNull();
    expect(facts.sleepSampleSize).toBe(0);
    expect(facts.sleepMeanMinutes).toBeNull();
    expect(facts.fatigueSampleSize).toBe(0);
  });
});

// ── buildWindowFacts ─────────────────────────────────────────────────────────

describe('buildWindowFacts', () => {
  it('builds complete window facts from input', () => {
    const input = makeInput({
      dailyLogs: [
        { targetDate: '2026-05-26', morningHardness: 3, sleepDurationMinutes: 420, sleepQuality: 3 },
        { targetDate: '2026-05-27', morningHardness: 4, sleepDurationMinutes: 480, sleepQuality: 4 },
      ],
      pornUseEvents: [makePu('2026-05-26')],
      masturbationEvents: [makeMb('2026-05-27')],
      sexEvents: [],
    });
    const facts = buildWindowFacts(input);
    expect(facts.window.kind).toBe('rolling_14d');
    expect(facts.recordDays).toBe(2);
    expect(facts.pornUse.count).toBe(1);
    expect(facts.masturbation.count).toBe(1);
    expect(facts.sex.count).toBe(0);
    expect(facts.recovery.morningHardnessSampleSize).toBe(2);
    expect(facts.timeline).toHaveLength(2);
  });

  it('empty input produces empty timeline', () => {
    const facts = buildWindowFacts(makeInput({}));
    expect(facts.recordDays).toBe(0);
    expect(facts.timeline).toHaveLength(0);
    expect(facts.pornUse.count).toBe(0);
    expect(facts.masturbation.count).toBe(0);
    expect(facts.sex.count).toBe(0);
  });

  it('mean only outputs when sampleSize > 0', () => {
    const facts = buildWindowFacts(makeInput({}));
    expect(facts.recovery.morningHardnessMean).toBeNull();
    expect(facts.recovery.sleepMeanMinutes).toBeNull();
  });
});
