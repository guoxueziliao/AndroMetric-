import { describe, it, expect } from 'vitest';
import {
  mergeEventsForImport,
  checkAdultEventLinks,
} from '../core/storage/importMerge';
import { assertSnapshotReadback, checkSnapshotIntegrity } from '../core/storage/snapshotIntegrity';
import { buildImportPreview } from '../features/profile/model/importPreview';
import { LATEST_VERSION } from '../core/storage/migration';
import type { Snapshot, PornUseEvent, MasturbationEvent, SexEvent } from '../domain';

// ── Helpers ─────────────────────────────────────────────────────────────────

const makePuEvent = (overrides: Partial<PornUseEvent> = {}): PornUseEvent => ({
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
  linkedMasturbationEventIds: [],
  linkedSexEventIds: [],
  ...overrides,
});

const makeMbEvent = (overrides: Partial<MasturbationEvent> = {}): MasturbationEvent => ({
  id: 'mb_1',
  startedAt: '2026-05-20T23:30:00',
  targetDate: '2026-05-20',
  createdAt: '2026-05-20T23:30:00',
  updatedAt: '2026-05-20T23:30:00',
  status: 'completed',
  source: 'manual',
  durationMinutes: 15,
  ejaculated: true,
  orgasmIntensity: 4,
  edging: 'none',
  hardnessLevel: 4,
  arousalLevel: 4,
  stimulationSources: ['porn'],
  afterState: ['satisfied'],
  satisfaction: 4,
  sessionCount: 1,
  ejaculationCount: 1,
  linkedPornUseEventIds: [],
  linkedSexEventIds: [],
  ...overrides,
});

const makeSxEvent = (overrides: Partial<SexEvent> = {}): SexEvent => ({
  id: 'sx_1',
  startedAt: '2026-05-20T22:00:00',
  targetDate: '2026-05-20',
  createdAt: '2026-05-20T22:00:00',
  updatedAt: '2026-05-20T22:00:00',
  status: 'completed',
  source: 'manual',
  durationMinutes: 30,
  partnerIds: [],
  interactionTypes: ['penetrative'],
  penetration: 'yes',
  hardnessLevel: 4,
  ejaculated: true,
  ejaculationContext: 'inside_condom',
  orgasmIntensity: 3,
  satisfaction: 4,
  afterState: ['calm'],
  pornInvolved: false,
  linkedPornUseEventIds: [],
  linkedMasturbationEventIds: [],
  ...overrides,
});

// ── mergeEventsForImport ────────────────────────────────────────────────────

describe('mergeEventsForImport', () => {
  it('adds new events not in current', () => {
    const current = [makePuEvent({ id: 'pu_1' })];
    const incoming = [makePuEvent({ id: 'pu_2' })];
    const result = mergeEventsForImport(current, incoming, 'use-import');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toContain('pu_2');
  });

  it('skips identical events', () => {
    const event = makePuEvent({ id: 'pu_1' });
    const result = mergeEventsForImport([event], [event], 'use-import');
    expect(result).toHaveLength(1);
  });

  it('replaces with incoming on use-import when content differs', () => {
    const current = [makePuEvent({ id: 'pu_1', durationMinutes: 30 })];
    const incoming = [makePuEvent({ id: 'pu_1', durationMinutes: 45 })];
    const result = mergeEventsForImport(current, incoming, 'use-import');
    expect(result).toHaveLength(1);
    expect(result[0].durationMinutes).toBe(45);
  });

  it('keeps current on keep-current when content differs', () => {
    const current = [makePuEvent({ id: 'pu_1', durationMinutes: 30 })];
    const incoming = [makePuEvent({ id: 'pu_1', durationMinutes: 45 })];
    const result = mergeEventsForImport(current, incoming, 'keep-current');
    expect(result).toHaveLength(1);
    expect(result[0].durationMinutes).toBe(30);
  });

  it('does not merge by startedAt — only by id', () => {
    const current = [makePuEvent({ id: 'pu_1', startedAt: '2026-05-20T22:00:00' })];
    const incoming = [makePuEvent({ id: 'pu_2', startedAt: '2026-05-20T22:00:00' })];
    const result = mergeEventsForImport(current, incoming, 'use-import');
    expect(result).toHaveLength(2); // not merged into 1
  });
});

// ── checkAdultEventLinks ────────────────────────────────────────────────────

describe('checkAdultEventLinks', () => {
  it('reports no issues for empty events', () => {
    const issues = checkAdultEventLinks({ pornUseEvents: [], masturbationEvents: [], sexEvents: [] });
    expect(issues).toHaveLength(0);
  });

  it('reports no issues for valid bidirectional links', () => {
    const pu = makePuEvent({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1'] });
    const mb = makeMbEvent({ id: 'mb_1', linkedPornUseEventIds: ['pu_1'] });
    const issues = checkAdultEventLinks({ pornUseEvents: [pu], masturbationEvents: [mb], sexEvents: [] });
    expect(issues).toHaveLength(0);
  });

  it('reports orphan when linked target does not exist', () => {
    const pu = makePuEvent({ id: 'pu_1', linkedMasturbationEventIds: ['mb_missing'] });
    const issues = checkAdultEventLinks({ pornUseEvents: [pu], masturbationEvents: [], sexEvents: [] });
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe('orphan');
    expect(issues[0].sourceType).toBe('porn_use');
    expect(issues[0].targetId).toBe('mb_missing');
  });

  it('reports one-way when reverse link is missing', () => {
    const pu = makePuEvent({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1'] });
    const mb = makeMbEvent({ id: 'mb_1', linkedPornUseEventIds: [] }); // no reverse
    const issues = checkAdultEventLinks({ pornUseEvents: [pu], masturbationEvents: [mb], sexEvents: [] });
    const oneWay = issues.filter((i) => i.kind === 'one_way');
    expect(oneWay).toHaveLength(1);
    expect(oneWay[0].sourceType).toBe('porn_use');
    expect(oneWay[0].targetType).toBe('masturbation');
  });

  it('reports duplicate IDs within same type', () => {
    const pu1 = makePuEvent({ id: 'dup_id' });
    const pu2 = makePuEvent({ id: 'dup_id' });
    const issues = checkAdultEventLinks({ pornUseEvents: [pu1, pu2], masturbationEvents: [], sexEvents: [] });
    const dupes = issues.filter((i) => i.kind === 'duplicate_id');
    expect(dupes).toHaveLength(1);
    expect(dupes[0].severity).toBe('error');
  });

  it('checks sex <-> porn_use bidirectional links', () => {
    const sx = makeSxEvent({ id: 'sx_1', linkedPornUseEventIds: ['pu_1'] });
    const pu = makePuEvent({ id: 'pu_1', linkedSexEventIds: ['sx_1'] });
    const issues = checkAdultEventLinks({ pornUseEvents: [pu], masturbationEvents: [], sexEvents: [sx] });
    expect(issues).toHaveLength(0);
  });

  it('checks sex <-> masturbation bidirectional links', () => {
    const sx = makeSxEvent({ id: 'sx_1', linkedMasturbationEventIds: ['mb_1'] });
    const mb = makeMbEvent({ id: 'mb_1', linkedSexEventIds: ['sx_1'] });
    const issues = checkAdultEventLinks({ pornUseEvents: [], masturbationEvents: [mb], sexEvents: [sx] });
    expect(issues).toHaveLength(0);
  });
});

// ── assertSnapshotReadback with events ──────────────────────────────────────

describe('assertSnapshotReadback with events', () => {
  const makeSnapshot = (overrides: Partial<Snapshot['data']> = {}): Snapshot => ({
    timestamp: Date.now(),
    dataVersion: 47,
    appVersion: '0.2.2',
    description: 'test',
    settings: null,
    userName: null,
    data: {
      version: LATEST_VERSION,
      logs: [],
      partners: [],
      tags: [],
      cycleEvents: [],
      pregnancyEvents: [],
      pornUseEvents: [],
      masturbationEvents: [],
      sexEvents: [],
      ...overrides,
    },
  });

  it('passes when event arrays match', () => {
    const expected = makeSnapshot({
      pornUseEvents: [makePuEvent({ id: 'pu_1' })],
      masturbationEvents: [makeMbEvent({ id: 'mb_1' })],
    });
    const readback = { ...expected, id: 1 };
    expect(() => assertSnapshotReadback(expected, readback, 1)).not.toThrow();
  });

  it('fails when pornUseEvents count differs (caught by length check)', () => {
    const expected = makeSnapshot({ pornUseEvents: [makePuEvent({ id: 'pu_1' })] });
    const readback = { ...expected, id: 1, data: { ...expected.data, pornUseEvents: [] } };
    // Length check fires first when arrays differ in count
    expect(() => assertSnapshotReadback(expected, readback, 1)).toThrow('快照写入自检失败');
  });

  it('fails when sexEvents ID set differs (same length)', () => {
    const expected = makeSnapshot({ sexEvents: [makeSxEvent({ id: 'sx_1' })] });
    const readback = { ...expected, id: 1, data: { ...expected.data, sexEvents: [makeSxEvent({ id: 'sx_2' })] } };
    expect(() => assertSnapshotReadback(expected, readback, 1)).toThrow('sexEvents ID 集合不一致');
  });
});

// ── checkSnapshotIntegrity ──────────────────────────────────────────────────

describe('checkSnapshotIntegrity', () => {
  const makeSnapshot = (overrides: Partial<Snapshot['data']> = {}): Snapshot => ({
    timestamp: Date.now(),
    dataVersion: 47,
    appVersion: '0.2.2',
    description: 'test',
    settings: null,
    userName: null,
    data: {
      version: LATEST_VERSION,
      logs: [],
      partners: [],
      tags: [],
      cycleEvents: [],
      pregnancyEvents: [],
      pornUseEvents: [],
      masturbationEvents: [],
      sexEvents: [],
      ...overrides,
    },
  });

  it('reports no issues for clean data', () => {
    const snapshot = makeSnapshot({
      pornUseEvents: [makePuEvent({ id: 'pu_1', linkedMasturbationEventIds: ['mb_1'] })],
      masturbationEvents: [makeMbEvent({ id: 'mb_1', linkedPornUseEventIds: ['pu_1'] })],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    expect(issues).toHaveLength(0);
  });

  it('reports orphan linked ids', () => {
    const snapshot = makeSnapshot({
      pornUseEvents: [makePuEvent({ id: 'pu_1', linkedMasturbationEventIds: ['mb_missing'] })],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const orphans = issues.filter((i) => i.kind === 'orphan');
    expect(orphans).toHaveLength(1);
  });

  it('reports one-way linked ids', () => {
    const snapshot = makeSnapshot({
      pornUseEvents: [makePuEvent({ id: 'pu_1', linkedSexEventIds: ['sx_1'] })],
      sexEvents: [makeSxEvent({ id: 'sx_1', linkedPornUseEventIds: [] })],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const oneWay = issues.filter((i) => i.kind === 'one_way');
    expect(oneWay).toHaveLength(1);
  });

  it('reports missing targetDate', () => {
    const snapshot = makeSnapshot({
      pornUseEvents: [makePuEvent({ id: 'pu_1', targetDate: '' })],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const missing = issues.filter((i) => i.kind === 'missing_target_date');
    expect(missing).toHaveLength(1);
  });

  it('reports targetDate/starterAt inconsistency (before 03:00)', () => {
    // 02:00 on May 21 → physiological day = May 20, but targetDate says May 21
    const snapshot = makeSnapshot({
      masturbationEvents: [makeMbEvent({ id: 'mb_1', startedAt: '2026-05-21T02:00:00', targetDate: '2026-05-21' })],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const mismatch = issues.filter((i) => i.kind === 'target_date_mismatch');
    expect(mismatch).toHaveLength(1);
  });

  it('accepts correct targetDate for pre-03:00 events', () => {
    // 02:00 on May 21 → physiological day = May 20
    const snapshot = makeSnapshot({
      masturbationEvents: [makeMbEvent({ id: 'mb_1', startedAt: '2026-05-21T02:00:00', targetDate: '2026-05-20' })],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const mismatch = issues.filter((i) => i.kind === 'target_date_mismatch');
    expect(mismatch).toHaveLength(0);
  });
});

// ── buildImportPreview with events ──────────────────────────────────────────

describe('buildImportPreview with events', () => {
  it('counts event arrays from imported data', () => {
    const snapshot = {
      appName: '硬度日记',
      appVersion: '0.2.2',
      dataVersion: 47,
      exportDate: '2026-05-28T10:00:00.000Z',
      settings: null,
      userName: null,
      data: {
        version: LATEST_VERSION,
        logs: [],
        partners: [],
        tags: [],
        cycleEvents: [],
        pregnancyEvents: [],
        snapshots: [],
        pornUseEvents: [makePuEvent({ id: 'pu_1' }), makePuEvent({ id: 'pu_2' })],
        masturbationEvents: [makeMbEvent({ id: 'mb_1' })],
        sexEvents: [],
      },
    };

    const preview = buildImportPreview(JSON.stringify(snapshot), false);
    expect(preview.counts.pornUseEvents).toBe(2);
    expect(preview.counts.masturbationEvents).toBe(1);
    expect(preview.counts.sexEvents).toBe(0);
  });

  it('defaults to 0 for missing event arrays (legacy data)', () => {
    const legacy = {
      data: {
        version: 46,
        logs: [{ date: '2026-05-20' }],
      },
    };
    const preview = buildImportPreview(JSON.stringify(legacy), false);
    expect(preview.counts.pornUseEvents).toBe(0);
    expect(preview.counts.masturbationEvents).toBe(0);
    expect(preview.counts.sexEvents).toBe(0);
  });

  it('reports orphan linked ids in eventLinkIssues', () => {
    const snapshot = {
      appName: '硬度日记',
      appVersion: '0.2.2',
      dataVersion: 47,
      exportDate: '2026-05-28T10:00:00.000Z',
      settings: null,
      userName: null,
      data: {
        version: LATEST_VERSION,
        logs: [],
        partners: [],
        tags: [],
        cycleEvents: [],
        pregnancyEvents: [],
        snapshots: [],
        pornUseEvents: [makePuEvent({ id: 'pu_1', linkedMasturbationEventIds: ['mb_x'] })],
        masturbationEvents: [],
        sexEvents: [],
      },
    };

    const preview = buildImportPreview(JSON.stringify(snapshot), false);
    expect(preview.eventLinkIssues.length).toBeGreaterThan(0);
    expect(preview.eventLinkIssues.some((i) => i.kind === 'orphan')).toBe(true);
  });
});
