
export type TagType = 'xp' | 'event' | 'symptom';

export interface TagEntry {
    name: string;
    category: TagType;
    dimension?: string; // 仅对 XP 标签有效，如 "角色"、"玩法"
    createdAt: number;
}

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

export type MenstrualStatus = 'unknown' | 'none' | 'period' | 'fertile_window';

export interface MenstrualRecord {
    status: MenstrualStatus;
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
    materials?: string[]; // Legacy
    props?: string[]; // Legacy
    assets?: {
        sources?: string[];
        platforms?: string[];
        categories?: string[];
        target?: string;
        actors?: string[];
    };
    materialsList?: any[]; // Legacy
    edging: 'none' | 'single' | 'multiple';
    edgingCount: number;
    lubricant: string;
    useCondom: boolean;
    ejaculation: boolean;
    orgasmIntensity: number;
    satisfactionLevel?: number; // 1-5: 生理满足感/泄压程度
    mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'angry';
    stressLevel: number;
    energyLevel: number;
    interrupted: boolean;
    interruptionReasons: string[];
    notes: string;
    volumeForceLevel?: number;
    postMood?: string;
    fatigue?: string;
    postFatigue?: string;
    location?: string;
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
    partner?: string;
    location?: string;
    protection: string;
    state?: string;
    indicators: {
        lingerie: boolean;
        orgasm: boolean;
        partnerOrgasm: boolean;
        squirting: boolean;
        toys: boolean;
    };
    ejaculation: boolean;
    ejaculationLocation?: string;
    semenSwallowed?: boolean;
    postSexActivity?: string[];
    partnerScore?: number;
    mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'angry';
    notes?: string;
    interactions: SexInteraction[];
    acts?: string[]; // Legacy
    positions?: string[]; // Legacy
}

export interface ChangeDetail {
    field: string;
    oldValue: string | null | undefined;
    newValue: string | null | undefined;
    category: HistoryCategory;
}

export type HistoryEventType = 'manual' | 'quick' | 'auto';

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

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'foggy';
export type Location = 'home' | 'partner' | 'hotel' | 'travel' | 'other';
export type Mood = 'happy' | 'excited' | 'neutral' | 'anxious' | 'sad' | 'angry';
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type AlcoholConsumption = 'none' | 'low' | 'medium' | 'high';
export type PornConsumption = 'none' | 'low' | 'medium' | 'high';
export type ExerciseIntensity = 'low' | 'medium' | 'high';
export type SexQuality = 1 | 2 | 3 | 4 | 5;
// Added 'meta' to HistoryCategory
export type HistoryCategory = 'sex' | 'masturbation' | 'exercise' | 'sleep' | 'morning' | 'lifestyle' | 'health' | 'nap' | 'system' | 'meta';

export interface CaffeineItem {
    id: string;
    name: string;
    volume: number;
    time: string;
    count: number;
    isCustom?: boolean;
    isDaily?: boolean; // 新增：全天日常饮用
}

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
    menstrual?: MenstrualRecord | null;
    changeHistory: ChangeRecord[];
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

export interface PartnerProfile {
    id: string;
    name: string;
    avatarColor?: string;
    type?: PartnerType;
    isMarried?: boolean;
    age?: number;
    height?: number;
    weight?: number;
    cupSize?: string;
    origin?: string;
    // Added occupation field
    occupation?: string;
    firstEncounterDate?: string;
    contrastDaily?: string;
    contrastBedroom?: string;
    sensitiveSpots: string[];
    stimulationPreferences: string[];
    likedPositions: string[];
    dislikedActs: string[];
    socialTags: string[];
    smoking?: 'none' | 'occasional' | 'frequent';
    alcohol?: 'none' | 'occasional' | 'frequent';
    deepThroatLevel?: 0 | 1 | 2 | 3;
    orgasmDifficulty?: 'easy' | 'medium' | 'hard';
    analDeveloped?: boolean;
    squirtingAbility?: boolean;
    primaryValues?: string;
    petPeeves?: string;
    notes?: string;
    milestones: Record<string, string>;
}

export type PartnerType = 'stable' | 'dating' | 'casual' | 'service';

export interface Snapshot {
    id?: number;
    timestamp: number;
    dataVersion: number;
    appVersion: string;
    description: string;
    data: {
        logs: LogEntry[];
        partners: PartnerProfile[];
        tags?: TagEntry[];
    };
}

export interface StoredData {
    version: number;
    logs: LogEntry[];
}

export interface BackupState {
    lastBackupAt?: number;
    isAutoBackupEnabled: boolean;
}

export type EventType = 'morning_wood' | 'sleep' | 'alcohol' | 'exercise' | 'sex' | 'masturbation' | 'stress' | 'health' | 'screen_time';

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
        score?: number;
        qualityScore?: number;
        satisfactionScore?: number;
        fatigueCost?: number;
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

export interface ExerciseFeeling {
    value: 'great' | 'ok' | 'tired' | 'bad';
    label: string;
    icon: any;
    color: string;
}
