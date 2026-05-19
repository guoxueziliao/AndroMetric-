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
    orgasmIntensity: number | null;
    satisfactionLevel?: number | null; // 1-5: 生理满足感/泄压程度
    mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'angry';
    stressLevel: number | null;
    energyLevel: number | null;
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
