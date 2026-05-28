import type { PornUseEvent, MasturbationEvent, SexEvent } from '../../../domain';

export type TimelineEventType = 'porn_use' | 'masturbation' | 'sex';

export interface TimelineEntry {
  id: string;
  type: TimelineEventType;
  startedAt: string;
  time: string; // HH:mm extracted
  summary: string;
  details: string[];
  linkedIds: string[];
  linkedType: TimelineEventType | null;
}

const TIME_RE = /T(\d{2}:\d{2})/;

const extractTime = (iso: string): string => {
  const m = TIME_RE.exec(iso);
  return m ? m[1] : '';
};

export const buildPornUseSummary = (e: PornUseEvent): { summary: string; details: string[] } => {
  const summary = `色情使用${e.durationMinutes ? ` · ${e.durationMinutes}分` : ''}`;
  const details: string[] = [];
  if (e.contentTypes.length > 0) details.push(`内容: ${e.contentTypes.join(', ')}`);
  if (e.sourceTypes.length > 0) details.push(`来源: ${e.sourceTypes.join(', ')}`);
  if (e.arousalLevel) details.push(`唤起: ${e.arousalLevel}/5`);
  if (e.ledToMasturbation === true) details.push('进入自慰');
  if (e.ejaculated === true) details.push('射精');
  if (e.afterState.length > 0) details.push(`事后: ${e.afterState.join(', ')}`);
  return { summary, details };
};

export const buildMasturbationSummary = (e: MasturbationEvent): { summary: string; details: string[] } => {
  const summary = `自慰${e.durationMinutes ? ` · ${e.durationMinutes}分` : ''}`;
  const details: string[] = [];
  if (e.ejaculated === true) details.push('射精');
  if (e.orgasmIntensity) details.push(`高潮强度: ${e.orgasmIntensity}/5`);
  if (e.hardnessLevel) details.push(`硬度: ${e.hardnessLevel}/5`);
  if (e.arousalLevel) details.push(`唤起: ${e.arousalLevel}/5`);
  if (e.edging !== 'none') details.push(`边缘控制: ${e.edging}`);
  if (e.satisfaction) details.push(`满意度: ${e.satisfaction}/5`);
  if (e.afterState.length > 0) details.push(`事后: ${e.afterState.join(', ')}`);
  return { summary, details };
};

export const buildSexSummary = (e: SexEvent): { summary: string; details: string[] } => {
  const summary = `性爱${e.durationMinutes ? ` · ${e.durationMinutes}分` : ''}`;
  const details: string[] = [];
  if (e.penetration === 'yes') details.push('插入');
  if (e.ejaculated === true) details.push('射精');
  if (e.hardnessLevel) details.push(`硬度: ${e.hardnessLevel}/5`);
  if (e.orgasmIntensity) details.push(`高潮强度: ${e.orgasmIntensity}/5`);
  if (e.satisfaction) details.push(`满意度: ${e.satisfaction}/5`);
  if (e.pornInvolved === true) details.push('有色情参与');
  if (e.afterState.length > 0) details.push(`事后: ${e.afterState.join(', ')}`);
  return { summary, details };
};

/**
 * Build a sorted timeline of adult behavior events for a single physiological day.
 * Pure function: no Dexie, no React, no DOM.
 */
export const buildDayTimeline = (input: {
  pornUseEvents: PornUseEvent[];
  masturbationEvents: MasturbationEvent[];
  sexEvents: SexEvent[];
  targetDate: string;
}): TimelineEntry[] => {
  const entries: TimelineEntry[] = [];

  for (const e of input.pornUseEvents) {
    if (e.targetDate !== input.targetDate) continue;
    const { summary, details } = buildPornUseSummary(e);
    entries.push({
      id: e.id,
      type: 'porn_use',
      startedAt: e.startedAt,
      time: extractTime(e.startedAt),
      summary,
      details,
      linkedIds: [...e.linkedMasturbationEventIds, ...e.linkedSexEventIds],
      linkedType: null,
    });
  }

  for (const e of input.masturbationEvents) {
    if (e.targetDate !== input.targetDate) continue;
    const { summary, details } = buildMasturbationSummary(e);
    entries.push({
      id: e.id,
      type: 'masturbation',
      startedAt: e.startedAt,
      time: extractTime(e.startedAt),
      summary,
      details,
      linkedIds: [...e.linkedPornUseEventIds, ...e.linkedSexEventIds],
      linkedType: null,
    });
  }

  for (const e of input.sexEvents) {
    if (e.targetDate !== input.targetDate) continue;
    const { summary, details } = buildSexSummary(e);
    entries.push({
      id: e.id,
      type: 'sex',
      startedAt: e.startedAt,
      time: extractTime(e.startedAt),
      summary,
      details,
      linkedIds: [...e.linkedPornUseEventIds, ...e.linkedMasturbationEventIds],
      linkedType: null,
    });
  }

  // Sort by startedAt ascending
  entries.sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  // Mark linked type context for each entry
  const allIds = new Set(entries.map((e) => e.id));
  for (const entry of entries) {
    entry.linkedType = entry.linkedIds.some((lid) => allIds.has(lid))
      ? entries.find((e) => entry.linkedIds.includes(e.id))?.type ?? null
      : null;
  }

  return entries;
};

/**
 * Count how many of the entry's linked ids point to events that don't exist in the timeline.
 */
export const countOrphanLinks = (entry: TimelineEntry, allEntries: TimelineEntry[]): number => {
  const allIds = new Set(allEntries.map((e) => e.id));
  return entry.linkedIds.filter((lid) => !allIds.has(lid)).length;
};
