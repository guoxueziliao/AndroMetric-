
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

export type SexActionType = 'act' | 'position';

export interface SexAction {
  id: string;
  type: SexActionType;
  name: string;
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

export interface SexRecordDetails {
  id: string; 
  startTime?: string | null; 
  duration?: number; 
  protection?: string | null;
  state?: string | null;
  interactions: SexInteraction[];
  partner?: string | null; // Legacy/Fallback
  location?: string | null; // Legacy/Fallback
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

export interface MasturbationMaterial {
    id: string;
    label?: string | null;
    publisher?: string | null;
    actors: string[];
    tags: string[];
}

// v0.0.6 Content Item (Replaces assets/materials)
export interface ContentItem {
    id: string;
    type: string; // was source (video, image...)
    platform?: string; // was platform (pornhub, twitter...)
    title?: string;
    actors: string[];
    xpTags: string[]; // was categories/tags
    notes?: string;
}

export interface MasturbationRecordDetails {
  id: string;
  startTime?: string | null;
  duration?: number;
  location?: string | null; // Scene/Place
  tools: string[];
  
  // v0.0.6: The new single source of truth for content
  contentItems: ContentItem[];

  // Legacy / Deprecated fields (kept for migration safety)
  materials?: string[]; // Old strings
  materialsList?: MasturbationMaterial[]; // v0.0.5 object
  assets?: {
      sources: string[];
      platforms: string[];
      categories: string[];
      actors?: string[];
      target?: string | null;
  };
  props?: string[];

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
  
  // v0.0.6 New Fields
  volumeForceLevel?: 1 | 2 | 3 | 4 | 5; // 纸巾测试
  postMood?: string;    // 贤者时间 - 心理
  fatigue?: string;     // 贤者时间 - 身体
  quickLog?: boolean;   // 标记是否为快速记录生成
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

export interface NapRecord {
    id: string;
    startTime: string;
    endTime?: string | null;
    duration?: number;
    ongoing?: boolean;
    hasDream?: boolean;
    dreamTypes?: string[];
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
    totalGrams: number;
    durationMinutes: number;
    isLate: boolean;
    items: AlcoholItem[];
    drunkLevel?: DrunkLevel;
    alcoholScene?: string;
    // v0.0.6
    time?: string; // HH:mm
}

// v0.0.6 Caffeine (Updated to use Cups)
export interface CaffeineItem {
    id: string;
    name: string;
    time: string; // HH:mm
    count: number; // cups
    volume?: number; // ml (size of cup)
}

export interface CaffeineRecord {
    totalCount: number; // total cups
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

export interface ChangeDetail {
    field: string;
    oldValue: string;
    newValue: string;
    category?: HistoryCategory;
    changeType?: ChangeType; // New in v0.0.6+: 'add' | 'mod' | 'del'
}

export interface ChangeRecord {
    id?: string; // New: Version ID (short hash)
    timestamp: number;
    summary: string;
    details: ChangeDetail[];
    type?: HistoryEventType;
    relatedDate?: string; // New: For cross-day links (e.g., Previous Day for Sleep)
}

// --- Standardized Domain Models (Schema v1.0) ---

export interface MorningRecord {
    id: string;
    timestamp?: number; // Time of recording
    wokeWithErection: boolean;
    hardness?: HardnessLevel | null;
    retention?: MorningWoodRetention | null;
    wokenByErection?: boolean;
    durationImpression?: ErectionDurationImpression | null;
}

export interface SleepRecord {
    id: string;
    startTime?: string | null; // sleepDateTime
    endTime?: string | null; // wakeUpDateTime
    quality: number; // 1-5
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

export interface Health {
    isSick: boolean; // Corresponds to hasDiscomfort
    discomfortLevel?: DiscomfortLevel | null;
    symptoms?: string[];
    medications?: string[];
    
    // Legacy fields (Deprecated in v0.0.6)
    feeling?: HealthFeeling | null;
    illnessType?: IllnessType | null;
    medicationTaken?: boolean | null;
    medicationName?: string | null;
}

// Aliases for Schema v1.0 Compliance
export type ExerciseEntry = ExerciseRecord;
export type MasturbationEntry = MasturbationRecordDetails;
export type NapEntry = NapRecord;
export type ChangeHistoryEntry = ChangeRecord;

export interface LogEntry {
    date: string; // ID (YYYY-MM-DD)
    status: 'pending' | 'completed';
    updatedAt: number;
    
    // Domain Objects
    morning?: MorningRecord | null;
    sleep?: SleepRecord | null;
    
    // Environment / State
    location?: Location | null;
    weather?: Weather | null;
    mood?: Mood | null;
    stressLevel?: StressLevel | null;
    
    // Health (Explicit Object)
    health?: Health | null;
    
    // Lifestyle
    alcohol?: AlcoholConsumption | null;
    alcoholRecord?: AlcoholRecord | null;
    pornConsumption?: PornConsumption | null;
    
    // v0.0.6 New Fields
    caffeineIntake?: CaffeineIntake | null; // Legacy enum
    caffeineRecord?: CaffeineRecord | null; // New object (Cups based)
    dailyEvents?: string[];
    
    // Activity Arrays
    exercise?: ExerciseRecord[];
    sex?: SexRecordDetails[];
    masturbation?: MasturbationRecordDetails[];
    
    // Meta
    tags?: string[];
    notes?: string | null;
    changeHistory?: ChangeRecord[];
}

export interface StoredData {
    version: number;
    logs: LogEntry[];
}

export interface BackupState {
    timestamp: string;
    logs: LogEntry[];
}

// Internal Snapshot for Rollback
export interface Snapshot {
    id?: number;
    timestamp: number;
    dataVersion: number;
    appVersion: string;
    description: string;
    data: {
        logs: LogEntry[];
        partners: PartnerProfile[];
    };
}
