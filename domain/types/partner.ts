import type { ReproductiveProfile } from './reproductive';

export type PartnerType = 'stable' | 'dating' | 'casual' | 'service';

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
    reproductiveProfile?: ReproductiveProfile;
    milestones: Record<string, string>;
}
