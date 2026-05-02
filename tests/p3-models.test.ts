import { describe, expect, it } from 'vitest';
import type { DataQuality, LogEntry, MasturbationRecordDetails, SexRecordDetails } from '../domain';
import { flattenLogsToEvents } from '../features/stats/model/eventAdapter';
import { getFatigueSummaryFromEvents } from '../features/stats/model/p3Fatigue';
import { getMasturbationRecommendationsFromEvents, getSexRecommendationsFromEvents } from '../features/stats/model/p3Recommendations';
import { scoreSexRecord } from '../features/stats/model/p3Scoring';
import { getWindowsFromEvents } from '../features/stats/model/p3Windows';

const createSleepRange = (date: string, hours: number) => {
  const end = new Date(`${date}T07:00:00`);
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
};

const addDays = (date: string, days: number) => {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
};

const createBaseLog = (date: string): LogEntry => {
  const sleep = createSleepRange(date, 8);

  return {
    date,
    status: 'completed',
    updatedAt: new Date(`${date}T12:00:00`).getTime(),
    morning: {
      id: `mr-${date}`,
      timestamp: new Date(`${date}T07:00:00`).getTime(),
      wokeWithErection: true,
      hardness: 4,
      retention: 'normal',
      wokenByErection: false
    },
    sleep: {
      id: `sleep-${date}`,
      startTime: sleep.start,
      endTime: sleep.end,
      quality: 4,
      attire: 'light',
      naturalAwakening: true,
      nocturnalEmission: false,
      withPartner: false,
      preSleepState: 'calm',
      naps: [],
      hasDream: false,
      dreamTypes: [],
      environment: {
        location: 'home',
        temperature: 'comfortable'
      }
    },
    stressLevel: 2,
    alcoholRecords: [],
    tags: [],
    exercise: [],
    sex: [],
    masturbation: [],
    changeHistory: []
  };
};

const createSexRecord = (id: string, overrides: Partial<SexRecordDetails> = {}): SexRecordDetails => ({
  id,
  startTime: '20:00',
  duration: 20,
  protection: '无保护措施',
  indicators: {
    lingerie: false,
    orgasm: true,
    partnerOrgasm: true,
    squirting: false,
    toys: false
  },
  ejaculation: true,
  partnerScore: 5,
  mood: 'happy',
  notes: '',
  interactions: [{
    id: `interaction-${id}`,
    partner: 'Alice',
    location: '卧室',
    costumes: ['黑丝'],
    toys: ['跳蛋'],
    chain: [{ id: `position-${id}`, type: 'position', name: '传教士' }]
  }],
  ...overrides
});

const createMasturbationRecord = (id: string, overrides: Partial<MasturbationRecordDetails> = {}): MasturbationRecordDetails => ({
  id,
  startTime: '23:30',
  duration: 15,
  status: 'completed',
  tools: ['飞机杯'],
  contentItems: [{
    id: `content-${id}`,
    type: '视频',
    xpTags: ['剧情']
  }],
  edging: 'none',
  edgingCount: 0,
  lubricant: '无润滑',
  useCondom: false,
  ejaculation: true,
  orgasmIntensity: 4,
  satisfactionLevel: 4,
  mood: 'neutral',
  stressLevel: 2,
  energyLevel: 4,
  interrupted: false,
  interruptionReasons: [],
  notes: '',
  postMood: '满足/愉悦',
  fatigue: '无明显疲劳',
  location: '卧室/床上',
  ...overrides
});

describe('P3 models', () => {
  it('drops sex score when usable weighted evidence is below half', () => {
    const log = createBaseLog('2026-01-01');
    const record = createSexRecord('sex-1', { partnerScore: undefined, mood: 'happy' });

    const dataQuality: DataQuality = {
      version: 1,
      source: 'migration',
      partial: true,
      updatedAt: Date.now(),
      fields: {
        [`sex.${record.id}.partnerScore`]: { state: 'defaulted', source: 'migration' },
        [`sex.${record.id}.duration`]: { state: 'defaulted', source: 'migration' },
        [`sex.${record.id}.ejaculation`]: { state: 'defaulted', source: 'migration' },
        [`sex.${record.id}.mood`]: { state: 'defaulted', source: 'migration' }
      }
    };

    log.sex = [record];
    log.dataQuality = dataQuality;

    const result = scoreSexRecord(log, record);

    expect(result.totalScore).toBeNull();
    expect(result.usableWeight).toBe(35);
  });

  it('produces sex recommendations and high-quality windows from standardized events', () => {
    const logs = Array.from({ length: 8 }, (_, index) => {
      const log = createBaseLog(addDays('2026-01-07', index * 7));
      log.sex = [createSexRecord(`sex-${index}`)];
      return log;
    });

    const events = flattenLogsToEvents(logs);
    const recommendations = getSexRecommendationsFromEvents(events);
    const windows = getWindowsFromEvents(events, 'sex');
    const sexEvent = events.find(event => event.type === 'sex');

    expect(sexEvent?.tags).toContain('time_bucket:evening');
    expect(sexEvent?.metrics.score).toBeTypeOf('number');
    expect(recommendations.some(item => item.value === '传教士')).toBe(true);
    expect(windows[0]?.label).toContain('晚间');
  });

  it('produces masturbation fatigue summary from high-strain histories', () => {
    const logs = Array.from({ length: 6 }, (_, index) => {
      const date = addDays('2026-02-03', index * 7);
      const log = createBaseLog(date);
      const sleep = createSleepRange(date, 5.5);
      log.sleep = { ...log.sleep!, startTime: sleep.start, endTime: sleep.end };
      log.stressLevel = 5;
      log.masturbation = [createMasturbationRecord(`mb-${index}`, {
        energyLevel: 1,
        ejaculation: false,
        edging: 'multiple',
        fatigue: '秒睡',
        startTime: '23:45'
      })];
      return log;
    });

    const events = flattenLogsToEvents(logs);
    const summary = getFatigueSummaryFromEvents(events, 'masturbation');
    const recommendations = getMasturbationRecommendationsFromEvents(events);

    expect(summary.insufficient).toBe(false);
    expect(summary.currentState).not.toBe('normal');
    expect(summary.lines[0]).toContain('高压状态');
    expect(recommendations.some(item => item.value === '剧情' || item.value === '飞机杯')).toBe(true);
  });
});
