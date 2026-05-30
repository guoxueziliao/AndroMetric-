import { describe, it, expect } from 'vitest';
import type { HealthProject, HealthProjectPlan } from '../domain/types/healthProject';
import { isProjectDueOnDate, getDueProjects, getProjectStats } from '../features/daily-log/model/healthProjectSchedule';

const makeProject = (overrides: Partial<HealthProject> = {}): HealthProject => ({
  id: 'hp_1',
  type: 'supplement',
  name: '维生素D',
  status: 'active',
  startDate: '2026-05-01',
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-01T12:00:00.000Z',
  ...overrides,
});

const makePlan = (overrides: Partial<HealthProjectPlan> = {}): HealthProjectPlan => ({
  id: 'hpp_1',
  projectId: 'hp_1',
  scheduleType: 'daily',
  startDate: '2026-05-01',
  dose: 2000,
  unit: 'IU',
  timeLabels: ['morning'],
  ...overrides,
});

describe('healthProjectSchedule', () => {
  describe('isProjectDueOnDate', () => {
    it('returns true for daily project on any date after start', () => {
      const project = makeProject();
      const plan = makePlan();
      expect(isProjectDueOnDate(project, plan, '2026-05-01')).toBe(true);
      expect(isProjectDueOnDate(project, plan, '2026-05-15')).toBe(true);
    });

    it('returns false before start date', () => {
      const project = makeProject();
      const plan = makePlan();
      expect(isProjectDueOnDate(project, plan, '2026-04-30')).toBe(false);
    });

    it('returns false for paused project', () => {
      const project = makeProject({ status: 'paused' });
      const plan = makePlan();
      expect(isProjectDueOnDate(project, plan, '2026-05-05')).toBe(false);
    });

    it('returns false after project end date', () => {
      const project = makeProject({ endDate: '2026-05-10' });
      const plan = makePlan();
      expect(isProjectDueOnDate(project, plan, '2026-05-11')).toBe(false);
    });

    it('returns false after plan end date', () => {
      const project = makeProject();
      const plan = makePlan({ endDate: '2026-05-10' });
      expect(isProjectDueOnDate(project, plan, '2026-05-11')).toBe(false);
    });

    it('every_other_day alternates correctly', () => {
      const project = makeProject();
      const plan = makePlan({ scheduleType: 'every_other_day', startDate: '2026-05-01' });
      expect(isProjectDueOnDate(project, plan, '2026-05-01')).toBe(true); // day 0
      expect(isProjectDueOnDate(project, plan, '2026-05-02')).toBe(false); // day 1
      expect(isProjectDueOnDate(project, plan, '2026-05-03')).toBe(true); // day 2
      expect(isProjectDueOnDate(project, plan, '2026-05-04')).toBe(false); // day 3
    });

    it('weekly checks day of week', () => {
      // 2026-05-01 is Friday (5)
      const project = makeProject();
      const plan = makePlan({ scheduleType: 'weekly', weeklyDays: [1, 3, 5] }); // Mon, Wed, Fri
      expect(isProjectDueOnDate(project, plan, '2026-05-01')).toBe(true); // Fri
      expect(isProjectDueOnDate(project, plan, '2026-05-02')).toBe(false); // Sat
      expect(isProjectDueOnDate(project, plan, '2026-05-04')).toBe(true); // Mon
    });

    it('consecutive_days limits to N days', () => {
      const project = makeProject();
      const plan = makePlan({ scheduleType: 'consecutive_days', consecutiveDays: 5, startDate: '2026-05-01' });
      expect(isProjectDueOnDate(project, plan, '2026-05-01')).toBe(true); // day 0
      expect(isProjectDueOnDate(project, plan, '2026-05-05')).toBe(true); // day 4
      expect(isProjectDueOnDate(project, plan, '2026-05-06')).toBe(false); // day 5
    });

    it('as_needed is always due when active', () => {
      const project = makeProject();
      const plan = makePlan({ scheduleType: 'as_needed' });
      expect(isProjectDueOnDate(project, plan, '2026-05-01')).toBe(true);
      expect(isProjectDueOnDate(project, plan, '2026-12-31')).toBe(true);
    });
  });

  describe('getDueProjects', () => {
    it('returns only due projects', () => {
      const projects = [
        makeProject({ id: 'hp_1' }),
        makeProject({ id: 'hp_2', status: 'paused' }),
      ];
      const plans = [
        makePlan({ id: 'hpp_1', projectId: 'hp_1' }),
        makePlan({ id: 'hpp_2', projectId: 'hp_2' }),
      ];
      const result = getDueProjects(projects, plans, '2026-05-05');
      expect(result).toHaveLength(1);
      expect(result[0].project.id).toBe('hp_1');
    });
  });

  describe('getProjectStats', () => {
    it('counts done and skipped correctly', () => {
      const project = makeProject();
      const plan = makePlan();
      const logs = [
        { projectId: 'hp_1', targetDate: '2026-05-01', status: 'done' },
        { projectId: 'hp_1', targetDate: '2026-05-02', status: 'done' },
        { projectId: 'hp_1', targetDate: '2026-05-03', status: 'skipped' },
      ];
      const stats = getProjectStats(project, plan, logs, '2026-05-01', '2026-05-05');
      expect(stats.dueDays).toBe(5);
      expect(stats.doneDays).toBe(2);
      expect(stats.skippedDays).toBe(1);
      expect(stats.missedDays).toBe(2);
    });
  });
});
