// ── Health Project Schedule Engine ────────────────────────────────────────────
// Pure function that determines if a health project is due on a given date.
// No Dexie, no React, no DOM.

import type { HealthProject, HealthProjectPlan, ScheduleType } from '../../../domain/types/healthProject';

/**
 * Check if a health project is due on a specific date.
 * Pure function — no Dexie, no React.
 */
export const isProjectDueOnDate = (
  project: HealthProject,
  plan: HealthProjectPlan,
  targetDate: string,
): boolean => {
  // Not active → not due
  if (project.status !== 'active') return false;

  // Before plan start → not due
  if (targetDate < plan.startDate) return false;

  // After plan end → not due
  if (plan.endDate && targetDate > plan.endDate) return false;

  // After project end → not due
  if (project.endDate && targetDate > project.endDate) return false;

  return matchesSchedule(plan.scheduleType, plan, targetDate);
};

const matchesSchedule = (
  scheduleType: ScheduleType,
  plan: HealthProjectPlan,
  targetDate: string,
): boolean => {
  switch (scheduleType) {
    case 'daily':
      return true;

    case 'as_needed':
      return true; // always available to record

    case 'every_other_day': {
      const start = new Date(plan.startDate + 'T12:00:00');
      const target = new Date(targetDate + 'T12:00:00');
      const diffDays = Math.round((target.getTime() - start.getTime()) / 86400000);
      return diffDays % 2 === 0;
    }

    case 'weekly': {
      if (!plan.weeklyDays || plan.weeklyDays.length === 0) return false;
      const dayOfWeek = new Date(targetDate + 'T12:00:00').getDay();
      return plan.weeklyDays.includes(dayOfWeek);
    }

    case 'consecutive_days': {
      if (!plan.consecutiveDays || plan.consecutiveDays <= 0) return false;
      const start = new Date(plan.startDate + 'T12:00:00');
      const target = new Date(targetDate + 'T12:00:00');
      const diffDays = Math.round((target.getTime() - start.getTime()) / 86400000);
      return diffDays >= 0 && diffDays < plan.consecutiveDays;
    }

    default:
      return false;
  }
};

/**
 * Get all due projects for a given date.
 * Pure function — no Dexie, no React.
 */
export const getDueProjects = (
  projects: HealthProject[],
  plans: HealthProjectPlan[],
  targetDate: string,
): Array<{ project: HealthProject; plan: HealthProjectPlan }> => {
  const result: Array<{ project: HealthProject; plan: HealthProjectPlan }> = [];
  for (const project of projects) {
    const plan = plans.find((p) => p.projectId === project.id);
    if (!plan) continue;
    if (isProjectDueOnDate(project, plan, targetDate)) {
      result.push({ project, plan });
    }
  }
  return result;
};

/**
 * Get execution stats for a project over a date range.
 * Pure function — no Dexie, no React.
 */
export const getProjectStats = (
  project: HealthProject,
  plan: HealthProjectPlan,
  logs: Array<{ projectId: string; targetDate: string; status: string }>,
  startDate: string,
  endDate: string,
): { dueDays: number; doneDays: number; skippedDays: number; missedDays: number } => {
  let dueDays = 0;
  const d = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  while (d <= end) {
    const dateStr = d.toISOString().slice(0, 10);
    if (isProjectDueOnDate(project, plan, dateStr)) {
      dueDays++;
    }
    d.setDate(d.getDate() + 1);
  }

  const projectLogs = logs.filter(
    (l) => l.projectId === project.id && l.targetDate >= startDate && l.targetDate <= endDate,
  );
  const doneDays = projectLogs.filter((l) => l.status === 'done').length;
  const skippedDays = projectLogs.filter((l) => l.status === 'skipped').length;
  const missedDays = dueDays - doneDays - skippedDays;

  return { dueDays, doneDays, skippedDays, missedDays: Math.max(0, missedDays) };
};
