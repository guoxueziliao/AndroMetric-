import { describe, it, expect } from 'vitest';
import {
  createPornUseEventDraft,
  hydratePornUseEvent,
  normalizePornUseEvent,
  validatePornUseEvent,
} from '../features/sex-life/model/pornUseEventModel';
import type { PornUseEvent } from '../domain';

// ── createPornUseEventDraft ─────────────────────────────────────────────────

describe('createPornUseEventDraft', () => {
  it('generates required base fields with defaults', () => {
    const draft = createPornUseEventDraft({ startedAt: '2026-05-20T23:00:00' });
    expect(draft.id).toMatch(/^pu_/);
    expect(draft.startedAt).toBe('2026-05-20T23:00:00');
    expect(draft.targetDate).toBe('2026-05-20');
    expect(draft.status).toBe('completed');
    expect(draft.source).toBe('manual');
    expect(draft.createdAt).toBeTruthy();
    expect(draft.updatedAt).toBeTruthy();
  });

  it('defaults arrays to [] and nullable scalars to null', () => {
    const draft = createPornUseEventDraft({ startedAt: '2026-05-20T23:00:00' });
    expect(draft.contentTypes).toEqual([]);
    expect(draft.sourceTypes).toEqual([]);
    expect(draft.afterState).toEqual([]);
    expect(draft.motives).toEqual([]);
    expect(draft.linkedMasturbationEventIds).toEqual([]);
    expect(draft.linkedSexEventIds).toEqual([]);
    expect(draft.tags).toEqual([]);
    expect(draft.durationMinutes).toBeNull();
    expect(draft.arousalLevel).toBeNull();
    expect(draft.ledToMasturbation).toBeNull();
    expect(draft.ejaculated).toBeNull();
    expect(draft.controlFeeling).toBeNull();
    expect(draft.orgasmIntensity).toBeNull();
    expect(draft.fatigueAfter).toBeNull();
    expect(draft.satisfaction).toBeNull();
    expect(draft.sleepImpact).toBeNull();
    expect(draft.edging).toBe('none');
  });

  it('computes targetDate by 03:00 physiological day rule', () => {
    // 02:00 on May 21 → physiological day = May 20
    const draft = createPornUseEventDraft({ startedAt: '2026-05-21T02:00:00' });
    expect(draft.targetDate).toBe('2026-05-20');
  });

  it('accepts custom input fields', () => {
    const draft = createPornUseEventDraft({
      startedAt: '2026-05-20T23:00:00',
      durationMinutes: 30,
      contentTypes: ['video'],
      arousalLevel: 4,
      ejaculated: true,
      tags: ['test'],
      linkedMasturbationEventIds: ['mb_1'],
    });
    expect(draft.durationMinutes).toBe(30);
    expect(draft.contentTypes).toEqual(['video']);
    expect(draft.arousalLevel).toBe(4);
    expect(draft.ejaculated).toBe(true);
    expect(draft.tags).toEqual(['test']);
    expect(draft.linkedMasturbationEventIds).toEqual(['mb_1']);
  });
});

// ── hydratePornUseEvent ─────────────────────────────────────────────────────

describe('hydratePornUseEvent', () => {
  it('fills missing arrays with []', () => {
    const hydrated = hydratePornUseEvent({ id: 'pu_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20' });
    expect(hydrated.contentTypes).toEqual([]);
    expect(hydrated.sourceTypes).toEqual([]);
    expect(hydrated.afterState).toEqual([]);
    expect(hydrated.motives).toEqual([]);
    expect(hydrated.linkedMasturbationEventIds).toEqual([]);
    expect(hydrated.linkedSexEventIds).toEqual([]);
    expect(hydrated.tags).toEqual([]);
  });

  it('fills missing nullable scalars with null', () => {
    const hydrated = hydratePornUseEvent({ id: 'pu_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20' });
    expect(hydrated.durationMinutes).toBeNull();
    expect(hydrated.arousalLevel).toBeNull();
    expect(hydrated.ejaculated).toBeNull();
    expect(hydrated.orgasmIntensity).toBeNull();
    expect(hydrated.satisfaction).toBeNull();
  });

  it('defaults edging to none when missing', () => {
    const hydrated = hydratePornUseEvent({ id: 'pu_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20' });
    expect(hydrated.edging).toBe('none');
  });

  it('computes targetDate from startedAt when missing', () => {
    const hydrated = hydratePornUseEvent({ id: 'pu_1', startedAt: '2026-05-20T23:00:00' });
    expect(hydrated.targetDate).toBe('2026-05-20');
  });

  it('deduplicates tags and linked ids', () => {
    const hydrated = hydratePornUseEvent({
      id: 'pu_1',
      startedAt: '2026-05-20T23:00:00',
      targetDate: '2026-05-20',
      tags: ['a', 'b', 'a'],
      linkedMasturbationEventIds: ['mb_1', 'mb_1', 'mb_2'],
      linkedSexEventIds: ['sx_1', 'sx_1'],
    });
    expect(hydrated.tags).toEqual(['a', 'b']);
    expect(hydrated.linkedMasturbationEventIds).toEqual(['mb_1', 'mb_2']);
    expect(hydrated.linkedSexEventIds).toEqual(['sx_1']);
  });

  it('filters invalid enum values from arrays', () => {
    const hydrated = hydratePornUseEvent({
      id: 'pu_1',
      startedAt: '2026-05-20T23:00:00',
      targetDate: '2026-05-20',
      contentTypes: ['video', 'invalid_type'] as any,
      afterState: ['satisfied', 'fake_state'] as any,
    });
    expect(hydrated.contentTypes).toEqual(['video']);
    expect(hydrated.afterState).toEqual(['satisfied']);
  });

  it('defaults status to completed', () => {
    const hydrated = hydratePornUseEvent({ id: 'pu_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20' });
    expect(hydrated.status).toBe('completed');
  });

  it('preserves in_progress status', () => {
    const hydrated = hydratePornUseEvent({ id: 'pu_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20', status: 'in_progress' });
    expect(hydrated.status).toBe('in_progress');
  });
});

// ── normalizePornUseEvent ───────────────────────────────────────────────────

describe('normalizePornUseEvent', () => {
  it('deduplicates tags and linked ids', () => {
    const event = {
      id: 'pu_1',
      startedAt: '2026-05-20T23:00:00',
      targetDate: '2026-05-20',
      createdAt: '2026-05-20T23:00:00',
      updatedAt: '2026-05-20T23:00:00',
      status: 'completed' as const,
      source: 'manual' as const,
      durationMinutes: 30,
      contentTypes: [],
      sourceTypes: [],
      arousalLevel: null,
      ledToMasturbation: null,
      ejaculated: null,
      afterState: [],
      edging: 'none' as const,
      tags: ['a', 'a', 'b'],
      linkedMasturbationEventIds: ['mb_1', 'mb_1'],
      linkedSexEventIds: [],
    };
    const normalized = normalizePornUseEvent(event);
    expect(normalized.tags).toEqual(['a', 'b']);
    expect(normalized.linkedMasturbationEventIds).toEqual(['mb_1']);
  });

  it('filters invalid enum values', () => {
    const event = {
      id: 'pu_1',
      startedAt: '2026-05-20T23:00:00',
      targetDate: '2026-05-20',
      createdAt: '2026-05-20T23:00:00',
      updatedAt: '2026-05-20T23:00:00',
      status: 'completed' as const,
      source: 'manual' as const,
      durationMinutes: null,
      contentTypes: ['video', 'bogus'] as any,
      sourceTypes: ['porn_site', 'fake'] as any,
      arousalLevel: null,
      ledToMasturbation: null,
      ejaculated: null,
      afterState: ['satisfied', 'nonsense'] as any,
      edging: 'none' as const,
      linkedMasturbationEventIds: [],
      linkedSexEventIds: [],
    };
    const normalized = normalizePornUseEvent(event);
    expect(normalized.contentTypes).toEqual(['video']);
    expect(normalized.sourceTypes).toEqual(['porn_site']);
    expect(normalized.afterState).toEqual(['satisfied']);
  });
});

// ── validatePornUseEvent ────────────────────────────────────────────────────

describe('validatePornUseEvent', () => {
  const validEvent: PornUseEvent = {
    id: 'pu_1',
    startedAt: '2026-05-20T23:00:00',
    targetDate: '2026-05-20',
    createdAt: '2026-05-20T23:00:00',
    updatedAt: '2026-05-20T23:00:00',
    status: 'completed',
    source: 'manual',
    durationMinutes: 30,
    contentTypes: ['video'],
    sourceTypes: ['porn_site'],
    arousalLevel: 4,
    ledToMasturbation: true,
    ejaculated: true,
    afterState: ['satisfied'],
    edging: 'none',
    linkedMasturbationEventIds: [],
    linkedSexEventIds: [],
  };

  it('returns no errors for a valid event', () => {
    expect(validatePornUseEvent(validEvent)).toHaveLength(0);
  });

  it('reports missing required fields', () => {
    const event = { ...validEvent, id: '', startedAt: '', targetDate: '' };
    const errors = validatePornUseEvent(event);
    expect(errors.some((e) => e.field === 'id')).toBe(true);
    expect(errors.some((e) => e.field === 'startedAt')).toBe(true);
    expect(errors.some((e) => e.field === 'targetDate')).toBe(true);
  });

  it('reports targetDate/starterAt inconsistency', () => {
    const event = { ...validEvent, targetDate: '2026-05-21' }; // should be 05-20 for 23:00
    const errors = validatePornUseEvent(event);
    expect(errors.some((e) => e.field === 'targetDate' && e.message.includes('不一致'))).toBe(true);
  });

  it('accepts correct targetDate for pre-03:00 events', () => {
    const event = { ...validEvent, startedAt: '2026-05-21T02:00:00', targetDate: '2026-05-20' };
    expect(validatePornUseEvent(event)).toHaveLength(0);
  });

  it('reports negative durationMinutes', () => {
    const event = { ...validEvent, durationMinutes: -5 };
    const errors = validatePornUseEvent(event);
    expect(errors.some((e) => e.field === 'durationMinutes')).toBe(true);
  });

  it('accepts null durationMinutes', () => {
    const event = { ...validEvent, durationMinutes: null };
    expect(validatePornUseEvent(event)).toHaveLength(0);
  });

  it('reports invalid scale5 values', () => {
    const event = { ...validEvent, arousalLevel: 6 as any };
    const errors = validatePornUseEvent(event);
    expect(errors.some((e) => e.field === 'arousalLevel')).toBe(true);
  });

  it('reports invalid edging', () => {
    const event = { ...validEvent, edging: 'invalid' as any };
    const errors = validatePornUseEvent(event);
    expect(errors.some((e) => e.field === 'edging')).toBe(true);
  });

  it('reports forbidden fields', () => {
    const event = { ...validEvent, actualUrl: 'https://example.com', addicted: false } as any;
    const errors = validatePornUseEvent(event);
    expect(errors.some((e) => e.field === 'actualUrl')).toBe(true);
    expect(errors.some((e) => e.field === 'addicted')).toBe(true);
  });

  it('reports linked ids that are not string arrays', () => {
    const event = { ...validEvent, linkedMasturbationEventIds: [123] as any };
    const errors = validatePornUseEvent(event);
    expect(errors.some((e) => e.field === 'linkedMasturbationEventIds')).toBe(true);
  });
});
