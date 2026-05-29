import { describe, it, expect } from 'vitest';
import {
  buildMasturbationEventsFromLogs,
  buildSexEventsFromLogs,
  runMigrations,
  LATEST_VERSION,
} from '../core/storage/migration';
import type { LogEntry, MasturbationEvent } from '../domain';

// ── Helpers ─────────────────────────────────────────────────────────────────

const makeLog = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  date: '2026-05-20',
  status: 'completed',
  updatedAt: 1747700000000, // some fixed timestamp
  alcoholRecords: [],
  tags: [],
  exercise: [],
  sex: [],
  masturbation: [],
  changeHistory: [],
  notes: '',
  morning: {
    id: 'mr_2026-05-20_test',
    timestamp: 1747700000000,
    wokeWithErection: true,
    hardness: 3,
    retention: 'normal',
    wokenByErection: false,
    durationImpression: 'brief',
  },
  sleep: {
    id: 'sr_2026-05-20_test',
    startTime: '2026-05-20T00:30:00',
    endTime: '2026-05-20T08:00:00',
    quality: 3,
    attire: 'light',
    naturalAwakening: true,
    nocturnalEmission: false,
    withPartner: false,
    preSleepState: 'calm',
    naps: [],
    hasDream: false,
    dreamTypes: [],
    environment: { location: 'home', temperature: 'comfortable' },
  },
  health: {
    isSick: false,
    illnessType: null,
    medicationTaken: null,
    medicationName: null,
    feeling: 'normal',
    discomfortLevel: null,
    symptoms: [],
    medications: [],
  },
  ...overrides,
});

// ── buildMasturbationEventsFromLogs ─────────────────────────────────────────

describe('buildMasturbationEventsFromLogs', () => {
  it('generates MasturbationEvent from log.masturbation[]', () => {
    const log = makeLog({
      masturbation: [
        {
          id: 'mb_001',
          startTime: '23:30',
          duration: 15,
          status: 'completed',
          tools: ['手'],
          contentItems: [],
          edging: 'none',
          edgingCount: 0,
          lubricant: '无润滑',
          useCondom: false,
          ejaculation: true,
          orgasmIntensity: 4,
          satisfactionLevel: 4,
          mood: 'neutral',
          stressLevel: 3,
          energyLevel: 3,
          interrupted: false,
          interruptionReasons: [],
          notes: 'test note',
        } as any,
      ],
    });

    const events = buildMasturbationEventsFromLogs([log]);
    expect(events).toHaveLength(1);

    const ev = events[0];
    expect(ev.id).toBe('mb_001');
    expect(ev.startedAt).toBe('2026-05-20T23:30:00');
    expect(ev.targetDate).toBe('2026-05-20');
    expect(ev.source).toBe('migration');
    expect(ev.status).toBe('completed');
    expect(ev.durationMinutes).toBe(15);
    expect(ev.ejaculated).toBe(true);
    expect(ev.orgasmIntensity).toBe(4);
    expect(ev.satisfaction).toBe(4);
    expect(ev.edging).toBe('none');
    expect(ev.notes).toBe('test note');
    expect(ev.sessionCount).toBe(1);
    expect(ev.ejaculationCount).toBe(1);
    expect(ev.linkedPornUseEventIds).toEqual([]);
    expect(ev.linkedSexEventIds).toEqual([]);
    expect(ev.stimulationSources).toEqual([]);
    expect(ev.afterState).toEqual([]);
  });

  it('generates stable migration id when record.id is missing', () => {
    const log = makeLog({
      masturbation: [
        { startTime: '23:00', duration: 10, ejaculation: false, edging: 'none' } as any,
        { startTime: '23:30', duration: 20, ejaculation: true, edging: 'none' } as any,
      ],
    });

    const events = buildMasturbationEventsFromLogs([log]);
    expect(events[0].id).toBe('mig_mb_2026-05-20_0');
    expect(events[1].id).toBe('mig_mb_2026-05-20_1');
  });

  it('preserves first duplicate original id, suffixes subsequent duplicates', () => {
    const log = makeLog({
      masturbation: [
        { id: 'dup_test', startTime: '23:00', duration: 10, ejaculation: true, edging: 'none' } as any,
        { id: 'dup_test', startTime: '23:30', duration: 15, ejaculation: false, edging: 'none' } as any,
      ],
    });

    const events = buildMasturbationEventsFromLogs([log]);
    expect(events[0].id).toBe('dup_test');
    expect(events[1].id).toBe('dup_test_dup_1');
  });

  it('falls back to 23:00 when startTime is missing', () => {
    const log = makeLog({
      masturbation: [
        { id: 'mb_no_time', duration: 10, ejaculation: false, edging: 'none' } as any,
      ],
    });

    const events = buildMasturbationEventsFromLogs([log]);
    expect(events[0].startedAt).toBe('2026-05-20T23:00:00');
    expect(events[0].targetDate).toBe('2026-05-20');
  });

  it('assigns events before 03:00 to previous physiological day', () => {
    const log = makeLog({
      date: '2026-05-21',
      masturbation: [
        { id: 'mb_late', startTime: '02:15', duration: 10, ejaculation: true, edging: 'none' } as any,
      ],
    });

    const events = buildMasturbationEventsFromLogs([log]);
    // 02:15 on May 21 → physiological day = May 20
    expect(events[0].targetDate).toBe('2026-05-20');
  });

  it('maps inProgress status to in_progress', () => {
    const log = makeLog({
      masturbation: [
        { id: 'mb_ip', startTime: '23:00', duration: 5, ejaculation: false, edging: 'none', status: 'inProgress' } as any,
      ],
    });

    const events = buildMasturbationEventsFromLogs([log]);
    expect(events[0].status).toBe('in_progress');
  });

  it('handles missing orgasmIntensity/satisfactionLevel as null', () => {
    const log = makeLog({
      masturbation: [
        { id: 'mb_no_scores', startTime: '23:00', duration: 10, ejaculation: false, edging: 'none' } as any,
      ],
    });

    const events = buildMasturbationEventsFromLogs([log]);
    expect(events[0].orgasmIntensity).toBeNull();
    expect(events[0].satisfaction).toBeNull();
    expect(events[0].ejaculated).toBe(false);
    expect(events[0].ejaculationCount).toBeNull();
  });

  it('handles edging values correctly', () => {
    const log = makeLog({
      masturbation: [
        { id: 'mb_e1', startTime: '23:00', duration: 10, ejaculation: false, edging: 'single' } as any,
        { id: 'mb_e2', startTime: '23:30', duration: 10, ejaculation: false, edging: 'multiple' } as any,
        { id: 'mb_e3', startTime: '23:45', duration: 10, ejaculation: false, edging: 'invalid' } as any,
      ],
    });

    const events = buildMasturbationEventsFromLogs([log]);
    expect(events[0].edging).toBe('single');
    expect(events[1].edging).toBe('multiple');
    expect(events[2].edging).toBe('none');
  });
});

// ── buildSexEventsFromLogs ──────────────────────────────────────────────────

describe('buildSexEventsFromLogs', () => {
  it('generates SexEvent from log.sex[] with legacySexRecord', () => {
    const sexRecord = {
      id: 'sex_001',
      startTime: '21:00',
      duration: 30,
      partner: 'partner_name',
      protection: '安全套',
      indicators: { lingerie: false, orgasm: true, partnerOrgasm: false, squirting: false, toys: false },
      ejaculation: true,
      ejaculationLocation: 'inside',
      mood: 'happy' as const,
      notes: 'sex test note',
      interactions: [],
    };

    const log = makeLog({ sex: [sexRecord as any] });
    const events = buildSexEventsFromLogs([log]);
    expect(events).toHaveLength(1);

    const ev = events[0];
    expect(ev.id).toBe('sex_001');
    expect(ev.startedAt).toBe('2026-05-20T21:00:00');
    expect(ev.targetDate).toBe('2026-05-20');
    expect(ev.source).toBe('migration');
    expect(ev.status).toBe('completed');
    expect(ev.durationMinutes).toBe(30);
    expect(ev.ejaculated).toBe(true);
    expect(ev.partnerIds).toEqual([]); // name is not a partner id
    expect(ev.interactionTypes).toEqual([]);
    expect(ev.penetration).toBe('unknown');
    expect(ev.satisfaction).toBeNull(); // partnerScore is NOT mapped
    expect(ev.pornInvolved).toBeNull();
    expect(ev.legacySexRecord).toBe(sexRecord);
    expect(ev.linkedPornUseEventIds).toEqual([]);
    expect(ev.linkedMasturbationEventIds).toEqual([]);
  });

  it('generates stable migration id when record.id is missing', () => {
    const log = makeLog({
      sex: [
        { startTime: '22:00', duration: 15, ejaculation: true, interactions: [] } as any,
        { startTime: '22:30', duration: 20, ejaculation: false, interactions: [] } as any,
      ],
    });

    const events = buildSexEventsFromLogs([log]);
    expect(events[0].id).toBe('mig_sex_2026-05-20_0');
    expect(events[1].id).toBe('mig_sex_2026-05-20_1');
  });

  it('preserves first duplicate original id, suffixes subsequent duplicates', () => {
    const log = makeLog({
      sex: [
        { id: 'sex_dup', startTime: '22:00', duration: 15, ejaculation: true, interactions: [] } as any,
        { id: 'sex_dup', startTime: '22:30', duration: 20, ejaculation: false, interactions: [] } as any,
      ],
    });

    const events = buildSexEventsFromLogs([log]);
    expect(events[0].id).toBe('sex_dup');
    expect(events[1].id).toBe('sex_dup_dup_1');
  });

  it('falls back to 22:00 when startTime is missing', () => {
    const log = makeLog({
      sex: [
        { id: 'sex_no_time', duration: 15, ejaculation: true, interactions: [] } as any,
      ],
    });

    const events = buildSexEventsFromLogs([log]);
    expect(events[0].startedAt).toBe('2026-05-20T22:00:00');
    expect(events[0].targetDate).toBe('2026-05-20');
  });

  it('assigns events before 03:00 to previous physiological day', () => {
    const log = makeLog({
      date: '2026-05-21',
      sex: [
        { id: 'sex_late', startTime: '01:30', duration: 30, ejaculation: true, interactions: [] } as any,
      ],
    });

    const events = buildSexEventsFromLogs([log]);
    // 01:30 on May 21 → physiological day = May 20
    expect(events[0].targetDate).toBe('2026-05-20');
  });

  it('does NOT map partnerScore to satisfaction', () => {
    const log = makeLog({
      sex: [
        {
          id: 'sex_score',
          startTime: '22:00',
          duration: 30,
          ejaculation: true,
          partnerScore: 5,
          interactions: [],
        } as any,
      ],
    });

    const events = buildSexEventsFromLogs([log]);
    expect(events[0].satisfaction).toBeNull();
  });

  it('preserves complete legacySexRecord', () => {
    const record = {
      id: 'sex_legacy',
      startTime: '22:00',
      duration: 30,
      partner: '测试伴侣',
      protection: '无保护措施',
      indicators: { lingerie: true, orgasm: true, partnerOrgasm: false, squirting: false, toys: false },
      ejaculation: true,
      mood: 'happy' as const,
      notes: 'legacy preserved',
      interactions: [{ id: 'int_1', partner: '测试伴侣', location: 'home', costumes: [], toys: [], chain: [] }],
    };

    const log = makeLog({ sex: [record as any] });
    const events = buildSexEventsFromLogs([log]);
    expect(events[0].legacySexRecord).toBe(record);
    expect(events[0].legacySexRecord?.interactions).toHaveLength(1);
  });
});

// ── runMigrations ───────────────────────────────────────────────────────────

describe('runMigrations', () => {
  it('returns version LATEST_VERSION (49)', () => {
    const result = runMigrations({ version: 46, logs: [] });
    expect(result.version).toBe(LATEST_VERSION);
    expect(result.version).toBe(49);
  });

  it('returns empty arrays for all event types on empty data', () => {
    const result = runMigrations({ version: 46, logs: [] });
    expect(result.pornUseEvents).toEqual([]);
    expect(result.masturbationEvents).toEqual([]);
    expect(result.sexEvents).toEqual([]);
  });

  it('generates masturbation events from v46 logs', () => {
    const log = makeLog({
      masturbation: [
        { id: 'mb_run', startTime: '23:00', duration: 10, ejaculation: true, edging: 'none', status: 'completed', tools: ['手'], contentItems: [], edgingCount: 0, lubricant: '无', useCondom: false, orgasmIntensity: 3, mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '' } as any,
      ],
    });

    const result = runMigrations({ version: 46, logs: [log] });
    expect(result.masturbationEvents).toHaveLength(1);
    expect(result.masturbationEvents![0].id).toBe('mb_run');
    expect(result.masturbationEvents![0].source).toBe('migration');
  });

  it('generates sex events from v46 logs', () => {
    const log = makeLog({
      sex: [
        { id: 'sex_run', startTime: '22:00', duration: 30, ejaculation: true, interactions: [], protection: '无', mood: 'happy', notes: '' } as any,
      ],
    });

    const result = runMigrations({ version: 46, logs: [log] });
    expect(result.sexEvents).toHaveLength(1);
    expect(result.sexEvents![0].id).toBe('sex_run');
    expect(result.sexEvents![0].source).toBe('migration');
  });

  it('does NOT generate porn use events from pornConsumption', () => {
    const log = makeLog({ pornConsumption: 'heavy' as any });
    const result = runMigrations({ version: 46, logs: [log] });
    expect(result.pornUseEvents).toEqual([]);
  });

  it('preserves existing event arrays when imported data already has them', () => {
    const existingMasturbation: MasturbationEvent[] = [{
      id: 'existing_mb',
      startedAt: '2026-05-01T23:00:00',
      targetDate: '2026-05-01',
      createdAt: '2026-05-01T23:00:00',
      updatedAt: '2026-05-01T23:00:00',
      status: 'completed',
      source: 'manual',
      durationMinutes: 15,
      ejaculated: true,
      orgasmIntensity: 4,
      edging: 'none',
      hardnessLevel: null,
      arousalLevel: null,
      stimulationSources: [],
      afterState: [],
      satisfaction: 4,
      sessionCount: 1,
      ejaculationCount: 1,
      linkedPornUseEventIds: [],
      linkedSexEventIds: [],
    }];

    const log = makeLog({
      masturbation: [
        { id: 'mb_new', startTime: '23:00', duration: 10, ejaculation: true, edging: 'none', status: 'completed', tools: ['手'], contentItems: [], edgingCount: 0, lubricant: '无', useCondom: false, orgasmIntensity: 3, mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '' } as any,
      ],
    });

    const result = runMigrations({
      version: 46,
      logs: [log],
      masturbationEvents: existingMasturbation,
    });

    // Should preserve existing events, not regenerate
    expect(result.masturbationEvents).toHaveLength(1);
    expect(result.masturbationEvents![0].id).toBe('existing_mb');
  });

  it('old logs.sex[] and logs.masturbation[] are preserved after migration', () => {
    const log = makeLog({
      masturbation: [
        { id: 'mb_keep', startTime: '23:00', duration: 10, ejaculation: true, edging: 'none', status: 'completed', tools: ['手'], contentItems: [], edgingCount: 0, lubricant: '无', useCondom: false, orgasmIntensity: 3, mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '' } as any,
      ],
      sex: [
        { id: 'sex_keep', startTime: '22:00', duration: 30, ejaculation: true, interactions: [], protection: '无', mood: 'happy', notes: '' } as any,
      ],
    });

    const result = runMigrations({ version: 46, logs: [log] });
    // Old fields should still be in the logs
    expect(result.logs[0].masturbation).toBeDefined();
    expect(result.logs[0].masturbation).toHaveLength(1);
    expect(result.logs[0].sex).toBeDefined();
    expect(result.logs[0].sex).toHaveLength(1);
  });
});
