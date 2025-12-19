
/**
 * 在此定义你的 TypeScript 类型和接口
 */

export interface UserProfile {
    id: string;
    name: string;
    createdAt: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type HardnessLevel = 1 | 2 | 3 | 4 | 5;
export type MorningWoodRetention = 'instant' | 'brief' | 'normal' | 'extended';
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type AlcoholConsumption = 'none' | 'low' | 'medium' | 'high';
export type PornConsumption = 'none' | 'low' | 'medium' | 'high';
export type ExerciseIntensity = 'low' | 'medium' | 'high';
export type ExerciseFeeling = 'great' | 'ok' | 'tired' | 'bad';
export type SexQuality = 1 | 2 | 3 | 4 | 5;
export type IllnessType = 'cold' | 'fever' | 'headache' | 'other';
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'foggy';
export type Location = 'home' | 'partner' | 'hotel' | 'travel' | 'other';
export type Mood = 'happy' | 'excited' | 'neutral' | 'anxious' | 'sad' | 'angry';
export type SleepAttire = 'naked' | 'light' | 'pajamas' | 'other';
export type HistoryCategory = 'sex' | 'masturbation' | 'exercise' | 'sleep' | 'morning' | 'lifestyle' | 'health' | 'nap' | 'system';
export type HistoryEventType = 'manual' | 'quick' | 'auto';
export type DrunkLevel = 'none' | 'tipsy' | 'drunk' | 'wasted';
export type PartnerType = 'stable' | 'dating' | 'casual' | 'service';
export type SexActionType = 'act' | 'position';
export type SleepLocation = 'home' | 'office' | 'transport' | 'hotel' | 'others_home' | 'dorm' | 'other';
export type SleepTemperature = 'cold' | 'comfortable' | 'hot';
export type PreSleepState = 'tired' | 'calm' | 'energetic' | 'stressed' | 'other';

export interface ChangeDetail {
    field: string;
    oldValue: any;
    newValue: any;
    category: HistoryCategory | 'meta';
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
    startTime: string | null;
    endTime: string | null;
    quality: number;
    attire?: SleepAttire | null;
    naturalAwakening: boolean;
    nocturnalEmission: boolean;
    withPartner: boolean;
    preSleepState?: PreSleepState | null;
    naps: NapRecord[];
    hasDream: boolean;
    dreamTypes: string[];
    environment?: {
        location: string;
        temperature: string;
    };
}

export interface Health {
    isSick: boolean;
    illnessType?: IllnessType | null;
    medicationTaken?: boolean | null;
    medicationName?: string | null;
    feeling: 'normal' | 'minor_discomfort' | 'bad';
    discomfortLevel?: 'mild' | 'moderate' | 'severe' | null;
    symptoms: string[];
    medications: string[];
}

export interface CaffeineItem {
    id: string;
    name: string;
    time: string;
    volume: number;
    count: number;
    isCustom?: boolean;
}

export interface AlcoholItem {
    key: string;
    name: string;
    volume: number;
    abv: number;
    count: number;
    pureAlcohol: number;
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

export interface SexAction {
    id: string;
    type: SexActionType;
    name: string;
}

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
    startTime: string;
    duration: number;
    ejaculation: boolean;
    partner?: string;
    location?: string;
    acts?: string[];
    positions?: string[];
    protection: string;
    indicators: {
        lingerie: boolean;
        orgasm: boolean;
        partnerOrgasm: boolean;
        squirting: boolean;
        toys: boolean;
    };
    interactions?: SexInteraction[];
    state: string;
    semenSwallowed: boolean;
    postSexActivity: string[];
    mood: Mood;
    notes: string;
    ejaculationLocation?: string;
    partnerScore?: number;
}

export interface ContentItem {
    id: string;
    type: string;
    platform?: string;
    title?: string;
    actors?: string[];
    xpTags?: string[];
    notes?: string;
}

export interface MasturbationRecordDetails {
    id: string;
    startTime: string;
    duration: number;
    status: 'completed' | 'inProgress';
    tools: string[];
    contentItems: ContentItem[];
    edging: 'none' | 'single' | 'multiple';
    edgingCount: number;
    lubricant?: string;
    useCondom: boolean;
    ejaculation: boolean;
    orgasmIntensity: number;
    mood: Mood;
    stressLevel: number;
    energyLevel: number;
    interrupted: boolean;
    interruptionReasons: string[];
    notes: string;
    volumeForceLevel?: number;
    postMood?: string;
    fatigue?: string;
    assets?: {
        sources?: string[];
        platforms?: string[];
        actors?: string[];
        categories?: string[];
        target?: string;
    };
    materialsList?: any[];
}

export interface LogEntry {
    date: string;
    status: 'completed' | 'pending';
    updatedAt: number;
    location: Location | null;
    weather: Weather | null;
    mood: Mood | null;
    stressLevel: StressLevel | null;
    alcohol: AlcoholConsumption | null;
    pornConsumption: PornConsumption | null;
    caffeineIntake?: string | null;
    dailyEvents: string[];
    tags: string[];
    notes: string | null;
    exercise: ExerciseRecord[];
    sex: SexRecordDetails[];
    masturbation: MasturbationRecordDetails[];
    alcoholRecords: AlcoholRecord[];
    changeHistory: ChangeRecord[];
    caffeineRecord?: {
        totalCount: number;
        items: CaffeineItem[];
    };
    morning?: MorningRecord;
    sleep?: SleepRecord;
    health?: Health;
}

export interface PartnerProfile {
    id: string;
    name: string;
    type: PartnerType;
    isMarried: boolean;
    age?: number;
    height?: number;
    weight?: number;
    cupSize?: string;
    firstEncounterDate?: string;
    origin?: string;
    avatarColor?: string;
    sensitiveSpots: string[];
    stimulationPreferences: string[];
    likedPositions: string[];
    dislikedActs: string[];
    socialTags: string[];
    smoking: 'none' | 'occasional' | 'frequent';
    alcohol: 'none' | 'occasional' | 'frequent';
    milestones: Record<string, string>;
    notes: string;
    contrastDaily?: string;
    contrastBedroom?: string;
    deepThroatLevel?: 0 | 1 | 2 | 3;
    orgasmDifficulty?: 'easy' | 'medium' | 'hard';
    analDeveloped?: boolean;
    squirtingAbility?: boolean;
    primaryValues?: string;
    petPeeves?: string;
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
    data: {
        logs: LogEntry[];
        partners: PartnerProfile[];
    };
}

export interface SystemLog {
    id?: number;
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    action: string;
    details?: any;
}

export interface BackupState {
    lastBackup?: number;
    isAutoBackupEnabled: boolean;
}

export interface AppSettings {
    theme: ThemeMode;
    version: string;
    lastExportAt?: number;
}

export type EventType = 'morning_wood' | 'sleep' | 'alcohol' | 'exercise' | 'sex' | 'masturbation' | 'stress' | 'health';

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
    };
    flags: {
        isGood?: boolean;
        isLate?: boolean;
        withPartner?: boolean;
        orgasm?: boolean;
        ejaculation?: boolean;
    };
    tags: string[];
    refId?: string;
}
