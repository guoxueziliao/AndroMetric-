import { describe, expect, it } from 'vitest';
import type { LogEntry } from '../domain';
import { analyzePersonalState } from '../features/state';

const createLog = (
  date: string,
  options: {
    hardness?: number | null;
    sleepHours?: number;
    sleepQuality?: number;
    exerciseMinutes?: number;
    alcoholGrams?: number;
    stressLevel?: 1 | 2 | 3 | 4 | 5;
    isSick?: boolean;
    sexLoad?: number;
    screenMinutes?: number;
  } = {}
): LogEntry => {
  const exerciseMinutes = options.exerciseMinutes ?? 0;
  const alcoholGrams = options.alcoholGrams ?? 0;
  const sexLoad = options.sexLoad ?? 0;
  const sleepHours = options.sleepHours ?? 7.5;
  const sleepStart = new Date(`${date}T07:00:00`);
  sleepStart.setHours(sleepStart.getHours() - sleepHours);

  return {
    date,
    status: 'completed',
    updatedAt: new Date(`${date}T12:00:00`).getTime(),
    morning: options.hardness
      ? {
          id: `mr-${date}`,
          timestamp: new Date(`${date}T07:00:00`).getTime(),
          wokeWithErection: true,
          hardness: options.hardness as 1 | 2 | 3 | 4 | 5,
          retention: 'normal',
          wokenByErection: false
        }
      : {
          id: `mr-${date}`,
          timestamp: new Date(`${date}T07:00:00`).getTime(),
          wokeWithErection: false,
          wokenByErection: false
        },
    sleep: {
      id: `sleep-${date}`,
      startTime: sleepStart.toISOString(),
      endTime: new Date(`${date}T07:00:00`).toISOString(),
      quality: options.sleepQuality ?? 4,
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
    stressLevel: options.stressLevel ?? 2,
    alcoholRecords: alcoholGrams > 0 ? [{
      id: `alc-${date}`,
      totalGrams: alcoholGrams,
      durationMinutes: 90,
      isLate: false,
      items: [{
        key: `beer-${date}`,
        name: 'beer',
        volume: 500,
        abv: 5,
        count: 2,
        pureAlcohol: alcoholGrams
      }],
      time: '20:00',
      ongoing: false
    }] : [],
    tags: [],
    exercise: exerciseMinutes > 0 ? [{
      id: `ex-${date}`,
      type: 'run',
      startTime: '18:00',
      duration: exerciseMinutes,
      intensity: 'medium'
    }] : [],
    sex: sexLoad >= 1.5 ? [{
      id: `sex-${date}`,
      startTime: '22:00',
      duration: 20,
      protection: '无保护措施',
      indicators: {
        lingerie: false,
        orgasm: true,
        partnerOrgasm: false,
        squirting: false,
        toys: false
      },
      ejaculation: sexLoad >= 2,
      mood: 'happy',
      interactions: []
    }] : [],
    masturbation: sexLoad > 0 && sexLoad < 1.5 ? [{
      id: `mb-${date}`,
      startTime: '22:00',
      duration: 10,
      status: 'completed',
      tools: ['hand'],
      contentItems: [],
      edging: 'none',
      edgingCount: 0,
      lubricant: 'none',
      useCondom: false,
      ejaculation: true,
      orgasmIntensity: 3,
      mood: 'neutral',
      stressLevel: 2,
      energyLevel: 3,
      interrupted: false,
      interruptionReasons: [],
      notes: ''
    }] : [],
    health: options.isSick ? {
      isSick: true,
      discomfortLevel: 'moderate',
      symptoms: ['cold'],
      medications: []
    } : undefined,
    screenTime: options.screenMinutes ? {
      totalMinutes: options.screenMinutes,
      source: 'manual',
      notes: ''
    } : undefined,
    changeHistory: []
  };
};

const createRange = (start: string, count: number, factory: (index: number, date: string) => LogEntry) => {
  const startDate = new Date(`${start}T00:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().slice(0, 10);
    return factory(index, dateStr);
  });
};

describe('analyzePersonalState', () => {
  it('degrades to record-building mode when hardness samples are insufficient', () => {
    const logs = createRange('2026-04-01', 10, (index, date) => createLog(date, {
      hardness: index % 2 === 0 ? 3 : null,
      sleepHours: 7,
      exerciseMinutes: 20
    }));

    const result = analyzePersonalState(logs);

    expect(result.confidence.level).toBe('none');
    expect(result.forecast.days.every((day) => day.predictedHardness === null)).toBe(true);
    expect(result.achievableGoals[0]?.title).toContain('连续记录 14 天');
  });

  it('produces forecasts and challenge goals for stable high-quality history', () => {
    const logs = createRange('2026-03-01', 30, (index, date) => createLog(date, {
      hardness: index % 3 === 0 ? 5 : index % 2 === 0 ? 4 : 3,
      sleepHours: index % 2 === 0 ? 7.8 : 6.4,
      sleepQuality: 4,
      exerciseMinutes: index % 2 === 0 ? 35 : 0,
      alcoholGrams: index % 2 === 0 ? 0 : 24,
      stressLevel: index % 2 === 0 ? 2 : 4,
      screenMinutes: index % 2 === 0 ? 140 : 260
    }));

    const result = analyzePersonalState(logs);

    expect(['peak_ready', 'stable']).toContain(result.currentState.type);
    expect(result.confidence.level).not.toBe('none');
    expect(result.forecast.days.some((day) => typeof day.predictedHardness === 'number')).toBe(true);
    expect(result.influencingFactors.positiveTop5.length).toBeGreaterThan(0);
    expect(result.achievableGoals.some((goal) => goal.title.includes('未来 7 天'))).toBe(true);
  });

  it('leans toward recovery or risk when recent days are under heavy strain', () => {
    const logs = createRange('2026-03-20', 24, (index, date) => {
      if (index < 20) {
        return createLog(date, {
          hardness: 4,
          sleepHours: 7.5,
          exerciseMinutes: 25,
          alcoholGrams: 0,
          stressLevel: 2,
          screenMinutes: 160
        });
      }

      return createLog(date, {
        hardness: 2,
        sleepHours: 5.5,
        exerciseMinutes: 0,
        alcoholGrams: 45,
        stressLevel: 5,
        sexLoad: 2,
        isSick: index === 23,
        screenMinutes: 420
      });
    });

    const result = analyzePersonalState(logs);

    expect(['fatigued', 'risk', 'recovering']).toContain(result.currentState.type);
    expect(result.currentState.stateScore).toBeLessThan(70);
    expect(result.achievableGoals.some((goal) => goal.title.includes('回到稳定区'))).toBe(true);
  });
});
