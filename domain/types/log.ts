import type { SexRecordDetails, MasturbationRecordDetails } from './sex';
import type { MenstrualDailySummary } from './reproductive';

export type HardnessLevel = 1 | 2 | 3 | 4 | 5;

export type MorningWoodRetention = 'instant' | 'brief' | 'normal' | 'extended';

export interface MorningRecord {
    id: string;
    timestamp: number;
    wokeWithErection: boolean;
    hardness?: HardnessLevel | null;
    retention?: MorningWoodRetention | null;
    wokenByErection: boolean;
    durationImpression?: string | null;
}

export type SleepLocation = 'home' | 'hotel' | 'others_home' | 'dorm' | 'office' | 'transport' | 'other';
export type SleepTemperature = 'cold' | 'comfortable' | 'hot';
export type SleepAttire = 'naked' | 'light' | 'pajamas' | 'other';
export type PreSleepState = 'tired' | 'energetic' | 'stressed' | 'calm' | 'other';

export interface NapRecord {
    id: string;
    startTime: string;
    endTime?: string;
    ongoing: boolean;
    duration: number;
    quality: number;
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

export type IllnessType = 'cold' | 'fever' | 'headache' | 'other';
export type DiscomfortLevel = 'mild' | 'moderate' | 'severe';

export interface Health {
    isSick: boolean;
    illnessType?: string | null;
    medicationTaken?: boolean | null;
    medicationName?: string | null;
    feeling?: 'normal' | 'minor_discomfort' | 'bad' | null;
    discomfortLevel?: DiscomfortLevel | null;
    symptoms: string[];
    medications: string[];
}

export interface ScreenTimeRecord {
    totalMinutes: number;
    source: 'manual' | 'imported';
    notes?: string;
}

export interface SupplementRecord {
    id: string;
    name: string;
    taken: boolean;
    notes?: string;
}

export interface AlcoholItem {
    key: string;
    name: string;
    volume: number;
    abv: number;
    count: number;
    pureAlcohol: number;
}

export type DrunkLevel = 'none' | 'tipsy' | 'drunk' | 'wasted';

export interface AlcoholRecord {
    id: string;
    totalGrams: number;
    durationMinutes: number;
    isLate: boolean;
    items: AlcoholItem[];
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
    intensity: 'low' | 'medium' | 'high';
    bodyParts?: string[];
    steps?: number;
    notes?: string;
    feeling?: 'great' | 'ok' | 'tired' | 'bad';
    ongoing?: boolean;
}

export interface ExerciseFeeling {
    value: 'great' | 'ok' | 'tired' | 'bad';
    label: string;
    icon: any;
    color: string;
}

export interface CaffeineItem {
    id: string;
    name: string;
    volume: number;
    time: string;
    count: number;
    isCustom?: boolean;
    isDaily?: boolean; // 全天日常饮用
}

export type DataQualityState = 'recorded' | 'none' | 'unknown' | 'not_recorded' | 'inferred' | 'defaulted';
export type DataQualitySource = 'manual' | 'quick' | 'import' | 'migration' | 'repair' | 'display_default';

export interface FieldQuality {
    state: DataQualityState;
    source: DataQualitySource;
    confidence?: number;
    updatedAt?: number;
}

export interface DataQuality {
    version: 1;
    source: DataQualitySource;
    partial: boolean;
    fields: Record<string, FieldQuality>;
    updatedAt: number;
}

export type HistoryEventType = 'manual' | 'quick' | 'auto';
export type HistoryCategory = 'sex' | 'masturbation' | 'exercise' | 'sleep' | 'morning' | 'lifestyle' | 'health' | 'nap' | 'system' | 'meta';

export interface ChangeDetail {
    field: string;
    oldValue: string | null | undefined;
    newValue: string | null | undefined;
    category: HistoryCategory;
}

export interface ChangeRecord {
    timestamp: number;
    summary: string;
    details?: ChangeDetail[];
    type: HistoryEventType;
    fieldPath?: string;
    operation?: 'set' | 'append' | 'delete' | 'repair';
    actor?: 'user' | 'system' | 'migration';
    source?: DataQualitySource;
    confidence?: DataQualityState;
}

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'foggy';
export type Location = 'home' | 'partner' | 'hotel' | 'travel' | 'other';
export type Mood = 'happy' | 'excited' | 'neutral' | 'anxious' | 'sad' | 'angry';
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type AlcoholConsumption = 'none' | 'low' | 'medium' | 'high';
export type PornConsumption = 'none' | 'low' | 'medium' | 'high';
export type ExerciseIntensity = 'low' | 'medium' | 'high';
export type SexQuality = 1 | 2 | 3 | 4 | 5;

export interface LogEntry {
    date: string;
    status: 'completed' | 'pending';
    updatedAt: number;
    dataQuality?: DataQuality;
    touchedPaths?: string[];
    morning?: MorningRecord;
    sleep?: SleepRecord;
    location?: Location | null;
    weather?: Weather | null;
    mood?: Mood | null;
    stressLevel?: StressLevel | null;
    alcohol?: AlcoholConsumption | null;
    alcoholRecords: AlcoholRecord[];
    pornConsumption?: PornConsumption | null;
    caffeineIntake?: string | null;
    caffeineRecord?: {
        totalCount: number;
        items: CaffeineItem[];
    };
    dailyEvents?: string[];
    tags: string[];
    notes?: string | null;
    exercise: ExerciseRecord[];
    sex: SexRecordDetails[];
    masturbation: MasturbationRecordDetails[];
    health?: Health;
    screenTime?: ScreenTimeRecord | null;
    supplements?: SupplementRecord[];
    menstrual?: MenstrualDailySummary | null;
    changeHistory: ChangeRecord[];
}
