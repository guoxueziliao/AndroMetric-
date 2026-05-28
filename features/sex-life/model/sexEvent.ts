import type { SexEvent, SexRecordDetails, AdultBehaviorScale5, AdultBehaviorEventStatus, AdultBehaviorEventSource, SexPenetration, SexContraception } from '../../../domain';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';

// ── Draft creation ──────────────────────────────────────────────────────────

export interface SexEventDraftInput {
  startedAt: string;
  source?: AdultBehaviorEventSource;
  durationMinutes?: number | null;
  partnerIds?: string[];
  interactionTypes?: SexEvent['interactionTypes'];
  penetration?: SexPenetration;
  hardnessLevel?: AdultBehaviorScale5 | null;
  ejaculated?: boolean | null;
  ejaculationContext?: SexEvent['ejaculationContext'];
  orgasmIntensity?: AdultBehaviorScale5 | null;
  satisfaction?: AdultBehaviorScale5 | null;
  afterState?: SexEvent['afterState'];
  pornInvolved?: boolean | null;
  pornUseContext?: SexEvent['pornUseContext'];
  arousalLevel?: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  recoveryFeeling?: AdultBehaviorScale5 | null;
  contraception?: SexContraception | null;
  riskFlags?: SexEvent['riskFlags'];
  sleepImpact?: SexEvent['sleepImpact'];
  tags?: string[];
  notes?: string;
  linkedPornUseEventIds?: string[];
  linkedMasturbationEventIds?: string[];
}

const generateId = (): string => {
  try { return `sx_${crypto.randomUUID()}`; } catch { return `sx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }
};

export const createSexEventDraft = (input: SexEventDraftInput): SexEvent => {
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
    partnerIds: input.partnerIds ?? [],
    interactionTypes: input.interactionTypes ?? [],
    penetration: input.penetration ?? 'unknown',
    hardnessLevel: input.hardnessLevel ?? null,
    ejaculated: input.ejaculated ?? null,
    ejaculationContext: input.ejaculationContext ?? null,
    orgasmIntensity: input.orgasmIntensity ?? null,
    satisfaction: input.satisfaction ?? null,
    afterState: input.afterState ?? [],
    pornInvolved: input.pornInvolved ?? null,
    pornUseContext: input.pornUseContext ?? [],
    arousalLevel: input.arousalLevel ?? null,
    fatigueAfter: input.fatigueAfter ?? null,
    recoveryFeeling: input.recoveryFeeling ?? null,
    contraception: input.contraception ?? null,
    riskFlags: input.riskFlags ?? [],
    sleepImpact: input.sleepImpact ?? null,
    tags: input.tags ?? [],
    notes: input.notes,
    linkedPornUseEventIds: input.linkedPornUseEventIds ?? [],
    linkedMasturbationEventIds: input.linkedMasturbationEventIds ?? [],
  };
};

// ── Hydrate ─────────────────────────────────────────────────────────────────

const dedupe = (arr: string[]): string[] => [...new Set(arr)];

const isScale5 = (v: unknown): v is AdultBehaviorScale5 =>
  typeof v === 'number' && v >= 1 && v <= 5 && Number.isInteger(v);

const VALID_INTERACTION_TYPES = new Set([
  'penetrative', 'oral', 'manual', 'mutual_masturbation', 'toy', 'video_sex', 'other',
]);

const VALID_AFTER_STATES = new Set([
  'satisfied', 'calm', 'tired', 'empty', 'anxious', 'guilty', 'more_aroused', 'neutral',
]);

const VALID_PENETRATION = new Set(['yes', 'no', 'unknown']);

const VALID_EJACULATION_CONTEXT = new Set([
  'inside_condom', 'inside_no_condom', 'outside', 'oral', 'manual', 'not_applicable', 'other',
]);

const VALID_PORN_USE_CONTEXT = new Set([
  'pre_sex_arousal', 'during_partner_play', 'during_intercourse', 'post_sex', 'shared_viewing', 'solo_before_meeting', 'other',
]);

const VALID_CONTRACEPTION = new Set(['condom', 'pill', 'iud', 'withdrawal', 'none', 'unknown', 'other']);

const VALID_RISK_FLAGS = new Set(['condom_broke', 'unprotected', 'sti_concern', 'pregnancy_concern', 'consent_concern', 'other']);

const VALID_SLEEP_IMPACT = new Set(['none', 'delayed_sleep', 'slept_better', 'woke_up', 'unknown']);

const validateEnumArray = <T extends string>(arr: unknown, validSet: Set<string>): T[] =>
  Array.isArray(arr) ? (arr as T[]).filter((v) => validSet.has(v)) : [];

export const hydrateSexEvent = (raw: Partial<SexEvent> & { startedAt?: string }): SexEvent => {
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
    partnerIds: Array.isArray(raw.partnerIds) ? dedupe(raw.partnerIds) : [],
    interactionTypes: validateEnumArray(raw.interactionTypes, VALID_INTERACTION_TYPES),
    penetration: VALID_PENETRATION.has(raw.penetration as string) ? raw.penetration as SexPenetration : 'unknown',
    hardnessLevel: isScale5(raw.hardnessLevel) ? raw.hardnessLevel : null,
    ejaculated: typeof raw.ejaculated === 'boolean' ? raw.ejaculated : null,
    ejaculationContext: VALID_EJACULATION_CONTEXT.has(raw.ejaculationContext as string) ? raw.ejaculationContext! : null,
    orgasmIntensity: isScale5(raw.orgasmIntensity) ? raw.orgasmIntensity : null,
    satisfaction: isScale5(raw.satisfaction) ? raw.satisfaction : null,
    afterState: validateEnumArray(raw.afterState, VALID_AFTER_STATES),
    pornInvolved: typeof raw.pornInvolved === 'boolean' ? raw.pornInvolved : null,
    pornUseContext: validateEnumArray(raw.pornUseContext, VALID_PORN_USE_CONTEXT),
    arousalLevel: isScale5(raw.arousalLevel) ? raw.arousalLevel : null,
    fatigueAfter: isScale5(raw.fatigueAfter) ? raw.fatigueAfter : null,
    recoveryFeeling: isScale5(raw.recoveryFeeling) ? raw.recoveryFeeling : null,
    contraception: VALID_CONTRACEPTION.has(raw.contraception as string) ? raw.contraception as SexContraception : null,
    riskFlags: validateEnumArray(raw.riskFlags, VALID_RISK_FLAGS),
    sleepImpact: VALID_SLEEP_IMPACT.has(raw.sleepImpact as string) ? raw.sleepImpact! : null,
    legacySexRecord: raw.legacySexRecord,
    tags: Array.isArray(raw.tags) ? dedupe(raw.tags) : [],
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    linkedPornUseEventIds: Array.isArray(raw.linkedPornUseEventIds) ? dedupe(raw.linkedPornUseEventIds) : [],
    linkedMasturbationEventIds: Array.isArray(raw.linkedMasturbationEventIds) ? dedupe(raw.linkedMasturbationEventIds) : [],
  };
};

// ── Normalize ───────────────────────────────────────────────────────────────

export const normalizeSexEvent = (event: SexEvent): SexEvent => ({
  ...event,
  interactionTypes: validateEnumArray(event.interactionTypes, VALID_INTERACTION_TYPES),
  afterState: validateEnumArray(event.afterState, VALID_AFTER_STATES),
  pornUseContext: validateEnumArray(event.pornUseContext, VALID_PORN_USE_CONTEXT),
  riskFlags: validateEnumArray(event.riskFlags, VALID_RISK_FLAGS),
  partnerIds: dedupe(event.partnerIds ?? []),
  tags: dedupe(event.tags ?? []),
  linkedPornUseEventIds: dedupe(event.linkedPornUseEventIds),
  linkedMasturbationEventIds: dedupe(event.linkedMasturbationEventIds),
  penetration: VALID_PENETRATION.has(event.penetration) ? event.penetration : 'unknown',
});

// ── Validation ──────────────────────────────────────────────────────────────

export interface SexValidationError {
  field: string;
  message: string;
}

const REQUIRED_FIELDS: (keyof SexEvent)[] = [
  'id', 'startedAt', 'targetDate', 'createdAt', 'updatedAt', 'status', 'source',
];

export const validateSexEvent = (event: SexEvent): SexValidationError[] => {
  const errors: SexValidationError[] = [];

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

  const scaleFields: (keyof SexEvent)[] = [
    'hardnessLevel', 'orgasmIntensity', 'satisfaction', 'arousalLevel', 'fatigueAfter', 'recoveryFeeling',
  ];
  for (const field of scaleFields) {
    const val = event[field];
    if (val !== null && val !== undefined && !isScale5(val)) {
      errors.push({ field, message: `${field} 必须为 null 或 1-5` });
    }
  }

  if (!VALID_PENETRATION.has(event.penetration)) {
    errors.push({ field: 'penetration', message: `penetration 值无效: ${event.penetration}` });
  }

  for (const field of ['linkedPornUseEventIds', 'linkedMasturbationEventIds', 'partnerIds'] as const) {
    if (!Array.isArray(event[field]) || event[field].some((v) => typeof v !== 'string')) {
      errors.push({ field, message: `${field} 必须是字符串数组` });
    }
  }

  return errors;
};

// ── Old record adapter ──────────────────────────────────────────────────────

/**
 * Map an old SexRecordDetails (from LogEntry.sex[]) to a SexEvent.
 * Preserves the complete old record as legacySexRecord.
 * Does NOT map partnerScore to satisfaction.
 * Does NOT auto-create PartnerProfile or infer porn involvement.
 */
export const mapSexRecordToEvent = (record: SexRecordDetails, logDate: string): SexEvent => {
  const startedAt = record.startTime
    ? `${logDate}T${record.startTime}:00`
    : `${logDate}T22:00:00`;
  const targetDate = getActivityTargetDate(new Date(startedAt));
  const now = new Date().toISOString();

  return {
    id: record.id || generateId(),
    startedAt,
    targetDate,
    createdAt: now,
    updatedAt: now,
    status: 'completed',
    source: 'migration',
    durationMinutes: typeof record.duration === 'number' && record.duration > 0 ? record.duration : null,
    partnerIds: [],
    interactionTypes: [],
    penetration: 'unknown',
    hardnessLevel: null,
    ejaculated: typeof record.ejaculation === 'boolean' ? record.ejaculation : null,
    ejaculationContext: null,
    orgasmIntensity: null,
    satisfaction: null,
    afterState: [],
    pornInvolved: null,
    legacySexRecord: record,
    linkedPornUseEventIds: [],
    linkedMasturbationEventIds: [],
  };
};
