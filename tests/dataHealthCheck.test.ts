import { describe, expect, it } from 'vitest';
import type {
  CycleEvent,
  GoalCheckin,
  HealthProject,
  HealthProjectLog,
  HealthProjectPlan,
  PartnerProfile,
  PregnancyEvent,
  SexEvent,
  TrainingGoal,
} from '../domain';
import { checkDataHealth } from '../utils/dataHealthCheck';

const makePartner = (overrides: Partial<PartnerProfile> = {}): PartnerProfile => ({
  id: 'partner_1',
  name: 'A',
  sensitiveSpots: [],
  stimulationPreferences: [],
  likedPositions: [],
  dislikedActs: [],
  socialTags: [],
  milestones: {},
  ...overrides,
});

const makeSexEvent = (overrides: Partial<SexEvent> = {}): SexEvent => ({
  id: 'sex_1',
  startedAt: '2026-06-01T21:00:00',
  targetDate: '2026-06-01',
  createdAt: '2026-06-01T21:00:00',
  updatedAt: '2026-06-01T21:00:00',
  status: 'completed',
  source: 'manual',
  durationMinutes: 30,
  partnerIds: ['partner_1'],
  interactionTypes: ['penetrative'],
  penetration: 'yes',
  hardnessLevel: 4,
  ejaculated: true,
  ejaculationContext: 'inside_condom',
  orgasmIntensity: 4,
  satisfaction: 4,
  afterState: ['calm'],
  pornInvolved: false,
  linkedPornUseEventIds: [],
  linkedMasturbationEventIds: [],
  ...overrides,
});

const makeGoal = (overrides: Partial<TrainingGoal> = {}): TrainingGoal => ({
  id: 'goal_1',
  createdAt: '2026-06-01T08:00:00',
  updatedAt: '2026-06-01T08:00:00',
  status: 'active',
  category: 'recovery',
  title: '恢复目标',
  startDate: '2026-06-01',
  targetWindowDays: 7,
  source: 'manual',
  ...overrides,
});

const makeCheckin = (overrides: Partial<GoalCheckin> = {}): GoalCheckin => ({
  id: 'checkin_1',
  goalId: 'goal_1',
  createdAt: '2026-06-02T08:00:00',
  targetDate: '2026-06-02',
  status: 'continue',
  ...overrides,
});

const makeHealthProject = (overrides: Partial<HealthProject> = {}): HealthProject => ({
  id: 'hp_1',
  type: 'supplement',
  name: '镁',
  status: 'active',
  startDate: '2026-06-01',
  createdAt: '2026-06-01T08:00:00',
  updatedAt: '2026-06-01T08:00:00',
  ...overrides,
});

const makeHealthProjectPlan = (overrides: Partial<HealthProjectPlan> = {}): HealthProjectPlan => ({
  id: 'hpp_1',
  projectId: 'hp_1',
  scheduleType: 'daily',
  startDate: '2026-06-01',
  ...overrides,
});

const makeHealthProjectLog = (overrides: Partial<HealthProjectLog> = {}): HealthProjectLog => ({
  id: 'hpl_1',
  projectId: 'hp_1',
  targetDate: '2026-06-02',
  status: 'done',
  ...overrides,
});

const makeCycleEvent = (overrides: Partial<CycleEvent> = {}): CycleEvent => ({
  id: 'cycle_1',
  partnerId: 'partner_1',
  date: '2026-06-01',
  kind: 'period_start',
  source: 'manual',
  ...overrides,
});

const makePregnancyEvent = (overrides: Partial<PregnancyEvent> = {}): PregnancyEvent => ({
  id: 'preg_1',
  partnerId: 'partner_1',
  date: '2026-06-01',
  kind: 'pregnancy_test',
  source: 'manual',
  ...overrides,
});

describe('checkDataHealth full-table coverage', () => {
  it('detects orphan relations across event tables without changing score basis', () => {
    const baseReport = checkDataHealth({ logs: [], partners: [makePartner()] });
    const report = checkDataHealth({
      logs: [],
      partners: [makePartner()],
      sexEvents: [makeSexEvent({ partnerIds: ['partner_1', 'missing_partner'] })],
      cycleEvents: [makeCycleEvent({ partnerId: 'missing_partner' })],
      pregnancyEvents: [makePregnancyEvent({ partnerId: 'missing_partner' })],
      trainingGoals: [makeGoal()],
      goalCheckins: [makeCheckin({ goalId: 'missing_goal' })],
      healthProjects: [makeHealthProject()],
      healthProjectPlans: [makeHealthProjectPlan({ projectId: 'missing_project' })],
      healthProjectLogs: [makeHealthProjectLog({ projectId: 'missing_project' })],
    });

    expect(report.score).toBe(baseReport.score);
    expect(report.scores).toEqual(baseReport.scores);
    expect(report.canCleanOrphanRelations).toBe(true);
    expect(report.stats.orphanRelations.total).toBe(6);
    expect(report.stats.orphanRelations.byTable).toMatchObject({
      sex_events: 1,
      cycle_events: 1,
      pregnancy_events: 1,
      goal_checkins: 1,
      health_project_plans: 1,
      health_project_logs: 1,
    });
    expect(report.stats.tableStats.sex_events.brokenRelations).toBe(1);
    expect(report.stats.tableStats.goal_checkins.brokenRelations).toBe(1);
    expect(report.issues.filter((issue) => issue.type === 'relation')).toHaveLength(6);
  });

  it('uses SexEvent.partnerIds as the partner relation field', () => {
    const report = checkDataHealth({
      logs: [],
      partners: [makePartner()],
      sexEvents: [makeSexEvent({ partnerIds: ['partner_1'] })],
    });

    expect(report.stats.orphanRelations.total).toBe(0);
    expect(report.issues).toHaveLength(0);
    expect(report.stats.tableStats.sex_events.records).toBe(1);
  });
});
