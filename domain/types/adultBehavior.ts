import type { SexRecordDetails } from './sex';

// ── Source / Status ─────────────────────────────────────────────────────────

export type AdultBehaviorEventSource =
  | 'manual'
  | 'quick'
  | 'import'
  | 'migration'
  | 'repair';

export type AdultBehaviorEventStatus =
  | 'completed'
  | 'in_progress';

// ── Shared enums ───────────────────────────────────────────────────────────

export type AdultBehaviorScale5 = 1 | 2 | 3 | 4 | 5;

export type AdultBehaviorAfterState =
  | 'satisfied'
  | 'calm'
  | 'tired'
  | 'empty'
  | 'anxious'
  | 'guilty'
  | 'more_aroused'
  | 'neutral';

export type AdultBehaviorSleepImpact =
  | 'none'
  | 'delayed_sleep'
  | 'slept_better'
  | 'woke_up'
  | 'unknown';

export type AdultBehaviorEdging =
  | 'none'
  | 'single'
  | 'multiple';

// ── Base ───────────────────────────────────────────────────────────────────

export interface AdultBehaviorEventBase {
  id: string;
  startedAt: string;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
  status: AdultBehaviorEventStatus;
  source: AdultBehaviorEventSource;
  tags?: string[];
  notes?: string;
}

// ── PornUseEvent ───────────────────────────────────────────────────────────

export type PornContentType =
  | 'video'
  | 'image'
  | 'text'
  | 'audio'
  | 'live'
  | 'chat'
  | 'social_feed'
  | 'ai_generated'
  | 'fantasy_reading'
  | 'other';

export type PornSourceType =
  | 'porn_site'
  | 'x_twitter'
  | 'adult_forum'
  | 'reddit_like'
  | 'social_media'
  | 'chat_app'
  | 'creator_platform'
  | 'local_file'
  | 'ai_chat'
  | 'memory_fantasy'
  | 'other';

export type PornUseMotive =
  | 'sexual_arousal'
  | 'masturbation_aid'
  | 'stress_relief'
  | 'boredom'
  | 'habit'
  | 'sleep_aid'
  | 'partner_play'
  | 'pre_sex_arousal'
  | 'explore_preference'
  | 'emotional_escape'
  | 'other';

export interface PornUseEvent extends AdultBehaviorEventBase {
  durationMinutes: number | null;
  contentTypes: PornContentType[];
  sourceTypes: PornSourceType[];
  arousalLevel: AdultBehaviorScale5 | null;
  ledToMasturbation: boolean | null;
  ejaculated: boolean | null;
  afterState: AdultBehaviorAfterState[];
  motives?: PornUseMotive[];
  controlFeeling?: AdultBehaviorScale5 | null;
  exceededIntendedTime?: boolean | null;
  edging?: AdultBehaviorEdging;
  orgasmIntensity?: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  satisfaction?: AdultBehaviorScale5 | null;
  sleepImpact?: AdultBehaviorSleepImpact | null;
  platformName?: string;
  linkedMasturbationEventIds: string[];
  linkedSexEventIds: string[];
}

// ── MasturbationEvent ──────────────────────────────────────────────────────

export type MasturbationStimulationSource =
  | 'porn'
  | 'fantasy'
  | 'memory'
  | 'sexting'
  | 'partner_media'
  | 'ai_chat'
  | 'touch_only'
  | 'toy'
  | 'other';

export interface MasturbationEvent extends AdultBehaviorEventBase {
  durationMinutes: number | null;
  ejaculated: boolean | null;
  orgasmIntensity: AdultBehaviorScale5 | null;
  edging: AdultBehaviorEdging;
  hardnessLevel: AdultBehaviorScale5 | null;
  arousalLevel: AdultBehaviorScale5 | null;
  stimulationSources: MasturbationStimulationSource[];
  afterState: AdultBehaviorAfterState[];
  satisfaction: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  sleepImpact?: AdultBehaviorSleepImpact | null;
  controlFeeling?: AdultBehaviorScale5 | null;
  exceededIntendedTime?: boolean | null;
  sessionCount?: number;
  ejaculationCount?: number | null;
  linkedPornUseEventIds: string[];
  linkedSexEventIds: string[];
}

// ── SexEvent ───────────────────────────────────────────────────────────────

export type SexInteractionType =
  | 'penetrative'
  | 'oral'
  | 'manual'
  | 'mutual_masturbation'
  | 'toy'
  | 'video_sex'
  | 'other';

export type SexPenetration = 'yes' | 'no' | 'unknown';

export type SexEjaculationContext =
  | 'inside_condom'
  | 'inside_no_condom'
  | 'outside'
  | 'oral'
  | 'manual'
  | 'not_applicable'
  | 'other';

export type SexPornUseContext =
  | 'pre_sex_arousal'
  | 'during_partner_play'
  | 'during_intercourse'
  | 'post_sex'
  | 'shared_viewing'
  | 'solo_before_meeting'
  | 'other';

export type SexContraception =
  | 'condom'
  | 'pill'
  | 'iud'
  | 'withdrawal'
  | 'none'
  | 'unknown'
  | 'other';

export type SexRiskFlag =
  | 'condom_broke'
  | 'unprotected'
  | 'sti_concern'
  | 'pregnancy_concern'
  | 'consent_concern'
  | 'other';

export interface SexEvent extends AdultBehaviorEventBase {
  durationMinutes: number | null;
  partnerIds: string[];
  interactionTypes: SexInteractionType[];
  penetration: SexPenetration;
  hardnessLevel: AdultBehaviorScale5 | null;
  ejaculated: boolean | null;
  ejaculationContext: SexEjaculationContext | null;
  orgasmIntensity: AdultBehaviorScale5 | null;
  satisfaction: AdultBehaviorScale5 | null;
  afterState: AdultBehaviorAfterState[];
  pornInvolved: boolean | null;
  pornUseContext?: SexPornUseContext[];
  arousalLevel?: AdultBehaviorScale5 | null;
  fatigueAfter?: AdultBehaviorScale5 | null;
  recoveryFeeling?: AdultBehaviorScale5 | null;
  contraception?: SexContraception | null;
  riskFlags?: SexRiskFlag[];
  sleepImpact?: AdultBehaviorSleepImpact | null;
  legacySexRecord?: SexRecordDetails;
  linkedPornUseEventIds: string[];
  linkedMasturbationEventIds: string[];
}
