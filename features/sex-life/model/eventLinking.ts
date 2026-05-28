import type { PornUseEvent, MasturbationEvent, SexEvent } from '../../../domain';

// ── Types ───────────────────────────────────────────────────────────────────

export type AdultEventType = 'porn_use' | 'masturbation' | 'sex';

export interface LinkCandidate {
  id: string;
  type: AdultEventType;
  startedAt: string;
  targetDate: string;
  summary: string;
  alreadyLinked: boolean;
}

export type AnyAdultEvent = PornUseEvent | MasturbationEvent | SexEvent;

// ── Candidate computation ───────────────────────────────────────────────────

const HOURS_6_MS = 6 * 60 * 60 * 1000;

const getLinkedIds = (event: AnyAdultEvent): string[] => {
  const e = event as unknown as Record<string, unknown>;
  return [
    ...((e.linkedMasturbationEventIds as string[]) ?? []),
    ...((e.linkedSexEventIds as string[]) ?? []),
    ...((e.linkedPornUseEventIds as string[]) ?? []),
  ];
};

const getEventSummary = (event: AnyAdultEvent, type: AdultEventType): string => {
  switch (type) {
    case 'porn_use': {
      const pu = event as PornUseEvent;
      const parts: string[] = [];
      if (pu.durationMinutes) parts.push(`${pu.durationMinutes}分`);
      if (pu.contentTypes.length > 0) parts.push(pu.contentTypes.join('/'));
      if (pu.ejaculated === true) parts.push('射精');
      return parts.join(' · ') || '色情使用';
    }
    case 'masturbation': {
      const mb = event as MasturbationEvent;
      const parts: string[] = [];
      if (mb.durationMinutes) parts.push(`${mb.durationMinutes}分`);
      if (mb.ejaculated === true) parts.push('射精');
      if (mb.orgasmIntensity) parts.push(`强度${mb.orgasmIntensity}`);
      return parts.join(' · ') || '自慰';
    }
    case 'sex': {
      const sx = event as SexEvent;
      const parts: string[] = [];
      if (sx.durationMinutes) parts.push(`${sx.durationMinutes}分`);
      if (sx.ejaculated === true) parts.push('射精');
      if (sx.penetration === 'yes') parts.push('插入');
      return parts.join(' · ') || '性爱';
    }
  }
};

/**
 * Compute candidate events for linking to a source event.
 *
 * Rules:
 * - Same targetDate OR within ±6 hours of startedAt
 * - Sorted: same targetDate first, then by time distance, then by type relevance
 * - Already linked events marked as alreadyLinked=true
 * - Excludes the source event itself
 */
export const computeLinkCandidates = (input: {
  sourceEvent: AnyAdultEvent;
  sourceType: AdultEventType;
  pornUseEvents: PornUseEvent[];
  masturbationEvents: MasturbationEvent[];
  sexEvents: SexEvent[];
  preferredTypes?: AdultEventType[];
}): LinkCandidate[] => {
  const { sourceEvent, sourceType, pornUseEvents, masturbationEvents, sexEvents, preferredTypes } = input;
  const linkedIds = new Set(getLinkedIds(sourceEvent));
  const sourceStartedAt = new Date(sourceEvent.startedAt).getTime();

  const allCandidates: LinkCandidate[] = [];

  const addCandidates = (events: AnyAdultEvent[], type: AdultEventType) => {
    for (const ev of events) {
      if (ev.id === sourceEvent.id) continue;
      const evTime = new Date(ev.startedAt).getTime();
      const sameDate = ev.targetDate === sourceEvent.targetDate;
      const within6h = Math.abs(evTime - sourceStartedAt) <= HOURS_6_MS;
      if (!sameDate && !within6h) continue;

      allCandidates.push({
        id: ev.id,
        type,
        startedAt: ev.startedAt,
        targetDate: ev.targetDate,
        summary: getEventSummary(ev, type),
        alreadyLinked: linkedIds.has(ev.id),
      });
    }
  };

  // Add in preferred type order
  const typeOrder = preferredTypes ?? (sourceType === 'porn_use'
    ? ['masturbation' as const, 'sex' as const]
    : sourceType === 'masturbation'
      ? ['porn_use' as const, 'sex' as const]
      : ['porn_use' as const, 'masturbation' as const]);

  for (const t of typeOrder) {
    if (t === 'porn_use') addCandidates(pornUseEvents, 'porn_use');
    else if (t === 'masturbation') addCandidates(masturbationEvents, 'masturbation');
    else addCandidates(sexEvents, 'sex');
  }

  // Add remaining types not in preferred order
  const preferredSet = new Set(typeOrder);
  for (const t of (['porn_use', 'masturbation', 'sex'] as AdultEventType[])) {
    if (!preferredSet.has(t)) {
      if (t === 'porn_use') addCandidates(pornUseEvents, 'porn_use');
      else if (t === 'masturbation') addCandidates(masturbationEvents, 'masturbation');
      else addCandidates(sexEvents, 'sex');
    }
  }

  // Sort: already linked first, then same targetDate, then time distance, then type priority
  allCandidates.sort((a, b) => {
    if (a.alreadyLinked !== b.alreadyLinked) return a.alreadyLinked ? -1 : 1;
    const aSameDate = a.targetDate === sourceEvent.targetDate;
    const bSameDate = b.targetDate === sourceEvent.targetDate;
    if (aSameDate !== bSameDate) return aSameDate ? -1 : 1;
    const aDist = Math.abs(new Date(a.startedAt).getTime() - sourceStartedAt);
    const bDist = Math.abs(new Date(b.startedAt).getTime() - sourceStartedAt);
    if (aDist !== bDist) return aDist - bDist;
    const aPriority = typeOrder.indexOf(a.type);
    const bPriority = typeOrder.indexOf(b.type);
    return (aPriority === -1 ? Infinity : aPriority) - (bPriority === -1 ? Infinity : bPriority);
  });

  return allCandidates;
};

// ── Link / unlink operations ────────────────────────────────────────────────

const LINK_FIELD_MAP: Record<string, Record<AdultEventType, string>> = {
  porn_use: { masturbation: 'linkedMasturbationEventIds', sex: 'linkedSexEventIds', porn_use: '' },
  masturbation: { porn_use: 'linkedPornUseEventIds', sex: 'linkedSexEventIds', masturbation: '' },
  sex: { porn_use: 'linkedPornUseEventIds', masturbation: 'linkedMasturbationEventIds', sex: '' },
};

/**
 * Add a bidirectional link between two events.
 * Returns [updatedSource, updatedTarget] — caller must save both.
 */
export const addLink = (
  source: AnyAdultEvent,
  sourceType: AdultEventType,
  target: AnyAdultEvent,
  targetType: AdultEventType,
): [AnyAdultEvent, AnyAdultEvent] => {
  const sourceField = LINK_FIELD_MAP[sourceType]?.[targetType];
  const targetField = LINK_FIELD_MAP[targetType]?.[sourceType];
  if (!sourceField || !targetField) return [source, target];

  const sourceIds = (source as unknown as Record<string, unknown>)[sourceField] as string[] ?? [];
  const targetIds = (target as unknown as Record<string, unknown>)[targetField] as string[] ?? [];

  const updatedSource = {
    ...source,
    [sourceField]: sourceIds.includes(target.id) ? sourceIds : [...sourceIds, target.id],
  };
  const updatedTarget = {
    ...target,
    [targetField]: targetIds.includes(source.id) ? targetIds : [...targetIds, source.id],
  };

  return [updatedSource as unknown as AnyAdultEvent, updatedTarget as unknown as AnyAdultEvent];
};

/**
 * Remove a bidirectional link between two events.
 * Returns [updatedSource, updatedTarget] — caller must save both.
 */
export const removeLink = (
  source: AnyAdultEvent,
  sourceType: AdultEventType,
  target: AnyAdultEvent,
  targetType: AdultEventType,
): [AnyAdultEvent, AnyAdultEvent] => {
  const sourceField = LINK_FIELD_MAP[sourceType]?.[targetType];
  const targetField = LINK_FIELD_MAP[targetType]?.[sourceType];
  if (!sourceField || !targetField) return [source, target];

  const sourceIds = (source as unknown as Record<string, unknown>)[sourceField] as string[] ?? [];
  const targetIds = (target as unknown as Record<string, unknown>)[targetField] as string[] ?? [];

  const updatedSource = {
    ...source,
    [sourceField]: sourceIds.filter((id) => id !== target.id),
  };
  const updatedTarget = {
    ...target,
    [targetField]: targetIds.filter((id) => id !== source.id),
  };

  return [updatedSource as unknown as AnyAdultEvent, updatedTarget as unknown as AnyAdultEvent];
};

/**
 * Remove orphan linked ids from an event (ids that don't exist in the event pool).
 * Returns the cleaned event.
 */
export const cleanOrphanLinks = (
  event: AnyAdultEvent,
  sourceType: AdultEventType,
  allEventIds: Set<string>,
): AnyAdultEvent => {
  const updated = { ...(event as unknown as Record<string, unknown>) };
  for (const field of Object.keys(LINK_FIELD_MAP[sourceType] ?? {})) {
    const linkField = LINK_FIELD_MAP[sourceType][field as AdultEventType];
    if (!linkField) continue;
    const ids = updated[linkField] as string[] | undefined;
    if (Array.isArray(ids)) {
      updated[linkField] = ids.filter((id) => allEventIds.has(id));
    }
  }
  return updated as unknown as AnyAdultEvent;
};
