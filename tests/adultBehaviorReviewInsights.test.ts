import { describe, it, expect } from 'vitest';
import type { AdultBehaviorWindowFacts, ReviewTimelineDay } from '../features/stats/model/adultBehaviorReviewFacts';
import type { AdultBehaviorDailyLogInput } from '../features/stats/model/adultBehaviorReviewInput';
import { generateReviewInsights } from '../features/stats/model/adultBehaviorReviewInsights';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeTimelineDay = (
  targetDate: string,
  events: ReviewTimelineDay['events'] = [],
  missingData: ReviewTimelineDay['missingData'] = [],
): ReviewTimelineDay => ({
  targetDate,
  events,
  dayFacts: [],
  missingData,
});

const makeTimelineEvent = (
  kind: ReviewTimelineDay['events'][0]['kind'],
  targetDate: string,
  facts: Array<{ key: string; value: string | number | boolean | null; unit?: string }> = [],
  startedAt?: string,
): ReviewTimelineDay['events'][0] => ({
  id: `evt_${kind}_${targetDate}`,
  kind,
  targetDate,
  sortKey: startedAt ?? '12:00:00',
  sourceId: `src_${kind}_${targetDate}`,
  summaryFacts: facts,
  linkedEventIds: [],
  privacyLevel: kind === 'porn_use' || kind === 'masturbation' || kind === 'sex' ? 'sensitive' : 'standard',
});

const makeWindowFacts = (overrides: Partial<AdultBehaviorWindowFacts>): AdultBehaviorWindowFacts => ({
  window: { kind: 'rolling_14d', startDate: '2026-05-15', endDate: '2026-05-28', label: '近 14 天' },
  recordDays: 0,
  missingData: [],
  pornUse: { count: 0, totalDurationMinutes: null, avgDurationMinutes: null, ejaculationCount: 0, ledToMasturbationCount: 0, exceededTimeCount: 0, controlFeelingSampleSize: 0 },
  masturbation: { count: 0, ejaculationCount: 0, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
  sex: { count: 0, ejaculationCount: 0, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null, fatigueSampleSize: 0, fatigueMean: null },
  recovery: { morningHardnessSampleSize: 0, morningHardnessMean: null, sleepSampleSize: 0, sleepMeanMinutes: null, fatigueSampleSize: 0 },
  timeline: [],
  ...overrides,
});

const makeLog = (targetDate: string, overrides: Partial<AdultBehaviorDailyLogInput> = {}): AdultBehaviorDailyLogInput => ({
  targetDate,
  morningHardness: null,
  sleepDurationMinutes: null,
  sleepQuality: null,
  alcohol: null,
  exerciseMinutes: null,
  stressLevel: null,
  moodLevel: null,
  fatigueLevel: null,
  notesPresent: false,
  ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('generateReviewInsights', () => {
  it('returns empty when no data', () => {
    const facts = makeWindowFacts({});
    const insights = generateReviewInsights(facts, []);
    expect(insights).toHaveLength(0);
  });

  it('sleep & hardness insight requires both sleep and hardness data', () => {
    // 5 days with short sleep + low hardness, 5 days with long sleep + high hardness
    const timeline: ReviewTimelineDay[] = [];
    for (let i = 0; i < 5; i++) {
      timeline.push(makeTimelineDay(`2026-05-${20 + i}`, [
        makeTimelineEvent('sleep', `2026-05-${20 + i}`, [{ key: 'duration', value: 300 }]),
        makeTimelineEvent('morning_hardness', `2026-05-${20 + i}`, [{ key: 'hardness', value: 2 }]),
      ]));
    }
    for (let i = 5; i < 10; i++) {
      timeline.push(makeTimelineDay(`2026-05-${20 + i}`, [
        makeTimelineEvent('sleep', `2026-05-${20 + i}`, [{ key: 'duration', value: 480 }]),
        makeTimelineEvent('morning_hardness', `2026-05-${20 + i}`, [{ key: 'hardness', value: 4 }]),
      ]));
    }

    const facts = makeWindowFacts({
      timeline,
      recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 3, sleepSampleSize: 10, sleepMeanMinutes: 390, fatigueSampleSize: 0 },
    });

    const insights = generateReviewInsights(facts, []);
    const sleepInsight = insights.find((i) => i.metric === 'sleep_morning_hardness');
    expect(sleepInsight).toBeTruthy();
    expect(sleepInsight!.sampleSize).toBe(10);
    expect(sleepInsight!.supportingFacts.length).toBeGreaterThan(0);
    expect(sleepInsight!.limitations.length).toBeGreaterThan(0);
  });

  it('activity load insight requires 3+ events and fatigue data', () => {
    const facts = makeWindowFacts({
      masturbation: { count: 2, ejaculationCount: 2, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
      sex: { count: 1, ejaculationCount: 1, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null, fatigueSampleSize: 1, fatigueMean: 3 },
      recovery: { morningHardnessSampleSize: 0, morningHardnessMean: null, sleepSampleSize: 0, sleepMeanMinutes: null, fatigueSampleSize: 1 },
    });
    const insights = generateReviewInsights(facts, []);
    const activityInsight = insights.find((i) => i.metric === 'activity_load_fatigue');
    expect(activityInsight).toBeTruthy();
    expect(activityInsight!.sampleSize).toBe(3);
  });

  it('activity load insight not generated when < 3 events', () => {
    const facts = makeWindowFacts({
      masturbation: { count: 1, ejaculationCount: 1, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
    });
    const insights = generateReviewInsights(facts, []);
    const activityInsight = insights.find((i) => i.metric === 'activity_load_fatigue');
    expect(activityInsight).toBeUndefined();
  });

  it('porn use insight generated with data', () => {
    const timeline: ReviewTimelineDay[] = [
      makeTimelineDay('2026-05-24', [
        makeTimelineEvent('porn_use', '2026-05-24', [
          { key: 'duration', value: 30, unit: 'min' },
        ], '2026-05-24T20:00:00'),
      ]),
      makeTimelineDay('2026-05-25', [
        makeTimelineEvent('porn_use', '2026-05-25', [
          { key: 'duration', value: 45, unit: 'min' },
        ], '2026-05-25T20:00:00'),
      ]),
      makeTimelineDay('2026-05-26', [
        makeTimelineEvent('morning_hardness', '2026-05-26', [{ key: 'hardness', value: 3 }]),
      ]),
      makeTimelineDay('2026-05-27', [
        makeTimelineEvent('morning_hardness', '2026-05-27', [{ key: 'hardness', value: 4 }]),
      ]),
      makeTimelineDay('2026-05-28', [
        makeTimelineEvent('morning_hardness', '2026-05-28', [{ key: 'hardness', value: 3 }]),
      ]),
    ];

    const facts = makeWindowFacts({
      timeline,
      pornUse: { count: 2, totalDurationMinutes: 75, avgDurationMinutes: 37.5, ejaculationCount: 0, ledToMasturbationCount: 0, exceededTimeCount: 0, controlFeelingSampleSize: 0 },
      recovery: { morningHardnessSampleSize: 3, morningHardnessMean: 3.3, sleepSampleSize: 0, sleepMeanMinutes: null, fatigueSampleSize: 0 },
    });

    const insights = generateReviewInsights(facts, []);
    const pornInsight = insights.find((i) => i.metric === 'porn_use_next_day_hardness');
    expect(pornInsight).toBeTruthy();
    expect(pornInsight!.supportingFacts.some((f) => f.includes('色情使用'))).toBe(true);
  });

  it('masturbation insight generated with data', () => {
    const facts = makeWindowFacts({
      masturbation: { count: 5, ejaculationCount: 4, edgingCount: 1, hardnessSampleSize: 3, hardnessMean: 4, satisfactionSampleSize: 3, satisfactionMean: 3.5 },
    });
    const insights = generateReviewInsights(facts, []);
    const mbInsight = insights.find((i) => i.metric === 'masturbation_satisfaction_recovery');
    expect(mbInsight).toBeTruthy();
    expect(mbInsight!.sampleSize).toBe(5);
    expect(mbInsight!.supportingFacts.some((f) => f.includes('自慰'))).toBe(true);
  });

  it('sex insight generated with data', () => {
    const facts = makeWindowFacts({
      sex: { count: 3, ejaculationCount: 2, pornInvolvedCount: 1, hardnessSampleSize: 2, hardnessMean: 4, satisfactionSampleSize: 2, satisfactionMean: 3.5, fatigueSampleSize: 1, fatigueMean: 3 },
    });
    const insights = generateReviewInsights(facts, []);
    const sexInsight = insights.find((i) => i.metric === 'sex_hardness_satisfaction_recovery');
    expect(sexInsight).toBeTruthy();
    expect(sexInsight!.sampleSize).toBe(3);
  });

  it('record quality insight generated', () => {
    const facts = makeWindowFacts({
      timeline: [
        makeTimelineDay('2026-05-25', [], []),
        makeTimelineDay('2026-05-26', [], []),
        makeTimelineDay('2026-05-27', [], []),
        makeTimelineDay('2026-05-28', [], []),
      ],
    });
    const logs = [
      makeLog('2026-05-25', { morningHardness: 3, sleepDurationMinutes: 480 }),
      makeLog('2026-05-26', { morningHardness: 4, sleepDurationMinutes: 420 }),
      makeLog('2026-05-27'), // no data
    ];
    const insights = generateReviewInsights(facts, logs);
    const rqInsight = insights.find((i) => i.metric === 'record_quality');
    expect(rqInsight).toBeTruthy();
    expect(rqInsight!.supportingFacts.some((f) => f.includes('记录天数'))).toBe(true);
  });

  it('prohibited content not in summary or limitations', () => {
    const facts = makeWindowFacts({
      masturbation: { count: 5, ejaculationCount: 5, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
    });
    const insights = generateReviewInsights(facts, []);
    const prohibited = ['诊断', '成瘾', '导致', '你应该', '你有', '性功能障碍'];
    for (const insight of insights) {
      for (const word of prohibited) {
        expect(insight.summary).not.toContain(word);
        for (const lim of insight.limitations) {
          expect(lim).not.toContain(word);
        }
      }
    }
  });

  it('all insights have supportingFacts and limitations', () => {
    const timeline: ReviewTimelineDay[] = [];
    for (let i = 0; i < 7; i++) {
      timeline.push(makeTimelineDay(`2026-05-${22 + i}`, [
        makeTimelineEvent('sleep', `2026-05-${22 + i}`, [{ key: 'duration', value: 480 }]),
        makeTimelineEvent('morning_hardness', `2026-05-${22 + i}`, [{ key: 'hardness', value: 4 }]),
      ]));
    }

    const facts = makeWindowFacts({
      timeline,
      recovery: { morningHardnessSampleSize: 7, morningHardnessMean: 4, sleepSampleSize: 7, sleepMeanMinutes: 480, fatigueSampleSize: 0 },
      masturbation: { count: 3, ejaculationCount: 2, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
    });

    const logs = timeline.map((t) => makeLog(t.targetDate, { morningHardness: 4, sleepDurationMinutes: 480 }));
    const insights = generateReviewInsights(facts, logs);

    for (const insight of insights) {
      expect(insight.sampleSize).toBeGreaterThan(0);
      expect(insight.supportingFacts.length).toBeGreaterThan(0);
      expect(insight.limitations.length).toBeGreaterThan(0);
    }
  });
});
