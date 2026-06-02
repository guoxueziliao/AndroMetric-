import { describe, it, expect } from 'vitest';
import {
  normalizeFilter,
  resolveTimeRange,
  applyReviewFilter,
  runReviewFilter,
  type ReviewFilterDraft,
} from '../features/stats/model/advancedReviewFilter';
import type { LogEntry } from '../domain/types/log';

const TODAY = '2024-03-31';

const shift = (base: string, days: number): string => {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const makeLog = (date: string, fields: Record<string, unknown> = {}): LogEntry =>
  ({ id: date, date, status: 'completed', ...fields }) as unknown as LogEntry;

const draft = (over: Partial<ReviewFilterDraft> = {}): ReviewFilterDraft => ({
  time: 'last30',
  behaviors: [],
  dataQuality: [],
  ...over,
});

describe('resolveTimeRange', () => {
  it('resolves last-N presets inclusive of today', () => {
    expect(resolveTimeRange(draft({ time: 'last7' }), TODAY)).toEqual({ from: shift(TODAY, -6), to: TODAY });
    expect(resolveTimeRange(draft({ time: 'last30' }), TODAY)).toEqual({ from: shift(TODAY, -29), to: TODAY });
  });

  it('resolves thisMonth to the first of the month', () => {
    expect(resolveTimeRange(draft({ time: 'thisMonth' }), TODAY)).toEqual({ from: '2024-03-01', to: TODAY });
  });

  it('resolves thisWeek to Monday', () => {
    // 2024-03-31 is a Sunday → Monday is 2024-03-25
    expect(resolveTimeRange(draft({ time: 'thisWeek' }), TODAY)).toEqual({ from: '2024-03-25', to: TODAY });
  });

  it('normalises reversed custom bounds', () => {
    const r = resolveTimeRange(draft({ time: 'custom', customFrom: '2024-03-10', customTo: '2024-03-01' }), TODAY);
    expect(r).toEqual({ from: '2024-03-01', to: '2024-03-10' });
  });

  it('falls back to today for invalid custom dates', () => {
    const r = resolveTimeRange(draft({ time: 'custom', customFrom: 'nope', customTo: '' }), TODAY);
    expect(r).toEqual({ from: TODAY, to: TODAY });
  });
});

describe('normalizeFilter', () => {
  it('caps an over-long custom range to <= 366 days', () => {
    const f = normalizeFilter(draft({ time: 'custom', customFrom: '2020-01-01', customTo: '2024-03-31' }), TODAY);
    const days = Math.round((new Date(`${f.to}T12:00:00`).getTime() - new Date(`${f.from}T12:00:00`).getTime()) / 86_400_000) + 1;
    expect(days).toBeLessThanOrEqual(366);
    expect(f.to).toBe('2024-03-31');
  });
});

describe('applyReviewFilter', () => {
  it('returns only completed logs inside the range, newest-first', () => {
    const logs = [
      makeLog(shift(TODAY, 0)),
      makeLog(shift(TODAY, -5)),
      makeLog(shift(TODAY, -40)), // outside last30
      { id: 'p', date: shift(TODAY, -1), status: 'pending' } as unknown as LogEntry,
    ];
    const result = runReviewFilter(logs, draft({ time: 'last30' }), TODAY);
    expect(result.logs.map((l) => l.date)).toEqual([shift(TODAY, 0), shift(TODAY, -5)]);
    expect(result.summary.hitDays).toBe(2);
  });

  it('ANDs across dimensions, ORs within a dimension', () => {
    const logs = [
      makeLog(shift(TODAY, -1), { exercise: [{ id: 'e' }] }),
      makeLog(shift(TODAY, -2), { masturbation: [{ id: 'm' }] }),
      makeLog(shift(TODAY, -3), { sleep: { startTime: '23:00', endTime: '07:00', naps: [] } }),
    ];
    // behavior OR: exercise or masturbation → 2 hits
    const r1 = runReviewFilter(logs, draft({ behaviors: ['exercise', 'masturbation'] }), TODAY);
    expect(r1.summary.hitDays).toBe(2);
    // AND with dataQuality missingSleep: exercise+masturbation logs both lack sleep → still 2
    const r2 = runReviewFilter(logs, draft({ behaviors: ['exercise', 'masturbation'], dataQuality: ['missingSleep'] }), TODAY);
    expect(r2.summary.hitDays).toBe(2);
  });

  it('excludes porn === none, includes porn levels', () => {
    const logs = [
      makeLog(shift(TODAY, -1), { pornConsumption: 'none' }),
      makeLog(shift(TODAY, -2), { pornConsumption: 'low' }),
    ];
    const r = runReviewFilter(logs, draft({ behaviors: ['porn'] }), TODAY);
    expect(r.logs.map((l) => l.date)).toEqual([shift(TODAY, -2)]);
  });

  it('detects partnerInvolved from multiple signals', () => {
    const logs = [
      makeLog(shift(TODAY, -1), { sex: [{ id: 's', partner: 'A' }] }),
      makeLog(shift(TODAY, -2), { sleep: { withPartner: true, naps: [] } }),
      makeLog(shift(TODAY, -3), { location: 'partner' }),
      makeLog(shift(TODAY, -4), { masturbation: [{ id: 'm' }] }), // no partner
    ];
    const r = runReviewFilter(logs, draft({ behaviors: ['partnerInvolved'] }), TODAY);
    expect(r.summary.hitDays).toBe(3);
  });

  it('buckets data quality: complete vs missing vs lowConfidence', () => {
    const complete = makeLog(shift(TODAY, -1), {
      morning: { wokeWithErection: true, hardness: 3 },
      sleep: { startTime: '23:00', endTime: '07:00', naps: [] },
      dataQuality: { version: 1, source: 'manual', partial: false, fields: {}, updatedAt: 0 },
    });
    const missingSleep = makeLog(shift(TODAY, -2), { morning: { wokeWithErection: true, hardness: 3 } });
    const partial = makeLog(shift(TODAY, -3), {
      sleep: { startTime: '23:00', endTime: '07:00', naps: [] },
      dataQuality: { version: 1, source: 'manual', partial: true, fields: {}, updatedAt: 0 },
    });
    const logs = [complete, missingSleep, partial];

    expect(runReviewFilter(logs, draft({ dataQuality: ['complete'] }), TODAY).logs.map((l) => l.date)).toEqual([
      shift(TODAY, -1),
    ]);
    expect(runReviewFilter(logs, draft({ dataQuality: ['missingSleep'] }), TODAY).logs.map((l) => l.date)).toEqual([
      shift(TODAY, -2),
    ]);
    // lowConfidence: partial log + the missingSleep log (no dataQuality metadata → treated low)
    const low = runReviewFilter(logs, draft({ dataQuality: ['lowConfidence'] }), TODAY).logs.map((l) => l.date).sort();
    expect(low).toEqual([shift(TODAY, -2), shift(TODAY, -3)].sort());
  });

  it('flags tooFew when 1-2 hits, not when 0 or >=3', () => {
    const mk = (n: number) => Array.from({ length: n }, (_, i) => makeLog(shift(TODAY, -i)));
    expect(applyReviewFilter([], normalizeFilter(draft(), TODAY)).tooFew).toBe(false);
    expect(applyReviewFilter(mk(2), normalizeFilter(draft(), TODAY)).tooFew).toBe(true);
    expect(applyReviewFilter(mk(3), normalizeFilter(draft(), TODAY)).tooFew).toBe(false);
  });

  it('reports coverage and behaviorEvents in the summary', () => {
    const logs = [
      makeLog(shift(TODAY, -1), { sex: [{ id: 's1' }, { id: 's2' }], exercise: [{ id: 'e' }] }),
    ];
    const r = runReviewFilter(logs, draft({ time: 'last7' }), TODAY);
    expect(r.summary.behaviorEvents).toBe(3);
    expect(r.summary.hitDays).toBe(1);
    expect(r.summary.coverage).toBeCloseTo(1 / 7, 5);
  });
});
