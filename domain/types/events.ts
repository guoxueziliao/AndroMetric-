export type EventType =
    | 'morning_wood'
    | 'sleep'
    | 'alcohol'
    | 'exercise'
    | 'sex'
    | 'masturbation'
    | 'stress'
    | 'health'
    | 'screen_time'
    | 'menstrual'
    | 'ovulation_test'
    | 'fertility_window'
    | 'pregnancy_test'
    | 'pregnancy_outcome';

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
