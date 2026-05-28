import type { PornUseEvent, AdultBehaviorScale5, AdultBehaviorEdging, AdultBehaviorEventStatus, AdultBehaviorEventSource } from '../../../domain';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';

// ── Draft creation ──────────────────────────────────────────────────────────

export interface PornUseEventDraftInput {
  startedAt: string;
  source?: AdultBehaviorEventSource;
  durationMinutes?: number | null;
  contentTypes?: PornUseEvent['contentTypes'];
  sourceTypes?: PornUseEvent['sourceTypes'];
  arousalLevel?: AdultBehaviorScale5 | null;
  ledToMasturbation?: boolean | null;
  ejaculated?: boolean | null;
  afterState?: PornUseEvent['afterState'];
  motives?: PornUseEvent['motives'];
  controlFeeling?: AdultBehaviorScale5 | null;
  exceededIntendedTime?: boolean | null;
  edging?: AdultBehaviorEdging;
  orgasmIntensity?: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  satisfaction?: AdultBehaviorScale5 | null;
  sleepImpact?: PornUseEvent['sleepImpact'];
  platformName?: string;
  tags?: string[];
  notes?: string;
  linkedMasturbationEventIds?: string[];
  linkedSexEventIds?: string[];
}

const generateId = (): string => {
  try { return `pu_${crypto.randomUUID()}`; } catch { return `pu_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }
};

export const createPornUseEventDraft = (input: PornUseEventDraftInput): PornUseEvent => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    startedAt: input.startedAt,
    targetDate: getActivityTargetDate(new Date(input.startedAt)),
    createdAt: now,
    updatedAt: now,
    status: 'completed',
    source: input.source ?? 'manual',
    durationMinutes: input.durationMinutes ?? null,
    contentTypes: input.contentTypes ?? [],
    sourceTypes: input.sourceTypes ?? [],
    arousalLevel: input.arousalLevel ?? null,
    ledToMasturbation: input.ledToMasturbation ?? null,
    ejaculated: input.ejaculated ?? null,
    afterState: input.afterState ?? [],
    motives: input.motives ?? [],
    controlFeeling: input.controlFeeling ?? null,
    exceededIntendedTime: input.exceededIntendedTime ?? null,
    edging: input.edging ?? 'none',
    orgasmIntensity: input.orgasmIntensity ?? null,
    fatigueAfter: input.fatigueAfter ?? null,
    satisfaction: input.satisfaction ?? null,
    sleepImpact: input.sleepImpact ?? null,
    platformName: input.platformName,
    tags: input.tags ?? [],
    notes: input.notes,
    linkedMasturbationEventIds: input.linkedMasturbationEventIds ?? [],
    linkedSexEventIds: input.linkedSexEventIds ?? [],
  };
};

// ── Hydrate ─────────────────────────────────────────────────────────────────

const dedupe = (arr: string[]): string[] => [...new Set(arr)];

const isScale5 = (v: unknown): v is AdultBehaviorScale5 =>
  typeof v === 'number' && v >= 1 && v <= 5 && Number.isInteger(v);

const isEdging = (v: unknown): v is AdultBehaviorEdging =>
  v === 'none' || v === 'single' || v === 'multiple';

const VALID_CONTENT_TYPES = new Set([
  'video', 'image', 'text', 'audio', 'live', 'chat', 'social_feed',
  'ai_generated', 'fantasy_reading', 'other',
]);

const VALID_SOURCE_TYPES = new Set([
  'porn_site', 'x_twitter', 'adult_forum', 'reddit_like', 'social_media',
  'chat_app', 'creator_platform', 'local_file', 'ai_chat', 'memory_fantasy', 'other',
]);

const VALID_AFTER_STATES = new Set([
  'satisfied', 'calm', 'tired', 'empty', 'anxious', 'guilty', 'more_aroused', 'neutral',
]);

const VALID_MOTIVES = new Set([
  'sexual_arousal', 'masturbation_aid', 'stress_relief', 'boredom', 'habit',
  'sleep_aid', 'partner_play', 'pre_sex_arousal', 'explore_preference',
  'emotional_escape', 'other',
]);

const VALID_SLEEP_IMPACT = new Set(['none', 'delayed_sleep', 'slept_better', 'woke_up', 'unknown']);

const validateEnumArray = <T extends string>(arr: unknown, validSet: Set<string>): T[] =>
  Array.isArray(arr) ? (arr as T[]).filter((v) => validSet.has(v)) : [];

/**
 * Hydrate a raw/partial PornUseEvent, filling missing fields with safe defaults.
 * Does NOT generate id — caller must provide it (e.g. from migration or import).
 */
export const hydratePornUseEvent = (raw: Partial<PornUseEvent> & { startedAt?: string }): PornUseEvent => {
  const startedAt = typeof raw.startedAt === 'string' ? raw.startedAt : '';
  const targetDate = raw.targetDate || (startedAt ? getActivityTargetDate(new Date(startedAt)) : '');
  const now = new Date().toISOString();

  return {
    id: raw.id ?? generateId(),
    startedAt,
    targetDate,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    status: (raw.status === 'in_progress' ? 'in_progress' : 'completed') as AdultBehaviorEventStatus,
    source: (typeof raw.source === 'string' ? raw.source : 'manual') as AdultBehaviorEventSource,
    durationMinutes: typeof raw.durationMinutes === 'number' && raw.durationMinutes >= 0 ? raw.durationMinutes : null,
    contentTypes: validateEnumArray(raw.contentTypes, VALID_CONTENT_TYPES),
    sourceTypes: validateEnumArray(raw.sourceTypes, VALID_SOURCE_TYPES),
    arousalLevel: isScale5(raw.arousalLevel) ? raw.arousalLevel : null,
    ledToMasturbation: typeof raw.ledToMasturbation === 'boolean' ? raw.ledToMasturbation : null,
    ejaculated: typeof raw.ejaculated === 'boolean' ? raw.ejaculated : null,
    afterState: validateEnumArray(raw.afterState, VALID_AFTER_STATES),
    motives: validateEnumArray(raw.motives, VALID_MOTIVES),
    controlFeeling: isScale5(raw.controlFeeling) ? raw.controlFeeling : null,
    exceededIntendedTime: typeof raw.exceededIntendedTime === 'boolean' ? raw.exceededIntendedTime : null,
    edging: isEdging(raw.edging) ? raw.edging : 'none',
    orgasmIntensity: isScale5(raw.orgasmIntensity) ? raw.orgasmIntensity : null,
    fatigueAfter: isScale5(raw.fatigueAfter) ? raw.fatigueAfter : null,
    satisfaction: isScale5(raw.satisfaction) ? raw.satisfaction : null,
    sleepImpact: VALID_SLEEP_IMPACT.has(raw.sleepImpact as string) ? raw.sleepImpact! : null,
    platformName: typeof raw.platformName === 'string' ? raw.platformName : undefined,
    tags: Array.isArray(raw.tags) ? dedupe(raw.tags) : [],
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    linkedMasturbationEventIds: Array.isArray(raw.linkedMasturbationEventIds) ? dedupe(raw.linkedMasturbationEventIds) : [],
    linkedSexEventIds: Array.isArray(raw.linkedSexEventIds) ? dedupe(raw.linkedSexEventIds) : [],
  };
};

// ── Normalize (sanitize existing valid event) ──────────────────────────────

export const normalizePornUseEvent = (event: PornUseEvent): PornUseEvent => ({
  ...event,
  contentTypes: validateEnumArray(event.contentTypes, VALID_CONTENT_TYPES),
  sourceTypes: validateEnumArray(event.sourceTypes, VALID_SOURCE_TYPES),
  afterState: validateEnumArray(event.afterState, VALID_AFTER_STATES),
  motives: validateEnumArray(event.motives, VALID_MOTIVES),
  tags: dedupe(event.tags ?? []),
  linkedMasturbationEventIds: dedupe(event.linkedMasturbationEventIds),
  linkedSexEventIds: dedupe(event.linkedSexEventIds),
  edging: isEdging(event.edging) ? event.edging : 'none',
});

// ── Validation ──────────────────────────────────────────────────────────────

export interface PornUseValidationError {
  field: string;
  message: string;
}

const REQUIRED_FIELDS: (keyof PornUseEvent)[] = [
  'id', 'startedAt', 'targetDate', 'createdAt', 'updatedAt', 'status', 'source',
];

const FORBIDDEN_FIELDS = [
  'actualUrl', 'thumbnailUrl', 'imageUrl', 'videoUrl', 'audioUrl',
  'actorName', 'creatorName', 'addicted', 'badPorn', 'explicitnessLevel',
  'contentRating', 'moderationFlag',
];

export const validatePornUseEvent = (event: PornUseEvent): PornUseValidationError[] => {
  const errors: PornUseValidationError[] = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!event[field]) {
      errors.push({ field, message: `缺少必要字段: ${field}` });
    }
  }

  // targetDate vs startedAt consistency
  if (event.startedAt && event.targetDate) {
    const expected = getActivityTargetDate(new Date(event.startedAt));
    if (event.targetDate !== expected) {
      errors.push({ field: 'targetDate', message: `targetDate=${event.targetDate} 与 startedAt 生理日 ${expected} 不一致` });
    }
  }

  // durationMinutes
  if (event.durationMinutes !== null && (typeof event.durationMinutes !== 'number' || event.durationMinutes < 0)) {
    errors.push({ field: 'durationMinutes', message: 'durationMinutes 必须为 null 或非负数字' });
  }

  // Scale5 fields
  const scaleFields: (keyof PornUseEvent)[] = [
    'arousalLevel', 'controlFeeling', 'orgasmIntensity', 'fatigueAfter', 'satisfaction',
  ];
  for (const field of scaleFields) {
    const val = event[field];
    if (val !== null && val !== undefined && !isScale5(val)) {
      errors.push({ field, message: `${field} 必须为 null 或 1-5` });
    }
  }

  // edging
  if (!isEdging(event.edging)) {
    errors.push({ field: 'edging', message: `edging 值无效: ${event.edging}` });
  }

  // Linked ids must be string arrays
  for (const field of ['linkedMasturbationEventIds', 'linkedSexEventIds'] as const) {
    if (!Array.isArray(event[field]) || event[field].some((v) => typeof v !== 'string')) {
      errors.push({ field, message: `${field} 必须是字符串数组` });
    }
  }

  // Forbidden fields (check for unexpected properties)
  for (const field of FORBIDDEN_FIELDS) {
    if ((event as unknown as Record<string, unknown>)[field] !== undefined) {
      errors.push({ field, message: `禁止字段不应出现在事件中: ${field}` });
    }
  }

  return errors;
};
