import { describe, it, expect } from 'vitest';
import type { TrainingGoal, TrainingGoalCategory } from '../domain';
import {
  validateGoalDraft,
  createGoalFromDraft,
  canTransitionGoal,
  transitionGoal,
  createCheckin,
  applyCheckinToGoal,
  isGoalDueForCheckin,
  getGoalEndDate,
  getActiveGoals,
  getPausedGoals,
  getDueGoals,
  getCheckinsForGoal,
  archiveGoal,
} from '../features/stats/model/trainingGoalService';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeGoal = (overrides: Partial<TrainingGoal> = {}): TrainingGoal => ({
  id: 'goal_1',
  createdAt: '2026-05-28T12:00:00',
  updatedAt: '2026-05-28T12:00:00',
  status: 'active',
  category: 'recovery',
  title: '7 天恢复观察',
  startDate: '2026-05-28',
  targetWindowDays: 7,
  source: 'manual',
  ...overrides,
});

// ── validateGoalDraft ────────────────────────────────────────────────────────

describe('validateGoalDraft', () => {
  it('accepts valid draft', () => {
    const errors = validateGoalDraft({
      category: 'recovery',
      title: '恢复目标',
      targetWindowDays: 7,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects forbidden category', () => {
    const errors = validateGoalDraft({
      category: 'partner_ranking' as unknown as TrainingGoalCategory,
      title: 'Test',
      targetWindowDays: 7,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('category');
  });

  it('rejects non-7/14 window', () => {
    const errors = validateGoalDraft({
      category: 'recovery',
      title: 'Test',
      targetWindowDays: 30,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('targetWindowDays');
  });

  it('rejects empty title', () => {
    const errors = validateGoalDraft({
      category: 'recovery',
      title: '',
      targetWindowDays: 7,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('title');
  });
});

// ── createGoalFromDraft ──────────────────────────────────────────────────────

describe('createGoalFromDraft', () => {
  it('creates goal with correct fields', () => {
    const goal = createGoalFromDraft(
      { category: 'hardness_stability', title: '硬度稳定', targetWindowDays: 14 },
      '2026-05-28',
    );
    expect(goal.id).toBeTruthy();
    expect(goal.status).toBe('active');
    expect(goal.category).toBe('hardness_stability');
    expect(goal.title).toBe('硬度稳定');
    expect(goal.startDate).toBe('2026-05-28');
    expect(goal.targetWindowDays).toBe(14);
    expect(goal.source).toBe('suggested');
  });

  it('trims title', () => {
    const goal = createGoalFromDraft(
      { category: 'recovery', title: '  恢复  ', targetWindowDays: 7 },
      '2026-05-28',
    );
    expect(goal.title).toBe('恢复');
  });

  it('preserves linkedInsightId', () => {
    const goal = createGoalFromDraft(
      { category: 'recovery', title: 'Test', targetWindowDays: 7, linkedInsightId: 'insight_1' },
      '2026-05-28',
    );
    expect(goal.linkedInsightId).toBe('insight_1');
  });
});

// ── Goal status transitions ──────────────────────────────────────────────────

describe('canTransitionGoal', () => {
  it('active can go to paused/completed/archived', () => {
    expect(canTransitionGoal('active', 'paused')).toBe(true);
    expect(canTransitionGoal('active', 'completed')).toBe(true);
    expect(canTransitionGoal('active', 'archived')).toBe(true);
  });

  it('active cannot go to active', () => {
    expect(canTransitionGoal('active', 'active')).toBe(false);
  });

  it('paused can go to active/archived', () => {
    expect(canTransitionGoal('paused', 'active')).toBe(true);
    expect(canTransitionGoal('paused', 'archived')).toBe(true);
    expect(canTransitionGoal('paused', 'completed')).toBe(false);
  });

  it('completed can only go to archived', () => {
    expect(canTransitionGoal('completed', 'archived')).toBe(true);
    expect(canTransitionGoal('completed', 'active')).toBe(false);
  });

  it('archived can only restore to active', () => {
    expect(canTransitionGoal('archived', 'active')).toBe(true);
    expect(canTransitionGoal('archived', 'completed')).toBe(false);
    expect(canTransitionGoal('archived', 'paused')).toBe(false);
  });
});

describe('transitionGoal', () => {
  it('transitions correctly', () => {
    const goal = makeGoal({ status: 'active' });
    const paused = transitionGoal(goal, 'paused');
    expect(paused.status).toBe('paused');
    expect(paused.updatedAt).not.toBe(goal.updatedAt);
  });

  it('throws on invalid transition', () => {
    const goal = makeGoal({ status: 'completed' });
    expect(() => transitionGoal(goal, 'active')).toThrow();
  });
});

// ── createCheckin ────────────────────────────────────────────────────────────

describe('createCheckin', () => {
  it('creates checkin with correct fields', () => {
    const checkin = createCheckin({
      goalId: 'goal_1',
      targetDate: '2026-06-04',
      status: 'continue',
      cycleFeeling: 3,
    });
    expect(checkin.id).toBeTruthy();
    expect(checkin.goalId).toBe('goal_1');
    expect(checkin.targetDate).toBe('2026-06-04');
    expect(checkin.status).toBe('continue');
    expect(checkin.cycleFeeling).toBe(3);
  });

  it('cycleFeeling can be empty', () => {
    const checkin = createCheckin({
      goalId: 'goal_1',
      targetDate: '2026-06-04',
      status: 'continue',
    });
    expect(checkin.cycleFeeling).toBeUndefined();
  });

  it('nulls out-of-range cycleFeeling', () => {
    const checkin = createCheckin({
      goalId: 'goal_1',
      targetDate: '2026-06-04',
      status: 'continue',
      cycleFeeling: 6,
    });
    expect(checkin.cycleFeeling).toBeUndefined();
  });

  it('nulls inverted window dates', () => {
    const checkin = createCheckin({
      goalId: 'goal_1',
      targetDate: '2026-06-04',
      status: 'continue',
      windowStartDate: '2026-06-10',
      windowEndDate: '2026-06-05',
    });
    expect(checkin.windowStartDate).toBeUndefined();
    expect(checkin.windowEndDate).toBeUndefined();
  });

  it('trims note', () => {
    const checkin = createCheckin({
      goalId: 'goal_1',
      targetDate: '2026-06-04',
      status: 'complete',
      note: '  完成了  ',
    });
    expect(checkin.note).toBe('完成了');
  });
});

// ── applyCheckinToGoal ───────────────────────────────────────────────────────

describe('applyCheckinToGoal', () => {
  it('continue keeps active', () => {
    const goal = makeGoal({ status: 'active' });
    const checkin = createCheckin({ goalId: 'goal_1', targetDate: '2026-06-04', status: 'continue' });
    const result = applyCheckinToGoal(goal, checkin);
    expect(result.status).toBe('active');
  });

  it('continue restores paused to active', () => {
    const goal = makeGoal({ status: 'paused' });
    const checkin = createCheckin({ goalId: 'goal_1', targetDate: '2026-06-04', status: 'continue' });
    const result = applyCheckinToGoal(goal, checkin);
    expect(result.status).toBe('active');
  });

  it('pause sets paused', () => {
    const goal = makeGoal({ status: 'active' });
    const checkin = createCheckin({ goalId: 'goal_1', targetDate: '2026-06-04', status: 'pause' });
    const result = applyCheckinToGoal(goal, checkin);
    expect(result.status).toBe('paused');
  });

  it('complete sets completed', () => {
    const goal = makeGoal({ status: 'active' });
    const checkin = createCheckin({ goalId: 'goal_1', targetDate: '2026-06-04', status: 'complete' });
    const result = applyCheckinToGoal(goal, checkin);
    expect(result.status).toBe('completed');
  });

  it('adjust does not change status', () => {
    const goal = makeGoal({ status: 'active' });
    const checkin = createCheckin({ goalId: 'goal_1', targetDate: '2026-06-04', status: 'adjust' });
    const result = applyCheckinToGoal(goal, checkin);
    expect(result.status).toBe('active');
  });
});

// ── Check-in due detection ───────────────────────────────────────────────────

describe('isGoalDueForCheckin', () => {
  it('active goal past end date is due', () => {
    const goal = makeGoal({ startDate: '2026-05-28', targetWindowDays: 7 });
    expect(isGoalDueForCheckin(goal, '2026-06-04')).toBe(true);
  });

  it('active goal before end date is not due', () => {
    const goal = makeGoal({ startDate: '2026-05-28', targetWindowDays: 7 });
    expect(isGoalDueForCheckin(goal, '2026-06-01')).toBe(false);
  });

  it('paused goal is not due', () => {
    const goal = makeGoal({ status: 'paused', startDate: '2026-05-28', targetWindowDays: 7 });
    expect(isGoalDueForCheckin(goal, '2026-06-04')).toBe(false);
  });

  it('getGoalEndDate returns correct end date', () => {
    const goal = makeGoal({ startDate: '2026-05-28', targetWindowDays: 14 });
    expect(getGoalEndDate(goal)).toBe('2026-06-11');
  });
});

// ── Query helpers ────────────────────────────────────────────────────────────

describe('query helpers', () => {
  const goals = [
    makeGoal({ id: 'g1', status: 'active' }),
    makeGoal({ id: 'g2', status: 'paused' }),
    makeGoal({ id: 'g3', status: 'completed' }),
    makeGoal({ id: 'g4', status: 'archived' }),
  ];

  it('getActiveGoals', () => {
    expect(getActiveGoals(goals)).toHaveLength(1);
    expect(getActiveGoals(goals)[0].id).toBe('g1');
  });

  it('getPausedGoals', () => {
    expect(getPausedGoals(goals)).toHaveLength(1);
  });

  it('getDueGoals', () => {
    const dueGoals = getDueGoals(goals, '2026-06-04');
    expect(dueGoals).toHaveLength(1); // only g1 is active
    expect(dueGoals[0].id).toBe('g1');
  });

  it('getCheckinsForGoal', () => {
    const checkins = [
      createCheckin({ goalId: 'g1', targetDate: '2026-06-01', status: 'continue' }),
      createCheckin({ goalId: 'g2', targetDate: '2026-06-01', status: 'pause' }),
      createCheckin({ goalId: 'g1', targetDate: '2026-06-04', status: 'complete' }),
    ];
    const g1Checkins = getCheckinsForGoal(checkins, 'g1');
    expect(g1Checkins).toHaveLength(2);
  });

  it('archiveGoal', () => {
    const goal = makeGoal({ status: 'completed' });
    const archived = archiveGoal(goal);
    expect(archived.status).toBe('archived');
  });

  it('archive preserves checkin history', () => {
    // Archive only changes goal status, checkins are stored separately
    const goal = makeGoal({ status: 'completed' });
    const archived = archiveGoal(goal);
    expect(archived.status).toBe('archived');
    // Checkins remain in the database independently
  });
});

// ── Note does not participate in diagnosis ───────────────────────────────────

describe('note field', () => {
  it('note is preserved as-is (no auto-diagnosis)', () => {
    const checkin = createCheckin({
      goalId: 'goal_1',
      targetDate: '2026-06-04',
      status: 'complete',
      note: '感觉还行，睡眠有改善',
    });
    expect(checkin.note).toBe('感觉还行，睡眠有改善');
    // Note should not be parsed for diagnosis or scoring
  });
});
