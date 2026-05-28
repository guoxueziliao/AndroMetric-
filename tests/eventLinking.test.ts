import { describe, it, expect } from 'vitest';
import {
  computeLinkCandidates,
  addLink,
  removeLink,
  cleanOrphanLinks,
} from '../features/sex-life/model/eventLinking';
import type { PornUseEvent, MasturbationEvent, SexEvent } from '../domain';

const makePu = (overrides: Partial<PornUseEvent> = {}): PornUseEvent => ({
  id: 'pu_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20',
  createdAt: '2026-05-20T23:00:00', updatedAt: '2026-05-20T23:00:00',
  status: 'completed', source: 'manual', durationMinutes: 30,
  contentTypes: ['video'], sourceTypes: ['porn_site'], arousalLevel: 4,
  ledToMasturbation: true, ejaculated: true, afterState: ['satisfied'],
  linkedMasturbationEventIds: [], linkedSexEventIds: [],
  ...overrides,
});

const makeMb = (overrides: Partial<MasturbationEvent> = {}): MasturbationEvent => ({
  id: 'mb_1', startedAt: '2026-05-20T23:30:00', targetDate: '2026-05-20',
  createdAt: '2026-05-20T23:30:00', updatedAt: '2026-05-20T23:30:00',
  status: 'completed', source: 'manual', durationMinutes: 15,
  ejaculated: true, orgasmIntensity: 4, edging: 'none',
  hardnessLevel: 4, arousalLevel: 4, stimulationSources: ['porn'],
  afterState: ['satisfied'], satisfaction: 4, sessionCount: 1, ejaculationCount: 1,
  linkedPornUseEventIds: [], linkedSexEventIds: [],
  ...overrides,
});

const makeSx = (overrides: Partial<SexEvent> = {}): SexEvent => ({
  id: 'sx_1', startedAt: '2026-05-20T22:00:00', targetDate: '2026-05-20',
  createdAt: '2026-05-20T22:00:00', updatedAt: '2026-05-20T22:00:00',
  status: 'completed', source: 'manual', durationMinutes: 30,
  partnerIds: [], interactionTypes: ['penetrative'], penetration: 'yes',
  hardnessLevel: 4, ejaculated: true, ejaculationContext: 'inside_condom',
  orgasmIntensity: 3, satisfaction: 4, afterState: ['calm'],
  pornInvolved: false, linkedPornUseEventIds: [], linkedMasturbationEventIds: [],
  ...overrides,
});

// ── computeLinkCandidates ───────────────────────────────────────────────────

describe('computeLinkCandidates', () => {
  it('returns events from same targetDate', () => {
    const pu = makePu({ id: 'pu_1' });
    const mb = makeMb({ id: 'mb_1' });
    const candidates = computeLinkCandidates({
      sourceEvent: pu, sourceType: 'porn_use',
      pornUseEvents: [pu], masturbationEvents: [mb], sexEvents: [],
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].id).toBe('mb_1');
    expect(candidates[0].type).toBe('masturbation');
  });

  it('includes events within 6 hours on different targetDate', () => {
    // pu at 2026-05-20T23:00, mb at 2026-05-21T01:00 (2h later, different targetDate)
    const pu = makePu({ id: 'pu_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20' });
    const mb = makeMb({ id: 'mb_1', startedAt: '2026-05-21T01:00:00', targetDate: '2026-05-20' });
    const candidates = computeLinkCandidates({
      sourceEvent: pu, sourceType: 'porn_use',
      pornUseEvents: [pu], masturbationEvents: [mb], sexEvents: [],
    });
    expect(candidates).toHaveLength(1);
  });

  it('excludes events beyond 6 hours on different targetDate', () => {
    const pu = makePu({ id: 'pu_1', startedAt: '2026-05-20T23:00:00', targetDate: '2026-05-20' });
    const mb = makeMb({ id: 'mb_1', startedAt: '2026-05-21T12:00:00', targetDate: '2026-05-21' });
    const candidates = computeLinkCandidates({
      sourceEvent: pu, sourceType: 'porn_use',
      pornUseEvents: [pu], masturbationEvents: [mb], sexEvents: [],
    });
    expect(candidates).toHaveLength(0);
  });

  it('marks already linked events', () => {
    const pu = makePu({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1'] });
    const mb = makeMb({ id: 'mb_1' });
    const candidates = computeLinkCandidates({
      sourceEvent: pu, sourceType: 'porn_use',
      pornUseEvents: [pu], masturbationEvents: [mb], sexEvents: [],
    });
    expect(candidates[0].alreadyLinked).toBe(true);
  });

  it('excludes source event itself', () => {
    const pu = makePu({ id: 'pu_1' });
    const candidates = computeLinkCandidates({
      sourceEvent: pu, sourceType: 'porn_use',
      pornUseEvents: [pu], masturbationEvents: [], sexEvents: [],
    });
    expect(candidates).toHaveLength(0);
  });
});

// ── addLink / removeLink ────────────────────────────────────────────────────

describe('addLink', () => {
  it('adds bidirectional links between porn_use and masturbation', () => {
    const pu = makePu({ id: 'pu_1' });
    const mb = makeMb({ id: 'mb_1' });
    const [updatedPu, updatedMb] = addLink(pu, 'porn_use', mb, 'masturbation') as [PornUseEvent, MasturbationEvent];
    expect(updatedPu.linkedMasturbationEventIds).toContain('mb_1');
    expect(updatedMb.linkedPornUseEventIds).toContain('pu_1');
  });

  it('adds bidirectional links between porn_use and sex', () => {
    const pu = makePu({ id: 'pu_1' });
    const sx = makeSx({ id: 'sx_1' });
    const [updatedPu, updatedSx] = addLink(pu, 'porn_use', sx, 'sex') as [PornUseEvent, SexEvent];
    expect(updatedPu.linkedSexEventIds).toContain('sx_1');
    expect(updatedSx.linkedPornUseEventIds).toContain('pu_1');
  });

  it('adds bidirectional links between masturbation and sex', () => {
    const mb = makeMb({ id: 'mb_1' });
    const sx = makeSx({ id: 'sx_1' });
    const [updatedMb, updatedSx] = addLink(mb, 'masturbation', sx, 'sex') as [MasturbationEvent, SexEvent];
    expect(updatedMb.linkedSexEventIds).toContain('sx_1');
    expect(updatedSx.linkedMasturbationEventIds).toContain('mb_1');
  });

  it('does not duplicate existing links', () => {
    const pu = makePu({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1'] });
    const mb = makeMb({ id: 'mb_1', linkedPornUseEventIds: ['pu_1'] });
    const [updatedPu, updatedMb] = addLink(pu, 'porn_use', mb, 'masturbation') as [PornUseEvent, MasturbationEvent];
    expect(updatedPu.linkedMasturbationEventIds.filter((id) => id === 'mb_1')).toHaveLength(1);
    expect(updatedMb.linkedPornUseEventIds.filter((id) => id === 'pu_1')).toHaveLength(1);
  });
});

describe('removeLink', () => {
  it('removes bidirectional links', () => {
    const pu = makePu({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1'] });
    const mb = makeMb({ id: 'mb_1', linkedPornUseEventIds: ['pu_1'] });
    const [updatedPu, updatedMb] = removeLink(pu, 'porn_use', mb, 'masturbation') as [PornUseEvent, MasturbationEvent];
    expect(updatedPu.linkedMasturbationEventIds).not.toContain('mb_1');
    expect(updatedMb.linkedPornUseEventIds).not.toContain('pu_1');
  });

  it('handles missing links gracefully', () => {
    const pu = makePu({ id: 'pu_1' });
    const mb = makeMb({ id: 'mb_1' });
    const [updatedPu, updatedMb] = removeLink(pu, 'porn_use', mb, 'masturbation') as [PornUseEvent, MasturbationEvent];
    expect(updatedPu.linkedMasturbationEventIds).toEqual([]);
    expect(updatedMb.linkedPornUseEventIds).toEqual([]);
  });
});

// ── cleanOrphanLinks ────────────────────────────────────────────────────────

describe('cleanOrphanLinks', () => {
  it('removes ids that are not in the event pool', () => {
    const pu = makePu({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1', 'mb_missing'], linkedSexEventIds: ['sx_missing'] });
    const cleaned = cleanOrphanLinks(pu, 'porn_use', new Set(['pu_1', 'mb_1'])) as PornUseEvent;
    expect(cleaned.linkedMasturbationEventIds).toEqual(['mb_1']);
    expect(cleaned.linkedSexEventIds).toEqual([]);
  });

  it('preserves valid links', () => {
    const pu = makePu({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1'] });
    const cleaned = cleanOrphanLinks(pu, 'porn_use', new Set(['pu_1', 'mb_1'])) as PornUseEvent;
    expect(cleaned.linkedMasturbationEventIds).toEqual(['mb_1']);
  });
});
