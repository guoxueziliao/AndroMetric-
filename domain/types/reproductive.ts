export type MenstrualStatus = 'unknown' | 'none' | 'period' | 'fertile_window';

export interface MenstrualDailySummary {
    partnerId?: string | null;
    status: MenstrualStatus;
    cycleDay?: number | null;
    predictedPeriod?: boolean;
    predictedFertileWindow?: boolean;
    notes?: string;
}

export type MenstrualRecord = MenstrualDailySummary;

export type ReproductiveGoal = 'none' | 'trying_to_conceive' | 'avoid_pregnancy' | 'pregnant' | 'post_loss_recovery';
export type CycleRegularity = 'unknown' | 'regular' | 'irregular';

export interface ReproductiveProfile {
    trackingEnabled: boolean;
    goal: ReproductiveGoal;
    cycleRegularity: CycleRegularity;
    typicalCycleLengthDays?: number | null;
    typicalPeriodLengthDays?: number | null;
    lastMenstrualPeriodStart?: string | null;
    pregnancyHistorySummary?: {
        priorPregnancies?: number | null;
        priorLosses?: number | null;
        ectopicHistory?: boolean | null;
    };
    riskFlags?: string[];
}

export type RecordSource = 'manual' | 'imported' | 'derived' | 'legacy';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type CycleEventKind =
    | 'period_start'
    | 'period_end'
    | 'spotting'
    | 'flow'
    | 'cramp'
    | 'cervical_mucus'
    | 'ovulation_test'
    | 'basal_body_temperature'
    | 'libido'
    | 'breast_tenderness'
    | 'intercourse_for_conception';

export interface CycleEvent {
    id: string;
    partnerId: string;
    date: string;
    kind: CycleEventKind;
    source: RecordSource;
    confidence?: ConfidenceLevel;
    notes?: string;
    payload?: {
        flow?: 'light' | 'medium' | 'heavy';
        crampLevel?: 0 | 1 | 2 | 3 | 4 | 5;
        cervicalMucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg_white';
        ovulationTest?: 'negative' | 'high' | 'peak';
        basalBodyTemperatureCelsius?: number;
        libidoLevel?: 1 | 2 | 3 | 4 | 5;
        intercourseProtected?: boolean;
    };
}

export type PregnancyEventKind =
    | 'pregnancy_test'
    | 'suspected_pregnancy'
    | 'bleeding'
    | 'pain'
    | 'clinical_visit'
    | 'ultrasound'
    | 'hcg_result'
    | 'pregnancy_outcome';

export interface PregnancyEvent {
    id: string;
    partnerId: string;
    date: string;
    kind: PregnancyEventKind;
    source: RecordSource;
    notes?: string;
    payload?: {
        pregnancyTest?: 'negative' | 'faint_positive' | 'positive' | 'invalid';
        bleedingLevel?: 'light' | 'moderate' | 'heavy';
        painSeverity?: 0 | 1 | 2 | 3 | 4 | 5;
        painSide?: 'left' | 'right' | 'bilateral' | 'unknown';
        withDizziness?: boolean;
        withShoulderPain?: boolean;
        visitType?: 'clinic' | 'er' | 'phone';
        gestationalSacSeen?: boolean;
        intrauterineConfirmed?: boolean;
        hcgValue?: number;
        pregnancyOutcome?: 'ongoing' | 'chemical' | 'early_loss' | 'ectopic' | 'terminated' | 'unknown';
    };
}
