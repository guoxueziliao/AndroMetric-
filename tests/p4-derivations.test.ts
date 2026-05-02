import { describe, expect, it } from 'vitest';
import type { CycleEvent, LogEntry, PartnerProfile, PregnancyEvent } from '../domain';
import { attachMenstrualSummary, buildPregnancyStatus, estimateFertileWindow, predictNextPeriod } from '../features/reproductive/model/p4Derivations';
import { flattenLogsToEvents } from '../features/stats/model/eventAdapter';

const addDays = (date: string, days: number) => {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + days);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createBaseLog = (date: string): LogEntry => ({
  date,
  status: 'completed',
  updatedAt: new Date(`${date}T12:00:00`).getTime(),
  alcoholRecords: [],
  tags: [],
  exercise: [],
  sex: [],
  masturbation: [],
  changeHistory: []
});

const partner: PartnerProfile = {
  id: 'partner-1',
  name: 'Alice',
  sensitiveSpots: [],
  stimulationPreferences: [],
  likedPositions: [],
  dislikedActs: [],
  socialTags: [],
  milestones: {},
  reproductiveProfile: {
    trackingEnabled: true,
    goal: 'trying_to_conceive',
    cycleRegularity: 'regular',
    typicalCycleLengthDays: 28,
    typicalPeriodLengthDays: 5,
    lastMenstrualPeriodStart: null,
    pregnancyHistorySummary: {
      priorPregnancies: null,
      priorLosses: null,
      ectopicHistory: null
    },
    riskFlags: []
  }
};

describe('P4 derivations', () => {
  it('predicts next period and fertile window from complete cycles', () => {
    const cycleEvents: CycleEvent[] = [
      { id: 'c1', partnerId: partner.id, date: '2026-01-01', kind: 'period_start', source: 'manual' },
      { id: 'c2', partnerId: partner.id, date: '2026-01-05', kind: 'period_end', source: 'manual' },
      { id: 'c3', partnerId: partner.id, date: '2026-01-29', kind: 'period_start', source: 'manual' },
      { id: 'c4', partnerId: partner.id, date: '2026-02-02', kind: 'period_end', source: 'manual' },
      { id: 'c5', partnerId: partner.id, date: '2026-02-26', kind: 'period_start', source: 'manual' },
      { id: 'c6', partnerId: partner.id, date: '2026-03-02', kind: 'period_end', source: 'manual' },
      { id: 'c7', partnerId: partner.id, date: '2026-03-25', kind: 'period_start', source: 'manual' }
    ];

    const nextPeriod = predictNextPeriod(partner.id, cycleEvents);
    const fertileWindow = estimateFertileWindow(partner.id, cycleEvents, '2026-03-30');

    expect(nextPeriod.date).toBe('2026-04-22');
    expect(fertileWindow.startDate).toBe('2026-04-03');
    expect(fertileWindow.endDate).toBe('2026-04-09');
  });

  it('uses peak ovulation test to override the default fertile window summary', () => {
    const cycleEvents: CycleEvent[] = [
      { id: 'c1', partnerId: partner.id, date: '2026-03-25', kind: 'period_start', source: 'manual' },
      { id: 'c2', partnerId: partner.id, date: '2026-03-29', kind: 'period_end', source: 'manual' },
      { id: 'c3', partnerId: partner.id, date: '2026-04-08', kind: 'ovulation_test', source: 'manual', payload: { ovulationTest: 'peak' } }
    ];
    const log = createBaseLog('2026-04-09');

    const decorated = attachMenstrualSummary(log, [partner], cycleEvents);

    expect(decorated.menstrual?.status).toBe('fertile_window');
    expect(decorated.menstrual?.predictedFertileWindow).toBe(true);
  });

  it('builds pregnancy risk state and emits event adapter reproductive events', () => {
    const pregnancy: PregnancyEvent[] = [
      {
        id: 'p1',
        partnerId: partner.id,
        date: '2026-04-10',
        kind: 'pregnancy_test',
        source: 'manual',
        payload: { pregnancyTest: 'positive' }
      },
      {
        id: 'p2',
        partnerId: partner.id,
        date: '2026-04-11',
        kind: 'pain',
        source: 'manual',
        payload: { painSeverity: 4, painSide: 'left', withDizziness: true }
      }
    ];

    const status = buildPregnancyStatus(partner.id, pregnancy);
    const events = flattenLogsToEvents(
      [createBaseLog('2026-04-10')],
      { pregnancyEvents: pregnancy }
    );

    expect(status.state).toBe('suspected_or_confirmed_pregnancy');
    expect(status.alerts[0]).toContain('叶酸');
    expect(status.alerts[1]).toContain('急诊');
    expect(events.some((event) => event.type === 'pregnancy_test')).toBe(true);
  });
});
