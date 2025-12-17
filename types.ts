

export type HardnessLevel = 1 | 2 | 3 | 4 | 5;
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type ErectionDurationImpression = 'brief' | 'long' | 'unsure';
export type MorningWoodRetention = 'instant' | 'brief' | 'normal' | 'extended';
export type SleepAttire = 'naked' | 'light' | 'pajamas' | 'other';
export type ExerciseIntensity = 'low' | 'medium' | 'high';
export type SexQuality = 'good' | 'medium' | 'bad';
export type PreSleepState = 'tired' | 'energetic' | 'stressed' | 'calm' | 'other';
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'windy';
export type Location = 'home' | 'partner' | 'hotel' | 'travel' | 'other';
export type Mood = 'happy' | 'excited' | 'neutral' | 'anxious' | 'sad' | 'angry';
export type AlcoholConsumption = 'none' | 'low' | 'medium' | 'high';
export type PornConsumption = 'none' | 'low' | 'medium' | 'high';
export type IllnessType = 'cold' | 'fever' | 'headache' | 'other';
export type PartnerType = 'stable' | 'dating' | 'casual' | 'service';

// v0.0.5 New Enums
export type SleepLocation = 'home' | 'hotel' | 'others_home' | 'dorm' | 'other';
export type SleepTemperature = 'cold' | 'comfortable' | 'hot';
export type DrunkLevel = 'none' | 'tipsy' | 'drunk' | 'wasted';
export type HealthFeeling = 'normal' | 'minor_discomfort' | 'bad'; // Deprecated in v0.0.6
export type DiscomfortLevel = 'mild' | 'moderate' | 'severe';
export type ExerciseFeeling = 'great' | 'ok' | 'tired' | 'bad';
export type CaffeineIntake = 'none' | 'low' | 'medium' | 'high';

// --- History Categories ---
export type HistoryCategory = 'sleep' | 'morning' | 'nap' | 'exercise' | 'masturbation' | 'sex' | 'health' | 'lifestyle' | 'meta' | 'system';
export type HistoryEventType = 'manual' | 'quick' | 'auto';
export type ChangeType = 'add' | 'mod' | 'del';

/**
 * Added missing ChangeDetail type used in helper functions and history repair.
 */
export interface ChangeDetail {
    field: string;
    oldValue: string;
    newValue: string;
    category?: HistoryCategory;
    changeType?: ChangeType;
}

// --- Unified Event Model (Analytics Layer) ---
export type EventType = 'morning_wood' | 'sleep' | 'sex' | 'masturbation' | 'exercise' | 'alcohol' | 'stress' | 'emotion' | 'health';

export interface UnifiedEvent {
    schemaVersion: number;
    id: string;
    type: EventType;
    timestamp: number;
    dateStr: string;
    metrics: {
        value?: number;
        duration?: number;
        count?: number;
        amount?: number;
        intensity?: number;
    };
    flags: {
        isLate?: boolean;
        isGood?: boolean;
        withPartner?: boolean;
        orgasm?: boolean;
        ejaculation?: boolean;
    };
    tags: string[];
    refId?: string;
}

export interface AppSettings {
  version: string;
  theme: 'system' | 'light' | 'dark';
  privacyMode: boolean;
  enableNotifications: boolean;
  notificationTime: {
    morning: string;
    evening: string;
  };
  hiddenFields: string[];
  userGoal?: 'recovery' | 'tracking' | 'biohacking';
  lastBackupAt?: number;
  lastExportAt?: number;
}

/**
 * Added missing BackupState type used in MyView.
 */
export interface BackupState {
    lastBackupAt?: number;
    isCloudSynced?: boolean;
}

export interface AlcoholItem {
    key: string;
    name: string;
    volume: number;
    abv: number;
    pureAlcohol: number;
    count: number;
}

export interface AlcoholRecord {
    id?: string;
    startTime?: string;
    endTime?: string;
    ongoing?: boolean;
    isInstant?: boolean; // v0.0.9 新增：是否为一口/一杯式饮酒
    totalGrams: number;
    durationMinutes: number;
    isLate: boolean;
    items: AlcoholItem[];
    drunkLevel?: DrunkLevel;
    
    // v0.0.9 Context Fields
    location?: string; // Where
    people?: string;   // Who
    reason?: string;   // Why
    
    // Legacy
    time?: string;
    alcoholScene?: string;
}

export interface MorningRecord {
    id: string;
    timestamp?: number;
    wokeWithErection: boolean;
    hardness?: HardnessLevel | null;
    retention?: MorningWoodRetention | null;
    wokenByErection?: boolean;
    durationImpression?: ErectionDurationImpression | null;
}

export interface SleepRecord {
    id: string;
    startTime?: string | null;
    endTime?: string | null;
    quality: number;
    attire?: SleepAttire | null;
    naturalAwakening?: boolean;
    nocturnalEmission?: boolean;
    withPartner?: boolean;
    preSleepState?: PreSleepState | null;
    naps: NapRecord[];
    hasDream?: boolean;
    dreamTypes?: string[];
    environment?: {
        location: SleepLocation;
        temperature: SleepTemperature;
    };
}

export interface NapRecord {
    id: string;
    startTime: string;
    endTime?: string | null;
    duration?: number;
    ongoing?: boolean;
    hasDream?: boolean;
    dreamTypes?: string[];
    wokeWithErection?: boolean;
    hardness?: HardnessLevel | null;
    quality?: number;
    environment?: {
        location: SleepLocation;
        temperature: SleepTemperature;
    };
}

export interface ExerciseRecord {
    id: string;
    type: string;
    startTime: string;
    duration?: number;
    intensity?: ExerciseIntensity | null;
    bodyParts?: string[];
    ongoing?: boolean;
    steps?: number | null;
    notes?: string | null;
    feeling?: ExerciseFeeling;
}

export interface SexRecordDetails {
  id: string; 
  startTime?: string | null; 
  duration?: number; 
  protection?: string | null;
  state?: string | null;
  interactions: SexInteraction[];
  partner?: string | null;
  location?: string | null;
  role?: string | null;
  costumes?: string[];
  acts?: string[];
  positions?: string[];
  indicators: {
    lingerie: boolean;
    orgasm: boolean;
    partnerOrgasm: boolean;
    squirting: boolean;
    toys: boolean;
  };
  ejaculation?: boolean;
  ejaculationLocation?: string | null;
  semenSwallowed?: boolean;
  postSexActivity?: string[];
  partnerScore?: number;
  mood?: Mood | null;
  notes?: string | null;
}

export interface SexInteraction {
  id: string;
  partner: string;
  role?: string | null;
  location: string;
  costumes?: string[];
  toys?: string[];
  chain: SexAction[];
}

export interface SexAction {
  id: string;
  type: SexActionType;
  name: string;
}

/**
 * Added missing SexActionType.
 */
export type SexActionType = 'act' | 'position';

export interface MasturbationRecordDetails {
  id: string;
  startTime?: string | null;
  duration?: number;
  location?: string | null;
  tools: string[];
  contentItems: ContentItem[];
  edging?: 'none' | 'once' | 'multiple';
  edgingCount?: number;
  lubricant?: string | null;
  useCondom?: boolean;
  ejaculation?: boolean;
  orgasmIntensity?: number;
  mood?: Mood | null;
  stressLevel?: number;
  energyLevel?: number;
  interrupted?: boolean;
  interruptionReasons?: string[];
  notes?: string | null;
  status?: 'completed' | 'inProgress'; 
  volumeForceLevel?: 1 | 2 | 3 | 4 | 5;
  postMood?: string;
  fatigue?: string;
  /**
   * Added missing legacy/internal properties used in UI and migrations.
   */
  materialsList?: any[];
  assets?: {
      sources?: string[];
      platforms?: string[];
      categories?: string[];
      target?: string;
      actors?: string[];
  };
  materials?: string[];
  props?: string[];
}

export interface ContentItem {
    id: string;
    type: string;
    platform?: string;
    title?: string;
    actors: string[];
    xpTags: string[];
    notes?: string;
}

export interface CaffeineItem {
    id: string;
    name: string;
    time: string;
    count: number;
    volume?: number;
}

export interface CaffeineRecord {
    totalCount: number;
    items: CaffeineItem[];
}

export interface PartnerProfile {
    id: string;
    name: string;
    avatarColor?: string | null;
    age?: number | null;
    height?: number | null;
    weight?: number | null;
    cupSize?: string | null;
    type?: PartnerType | null;
    isMarried?: boolean;
    origin?: string | null;
    firstEncounterDate?: string | null;
    smoking?: 'none' | 'occasional' | 'frequent' | null;
    alcohol?: 'none' | 'occasional' | 'frequent' | null;
    occupation?: string | null;
    primaryValues?: string | null;
    petPeeves?: string | null;
    notes?: string | null;
    contrastDaily?: string | null;
    contrastBedroom?: string | null;
    sensitiveSpots?: string[];
    stimulationPreferences?: string[];
    likedPositions?: string[];
    dislikedActs?: string[];
    socialTags?: string[];
    milestones?: Record<string, string>;
    deepThroatLevel?: number;
    orgasmDifficulty?: 'easy' | 'medium' | 'hard' | null;
    analDeveloped?: boolean;
    squirtingAbility?: boolean;
}

export interface LogEntry {
    date: string;
    status: 'pending' | 'completed';
    updatedAt: number;
    morning?: MorningRecord | null;
    sleep?: SleepRecord | null;
    location?: Location | null;
    weather?: Weather | null;
    mood?: Mood | null;
    stressLevel?: StressLevel | null;
    health?: Health | null;
    alcohol?: AlcoholConsumption | null;
    alcoholRecord?: AlcoholRecord | null;
    pornConsumption?: PornConsumption | null;
    caffeineRecord?: CaffeineRecord | null;
    /**
     * Added missing caffeineIntake used in hydrateLog.
     */
    caffeineIntake?: CaffeineIntake | null;
    dailyEvents?: string[];
    exercise?: ExerciseRecord[];
    sex?: SexRecordDetails[];
    masturbation?: MasturbationRecordDetails[];
    tags?: string[];
    notes?: string | null;
    changeHistory?: ChangeRecord[];
}

export interface Health {
    isSick: boolean;
    discomfortLevel?: DiscomfortLevel | null;
    symptoms?: string[];
    medications?: string[];
    /**
     * Added missing properties used in hydrateLog and eventAdapter.
     */
    illnessType?: string | null;
    medicationTaken?: boolean | null;
    medicationName?: string | null;
    feeling?: string;
}

export interface ChangeRecord {
    timestamp: number;
    summary: string;
    details: ChangeDetail[];
    type?: HistoryEventType;
}

export interface StoredData {
    version: number;
    logs: LogEntry[];
}

export interface Snapshot {
    id?: number;
    timestamp: number;
    dataVersion: number;
    appVersion: string;
    description: string;
    data: { logs: LogEntry[]; partners: PartnerProfile[]; };
}
