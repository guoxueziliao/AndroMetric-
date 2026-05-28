import { describe, it, expect } from 'vitest';
import {
  buildDayTimeline,
  buildPornUseSummary,
  buildMasturbationSummary,
  buildSexSummary,
  countOrphanLinks,
} from '../features/sex-life/model/dayTimeline';
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

// ── buildDayTimeline ────────────────────────────────────────────────────────

describe('buildDayTimeline', () => {
  it('returns events sorted by startedAt ascending', () => {
    const entries = buildDayTimeline({
      pornUseEvents: [makePu({ id: 'pu_1', startedAt: '2026-05-20T23:00:00' })],
      masturbationEvents: [makeMb({ id: 'mb_1', startedAt: '2026-05-20T23:30:00' })],
      sexEvents: [makeSx({ id: 'sx_1', startedAt: '2026-05-20T22:00:00' })],
      targetDate: '2026-05-20',
    });
    expect(entries).toHaveLength(3);
    expect(entries[0].type).toBe('sex');
    expect(entries[1].type).toBe('porn_use');
    expect(entries[2].type).toBe('masturbation');
  });

  it('filters events by targetDate', () => {
    const entries = buildDayTimeline({
      pornUseEvents: [makePu({ id: 'pu_1', targetDate: '2026-05-20' })],
      masturbationEvents: [makeMb({ id: 'mb_1', targetDate: '2026-05-21' })],
      sexEvents: [],
      targetDate: '2026-05-20',
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('porn_use');
  });

  it('returns empty for a day with no events', () => {
    const entries = buildDayTimeline({
      pornUseEvents: [], masturbationEvents: [], sexEvents: [],
      targetDate: '2026-05-20',
    });
    expect(entries).toHaveLength(0);
  });

  it('extracts HH:mm time correctly', () => {
    const entries = buildDayTimeline({
      pornUseEvents: [makePu({ startedAt: '2026-05-20T14:30:00' })],
      masturbationEvents: [], sexEvents: [],
      targetDate: '2026-05-20',
    });
    expect(entries[0].time).toBe('14:30');
  });

  it('includes linked ids from events', () => {
    const entries = buildDayTimeline({
      pornUseEvents: [makePu({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1'] })],
      masturbationEvents: [makeMb({ id: 'mb_1', linkedPornUseEventIds: ['pu_1'] })],
      sexEvents: [],
      targetDate: '2026-05-20',
    });
    const puEntry = entries.find((e) => e.id === 'pu_1')!;
    expect(puEntry.linkedIds).toContain('mb_1');
  });
});

// ── Summary builders ────────────────────────────────────────────────────────

describe('buildPornUseSummary', () => {
  it('includes duration and content types', () => {
    const { summary, details } = buildPornUseSummary(makePu({ durationMinutes: 30, contentTypes: ['video', 'image'] }));
    expect(summary).toContain('30分');
    expect(details).toContain('内容: video, image');
  });

  it('includes ejaculation and afterState', () => {
    const { details } = buildPornUseSummary(makePu({ ejaculated: true, afterState: ['satisfied', 'tired'] }));
    expect(details).toContain('射精');
    expect(details).toContain('事后: satisfied, tired');
  });
});

describe('buildMasturbationSummary', () => {
  it('includes key fields', () => {
    const { summary, details } = buildMasturbationSummary(makeMb({
      durationMinutes: 15, ejaculated: true, orgasmIntensity: 4, edging: 'single',
    }));
    expect(summary).toContain('15分');
    expect(details).toContain('射精');
    expect(details).toContain('高潮强度: 4/5');
    expect(details).toContain('边缘控制: single');
  });
});

describe('buildSexSummary', () => {
  it('includes penetration and ejaculation', () => {
    const { details } = buildSexSummary(makeSx({ penetration: 'yes', ejaculated: true, pornInvolved: true }));
    expect(details).toContain('插入');
    expect(details).toContain('射精');
    expect(details).toContain('有色情参与');
  });
});

// ── countOrphanLinks ────────────────────────────────────────────────────────

describe('countOrphanLinks', () => {
  it('counts ids that are not in the entries', () => {
    const entries = [
      { id: 'pu_1', type: 'porn_use' as const, startedAt: '', time: '', summary: '', details: [], linkedIds: ['mb_1', 'mb_missing'], linkedType: null },
      { id: 'mb_1', type: 'masturbation' as const, startedAt: '', time: '', summary: '', details: [], linkedIds: ['pu_1'], linkedType: null },
    ];
    expect(countOrphanLinks(entries[0], entries)).toBe(1);
  });

  it('returns 0 when all linked ids exist', () => {
    const entries = [
      { id: 'pu_1', type: 'porn_use' as const, startedAt: '', time: '', summary: '', details: [], linkedIds: ['mb_1'], linkedType: null },
      { id: 'mb_1', type: 'masturbation' as const, startedAt: '', time: '', summary: '', details: [], linkedIds: ['pu_1'], linkedType: null },
    ];
    expect(countOrphanLinks(entries[0], entries)).toBe(0);
  });
});
