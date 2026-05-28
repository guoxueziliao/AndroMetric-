import { describe, it, expect } from 'vitest';
import {
  createSexEventDraft,
  hydrateSexEvent,
  validateSexEvent,
  mapSexRecordToEvent,
} from '../features/sex-life/model/sexEvent';
import type { SexRecordDetails } from '../domain';

// ── createSexEventDraft ─────────────────────────────────────────────────────

describe('createSexEventDraft', () => {
  it('generates required base fields with defaults', () => {
    const draft = createSexEventDraft({ startedAt: '2026-05-20T22:00:00' });
    expect(draft.id).toMatch(/^sx_/);
    expect(draft.startedAt).toBe('2026-05-20T22:00:00');
    expect(draft.targetDate).toBe('2026-05-20');
    expect(draft.status).toBe('completed');
    expect(draft.source).toBe('manual');
    expect(draft.penetration).toBe('unknown');
  });

  it('defaults arrays to [] and nullable scalars to null', () => {
    const draft = createSexEventDraft({ startedAt: '2026-05-20T22:00:00' });
    expect(draft.partnerIds).toEqual([]);
    expect(draft.interactionTypes).toEqual([]);
    expect(draft.afterState).toEqual([]);
    expect(draft.linkedPornUseEventIds).toEqual([]);
    expect(draft.linkedMasturbationEventIds).toEqual([]);
    expect(draft.riskFlags).toEqual([]);
    expect(draft.durationMinutes).toBeNull();
    expect(draft.hardnessLevel).toBeNull();
    expect(draft.ejaculated).toBeNull();
    expect(draft.orgasmIntensity).toBeNull();
    expect(draft.satisfaction).toBeNull();
    expect(draft.pornInvolved).toBeNull();
    expect(draft.contraception).toBeNull();
  });

  it('computes targetDate by 03:00 physiological day rule', () => {
    const draft = createSexEventDraft({ startedAt: '2026-05-21T01:00:00' });
    expect(draft.targetDate).toBe('2026-05-20');
  });
});

// ── hydrateSexEvent ─────────────────────────────────────────────────────────

describe('hydrateSexEvent', () => {
  it('fills missing arrays and defaults', () => {
    const h = hydrateSexEvent({ id: 'sx_1', startedAt: '2026-05-20T22:00:00', targetDate: '2026-05-20' });
    expect(h.partnerIds).toEqual([]);
    expect(h.interactionTypes).toEqual([]);
    expect(h.afterState).toEqual([]);
    expect(h.penetration).toBe('unknown');
    expect(h.pornInvolved).toBeNull();
    expect(h.contraception).toBeNull();
  });

  it('deduplicates partnerIds, tags, and linked ids', () => {
    const h = hydrateSexEvent({
      id: 'sx_1', startedAt: '2026-05-20T22:00:00', targetDate: '2026-05-20',
      partnerIds: ['p1', 'p1'], tags: ['a', 'a'], linkedPornUseEventIds: ['pu_1', 'pu_1'],
    });
    expect(h.partnerIds).toEqual(['p1']);
    expect(h.tags).toEqual(['a']);
    expect(h.linkedPornUseEventIds).toEqual(['pu_1']);
  });

  it('filters invalid enum values', () => {
    const h = hydrateSexEvent({
      id: 'sx_1', startedAt: '2026-05-20T22:00:00', targetDate: '2026-05-20',
      interactionTypes: ['penetrative', 'invalid'] as any,
      riskFlags: ['condom_broke', 'bogus'] as any,
    });
    expect(h.interactionTypes).toEqual(['penetrative']);
    expect(h.riskFlags).toEqual(['condom_broke']);
  });

  it('preserves legacySexRecord', () => {
    const legacy = { id: 'old', startTime: '22:00', duration: 30, ejaculation: true, interactions: [], protection: 'none', mood: 'happy' as const };
    const h = hydrateSexEvent({ id: 'sx_1', startedAt: '2026-05-20T22:00:00', targetDate: '2026-05-20', legacySexRecord: legacy as any });
    expect(h.legacySexRecord).toBe(legacy);
  });
});

// ── validateSexEvent ────────────────────────────────────────────────────────

describe('validateSexEvent', () => {
  const valid = {
    id: 'sx_1', startedAt: '2026-05-20T22:00:00', targetDate: '2026-05-20',
    createdAt: '2026-05-20T22:00:00', updatedAt: '2026-05-20T22:00:00',
    status: 'completed' as const, source: 'manual' as const,
    durationMinutes: 30, partnerIds: [], interactionTypes: ['penetrative' as const],
    penetration: 'yes' as const, hardnessLevel: 4 as const,
    ejaculated: true, ejaculationContext: 'inside_condom' as const,
    orgasmIntensity: 3 as const, satisfaction: 4 as const, afterState: ['calm' as const],
    pornInvolved: false, linkedPornUseEventIds: [], linkedMasturbationEventIds: [],
  };

  it('returns no errors for a valid event', () => {
    expect(validateSexEvent(valid)).toHaveLength(0);
  });

  it('reports missing required fields', () => {
    const errors = validateSexEvent({ ...valid, id: '' });
    expect(errors.some((e) => e.field === 'id')).toBe(true);
  });

  it('reports negative durationMinutes', () => {
    const errors = validateSexEvent({ ...valid, durationMinutes: -1 });
    expect(errors.some((e) => e.field === 'durationMinutes')).toBe(true);
  });

  it('reports invalid penetration', () => {
    const errors = validateSexEvent({ ...valid, penetration: 'invalid' as any });
    expect(errors.some((e) => e.field === 'penetration')).toBe(true);
  });

  it('reports invalid scale5 values', () => {
    const errors = validateSexEvent({ ...valid, satisfaction: 6 as any });
    expect(errors.some((e) => e.field === 'satisfaction')).toBe(true);
  });

  it('reports targetDate/starterAt inconsistency', () => {
    const errors = validateSexEvent({ ...valid, targetDate: '2026-05-21' });
    expect(errors.some((e) => e.field === 'targetDate')).toBe(true);
  });
});

// ── mapSexRecordToEvent ─────────────────────────────────────────────────────

describe('mapSexRecordToEvent', () => {
  const baseRecord: SexRecordDetails = {
    id: 'old_sex_1',
    startTime: '21:30',
    duration: 30,
    partner: 'partner_name',
    protection: '安全套',
    indicators: { lingerie: true, orgasm: true, partnerOrgasm: false, squirting: false, toys: false },
    ejaculation: true,
    ejaculationLocation: 'inside',
    mood: 'happy',
    notes: 'sex test note',
    interactions: [{ id: 'int_1', partner: 'partner_name', location: 'home', costumes: [], toys: [], chain: [] }],
  };

  it('maps old record fields correctly', () => {
    const event = mapSexRecordToEvent(baseRecord, '2026-05-20');
    expect(event.id).toBe('old_sex_1');
    expect(event.startedAt).toBe('2026-05-20T21:30:00');
    expect(event.targetDate).toBe('2026-05-20');
    expect(event.durationMinutes).toBe(30);
    expect(event.ejaculated).toBe(true);
    expect(event.status).toBe('completed');
    expect(event.source).toBe('migration');
  });

  it('preserves legacySexRecord', () => {
    const event = mapSexRecordToEvent(baseRecord, '2026-05-20');
    expect(event.legacySexRecord).toBe(baseRecord);
  });

  it('does NOT map partnerScore to satisfaction', () => {
    const record = { ...baseRecord, partnerScore: 5 };
    const event = mapSexRecordToEvent(record, '2026-05-20');
    expect(event.satisfaction).toBeNull();
  });

  it('does NOT infer partnerIds from partner name', () => {
    const event = mapSexRecordToEvent(baseRecord, '2026-05-20');
    expect(event.partnerIds).toEqual([]);
  });

  it('does NOT infer pornInvolved', () => {
    const event = mapSexRecordToEvent(baseRecord, '2026-05-20');
    expect(event.pornInvolved).toBeNull();
  });

  it('falls back to 22:00 when startTime is missing', () => {
    const record = { ...baseRecord, startTime: '' };
    const event = mapSexRecordToEvent(record, '2026-05-20');
    expect(event.startedAt).toBe('2026-05-20T22:00:00');
  });

  it('assigns pre-03:00 events to previous physiological day', () => {
    const record = { ...baseRecord, startTime: '01:00' };
    const event = mapSexRecordToEvent(record, '2026-05-21');
    expect(event.targetDate).toBe('2026-05-20');
  });
});
