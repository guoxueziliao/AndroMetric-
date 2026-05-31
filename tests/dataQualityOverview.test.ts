import { describe, it, expect } from 'vitest';
import { computeDataQualityOverview } from '../features/stats/model/dataQualityOverview';
import type { LogEntry } from '../domain/types/log';

const TODAY = '2024-03-31';

const dayOffset = (base: string, daysAgo: number): string => {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const makeLog = (date: string, fields: Record<string, unknown> = {}): LogEntry =>
  ({ id: date, date, status: 'completed', ...fields }) as unknown as LogEntry;

describe('computeDataQualityOverview', () => {
  it('reports zero coverage and neutral copy when there are no logs', () => {
    const overview = computeDataQualityOverview([], TODAY);
    expect(overview.totalRecordedDays).toBe(0);
    expect(overview.windows.every((w) => w.coverage === 0)).toBe(true);
    const adult = overview.groups.find((g) => g.id === 'adult')!;
    expect(adult.confidence).toBe('none');
    expect(adult.note).toContain('缺失不代表问题');
    // never frames missing data as the user doing wrong
    const allNotes = overview.groups.map((g) => g.note).join('');
    for (const banned of ['异常', '风险', '病变', '诊断', '导致']) {
      expect(allNotes).not.toContain(banned);
    }
  });

  it('counts only completed logs inside the window', () => {
    const logs = [
      makeLog(dayOffset(TODAY, 0), { mood: 'good' }),
      makeLog(dayOffset(TODAY, 10), { mood: 'ok' }),
      makeLog(dayOffset(TODAY, 200), { mood: 'good' }), // outside 180
      { id: 'draft', date: dayOffset(TODAY, 1), status: 'draft' } as unknown as LogEntry, // not completed
    ];
    const overview = computeDataQualityOverview(logs, TODAY);
    expect(overview.totalRecordedDays).toBe(3); // all completed logs
    const w30 = overview.windows.find((w) => w.windowDays === 30)!;
    expect(w30.recordedDays).toBe(2); // day 0 and day 10, draft excluded
    const w180 = overview.windows.find((w) => w.windowDays === 180)!;
    expect(w180.recordedDays).toBe(2); // day 200 is outside
  });

  it('gives high-coverage groups a viewable confidence', () => {
    const logs = Array.from({ length: 70 }, (_, i) =>
      makeLog(dayOffset(TODAY, i), { mood: 'good' }),
    );
    const overview = computeDataQualityOverview(logs, TODAY);
    const basic = overview.groups.find((g) => g.id === 'basic')!;
    expect(basic.coverage).toBeGreaterThanOrEqual(0.6);
    expect(basic.confidence).toBe('medium');
    expect(basic.note).toContain('可用于相关观察');
  });

  it('marks the adult group sensitive and keeps low-coverage copy non-judgmental', () => {
    const logs = [makeLog(dayOffset(TODAY, 0), { masturbation: [{ id: 'm1' }] })];
    const overview = computeDataQualityOverview(logs, TODAY);
    const adult = overview.groups.find((g) => g.id === 'adult')!;
    expect(adult.sensitive).toBe(true);
    expect(adult.confidence).toBe('low');
    expect(adult.note).toContain('缺失不代表问题');
  });
});
