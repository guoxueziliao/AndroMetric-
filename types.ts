
export type HardnessLevel = 1 | 2 | 3 | 4 | 5;
export type MorningWoodRetention = 'instant' | 'brief' | 'normal' | 'extended';
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type AlcoholConsumption = 'none' | 'low' | 'medium' | 'high';
export type PornConsumption = 'none' | 'low' | 'medium' | 'high';
export type ExerciseIntensity = 'low' | 'medium' | 'high';
export type SexQuality = 1 | 2 | 3 | 4 | 5;
export type IllnessType = 'cold' | 'fever' | 'headache' | 'other' | string;
export type PreSleepState = 'tired' | 'energetic' | 'stressed' | 'calm' | 'other' | string;
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'foggy';
export type Location = 'home' | 'partner' | 'hotel' | 'travel' | 'other' | string;
export type Mood = 'happy' | 'excited' | 'neutral' | 'anxious' | 'sad' | 'angry';
export type SleepAttire = 'naked' | 'light' | 'pajamas' | 'other';
export type DrunkLevel = 'none' | 'tipsy' | 'drunk' | 'wasted';
export type ExerciseFeeling = 'great' | 'ok' | 'tired' | 'bad';
export type PartnerType = 'stable' | 'dating' | 'casual' | 'service';
export type HistoryCategory = 'sex' | 'masturbation' | 'exercise' | 'sleep' | 'morning' | 'lifestyle' | 'health' | 'nap' | 'system' | 'meta';
export type HistoryEventType = 'manual' | 'quick' | 'auto';
export type EventType = 'morning_wood' | 'sleep' | 'alcohol' | 'exercise' | 'sex' | 'masturbation' | 'stress' | 'health';
export type SleepLocation = 'home' | 'office' | 'transport' | 'hotel' | 'other' | string;
export type SleepTemperature = 'cold' | 'comfortable' | 'hot';

export interface ChangeDetail {
    field: string;
    oldValue: any;
    newValue: any;
    category: HistoryCategory;
}

export interface ChangeRecord {
    timestamp: number;
    summary: string;
    details?: ChangeDetail[];
    type: HistoryEventType;
}

export interface MorningRecord {
    id: string;
    timestamp: number;
    wokeWithErection: boolean;
    hardness?: HardnessLevel | null;
    retention?: MorningWoodRetention | null;
    wokenByErection: boolean;
    durationImpression?: string | null;
}

export interface NapRecord {
    id: string;
    startTime: string;
    endTime?: string;
    ongoing: boolean;
    duration: number;
    quality?: number;
    hardness?: HardnessLevel | null;
    hasDream?: boolean;
    dreamTypes?: string[];
    notes?: string;
    location?: SleepLocation;
    temperature?: SleepTemperature;
    naturalAwakening?: boolean;
    attire?: SleepAttire;
    withPartner?: boolean;
    preSleepState?: PreSleepState;
}

export interface SleepRecord {
    id: string;
    startTime?: string | null;
    endTime?: string | null;
    quality: number;
    attire?: SleepAttire | null;
    naturalAwakening: boolean;
    nocturnalEmission: boolean;
    withPartner: boolean;
    preSleepState?: PreSleepState | null;
    naps: NapRecord[];
    hasDream: boolean;
    dreamTypes: string[];
    environment: {
        location: SleepLocation;
        temperature: SleepTemperature;
    };
}

export interface Health {
    isSick: boolean;
    illnessType?: IllnessType | null;
    medicationTaken?: boolean | null;
    medicationName?: string | null;
    feeling?: 'normal' | 'bad' | 'minor_discomfort';
    discomfortLevel?: 'mild' | 'moderate' | 'severe' | null;
    symptoms: string[];
    medications: string[];
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
    id: string;
    totalGrams: number;
    durationMinutes: number;
    items: AlcoholItem[];
    isLate: boolean;
    drunkLevel?: DrunkLevel;
    alcoholScene?: string;
    time: string;
    startTime?: string;
    endTime?: string;
    ongoing: boolean;
}

export interface ExerciseRecord {
    id: string;
    type: string;
    startTime: string;
    duration: number;
    intensity: ExerciseIntensity;
    bodyParts?: string[];
    steps?: number;
    notes?: string;
    feeling?: ExerciseFeeling;
    ongoing?: boolean;
}

export interface ContentItem {
    id: string;
    type?: string;
    platform?: string;
    title?: string;
    actors: string[];
    xpTags: string[];
    notes?: string;
}

export interface MasturbationRecordDetails {
    id: string;
    startTime?: string;
    duration: number;
    status: 'inProgress' | 'completed';
    tools: string[];
    contentItems: ContentItem[];
    materials?: string[]; // Legacy
    props?: string[]; // Legacy
    assets?: {
        sources: string[];
        platforms: string[];
        categories: string[];
        target: string;
        actors: string[];
    };
    materialsList?: any[]; // Legacy
    edging: 'none' | 'once' | 'multiple';
    edgingCount: number;
    lubricant?: string;
    useCondom: boolean;
    ejaculation: boolean;
    orgasmIntensity?: number;
    mood: Mood | string;
    stressLevel: number;
    energyLevel: number;
    interrupted: boolean;
    interruptionReasons: string[];
    notes: string;
    volumeForceLevel?: number;
    postMood?: string;
    fatigue?: string;
    quickLog?: boolean;
    location?: string;
}

export interface SexAction {
    id: string;
    type: 'act' | 'position';
    name: string;
}

export type SexActionType = 'act' | 'position';

export interface SexInteraction {
    id: string;
    partner: string;
    location: string;
    role?: string;
    costumes: string[];
    toys: string[];
    chain: SexAction[];
}

export interface SexRecordDetails {
    id: string;
    startTime?: string;
    interactions: SexInteraction[];
    partner?: string; // Legacy
    location?: string; // Legacy
    acts?: string[]; // Legacy
    positions?: string[]; // Legacy
    duration: number;
    protection: string;
    state: string;
    indicators: {
        lingerie: boolean;
        orgasm: boolean;
        partnerOrgasm: boolean;
        squirting: boolean;
        toys: boolean;
    };
    ejaculation: boolean;
    ejaculationLocation?: string;
    semenSwallowed: boolean;
    postSexActivity: string[];
    partnerScore?: number;
    mood: Mood | string;
    notes: string;
}

export interface CaffeineItem {
    id: string;
    name: string;
    time: string;
    count: number;
    volume: number;
    category?: string;
    isCustom?: boolean;
    mg?: number; // Legacy migration
}

export interface CaffeineRecord {
    totalCount: number;
    items: CaffeineItem[];
    totalMg?: number; // Legacy migration
}

export interface LogEntry {
    date: string;
    status: 'pending' | 'completed';
    updatedAt: number;
    morning?: MorningRecord;
    sleep?: SleepRecord;
    weather?: Weather | null;
    location?: Location | null;
    mood?: Mood | null;
    stressLevel?: StressLevel | null;
    alcohol?: AlcoholConsumption | null;
    pornConsumption?: PornConsumption | null;
    caffeineIntake?: 'none' | 'low' | 'medium' | 'high' | null;
    dailyEvents: string[];
    tags: string[];
    notes: string | null;
    exercise: ExerciseRecord[];
    sex: SexRecordDetails[];
    masturbation: MasturbationRecordDetails[];
    caffeineRecord?: CaffeineRecord;
    alcoholRecords: AlcoholRecord[];
    health?: Health;
    changeHistory: ChangeRecord[];
    alcoholRecord?: AlcoholRecord | null; // Legacy field for migration
}

export interface PartnerProfile {
    id: string;
    name: string;
    avatarColor?: string;
    type: PartnerType;
    isMarried: boolean;
    age?: number;
    height?: number;
    weight?: number;
    cupSize?: string;
    origin?: string;
    firstEncounterDate?: string;
    contrastDaily?: string;
    contrastBedroom?: string;
    sensitiveSpots: string[];
    stimulationPreferences: string[];
    likedPositions: string[];
    dislikedActs: string[];
    socialTags: string[];
    smoking: 'none' | 'occasional' | 'frequent';
    alcohol: 'none' | 'occasional' | 'frequent';
    milestones: Record<string, string>;
    deepThroatLevel?: 0 | 1 | 2 | 3;
    orgasmDifficulty?: 'easy' | 'medium' | 'hard';
    analDeveloped?: boolean;
    squirtingAbility?: boolean;
    primaryValues?: string;
    petPeeves?: string;
    notes?: string;
    occupation?: string;
}

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

export interface StoredData {
    version: number;
    logs: LogEntry[];
}

export interface AppSettings {
    version: string;
    theme: 'system' | 'light' | 'dark';
    privacyMode: boolean;
    enableNotifications: boolean;
    notificationTime: { morning: string; evening: string };
    hiddenFields: string[];
    lastExportAt?: number;
}

export interface UnifiedEvent {
    schemaVersion: number;
    id: string;
    type: EventType;
    dateStr: string;
    timestamp: number;
    metrics: {
        value?: number;
        intensity?: number;
        duration?: number;
        amount?: number;
        [key: string]: any;
    };
    flags: {
        isGood?: boolean;
        isLate?: boolean;
        withPartner?: boolean;
        orgasm?: boolean;
        ejaculation?: boolean;
        [key: string]: any;
    };
    tags: string[];
    refId?: string;
}

export interface BackupState {
    lastBackup?: number;
    isAutoBackupEnabled: boolean;
}
