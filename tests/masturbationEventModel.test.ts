import { describe, it, expect } from 'vitest';
import {
  createMasturbationEventDraft,
  hydrateMasturbationEvent,
  validateMasturbationEvent,
  mapMasturbationRecordToEvent,
} from '../features/sex-life/model/masturbationEvent';
import type { MasturbationRecordDetails } from '../domain';

// ── createMasturbationEventDraft ────────────────────────────────────────────

describe('createMasturbationEventDraft', () => {
  it('generates required base fields with defaults', () => {
    const draft = createMasturbationEventDraft({ startedAt: '2026-05-20T23:00:00' });
    expect(draft.id).toMatch(/^mb_/);
    expect(draft.startedAt).toBe('2026-05-20T23:00:00');
    expect(draft.targetDate).toBe('2026-05-20');
    expect(draft.status).toBe('completed');
    expect(draft.source).toBe('manual');
  });

  it('defaults arrays to [] and nullable scalars to null', () => {
    const draft = createMasturbationEventDraft({ startedAt: '2026-05-20T23:00:00' });
    expect(draft.stimulationSources).toEqual([]);
    expect(draft.afterState).toEqual([]);
    expect(draft.linkedPornUseEventIds).toEqual([]);
    expect(draft.linkedSexEventIds).toEqual([]);
    expect(draft.tags).toEqual([]);
    expect(draft.durationMinutes).toBeNull();
    expect(draft.ejaculated).toBeNull();
    expect(draft.orgasmIntensity).toBeNull();
    expect(draft.hardnessLevel).toBeNull();
    expect(draft.arousalLevel).toBeNull();
    expect(draft.satisfaction).toBeNull();
    expect(draft.edging).toBe('none');
    expect(draft.sessionCount).toBe(1);
    expect(draft.ejaculationCount).toBeNull();
  });

  it('computes targetDate by 03:00 physiological day rule', () => {
    const draft = createMasturbationEventDraft({ startedAt: '2026-05-21T02:30:00' });
    expect(draft.targetDate).toBe('2026-05-20');
  });
});

// ── hydrateMasturbationEvent ────────────────────────────────────────────────

describe('hydrateMasturbationEvent', () => {
  it('fills missing arrays with []', () => {
    const h = hydrateMasturbationEvent({ id: 'mb_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20' });
    expect(h.stimulationSources).toEqual([]);
    expect(h.afterState).toEqual([]);
    expect(h.linkedPornUseEventIds).toEqual([]);
    expect(h.linkedSexEventIds).toEqual([]);
    expect(h.tags).toEqual([]);
  });

  it('defaults edging to none and sessionCount to 1', () => {
    const h = hydrateMasturbationEvent({ id: 'mb_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20' });
    expect(h.edging).toBe('none');
    expect(h.sessionCount).toBe(1);
  });

  it('deduplicates tags and linked ids', () => {
    const h = hydrateMasturbationEvent({
      id: 'mb_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20',
      tags: ['a', 'a', 'b'], linkedPornUseEventIds: ['pu_1', 'pu_1'], linkedSexEventIds: ['sx_1'],
    });
    expect(h.tags).toEqual(['a', 'b']);
    expect(h.linkedPornUseEventIds).toEqual(['pu_1']);
    expect(h.linkedSexEventIds).toEqual(['sx_1']);
  });

  it('filters invalid enum values', () => {
    const h = hydrateMasturbationEvent({
      id: 'mb_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20',
      stimulationSources: ['porn', 'invalid'] as any, afterState: ['tired', 'bogus'] as any,
    });
    expect(h.stimulationSources).toEqual(['porn']);
    expect(h.afterState).toEqual(['tired']);
  });
});

// ── validateMasturbationEvent ───────────────────────────────────────────────

describe('validateMasturbationEvent', () => {
  const valid = {
    id: 'mb_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20',
    createdAt: '2026-05-20T23:00:00', updatedAt: '2026-05-20T23:00:00',
    status: 'completed' as const, source: 'manual' as const,
    durationMinutes: 15, ejaculated: true, orgasmIntensity: 4 as const,
    edging: 'none' as const, hardnessLevel: 4 as const, arousalLevel: 4 as const,
    stimulationSources: ['porn' as const], afterState: ['satisfied' as const],
    satisfaction: 4 as const, sessionCount: 1, ejaculationCount: 1,
    linkedPornUseEventIds: [], linkedSexEventIds: [],
  };

  it('returns no errors for a valid event', () => {
    expect(validateMasturbationEvent(valid)).toHaveLength(0);
  });

  it('reports missing required fields', () => {
    const event = { ...valid, id: '', startedAt: '' };
    const errors = validateMasturbationEvent(event);
    expect(errors.some((e) => e.field === 'id')).toBe(true);
    expect(errors.some((e) => e.field === 'startedAt')).toBe(true);
  });

  it('reports negative durationMinutes', () => {
    const errors = validateMasturbationEvent({ ...valid, durationMinutes: -1 });
    expect(errors.some((e) => e.field === 'durationMinutes')).toBe(true);
  });

  it('reports invalid sessionCount', () => {
    const errors = validateMasturbationEvent({ ...valid, sessionCount: 0 });
    expect(errors.some((e) => e.field === 'sessionCount')).toBe(true);
  });

  it('reports invalid ejaculationCount', () => {
    const errors = validateMasturbationEvent({ ...valid, ejaculationCount: -1 });
    expect(errors.some((e) => e.field === 'ejaculationCount')).toBe(true);
  });

  it('accepts null ejaculationCount', () => {
    expect(validateMasturbationEvent({ ...valid, ejaculationCount: null })).toHaveLength(0);
  });

  it('reports invalid scale5 values', () => {
    const errors = validateMasturbationEvent({ ...valid, orgasmIntensity: 6 as any });
    expect(errors.some((e) => e.field === 'orgasmIntensity')).toBe(true);
  });

  it('reports targetDate/starterAt inconsistency', () => {
    const errors = validateMasturbationEvent({ ...valid, targetDate: '2026-05-21' });
    expect(errors.some((e) => e.field === 'targetDate')).toBe(true);
  });
});

// ── mapMasturbationRecordToEvent ────────────────────────────────────────────

describe('mapMasturbationRecordToEvent', () => {
  const baseRecord: MasturbationRecordDetails = {
    id: 'old_mb_1',
    startTime: '23:30',
    duration: 15,
    status: 'completed',
    tools: ['手'],
    contentItems: [],
    edging: 'single',
    edgingCount: 1,
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
  };

  it('maps old record fields correctly', () => {
    const event = mapMasturbationRecordToEvent(baseRecord, '2026-05-20');
    expect(event.id).toBe('old_mb_1');
    expect(event.startedAt).toBe('2026-05-20T23:30:00');
    expect(event.targetDate).toBe('2026-05-20');
    expect(event.durationMinutes).toBe(15);
    expect(event.ejaculated).toBe(true);
    expect(event.orgasmIntensity).toBe(4);
    expect(event.edging).toBe('single');
    expect(event.satisfaction).toBe(4);
    expect(event.notes).toBe('test note');
    expect(event.status).toBe('completed');
    expect(event.source).toBe('migration');
  });

  it('falls back to 23:00 when startTime is missing', () => {
    const record = { ...baseRecord, startTime: '' };
    const event = mapMasturbationRecordToEvent(record, '2026-05-20');
    expect(event.startedAt).toBe('2026-05-20T23:00:00');
  });

  it('assigns pre-03:00 events to previous physiological day', () => {
    const record = { ...baseRecord, startTime: '02:00' };
    const event = mapMasturbationRecordToEvent(record, '2026-05-21');
    expect(event.targetDate).toBe('2026-05-20');
  });

  it('does NOT generate PornUseEvent from contentItems', () => {
    const record = {
      ...baseRecord,
      contentItems: [{ id: 'ci_1', type: '视频', platform: 'test', title: 'test', actors: [], xpTags: [], notes: '' }],
    };
    const event = mapMasturbationRecordToEvent(record, '2026-05-20');
    // contentItems should not affect the event — no PornUseEvent generated
    expect(event.linkedPornUseEventIds).toEqual([]);
  });

  it('maps inProgress status to in_progress', () => {
    const record = { ...baseRecord, status: 'inProgress' as const };
    const event = mapMasturbationRecordToEvent(record, '2026-05-20');
    expect(event.status).toBe('in_progress');
  });

  it('handles missing satisfactionLevel as null', () => {
    const record = { ...baseRecord, satisfactionLevel: undefined };
    const event = mapMasturbationRecordToEvent(record, '2026-05-20');
    expect(event.satisfaction).toBeNull();
  });
});
