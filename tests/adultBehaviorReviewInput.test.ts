import { describe, it, expect } from 'vitest';
import type { LogEntry, PornUseEvent, MasturbationEvent, SexEvent } from '../domain';
import {
  computeWindow,
  addDays,
  generateDateRange,
  mapLogToDailyInput,
  buildReviewInput,
  buildReviewInputForWindow,
} from '../features/stats/model/adultBehaviorReviewInput';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeLog = (overrides: Partial<LogEntry> & { date: string }): LogEntry => ({
  status: 'completed',
  updatedAt: Date.now(),
  tags: [],
  notes: null,
  mood: null,
  stressLevel: null,
  alcohol: null,
  alcoholRecords: [],
  exercise: [],
  sex: [],
  masturbation: [],
  changeHistory: [],
  ...overrides,
} as LogEntry);

const makePu = (targetDate: string, startedAt = `${targetDate}T20:00:00`): PornUseEvent => ({
  id: `pu_${targetDate}`,
  startedAt,
  targetDate,
  createdAt: startedAt,
  updatedAt: startedAt,
  status: 'completed',
  source: 'manual',
  durationMinutes: 30,
  contentTypes: [],
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
});

const makeMb = (targetDate: string, startedAt = `${targetDate}T21:00:00`): MasturbationEvent => ({
  id: `mb_${targetDate}`,
  startedAt,
  targetDate,
  createdAt: startedAt,
  updatedAt: startedAt,
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
});

const makeSx = (targetDate: string, startedAt = `${targetDate}T22:00:00`): SexEvent => ({
  id: `sx_${targetDate}`,
  startedAt,
  targetDate,
  createdAt: startedAt,
  updatedAt: startedAt,
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
});

// ── addDays ──────────────────────────────────────────────────────────────────

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-05-28', 3)).toBe('2026-05-31');
  });

  it('subtracts days', () => {
    expect(addDays('2026-05-28', -7)).toBe('2026-05-21');
  });

  it('crosses month boundary', () => {
    expect(addDays('2026-05-28', 5)).toBe('2026-06-02');
  });

  it('crosses year boundary', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('adding 0 returns same date', () => {
    expect(addDays('2026-05-28', 0)).toBe('2026-05-28');
  });
});

// ── generateDateRange ────────────────────────────────────────────────────────

describe('generateDateRange', () => {
  it('generates a single-day range', () => {
    expect(generateDateRange('2026-05-28', '2026-05-28')).toEqual(['2026-05-28']);
  });

  it('generates a multi-day range', () => {
    const range = generateDateRange('2026-05-26', '2026-05-28');
    expect(range).toEqual(['2026-05-26', '2026-05-27', '2026-05-28']);
  });

  it('generates 7 days', () => {
    const range = generateDateRange('2026-05-22', '2026-05-28');
    expect(range).toHaveLength(7);
  });
});

// ── computeWindow ────────────────────────────────────────────────────────────

describe('computeWindow', () => {
  it('rolling_7d: 7 days inclusive', () => {
    const w = computeWindow('rolling_7d', '2026-05-28');
    expect(w.startDate).toBe('2026-05-22');
    expect(w.endDate).toBe('2026-05-28');
    expect(w.kind).toBe('rolling_7d');
    const days = generateDateRange(w.startDate, w.endDate);
    expect(days).toHaveLength(7);
  });

  it('rolling_14d: 14 days inclusive', () => {
    const w = computeWindow('rolling_14d', '2026-05-28');
    expect(w.startDate).toBe('2026-05-15');
    expect(w.endDate).toBe('2026-05-28');
    const days = generateDateRange(w.startDate, w.endDate);
    expect(days).toHaveLength(14);
  });

  it('rolling_30d: 30 days inclusive', () => {
    const w = computeWindow('rolling_30d', '2026-05-28');
    expect(w.startDate).toBe('2026-04-29');
    expect(w.endDate).toBe('2026-05-28');
    const days = generateDateRange(w.startDate, w.endDate);
    expect(days).toHaveLength(30);
  });

  it('week: Monday to current day when anchor is mid-week', () => {
    // 2026-05-28 is Thursday
    const w = computeWindow('week', '2026-05-28');
    expect(w.kind).toBe('week');
    expect(w.startDate).toBe('2026-05-25'); // Monday
    expect(w.endDate).toBe('2026-05-28');
  });

  it('week: anchor on Monday returns just that day', () => {
    const w = computeWindow('week', '2026-05-25'); // Monday
    expect(w.startDate).toBe('2026-05-25');
    expect(w.endDate).toBe('2026-05-25');
  });

  it('week: anchor on Sunday returns Mon-Sun', () => {
    const w = computeWindow('week', '2026-05-31'); // Sunday
    expect(w.startDate).toBe('2026-05-25'); // Monday
    expect(w.endDate).toBe('2026-05-31');
  });

  it('month: first day of month to anchor', () => {
    const w = computeWindow('month', '2026-05-28');
    expect(w.kind).toBe('month');
    expect(w.startDate).toBe('2026-05-01');
    expect(w.endDate).toBe('2026-05-28');
  });

  it('month: anchor on first day', () => {
    const w = computeWindow('month', '2026-05-01');
    expect(w.startDate).toBe('2026-05-01');
    expect(w.endDate).toBe('2026-05-01');
  });

  it('month: uses last day of month as max endDate', () => {
    // If anchor is past month end, endDate is clamped to anchor
    const w = computeWindow('month', '2026-02-15');
    expect(w.startDate).toBe('2026-02-01');
    expect(w.endDate).toBe('2026-02-15');
  });

  it('label is set for each kind', () => {
    expect(computeWindow('rolling_7d', '2026-05-28').label).toBe('近 7 天');
    expect(computeWindow('rolling_14d', '2026-05-28').label).toBe('近 14 天');
    expect(computeWindow('rolling_30d', '2026-05-28').label).toBe('近 30 天');
    expect(computeWindow('week', '2026-05-28').label).toBeTruthy();
    expect(computeWindow('month', '2026-05-28').label).toBe('5月');
  });
});

// ── mapLogToDailyInput ───────────────────────────────────────────────────────

describe('mapLogToDailyInput', () => {
  it('maps a complete log', () => {
    const log = makeLog({
      date: '2026-05-28',
      morning: {
        id: 'm1',
        timestamp: Date.now(),
        wokeWithErection: true,
        hardness: 4,
        retention: 'normal',
        wokenByErection: false,
        durationImpression: null,
      },
      sleep: {
        id: 's1',
        startTime: '23:00',
        endTime: '07:00',
        quality: 3,
        attire: null,
        naturalAwakening: true,
        nocturnalEmission: false,
        withPartner: false,
        preSleepState: null,
        naps: [],
        hasDream: false,
        dreamTypes: [],
        environment: null,
      },
      stressLevel: 3,
      mood: 'neutral',
      notes: 'test note',
    });

    const input = mapLogToDailyInput(log);
    expect(input.targetDate).toBe('2026-05-28');
    expect(input.morningHardness).toBe(4);
    expect(input.erectionQuality).toBe(4);
    expect(input.sleepDurationMinutes).toBe(480);
    expect(input.sleepQuality).toBe(3);
    expect(input.stressLevel).toBe(3);
    expect(input.moodLevel).toBe(3);
    expect(input.notesPresent).toBe(true);
  });

  it('maps a minimal log with nulls', () => {
    const log = makeLog({ date: '2026-05-28' });
    const input = mapLogToDailyInput(log);
    expect(input.morningHardness).toBeNull();
    expect(input.erectionQuality).toBeNull();
    expect(input.sleepDurationMinutes).toBeNull();
    expect(input.sleepQuality).toBeNull();
    expect(input.alcohol).toBeNull();
    expect(input.exerciseMinutes).toBeNull();
    expect(input.stressLevel).toBeNull();
    expect(input.moodLevel).toBeNull();
    expect(input.fatigueLevel).toBeNull();
    expect(input.notesPresent).toBe(false);
  });

  it('does not fill fake defaults for missing fields', () => {
    const log = makeLog({ date: '2026-05-28', mood: null });
    const input = mapLogToDailyInput(log);
    expect(input.moodLevel).toBeNull();
  });

  it('calculates total exercise minutes', () => {
    const log = makeLog({
      date: '2026-05-28',
      exercise: [
        { id: 'e1', type: 'run', startTime: '08:00', duration: 30, intensity: 'medium', ongoing: false },
        { id: 'e2', type: 'gym', startTime: '17:00', duration: 45, intensity: 'high', ongoing: false },
      ],
    });
    const input = mapLogToDailyInput(log);
    expect(input.exerciseMinutes).toBe(75);
  });

  it('alcohol true when not none', () => {
    const log = makeLog({ date: '2026-05-28', alcohol: 'low' });
    expect(mapLogToDailyInput(log).alcohol).toBe(true);
  });

  it('alcohol false when none', () => {
    const log = makeLog({ date: '2026-05-28', alcohol: 'none' });
    expect(mapLogToDailyInput(log).alcohol).toBe(false);
  });

  it('handles overnight sleep crossing midnight', () => {
    const log = makeLog({
      date: '2026-05-28',
      sleep: {
        id: 's1',
        startTime: '01:00',
        endTime: '09:00',
        quality: 4,
        attire: null,
        naturalAwakening: true,
        nocturnalEmission: false,
        withPartner: false,
        preSleepState: null,
        naps: [],
        hasDream: false,
        dreamTypes: [],
        environment: null,
      },
    });
    const input = mapLogToDailyInput(log);
    expect(input.sleepDurationMinutes).toBe(480);
  });
});

// ── buildReviewInput ─────────────────────────────────────────────────────────

describe('buildReviewInput', () => {
  const win = computeWindow('rolling_7d', '2026-05-28');

  it('filters logs by window', () => {
    const logs = [
      makeLog({ date: '2026-05-22' }),
      makeLog({ date: '2026-05-25' }),
      makeLog({ date: '2026-05-28' }),
      makeLog({ date: '2026-05-20' }), // outside window
      makeLog({ date: '2026-05-29' }), // outside window
    ];
    const result = buildReviewInput({
      window: win, logs,
      pornUseEvents: [], masturbationEvents: [], sexEvents: [],
    });
    expect(result.dailyLogs).toHaveLength(3);
    expect(result.dailyLogs.map((d) => d.targetDate).sort()).toEqual(['2026-05-22', '2026-05-25', '2026-05-28']);
  });

  it('filters adult behavior events by targetDate in window', () => {
    const puIn = makePu('2026-05-25');
    const puOut = makePu('2026-05-20');
    const mbIn = makeMb('2026-05-26');
    const mbOut = makeMb('2026-05-30');
    const sxIn = makeSx('2026-05-28');
    const sxOut = makeSx('2026-05-15');

    const result = buildReviewInput({
      window: win,
      logs: [],
      pornUseEvents: [puIn, puOut],
      masturbationEvents: [mbIn, mbOut],
      sexEvents: [sxIn, sxOut],
    });

    expect(result.pornUseEvents).toHaveLength(1);
    expect(result.pornUseEvents[0].id).toBe('pu_2026-05-25');
    expect(result.masturbationEvents).toHaveLength(1);
    expect(result.masturbationEvents[0].id).toBe('mb_2026-05-26');
    expect(result.sexEvents).toHaveLength(1);
    expect(result.sexEvents[0].id).toBe('sx_2026-05-28');
  });

  it('sets physiologicalDayBoundaryHour to 3', () => {
    const result = buildReviewInput({
      window: win, logs: [],
      pornUseEvents: [], masturbationEvents: [], sexEvents: [],
    });
    expect(result.physiologicalDayBoundaryHour).toBe(3);
  });

  it('sets generatedAt to a valid ISO string', () => {
    const result = buildReviewInput({
      window: win, logs: [],
      pornUseEvents: [], masturbationEvents: [], sexEvents: [],
    });
    expect(() => new Date(result.generatedAt)).not.toThrow();
  });

  it('empty window returns empty arrays', () => {
    const result = buildReviewInput({
      window: computeWindow('rolling_7d', '2026-01-01'),
      logs: [makeLog({ date: '2026-05-28' })],
      pornUseEvents: [makePu('2026-05-28')],
      masturbationEvents: [makeMb('2026-05-28')],
      sexEvents: [makeSx('2026-05-28')],
    });
    expect(result.dailyLogs).toHaveLength(0);
    expect(result.pornUseEvents).toHaveLength(0);
    expect(result.masturbationEvents).toHaveLength(0);
    expect(result.sexEvents).toHaveLength(0);
  });
});

// ── buildReviewInputForWindow ────────────────────────────────────────────────

describe('buildReviewInputForWindow', () => {
  it('uses provided anchorDate', () => {
    const result = buildReviewInputForWindow(
      'rolling_7d', [], [], [], [], '2026-05-28',
    );
    expect(result.window.startDate).toBe('2026-05-22');
    expect(result.window.endDate).toBe('2026-05-28');
  });

  it('defaults anchorDate to today physiological day', () => {
    const result = buildReviewInputForWindow('rolling_7d', [], [], [], []);
    expect(result.window.endDate).toBeTruthy();
  });

  it('supports all window kinds', () => {
    const kinds = ['rolling_7d', 'rolling_14d', 'rolling_30d', 'week', 'month'] as const;
    for (const kind of kinds) {
      const result = buildReviewInputForWindow(kind, [], [], [], [], '2026-05-28');
      expect(result.window.kind).toBe(kind);
      expect(result.window.startDate).toBeTruthy();
      expect(result.window.endDate).toBeTruthy();
      expect(result.window.label).toBeTruthy();
    }
  });
});
