import type { MasturbationEvent, MasturbationRecordDetails, AdultBehaviorScale5, AdultBehaviorEdging, AdultBehaviorEventStatus, AdultBehaviorEventSource } from '../../../domain';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';

// ── Draft creation ──────────────────────────────────────────────────────────

export interface MasturbationEventDraftInput {
  startedAt: string;
  source?: AdultBehaviorEventSource;
  durationMinutes?: number | null;
  ejaculated?: boolean | null;
  orgasmIntensity?: AdultBehaviorScale5 | null;
  edging?: AdultBehaviorEdging;
  hardnessLevel?: AdultBehaviorScale5 | null;
  arousalLevel?: AdultBehaviorScale5 | null;
  stimulationSources?: MasturbationEvent['stimulationSources'];
  afterState?: MasturbationEvent['afterState'];
  satisfaction?: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  sleepImpact?: MasturbationEvent['sleepImpact'];
  controlFeeling?: AdultBehaviorScale5 | null;
  exceededIntendedTime?: boolean | null;
  sessionCount?: number;
  ejaculationCount?: number | null;
  tags?: string[];
  notes?: string;
  linkedPornUseEventIds?: string[];
  linkedSexEventIds?: string[];
}

const generateId = (): string => {
  try { return `mb_${crypto.randomUUID()}`; } catch { return `mb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }
};

export const createMasturbationEventDraft = (input: MasturbationEventDraftInput): MasturbationEvent => {
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
    ejaculated: input.ejaculated ?? null,
    orgasmIntensity: input.orgasmIntensity ?? null,
    edging: input.edging ?? 'none',
    hardnessLevel: input.hardnessLevel ?? null,
    arousalLevel: input.arousalLevel ?? null,
    stimulationSources: input.stimulationSources ?? [],
    afterState: input.afterState ?? [],
    satisfaction: input.satisfaction ?? null,
    fatigueAfter: input.fatigueAfter ?? null,
    sleepImpact: input.sleepImpact ?? null,
    controlFeeling: input.controlFeeling ?? null,
    exceededIntendedTime: input.exceededIntendedTime ?? null,
    sessionCount: input.sessionCount ?? 1,
    ejaculationCount: input.ejaculationCount ?? null,
    tags: input.tags ?? [],
    notes: input.notes,
    linkedPornUseEventIds: input.linkedPornUseEventIds ?? [],
    linkedSexEventIds: input.linkedSexEventIds ?? [],
  };
};

// ── Hydrate ─────────────────────────────────────────────────────────────────

const dedupe = (arr: string[]): string[] => [...new Set(arr)];

const isScale5 = (v: unknown): v is AdultBehaviorScale5 =>
  typeof v === 'number' && v >= 1 && v <= 5 && Number.isInteger(v);

const isEdging = (v: unknown): v is AdultBehaviorEdging =>
  v === 'none' || v === 'single' || v === 'multiple';

const VALID_STIMULATION_SOURCES = new Set([
  'porn', 'fantasy', 'memory', 'sexting', 'partner_media',
  'ai_chat', 'touch_only', 'toy', 'other',
]);

const VALID_AFTER_STATES = new Set([
  'satisfied', 'calm', 'tired', 'empty', 'anxious', 'guilty', 'more_aroused', 'neutral',
]);

const VALID_SLEEP_IMPACT = new Set(['none', 'delayed_sleep', 'slept_better', 'woke_up', 'unknown']);

const validateEnumArray = <T extends string>(arr: unknown, validSet: Set<string>): T[] =>
  Array.isArray(arr) ? (arr as T[]).filter((v) => validSet.has(v)) : [];

export const hydrateMasturbationEvent = (raw: Partial<MasturbationEvent> & { startedAt?: string }): MasturbationEvent => {
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
    ejaculated: typeof raw.ejaculated === 'boolean' ? raw.ejaculated : null,
    orgasmIntensity: isScale5(raw.orgasmIntensity) ? raw.orgasmIntensity : null,
    edging: isEdging(raw.edging) ? raw.edging : 'none',
    hardnessLevel: isScale5(raw.hardnessLevel) ? raw.hardnessLevel : null,
    arousalLevel: isScale5(raw.arousalLevel) ? raw.arousalLevel : null,
    stimulationSources: validateEnumArray(raw.stimulationSources, VALID_STIMULATION_SOURCES),
    afterState: validateEnumArray(raw.afterState, VALID_AFTER_STATES),
    satisfaction: isScale5(raw.satisfaction) ? raw.satisfaction : null,
    fatigueAfter: isScale5(raw.fatigueAfter) ? raw.fatigueAfter : null,
    sleepImpact: VALID_SLEEP_IMPACT.has(raw.sleepImpact as string) ? raw.sleepImpact! : null,
    controlFeeling: isScale5(raw.controlFeeling) ? raw.controlFeeling : null,
    exceededIntendedTime: typeof raw.exceededIntendedTime === 'boolean' ? raw.exceededIntendedTime : null,
    sessionCount: typeof raw.sessionCount === 'number' && raw.sessionCount >= 1 ? Math.floor(raw.sessionCount) : 1,
    ejaculationCount: typeof raw.ejaculationCount === 'number' && raw.ejaculationCount >= 0 ? raw.ejaculationCount : null,
    tags: Array.isArray(raw.tags) ? dedupe(raw.tags) : [],
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    linkedPornUseEventIds: Array.isArray(raw.linkedPornUseEventIds) ? dedupe(raw.linkedPornUseEventIds) : [],
    linkedSexEventIds: Array.isArray(raw.linkedSexEventIds) ? dedupe(raw.linkedSexEventIds) : [],
  };
};

// ── Normalize ───────────────────────────────────────────────────────────────

export const normalizeMasturbationEvent = (event: MasturbationEvent): MasturbationEvent => ({
  ...event,
  stimulationSources: validateEnumArray(event.stimulationSources, VALID_STIMULATION_SOURCES),
  afterState: validateEnumArray(event.afterState, VALID_AFTER_STATES),
  tags: dedupe(event.tags ?? []),
  linkedPornUseEventIds: dedupe(event.linkedPornUseEventIds),
  linkedSexEventIds: dedupe(event.linkedSexEventIds),
  edging: isEdging(event.edging) ? event.edging : 'none',
});

// ── Validation ──────────────────────────────────────────────────────────────

export interface MasturbationValidationError {
  field: string;
  message: string;
}

const REQUIRED_FIELDS: (keyof MasturbationEvent)[] = [
  'id', 'startedAt', 'targetDate', 'createdAt', 'updatedAt', 'status', 'source',
];

export const validateMasturbationEvent = (event: MasturbationEvent): MasturbationValidationError[] => {
  const errors: MasturbationValidationError[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!event[field]) {
      errors.push({ field, message: `缺少必要字段: ${field}` });
    }
  }

  if (event.startedAt && event.targetDate) {
    const expected = getActivityTargetDate(new Date(event.startedAt));
    if (event.targetDate !== expected) {
      errors.push({ field: 'targetDate', message: `targetDate=${event.targetDate} 与 startedAt 生理日 ${expected} 不一致` });
    }
  }

  if (event.durationMinutes !== null && (typeof event.durationMinutes !== 'number' || event.durationMinutes < 0)) {
    errors.push({ field: 'durationMinutes', message: 'durationMinutes 必须为 null 或非负数字' });
  }

  if (typeof event.sessionCount !== 'number' || event.sessionCount < 1 || !Number.isInteger(event.sessionCount)) {
    errors.push({ field: 'sessionCount', message: 'sessionCount 必须为正整数' });
  }

  if (event.ejaculationCount !== null && (typeof event.ejaculationCount !== 'number' || event.ejaculationCount < 0 || !Number.isInteger(event.ejaculationCount))) {
    errors.push({ field: 'ejaculationCount', message: 'ejaculationCount 必须为 null 或非负整数' });
  }

  const scaleFields: (keyof MasturbationEvent)[] = [
    'orgasmIntensity', 'hardnessLevel', 'arousalLevel', 'satisfaction', 'fatigueAfter', 'controlFeeling',
  ];
  for (const field of scaleFields) {
    const val = event[field];
    if (val !== null && val !== undefined && !isScale5(val)) {
      errors.push({ field, message: `${field} 必须为 null 或 1-5` });
    }
  }

  if (!isEdging(event.edging)) {
    errors.push({ field: 'edging', message: `edging 值无效: ${event.edging}` });
  }

  for (const field of ['linkedPornUseEventIds', 'linkedSexEventIds'] as const) {
    if (!Array.isArray(event[field]) || event[field].some((v) => typeof v !== 'string')) {
      errors.push({ field, message: `${field} 必须是字符串数组` });
    }
  }

  return errors;
};

// ── Old record adapter ──────────────────────────────────────────────────────

/**
 * Map an old MasturbationRecordDetails (from LogEntry.masturbation[]) to a MasturbationEvent.
 * Does NOT generate PornUseEvent from contentItems/assets/materials.
 */
export const mapMasturbationRecordToEvent = (record: MasturbationRecordDetails, logDate: string): MasturbationEvent => {
  const startedAt = record.startTime
    ? `${logDate}T${record.startTime}:00`
    : `${logDate}T23:00:00`;
  const targetDate = getActivityTargetDate(new Date(startedAt));
  const now = new Date().toISOString();

  const edging: AdultBehaviorEdging =
    record.edging === 'single' || record.edging === 'multiple' ? record.edging : 'none';

  return {
    id: record.id || generateId(),
    startedAt,
    targetDate,
    createdAt: now,
    updatedAt: now,
    status: record.status === 'inProgress' ? 'in_progress' : 'completed',
    source: 'migration',
    durationMinutes: typeof record.duration === 'number' && record.duration > 0 ? record.duration : null,
    ejaculated: typeof record.ejaculation === 'boolean' ? record.ejaculation : null,
    orgasmIntensity: isScale5(record.orgasmIntensity) ? record.orgasmIntensity : null,
    edging,
    hardnessLevel: null,
    arousalLevel: null,
    stimulationSources: [],
    afterState: [],
    satisfaction: isScale5(record.satisfactionLevel) ? record.satisfactionLevel : null,
    sessionCount: 1,
    ejaculationCount: record.ejaculation ? 1 : null,
    tags: [],
    notes: typeof record.notes === 'string' ? record.notes : undefined,
    linkedPornUseEventIds: [],
    linkedSexEventIds: [],
  };
};
