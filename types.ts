
export type HardnessLevel = 1 | 2 | 3 | 4 | 5;
export type MorningWoodRetention = 'instant' | 'brief' | 'normal' | 'extended';

export type Mood = 'excited' | 'happy' | 'neutral' | 'anxious' | 'sad' | 'angry';
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'foggy';
export type Location = 'home' | 'partner' | 'hotel' | 'travel' | 'other';
export type AlcoholConsumption = 'none' | 'low' | 'medium' | 'high';
export type PornConsumption = 'none' | 'low' | 'medium' | 'high';
export type ExerciseIntensity = 'low' | 'medium' | 'high';
export type ExerciseFeeling = 'great' | 'ok' | 'tired' | 'bad';
export type SleepAttire = 'naked' | 'light' | 'pajamas' | 'other';
export type PreSleepState = 'tired' | 'energetic' | 'stressed' | 'calm' | 'other';
export type IllnessType = 'cold' | 'fever' | 'headache' | 'other';
export type DiscomfortLevel = 'mild' | 'moderate' | 'severe';
export type HistoryCategory = 'sex' | 'masturbation' | 'exercise' | 'sleep' | 'morning' | 'lifestyle' | 'health' | 'nap' | 'meta' | 'system';
export type HistoryEventType = 'manual' | 'quick' | 'auto';
export type ChangeType = 'add' | 'mod' | 'del';
export type SleepLocation = 'home' | 'hotel' | 'others_home' | 'dorm' | 'other';
export type SleepTemperature = 'cold' | 'comfortable' | 'hot';
export type DrunkLevel = 'none' | 'tipsy' | 'drunk' | 'wasted';
export type PartnerType = 'stable' | 'dating' | 'casual' | 'service';
export type SexActionType = 'act' | 'position';

export interface ChangeDetail {
    field: string;
    oldValue: any;
    newValue: any;
    category?: HistoryCategory;
    changeType?: ChangeType;
}

export interface ChangeRecord {
    timestamp: number;
    summary: string;
    details: ChangeDetail[];
    type?: HistoryEventType;
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

export interface SleepRecord {
    id: string;
    startTime?: string | null;
    endTime?: string | null;
    quality: number;
    naps: NapRecord[];
    attire?: SleepAttire | null;
    hasDream?: boolean;
    dreamTypes?: string[];
    naturalAwakening?: boolean;
    nocturnalEmission?: boolean;
    withPartner?: boolean;
    preSleepState?: PreSleepState | null;
    environment?: {
        location: SleepLocation;
        temperature: SleepTemperature;
    };
}

export interface MorningRecord {
    id: string;
    timestamp: number;
    wokeWithErection: boolean;
    hardness?: HardnessLevel | null;
    retention?: MorningWoodRetention | null;
    wokenByErection?: boolean;
    durationImpression?: string | null;
}

export interface Health {
    isSick: boolean;
    feeling?: 'normal' | 'bad' | string;
    discomfortLevel?: DiscomfortLevel | null;
    symptoms: string[];
    medications: string[];
    illnessType?: string;
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
    startTime: string;
    endTime?: string;
    time?: string;
    ongoing: boolean;
    isInstant?: boolean;
    totalGrams: number;
    durationMinutes: number;
    isLate: boolean;
    items: AlcoholItem[];
    drunkLevel: DrunkLevel;
    location: string;
    people: string;
    reason: string;
}

export interface CaffeineItem {
    id: string;
    name: string;
    time: string;
    count: number;
    volume: number;
}

export interface CaffeineRecord {
    totalCount: number;
    items: CaffeineItem[];
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
    type: string;
    platform?: string;
    title?: string;
    actors: string[];
    xpTags: string[];
    notes?: string;
}

export interface MasturbationRecordDetails {
    id: string;
    startTime: string;
    duration: number;
    status: 'inProgress' | 'completed';
    tools: string[];
    contentItems: ContentItem[];
    materials: any[];
    props: any[];
    assets: {
        sources: string[];
        platforms: string[];
        categories: string[];
        target: string;
        actors: string[];
    };
    materialsList: any[];
    edging: 'none' | 'once' | 'multiple';
    edgingCount: number;
    lubricant?: string;
    useCondom: boolean;
    ejaculation: boolean;
    orgasmIntensity: number;
    mood?: string;
    stressLevel?: number;
    energyLevel?: number;
    interrupted: boolean;
    interruptionReasons: string[];
    notes: string;
    volumeForceLevel?: 1 | 2 | 3 | 4 | 5;
    postMood?: string;
    fatigue?: string;
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
    role: string;
    costumes: string[];
    toys: string[];
    chain: SexAction[];
}

export interface SexRecordDetails {
    id: string;
    startTime: string;
    duration: number;
    protection: string;
    state: string;
    ejaculation: boolean;
    ejaculationLocation: string;
    semenSwallowed: boolean;
    postSexActivity: string[];
    partnerScore: number;
    mood: Mood;
    notes: string;
    interactions: SexInteraction[];
    partner?: string;
    location?: string;
    acts?: string[];
    positions?: string[];
    indicators: {
        lingerie: boolean;
        orgasm: boolean;
        partnerOrgasm: boolean;
        squirting: boolean;
        toys: boolean;
    };
    ongoing?: boolean;
}

export interface PartnerProfile {
    id: string;
    name: string;
    type: PartnerType;
    avatarColor: string;
    isMarried: boolean;
    age?: number;
    height?: number;
    weight?: number;
    cupSize?: string;
    firstEncounterDate?: string;
    origin?: string;
    contrastDaily?: string;
    contrastBedroom?: string;
    milestones: Record<string, string>;
    sensitiveSpots: string[];
    stimulationPreferences: string[];
    likedPositions: string[];
    dislikedActs: string[];
    socialTags: string[];
    smoking: 'none' | 'occasional' | 'frequent';
    alcohol: 'none' | 'occasional' | 'frequent';
    deepThroatLevel?: 0 | 1 | 2 | 3;
    orgasmDifficulty?: 'easy' | 'medium' | 'hard';
    analDeveloped?: boolean;
    squirtingAbility?: boolean;
    primaryValues?: string;
    petPeeves?: string;
    notes: string;
}

export interface LogEntry {
    date: string; // YYYY-MM-DD
    status: 'pending' | 'completed';
    updatedAt: number;
    morning?: MorningRecord | null;
    sleep?: SleepRecord | null;
    exercise?: ExerciseRecord[];
    sex?: SexRecordDetails[];
    masturbation?: MasturbationRecordDetails[];
    alcoholRecord?: AlcoholRecord | null;
    caffeineRecord?: CaffeineRecord;
    location?: Location | null;
    weather?: Weather | null;
    mood?: Mood | null;
    stressLevel?: StressLevel | null;
    alcohol?: AlcoholConsumption | null;
    pornConsumption?: PornConsumption | null;
    caffeineIntake?: string | null;
    dailyEvents?: string[];
    tags?: string[];
    notes?: string | null;
    health?: Health;
    changeHistory?: ChangeRecord[];
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

export type EventType = 'morning_wood' | 'sleep' | 'alcohol' | 'exercise' | 'sex' | 'masturbation' | 'stress' | 'health' | 'nap' | 'caffeine' | 'wakeup';

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

export interface BackupState {
    lastExportAt: number | null;
    isPersistent: boolean;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    version: string;
    lastExportAt: number | null;
}
