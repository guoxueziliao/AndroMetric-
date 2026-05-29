import { describe, it, expect } from 'vitest';
import type { TrainingGoal, GoalCheckin } from '../domain';
import {
  restoreGoal,
  getCompletedGoals,
  getArchivedGoals,
  getGoalsByCategory,
  getOrphanCheckins,
  getStatusCounts,
  getCategoryDistribution,
  getCheckinCountPerGoal,
  getGoalsWithCheckins,
  getRecentFocusCategories,
} from '../features/stats/model/trainingGoalService';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeGoal = (overrides: Partial<TrainingGoal> = {}): TrainingGoal => ({
  id: 'tg_test',
  title: 'Test Goal',
  category: 'recovery',
  status: 'active',
  targetWindowDays: 7,
  startDate: '2026-05-15',
  updatedAt: '2026-05-20T12:00:00.000Z',
  createdAt: '2026-05-15T12:00:00.000Z',
  source: 'suggested',
  ...overrides,
});

const makeCheckin = (overrides: Partial<GoalCheckin> = {}): GoalCheckin => ({
  id: 'gc_test',
  goalId: 'tg_test',
  targetDate: '2026-05-22',
  status: 'continue',
  createdAt: '2026-05-22T12:00:00.000Z',
  ...overrides,
});

// ── restoreGoal ──────────────────────────────────────────────────────────────

describe('restoreGoal', () => {
  it('restores archived goal to active', () => {
    const goal = makeGoal({ id: 'g1', status: 'archived' });
    const restored = restoreGoal(goal);
    expect(restored.status).toBe('active');
    expect(restored.id).toBe('g1');
  });

  it('returns same goal if not archived', () => {
    const goal = makeGoal({ id: 'g1', status: 'active' });
    const result = restoreGoal(goal);
    expect(result).toBe(goal);
  });
});

// ── getCompletedGoals / getArchivedGoals ──────────────────────────────────────

describe('getCompletedGoals', () => {
  it('filters to completed goals', () => {
    const goals = [
      makeGoal({ id: 'g1', status: 'active' }),
      makeGoal({ id: 'g2', status: 'completed' }),
      makeGoal({ id: 'g3', status: 'completed' }),
      makeGoal({ id: 'g4', status: 'archived' }),
    ];
    expect(getCompletedGoals(goals)).toHaveLength(2);
    expect(getCompletedGoals(goals).map((g) => g.id)).toEqual(['g2', 'g3']);
  });
});

describe('getArchivedGoals', () => {
  it('filters to archived goals', () => {
    const goals = [
      makeGoal({ id: 'g1', status: 'active' }),
      makeGoal({ id: 'g2', status: 'archived' }),
    ];
    expect(getArchivedGoals(goals)).toHaveLength(1);
    expect(getArchivedGoals(goals)[0].id).toBe('g2');
  });
});

// ── getGoalsByCategory ───────────────────────────────────────────────────────

describe('getGoalsByCategory', () => {
  it('filters by category', () => {
    const goals = [
      makeGoal({ id: 'g1', category: 'recovery' }),
      makeGoal({ id: 'g2', category: 'hardness_stability' }),
      makeGoal({ id: 'g3', category: 'recovery' }),
    ];
    expect(getGoalsByCategory(goals, 'recovery')).toHaveLength(2);
    expect(getGoalsByCategory(goals, 'hardness_stability')).toHaveLength(1);
    expect(getGoalsByCategory(goals, 'record_quality')).toHaveLength(0);
  });
});

// ── getOrphanCheckins ────────────────────────────────────────────────────────

describe('getOrphanCheckins', () => {
  it('finds checkins with no matching goal', () => {
    const goals = [makeGoal({ id: 'g1' })];
    const checkins = [
      makeCheckin({ id: 'c1', goalId: 'g1' }),
      makeCheckin({ id: 'c2', goalId: 'g_nonexistent' }),
      makeCheckin({ id: 'c3', goalId: 'g1' }),
    ];
    const orphans = getOrphanCheckins(checkins, goals);
    expect(orphans).toHaveLength(1);
    expect(orphans[0].id).toBe('c2');
  });

  it('returns empty when all checkins match goals', () => {
    const goals = [makeGoal({ id: 'g1' })];
    const checkins = [makeCheckin({ id: 'c1', goalId: 'g1' })];
    expect(getOrphanCheckins(checkins, goals)).toHaveLength(0);
  });

  it('returns empty when no checkins', () => {
    const goals = [makeGoal({ id: 'g1' })];
    expect(getOrphanCheckins([], goals)).toHaveLength(0);
  });
});

// ── getStatusCounts ──────────────────────────────────────────────────────────

describe('getStatusCounts', () => {
  it('counts goals by status', () => {
    const goals = [
      makeGoal({ id: 'g1', status: 'active' }),
      makeGoal({ id: 'g2', status: 'active' }),
      makeGoal({ id: 'g3', status: 'paused' }),
      makeGoal({ id: 'g4', status: 'completed' }),
      makeGoal({ id: 'g5', status: 'archived' }),
      makeGoal({ id: 'g6', status: 'archived' }),
      makeGoal({ id: 'g7', status: 'archived' }),
    ];
    const counts = getStatusCounts(goals);
    expect(counts.active).toBe(2);
    expect(counts.paused).toBe(1);
    expect(counts.completed).toBe(1);
    expect(counts.archived).toBe(3);
  });

  it('returns all zeros for empty array', () => {
    const counts = getStatusCounts([]);
    expect(counts.active).toBe(0);
    expect(counts.paused).toBe(0);
    expect(counts.completed).toBe(0);
    expect(counts.archived).toBe(0);
  });
});

// ── getCategoryDistribution ──────────────────────────────────────────────────

describe('getCategoryDistribution', () => {
  it('counts goals by category', () => {
    const goals = [
      makeGoal({ id: 'g1', category: 'recovery' }),
      makeGoal({ id: 'g2', category: 'recovery' }),
      makeGoal({ id: 'g3', category: 'hardness_stability' }),
      makeGoal({ id: 'g4', category: 'record_quality' }),
    ];
    const dist = getCategoryDistribution(goals);
    expect(dist.recovery).toBe(2);
    expect(dist.hardness_stability).toBe(1);
    expect(dist.record_quality).toBe(1);
    expect(dist.sex_performance_stability).toBeUndefined();
  });

  it('returns empty object for no goals', () => {
    expect(getCategoryDistribution([])).toEqual({});
  });
});

// ── getCheckinCountPerGoal ───────────────────────────────────────────────────

describe('getCheckinCountPerGoal', () => {
  it('counts checkins for a specific goal', () => {
    const checkins = [
      makeCheckin({ id: 'c1', goalId: 'g1' }),
      makeCheckin({ id: 'c2', goalId: 'g1' }),
      makeCheckin({ id: 'c3', goalId: 'g2' }),
    ];
    expect(getCheckinCountPerGoal(checkins, 'g1')).toBe(2);
    expect(getCheckinCountPerGoal(checkins, 'g2')).toBe(1);
    expect(getCheckinCountPerGoal(checkins, 'g_none')).toBe(0);
  });
});

// ── getGoalsWithCheckins ─────────────────────────────────────────────────────

describe('getGoalsWithCheckins', () => {
  it('filters to goals that have at least one checkin', () => {
    const goals = [
      makeGoal({ id: 'g1' }),
      makeGoal({ id: 'g2' }),
      makeGoal({ id: 'g3' }),
    ];
    const checkins = [
      makeCheckin({ id: 'c1', goalId: 'g1' }),
      makeCheckin({ id: 'c2', goalId: 'g3' }),
    ];
    const result = getGoalsWithCheckins(goals, checkins);
    expect(result).toHaveLength(2);
    expect(result.map((g) => g.id)).toEqual(expect.arrayContaining(['g1', 'g3']));
  });

  it('returns empty when no checkins', () => {
    const goals = [makeGoal({ id: 'g1' })];
    expect(getGoalsWithCheckins(goals, [])).toHaveLength(0);
  });
});

// ── getRecentFocusCategories ─────────────────────────────────────────────────

describe('getRecentFocusCategories', () => {
  it('returns most recent categories up to count', () => {
    const goals = [
      makeGoal({ id: 'g1', category: 'recovery', updatedAt: '2026-05-01T00:00:00Z' }),
      makeGoal({ id: 'g2', category: 'hardness_stability', updatedAt: '2026-05-15T00:00:00Z' }),
      makeGoal({ id: 'g3', category: 'recovery', updatedAt: '2026-05-20T00:00:00Z' }),
      makeGoal({ id: 'g4', category: 'record_quality', updatedAt: '2026-05-25T00:00:00Z' }),
    ];
    const focus = getRecentFocusCategories(goals, 3);
    expect(focus).toContain('record_quality');
    expect(focus).toContain('recovery');
    expect(focus.length).toBeLessThanOrEqual(3);
  });

  it('deduplicates categories', () => {
    const goals = [
      makeGoal({ id: 'g1', category: 'recovery', updatedAt: '2026-05-20T00:00:00Z' }),
      makeGoal({ id: 'g2', category: 'recovery', updatedAt: '2026-05-15T00:00:00Z' }),
    ];
    const focus = getRecentFocusCategories(goals, 4);
    expect(focus).toEqual(['recovery']);
  });

  it('returns empty for no goals', () => {
    expect(getRecentFocusCategories([], 4)).toEqual([]);
  });
});
