// ── Experience Card Types & Service ──────────────────────────────────────────
// Read-only derived types for experience cards.
// Stored as GoalCheckin with structured note field — no new schema.

import type { GoalCheckin } from '../../../domain';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExperienceCardDraft {
  sourceGoalId: string;
  sourceGoalTitle: string;
  sourceMetricId?: string;
  contextTypes: string[];
  dateRange: { startDate: string; endDate: string };
  title: string;
  factSummary: string;
  userReflection: string;
  limitations: string[];
}

export interface ExperienceCard {
  checkinId: string;
  goalId: string;
  goalTitle: string;
  savedAt: string;
  sourceMetricId?: string;
  contextTypes: string[];
  dateRange: { startDate: string; endDate: string };
  title: string;
  factSummary: string;
  userReflection: string;
  limitations: string[];
}

// ── Note structure (stored in GoalCheckin.note as JSON) ──────────────────────

interface ExperienceNoteData {
  type: 'experience_card';
  title: string;
  factSummary: string;
  userReflection: string;
  contextTypes: string[];
  sourceMetricId?: string;
  limitations: string[];
}

// ── Conversion ───────────────────────────────────────────────────────────────

const EXPERIENCE_NOTE_PREFIX = '{"type":"experience_card"';

/**
 * Check if a GoalCheckin is an experience card.
 */
export const isExperienceCard = (checkin: GoalCheckin): boolean =>
  typeof checkin.note === 'string' && checkin.note.startsWith(EXPERIENCE_NOTE_PREFIX);

/**
 * Build a fact summary from observation review data.
 * Pure function — no Dexie, no React.
 */
export const buildFactSummary = (
  goalTitle: string,
  windowDays: number,
  checkinDays: number,
  missingDays: number,
): string => {
  const parts = [`${goalTitle}，${windowDays} 天观察窗口。`];
  parts.push(`记录 ${checkinDays} 天，缺失 ${missingDays} 天。`);
  if (missingDays > windowDays * 0.5) {
    parts.push('记录缺口较多，仅供参考。');
  }
  return parts.join(' ');
};

/**
 * Build default limitations for an experience card.
 * Pure function — no Dexie, no React.
 */
export const buildDefaultLimitations = (
  checkinDays: number,
  totalDays: number,
): string[] => {
  const limitations: string[] = [];
  if (checkinDays < 3) limitations.push('记录天数较少，经验可能不完整。');
  if (checkinDays < totalDays * 0.5) limitations.push('记录覆盖率偏低。');
  limitations.push('这是个人主观经验，不代表规律。');
  return limitations;
};

/**
 * Create a GoalCheckin from an experience card draft.
 * The note field stores structured JSON with all card data.
 */
export const draftToCheckin = (draft: ExperienceCardDraft): GoalCheckin => {
  const noteData: ExperienceNoteData = {
    type: 'experience_card',
    title: draft.title,
    factSummary: draft.factSummary,
    userReflection: draft.userReflection,
    contextTypes: draft.contextTypes,
    sourceMetricId: draft.sourceMetricId,
    limitations: draft.limitations,
  };

  return {
    id: `gc_exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    goalId: draft.sourceGoalId,
    createdAt: new Date().toISOString(),
    targetDate: draft.dateRange.endDate,
    status: 'complete',
    note: JSON.stringify(noteData),
  };
};

/**
 * Parse a GoalCheckin into an ExperienceCard.
 * Returns null if the checkin is not an experience card.
 */
export const parseExperienceCard = (
  checkin: GoalCheckin,
  goalTitle: string,
): ExperienceCard | null => {
  if (!isExperienceCard(checkin)) return null;

  try {
    const data: ExperienceNoteData = JSON.parse(checkin.note!);
    return {
      checkinId: checkin.id,
      goalId: checkin.goalId,
      goalTitle,
      savedAt: checkin.createdAt,
      sourceMetricId: data.sourceMetricId,
      contextTypes: data.contextTypes ?? [],
      dateRange: {
        startDate: checkin.windowStartDate ?? '',
        endDate: checkin.windowEndDate ?? checkin.targetDate,
      },
      title: data.title,
      factSummary: data.factSummary,
      userReflection: data.userReflection,
      limitations: data.limitations ?? [],
    };
  } catch {
    return null;
  }
};

/**
 * Get all experience cards from goals and checkins.
 * Pure function — no Dexie, no React.
 */
export const getExperienceCards = (
  goals: Array<{ id: string; title: string }>,
  checkins: GoalCheckin[],
): ExperienceCard[] => {
  const goalTitleMap = new Map(goals.map((g) => [g.id, g.title]));
  return checkins
    .filter(isExperienceCard)
    .map((c) => parseExperienceCard(c, goalTitleMap.get(c.goalId) ?? ''))
    .filter((c): c is ExperienceCard => c != null)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
};

// ── Filtering ────────────────────────────────────────────────────────────────

export interface ExperienceCardFilter {
  contextType?: string;
  metricId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Filter experience cards by criteria.
 * Pure function — no Dexie, no React.
 */
export const filterExperienceCards = (
  cards: ExperienceCard[],
  filter: ExperienceCardFilter,
): ExperienceCard[] =>
  cards.filter((card) => {
    if (filter.contextType && !card.contextTypes.includes(filter.contextType)) return false;
    if (filter.metricId && card.sourceMetricId !== filter.metricId) return false;
    if (filter.dateFrom && card.dateRange.endDate < filter.dateFrom) return false;
    if (filter.dateTo && card.dateRange.startDate > filter.dateTo) return false;
    return true;
  });
