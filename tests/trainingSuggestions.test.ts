import { describe, it, expect } from 'vitest';
import type { AdultBehaviorWindowFacts } from '../features/stats/model/adultBehaviorReviewFacts';
import type { GatedInsight } from '../features/stats/model/adultBehaviorReviewConfidence';
import {
  generateTrainingSuggestions,
  buildSuggestionInput,
  type TrainingSuggestionInput,
} from '../features/stats/model/trainingSuggestions';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeFacts = (overrides: Partial<AdultBehaviorWindowFacts> = {}): AdultBehaviorWindowFacts => ({
  window: { kind: 'rolling_14d', startDate: '2026-05-15', endDate: '2026-05-28', label: '近 14 天' },
  recordDays: 10,
  missingData: [],
  pornUse: { count: 0, totalDurationMinutes: null, avgDurationMinutes: null, ejaculationCount: 0, ledToMasturbationCount: 0, exceededTimeCount: 0, controlFeelingSampleSize: 0 },
  masturbation: { count: 0, ejaculationCount: 0, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
  sex: { count: 0, ejaculationCount: 0, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null, fatigueSampleSize: 0, fatigueMean: null },
  recovery: { morningHardnessSampleSize: 0, morningHardnessMean: null, sleepSampleSize: 0, sleepMeanMinutes: null, fatigueSampleSize: 0 },
  timeline: [],
  ...overrides,
});

const makeInsight = (overrides: Partial<GatedInsight> = {}): GatedInsight => ({
  id: 'test-1',
  metric: 'sleep_morning_hardness',
  window: '近 14 天',
  sampleSize: 10,
  confidence: 'medium',
  summary: 'Test',
  supportingFacts: ['fact'],
  limitations: ['limitation'],
  ...overrides,
});

const makeInput = (overrides: Partial<TrainingSuggestionInput> = {}): TrainingSuggestionInput => ({
  facts: makeFacts(),
  insights: [],
  activeGoalCount: 0,
  hasHighLoad: false,
  hasLowRecovery: false,
  ...overrides,
});

// ── Rule 1: Insufficient sample ──────────────────────────────────────────────

describe('Rule 1: insufficient sample', () => {
  it('suggests keep_recording when all samples insufficient', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 0, morningHardnessMean: null, sleepSampleSize: 0, sleepMeanMinutes: null, fatigueSampleSize: 0 },
      }),
    }));
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].nextAction).toBe('keep_recording');
    expect(suggestions[0].dimension).toBe('record_quality');
    expect(suggestions[0].confidence).toBe('none');
    expect(suggestions[0].suggestedGoal).toBeTruthy();
    expect(suggestions[0].suggestedGoal!.targetWindowDays).toBe(7);
  });

  it('suggests keep_recording when hardness sample insufficient', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 1, morningHardnessMean: 3, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
      }),
    }));
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].nextAction).toBe('keep_recording');
  });

  it('does NOT return other suggestions when sample insufficient', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 0, morningHardnessMean: null, sleepSampleSize: 0, sleepMeanMinutes: null, fatigueSampleSize: 0 },
      }),
      hasHighLoad: true,
    }));
    // Should only return the insufficient sample suggestion, not high-load recovery
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].id).toBe('insufficient_sample');
  });
});

// ── Rule 2: High load / low recovery ─────────────────────────────────────────

describe('Rule 2: high load / low recovery', () => {
  it('suggests recovery when high load detected', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 4, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 5 },
        pornUse: { count: 5, totalDurationMinutes: 150, avgDurationMinutes: 30, ejaculationCount: 3, ledToMasturbationCount: 2, exceededTimeCount: 0, controlFeelingSampleSize: 3 },
        masturbation: { count: 4, ejaculationCount: 3, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
      }),
      hasHighLoad: true,
      hasLowRecovery: true,
    }));
    const recovery = suggestions.find((s) => s.dimension === 'recovery');
    expect(recovery).toBeTruthy();
    expect(recovery!.nextAction).toBe('prioritize_recovery');
    expect(recovery!.suggestedGoal!.targetWindowDays).toBe(7);
  });

  it('high load restricts to recovery and record_quality only', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 4, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 5 },
        sex: { count: 5, ejaculationCount: 3, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null, fatigueSampleSize: 0, fatigueMean: null },
      }),
      hasHighLoad: true,
    }));
    for (const s of suggestions) {
      expect(['recovery', 'record_quality']).toContain(s.dimension);
    }
  });
});

// ── Rule 3: Hardness stability ───────────────────────────────────────────────

describe('Rule 3: hardness stability', () => {
  it('suggests when hardness sample >= 7 and insight exists', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 3.5, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
        masturbation: { count: 3, ejaculationCount: 2, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
      }),
      insights: [makeInsight({ metric: 'sleep_morning_hardness', confidence: 'medium' })],
    }));
    const hardness = suggestions.find((s) => s.dimension === 'hardness_stability');
    expect(hardness).toBeTruthy();
    expect(hardness!.suggestedGoal!.category).toBe('hardness_stability');
    expect(hardness!.suggestedGoal!.targetWindowDays).toBe(14);
  });

  it('not suggested when hardness sample < 7', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 5, morningHardnessMean: 3.5, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
      }),
      insights: [makeInsight()],
    }));
    const hardness = suggestions.find((s) => s.dimension === 'hardness_stability');
    expect(hardness).toBeUndefined();
  });
});

// ── Rule 4: Ejaculation control ──────────────────────────────────────────────

describe('Rule 4: ejaculation control', () => {
  it('suggests when ejaculation count >= 5', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 4, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
        masturbation: { count: 5, ejaculationCount: 3, edgingCount: 2, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
        sex: { count: 3, ejaculationCount: 2, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null, fatigueSampleSize: 0, fatigueMean: null },
      }),
    }));
    const ec = suggestions.find((s) => s.dimension === 'ejaculation_control_observation');
    expect(ec).toBeTruthy();
    expect(ec!.suggestedGoal!.targetWindowDays).toBe(14);
  });
});

// ── Safety Rails ─────────────────────────────────────────────────────────────

describe('Safety Rails', () => {
  it('suggestedGoal.category always from allowlist', () => {
    const allowed = new Set([
      'record_quality', 'recovery', 'hardness_stability',
      'sex_performance_stability', 'ejaculation_control_observation',
      'relationship_communication',
    ]);
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 3, sleepSampleSize: 10, sleepMeanMinutes: 400, fatigueSampleSize: 0 },
        masturbation: { count: 5, ejaculationCount: 5, edgingCount: 3, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
        sex: { count: 5, ejaculationCount: 3, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 3, satisfactionMean: 4, fatigueSampleSize: 0, fatigueMean: null },
      }),
      insights: [makeInsight()],
    }));
    for (const s of suggestions) {
      if (s.suggestedGoal) {
        expect(allowed.has(s.suggestedGoal.category)).toBe(true);
      }
    }
  });

  it('targetWindowDays only 7 or 14', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 3, sleepSampleSize: 10, sleepMeanMinutes: 400, fatigueSampleSize: 0 },
        sex: { count: 5, ejaculationCount: 3, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 3, satisfactionMean: 4, fatigueSampleSize: 0, fatigueMean: null },
      }),
      insights: [makeInsight()],
    }));
    for (const s of suggestions) {
      if (s.suggestedGoal) {
        expect([7, 14]).toContain(s.suggestedGoal.targetWindowDays);
      }
    }
  });

  it('no forbidden copy in messages', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 3, sleepSampleSize: 10, sleepMeanMinutes: 400, fatigueSampleSize: 0 },
        masturbation: { count: 5, ejaculationCount: 5, edgingCount: 3, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
        sex: { count: 5, ejaculationCount: 3, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 3, satisfactionMean: 4, fatigueSampleSize: 0, fatigueMean: null },
      }),
      insights: [makeInsight()],
    }));
    const forbidden = ['诊断', '成瘾', '导致', '排名', '评分', '能力评分', '越久越好'];
    for (const s of suggestions) {
      for (const word of forbidden) {
        expect(s.message).not.toContain(word);
        expect(s.trigger).not.toContain(word);
      }
    }
  });

  it('max 3 suggestions output', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 3, sleepSampleSize: 10, sleepMeanMinutes: 400, fatigueSampleSize: 0 },
        masturbation: { count: 5, ejaculationCount: 5, edgingCount: 3, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
        sex: { count: 8, ejaculationCount: 5, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 5, satisfactionMean: 4, fatigueSampleSize: 0, fatigueMean: null },
      }),
      insights: [makeInsight()],
    }));
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });
});

// ── buildSuggestionInput ─────────────────────────────────────────────────────

describe('buildSuggestionInput', () => {
  it('detects high load from activity count', () => {
    const facts = makeFacts({
      pornUse: { count: 5, totalDurationMinutes: 150, avgDurationMinutes: 30, ejaculationCount: 3, ledToMasturbationCount: 0, exceededTimeCount: 0, controlFeelingSampleSize: 0 },
      masturbation: { count: 3, ejaculationCount: 3, edgingCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 0, satisfactionMean: null },
    });
    const input = buildSuggestionInput(facts, [], 0);
    expect(input.hasHighLoad).toBe(true);
  });

  it('detects low recovery from poor sleep', () => {
    const facts = makeFacts({
      recovery: { morningHardnessSampleSize: 5, morningHardnessMean: 4, sleepSampleSize: 5, sleepMeanMinutes: 300, fatigueSampleSize: 0 },
    });
    const input = buildSuggestionInput(facts, [], 0);
    expect(input.hasLowRecovery).toBe(true);
  });

  it('detects low recovery from low hardness', () => {
    const facts = makeFacts({
      recovery: { morningHardnessSampleSize: 5, morningHardnessMean: 2, sleepSampleSize: 5, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
    });
    const input = buildSuggestionInput(facts, [], 0);
    expect(input.hasLowRecovery).toBe(true);
  });
});

// ── Relationship context ─────────────────────────────────────────────────────

describe('Relationship context', () => {
  it('relationship suggestion uses gender-neutral copy', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 4, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
        sex: { count: 5, ejaculationCount: 3, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 5, satisfactionMean: 4, fatigueSampleSize: 0, fatigueMean: null },
      }),
    }));
    const rel = suggestions.find((s) => s.dimension === 'relationship_communication');
    if (rel) {
      // Must not contain gender-specific or relationship-form-specific terms
      const forbidden = ['女友', '老婆', '正经关系', '不正经关系', '主伴侣', '临时伴侣'];
      for (const word of forbidden) {
        expect(rel.message).not.toContain(word);
        expect(rel.trigger).not.toContain(word);
      }
    }
  });

  it('relationship suggestion does not evaluate partners', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 4, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
        sex: { count: 5, ejaculationCount: 3, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 5, satisfactionMean: 4, fatigueSampleSize: 0, fatigueMean: null },
      }),
    }));
    const rel = suggestions.find((s) => s.dimension === 'relationship_communication');
    if (rel) {
      const forbidden = ['导致', '适合', '不健康', '更换', '最好', '最差', '排名', '评分'];
      for (const word of forbidden) {
        expect(rel.message).not.toContain(word);
        expect(rel.trigger).not.toContain(word);
      }
    }
  });

  it('relationship goal category passes safety rails', () => {
    const suggestions = generateTrainingSuggestions(makeInput({
      facts: makeFacts({
        recovery: { morningHardnessSampleSize: 10, morningHardnessMean: 4, sleepSampleSize: 10, sleepMeanMinutes: 450, fatigueSampleSize: 0 },
        sex: { count: 5, ejaculationCount: 3, pornInvolvedCount: 0, hardnessSampleSize: 0, hardnessMean: null, satisfactionSampleSize: 5, satisfactionMean: 4, fatigueSampleSize: 0, fatigueMean: null },
      }),
    }));
    const rel = suggestions.find((s) => s.dimension === 'relationship_communication');
    if (rel && rel.suggestedGoal) {
      expect(rel.suggestedGoal.category).toBe('relationship_communication');
      expect([7, 14]).toContain(rel.suggestedGoal.targetWindowDays);
    }
  });
});
