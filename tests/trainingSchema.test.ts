import { describe, it, expect } from 'vitest';
import type { TrainingGoal, GoalCheckin } from '../domain';
import {
  isTrainingGoalCategory,
  isTrainingGoalStatus,
  isTrainingGoalSource,
  isGoalCheckinStatus,
  ALLOWED_GOAL_WINDOWS,
} from '../domain';
import {
  normalizeTrainingGoals,
  normalizeGoalCheckins,
} from '../core/storage/importMerge';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeGoal = (overrides: Partial<TrainingGoal> = {}): TrainingGoal => ({
  id: 'goal_1',
  createdAt: '2026-05-28T12:00:00',
  updatedAt: '2026-05-28T12:00:00',
  status: 'active',
  category: 'recovery',
  title: '恢复目标',
  startDate: '2026-05-28',
  targetWindowDays: 7,
  source: 'manual',
  ...overrides,
});

const makeCheckin = (overrides: Partial<GoalCheckin> = {}): GoalCheckin => ({
  id: 'checkin_1',
  goalId: 'goal_1',
  createdAt: '2026-05-29T12:00:00',
  targetDate: '2026-05-29',
  status: 'continue',
  ...overrides,
});

// ── Domain type guards ───────────────────────────────────────────────────────

describe('TrainingGoal type guards', () => {
  it('isTrainingGoalCategory accepts all allowed categories', () => {
    const allowed = [
      'record_quality', 'recovery', 'hardness_stability',
      'sex_performance_stability', 'ejaculation_control_observation',
      'relationship_communication',
    ];
    for (const cat of allowed) {
      expect(isTrainingGoalCategory(cat)).toBe(true);
    }
  });

  it('isTrainingGoalCategory rejects forbidden categories', () => {
    const forbidden = [
      'sex_count_challenge', 'ejaculation_count_challenge', 'partner_count_challenge',
      'porn_duration_challenge', 'porn_stimulation_challenge', 'longest_sex_challenge',
      'partner_ranking', 'partner_score', 'unknown', '',
    ];
    for (const cat of forbidden) {
      expect(isTrainingGoalCategory(cat)).toBe(false);
    }
  });

  it('isTrainingGoalStatus accepts allowed statuses', () => {
    for (const s of ['active', 'paused', 'completed', 'archived']) {
      expect(isTrainingGoalStatus(s)).toBe(true);
    }
    expect(isTrainingGoalStatus('deleted')).toBe(false);
  });

  it('isTrainingGoalSource accepts allowed sources', () => {
    for (const s of ['manual', 'suggested']) {
      expect(isTrainingGoalSource(s)).toBe(true);
    }
    expect(isTrainingGoalSource('auto')).toBe(false);
  });

  it('ALLOWED_GOAL_WINDOWS only contains 7 and 14', () => {
    expect(ALLOWED_GOAL_WINDOWS.has(7)).toBe(true);
    expect(ALLOWED_GOAL_WINDOWS.has(14)).toBe(true);
    expect(ALLOWED_GOAL_WINDOWS.has(30)).toBe(false);
    expect(ALLOWED_GOAL_WINDOWS.has(60)).toBe(false);
  });

  it('isGoalCheckinStatus accepts allowed statuses', () => {
    for (const s of ['continue', 'pause', 'complete', 'adjust']) {
      expect(isGoalCheckinStatus(s)).toBe(true);
    }
    expect(isGoalCheckinStatus('cancel')).toBe(false);
  });
});

// ── normalizeTrainingGoals ───────────────────────────────────────────────────

describe('normalizeTrainingGoals', () => {
  it('accepts valid goals', () => {
    const goals = [makeGoal(), makeGoal({ id: 'goal_2', category: 'hardness_stability' })];
    const result = normalizeTrainingGoals(goals);
    expect(result.goals).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);
  });

  it('skips forbidden category', () => {
    const goals = [makeGoal({ category: 'partner_ranking' as unknown as TrainingGoal['category'] })];
    const result = normalizeTrainingGoals(goals);
    expect(result.goals).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].kind).toBe('forbidden_category');
  });

  it('skips non-7/14 window', () => {
    const goals = [makeGoal({ targetWindowDays: 30 })];
    const result = normalizeTrainingGoals(goals);
    expect(result.goals).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].kind).toBe('invalid_window');
  });

  it('skips unknown goal status', () => {
    const goals = [makeGoal({ status: 'deleted' as unknown as TrainingGoal['status'] })];
    const result = normalizeTrainingGoals(goals);
    expect(result.goals).toHaveLength(0);
    expect(result.warnings[0].kind).toBe('invalid_goal_status');
  });

  it('skips unknown goal source', () => {
    const goals = [makeGoal({ source: 'auto' as unknown as TrainingGoal['source'] })];
    const result = normalizeTrainingGoals(goals);
    expect(result.goals).toHaveLength(0);
    expect(result.warnings[0].kind).toBe('invalid_goal_source');
  });

  it('does NOT auto-correct forbidden categories', () => {
    const goals = [makeGoal({ category: 'sex_count_challenge' as unknown as TrainingGoal['category'] })];
    const result = normalizeTrainingGoals(goals);
    expect(result.goals).toHaveLength(0);
    // Should skip, not correct
  });
});

// ── normalizeGoalCheckins ────────────────────────────────────────────────────

describe('normalizeGoalCheckins', () => {
  const validGoalIds = new Set(['goal_1']);

  it('accepts valid checkins', () => {
    const checkins = [makeCheckin(), makeCheckin({ id: 'checkin_2', status: 'pause' })];
    const result = normalizeGoalCheckins(checkins, validGoalIds);
    expect(result.checkins).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);
  });

  it('skips unknown checkin status', () => {
    const checkins = [makeCheckin({ status: 'cancel' as unknown as GoalCheckin['status'] })];
    const result = normalizeGoalCheckins(checkins, validGoalIds);
    expect(result.checkins).toHaveLength(0);
    expect(result.warnings[0].kind).toBe('invalid_checkin_status');
  });

  it('keeps orphan checkin with warning', () => {
    const checkins = [makeCheckin({ goalId: 'nonexistent' })];
    const result = normalizeGoalCheckins(checkins, validGoalIds);
    expect(result.checkins).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].kind).toBe('orphan_checkin');
  });

  it('nulls out-of-range cycleFeeling', () => {
    const checkins = [makeCheckin({ cycleFeeling: 6 })];
    const result = normalizeGoalCheckins(checkins, validGoalIds);
    expect(result.checkins).toHaveLength(1);
    expect(result.checkins[0].cycleFeeling).toBeUndefined();
    expect(result.warnings[0].kind).toBe('invalid_cycle_feeling');
  });

  it('accepts valid cycleFeeling', () => {
    const checkins = [makeCheckin({ cycleFeeling: 3 })];
    const result = normalizeGoalCheckins(checkins, validGoalIds);
    expect(result.checkins[0].cycleFeeling).toBe(3);
    expect(result.warnings).toHaveLength(0);
  });

  it('nulls inverted window dates', () => {
    const checkins = [makeCheckin({ windowStartDate: '2026-05-30', windowEndDate: '2026-05-28' })];
    const result = normalizeGoalCheckins(checkins, validGoalIds);
    expect(result.checkins[0].windowStartDate).toBeUndefined();
    expect(result.checkins[0].windowEndDate).toBeUndefined();
    expect(result.warnings[0].kind).toBe('inverted_window');
  });

  it('accepts valid window dates', () => {
    const checkins = [makeCheckin({ windowStartDate: '2026-05-28', windowEndDate: '2026-06-03' })];
    const result = normalizeGoalCheckins(checkins, validGoalIds);
    expect(result.checkins[0].windowStartDate).toBe('2026-05-28');
    expect(result.checkins[0].windowEndDate).toBe('2026-06-03');
  });
});

// ── Integration: round-trip scenarios ────────────────────────────────────────

describe('Training data round-trip scenarios', () => {
  it('active goal with no checkin', () => {
    const goals = [makeGoal({ status: 'active' })];
    const result = normalizeTrainingGoals(goals);
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].status).toBe('active');
  });

  it('completed goal with multiple checkins', () => {
    const goals = [makeGoal({ status: 'completed' })];
    const checkins = [
      makeCheckin({ id: 'c1', status: 'continue' }),
      makeCheckin({ id: 'c2', status: 'continue' }),
      makeCheckin({ id: 'c3', status: 'complete' }),
    ];
    const goalResult = normalizeTrainingGoals(goals);
    const checkinResult = normalizeGoalCheckins(checkins, new Set(goalResult.goals.map((g) => g.id)));
    expect(goalResult.goals).toHaveLength(1);
    expect(checkinResult.checkins).toHaveLength(3);
  });

  it('archived goal retains historical checkins', () => {
    const goals = [makeGoal({ status: 'archived' })];
    const checkins = [makeCheckin({ id: 'c1', status: 'complete' })];
    const goalResult = normalizeTrainingGoals(goals);
    const checkinResult = normalizeGoalCheckins(checkins, new Set(goalResult.goals.map((g) => g.id)));
    expect(goalResult.goals).toHaveLength(1);
    expect(checkinResult.checkins).toHaveLength(1);
  });

  it('mixed valid and invalid data', () => {
    const goals = [
      makeGoal({ id: 'g1' }),
      makeGoal({ id: 'g2', category: 'partner_ranking' as unknown as TrainingGoal['category'] }),
      makeGoal({ id: 'g3', targetWindowDays: 30 }),
    ];
    const checkins = [
      makeCheckin({ id: 'c1', goalId: 'g1' }),
      makeCheckin({ id: 'c2', goalId: 'g2' }), // orphan after g2 is filtered
      makeCheckin({ id: 'c3', goalId: 'g1', cycleFeeling: 0 }),
    ];
    const goalResult = normalizeTrainingGoals(goals);
    expect(goalResult.goals).toHaveLength(1);
    expect(goalResult.warnings).toHaveLength(2);

    const checkinResult = normalizeGoalCheckins(checkins, new Set(goalResult.goals.map((g) => g.id)));
    expect(checkinResult.checkins).toHaveLength(3); // orphan kept
    expect(checkinResult.warnings.filter((w) => w.kind === 'orphan_checkin')).toHaveLength(1);
    expect(checkinResult.warnings.filter((w) => w.kind === 'invalid_cycle_feeling')).toHaveLength(1);
  });

  it('empty data returns empty results', () => {
    const goalResult = normalizeTrainingGoals([]);
    const checkinResult = normalizeGoalCheckins([], new Set());
    expect(goalResult.goals).toHaveLength(0);
    expect(goalResult.warnings).toHaveLength(0);
    expect(checkinResult.checkins).toHaveLength(0);
    expect(checkinResult.warnings).toHaveLength(0);
  });
});
