import { describe, it, expect } from 'vitest';
import type { TrainingGoal, GoalCheckin } from '../domain';
import type { ContextExplanationCard } from '../features/stats/model/contextExplanationTypes';
import {
  buildDraftFromExplanationCard,
  buildDraftFromMetricId,
  draftToGoalInput,
  getObservationPlans,
  getActiveObservationPlans,
  isObservationPlan,
  buildObservationReview,
} from '../features/stats/model/observationPlanService';

const makeCard = (overrides: Partial<ContextExplanationCard> = {}): ContextExplanationCard => ({
  id: 'ctx_test_1',
  metricId: 'hardness',
  contextType: 'sleep',
  windowDays: 14,
  message: '变化窗口内睡眠记录较完整，建议结合晨间硬度一起观察。',
  sampleSize: 10,
  confidence: 'low',
  limitations: [],
  ...overrides,
});

const makeGoal = (overrides: Partial<TrainingGoal> = {}): TrainingGoal => ({
  id: 'tg_test_1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'active',
  category: 'observation',
  title: '观察睡眠',
  startDate: '2026-05-17',
  targetWindowDays: 14,
  source: 'manual',
  ...overrides,
});

const makeCheckin = (goalId: string, targetDate: string, overrides: Partial<GoalCheckin> = {}): GoalCheckin => ({
  id: `gc_${targetDate}`,
  goalId,
  createdAt: targetDate + 'T12:00:00.000Z',
  targetDate,
  status: 'continue',
  ...overrides,
});

describe('observationPlanService', () => {
  describe('buildDraftFromExplanationCard', () => {
    it('creates draft from explanation card', () => {
      const card = makeCard();
      const draft = buildDraftFromExplanationCard(card, 14);
      expect(draft.contextType).toBe('sleep');
      expect(draft.windowDays).toBe(14);
      expect(draft.title).toContain('观察');
      expect(draft.title).toContain('睡眠');
      expect(draft.focusFields).toContain('sleep.duration');
      expect(draft.sourceExplanationId).toBe('ctx_test_1');
      expect(draft.sourceMetricId).toBe('hardness');
    });

    it('defaults to 14 day window', () => {
      const card = makeCard();
      const draft = buildDraftFromExplanationCard(card);
      expect(draft.windowDays).toBe(14);
    });
  });

  describe('buildDraftFromMetricId', () => {
    it('creates draft for metric', () => {
      const draft = buildDraftFromMetricId('stress', '压力水平', 'sleep', 7);
      expect(draft.windowDays).toBe(7);
      expect(draft.title).toContain('压力水平');
      expect(draft.sourceMetricId).toBe('stress');
    });
  });

  describe('draftToGoalInput', () => {
    it('converts draft to goal creation input', () => {
      const card = makeCard();
      const draft = buildDraftFromExplanationCard(card, 14);
      const input = draftToGoalInput(draft);
      expect(input.category).toBe('observation');
      expect(input.title).toBe(draft.title);
      expect(input.targetWindowDays).toBe(14);
      expect(input.source).toBe('manual');
      expect(input.description).toContain('睡眠');
      expect(input.description).toContain('sleep.duration');
      expect(input.linkedInsightId).toBe('ctx_test_1');
    });
  });

  describe('getObservationPlans', () => {
    it('filters to observation category only', () => {
      const goals = [
        makeGoal(),
        makeGoal({ id: 'tg_2', category: 'recovery' }),
        makeGoal({ id: 'tg_3', category: 'observation' }),
      ];
      expect(getObservationPlans(goals)).toHaveLength(2);
    });
  });

  describe('getActiveObservationPlans', () => {
    it('filters to active observation plans', () => {
      const goals = [
        makeGoal(),
        makeGoal({ id: 'tg_2', status: 'completed' }),
        makeGoal({ id: 'tg_3', status: 'archived' }),
      ];
      expect(getActiveObservationPlans(goals)).toHaveLength(1);
    });
  });

  describe('isObservationPlan', () => {
    it('returns true for observation category', () => {
      expect(isObservationPlan(makeGoal())).toBe(true);
    });
    it('returns false for other categories', () => {
      expect(isObservationPlan(makeGoal({ category: 'recovery' }))).toBe(false);
    });
  });

  describe('buildObservationReview', () => {
    it('builds factual review with checkins', () => {
      const goal = makeGoal();
      const checkins = [
        makeCheckin('tg_test_1', '2026-05-17'),
        makeCheckin('tg_test_1', '2026-05-18'),
        makeCheckin('tg_test_1', '2026-05-19'),
        makeCheckin('tg_test_1', '2026-05-20'),
      ];
      const review = buildObservationReview(goal, checkins);
      expect(review.totalDays).toBe(14);
      expect(review.checkinDays).toBe(4);
      expect(review.missingDays).toBe(10);
      expect(review.startDate).toBe('2026-05-17');
      expect(review.limitations.some((l) => l.includes('不做任何结论'))).toBe(true);
    });

    it('handles zero checkins', () => {
      const goal = makeGoal();
      const review = buildObservationReview(goal, []);
      expect(review.checkinDays).toBe(0);
      expect(review.missingDays).toBe(14);
      expect(review.limitations.some((l) => l.includes('签到天数较少'))).toBe(true);
    });

    it('ignores checkins from other goals', () => {
      const goal = makeGoal();
      const checkins = [
        makeCheckin('other_goal', '2026-05-17'),
        makeCheckin('tg_test_1', '2026-05-18'),
      ];
      const review = buildObservationReview(goal, checkins);
      expect(review.checkinDays).toBe(1);
    });
  });
});
