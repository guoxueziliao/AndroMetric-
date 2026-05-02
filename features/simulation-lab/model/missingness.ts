import type { DataQualityState } from '../../../domain';
import { createSeededRandom, randomAt, sampleRange } from './rng';
import type {
  FieldPolicy,
  MissingnessProfile,
  RecordingOverlayId,
  SimulationFieldGroup,
  VirtualPersonProfile
} from './types';

type OverlayDefinition = {
  label: string;
  captureRate: Record<SimulationFieldGroup, { min: number; max: number }>;
  explicitNoneRate: Partial<Record<SimulationFieldGroup, { min: number; max: number }>>;
  unknownRate: Partial<Record<SimulationFieldGroup, { min: number; max: number }>>;
  burstiness: {
    streakDays: { min: number; max: number };
    gapDays: { min: number; max: number };
  };
  backfillLagDays: { min: number; max: number };
};

const FIELD_POLICY: Record<SimulationFieldGroup, FieldPolicy> = {
  morning: { allowNone: true, allowUnknown: false },
  sleep: { allowNone: false, allowUnknown: true },
  stress: { allowNone: false, allowUnknown: false },
  alcohol: { allowNone: true, allowUnknown: false },
  exercise: { allowNone: true, allowUnknown: false },
  sexLoad: { allowNone: true, allowUnknown: false },
  screenTime: { allowNone: false, allowUnknown: false },
  health: { allowNone: false, allowUnknown: false }
};

export const OVERLAY_CONFIGS: Record<RecordingOverlayId, OverlayDefinition> = {
  full_logger: {
    label: '完整记录型',
    captureRate: {
      morning: { min: 0.92, max: 0.98 },
      sleep: { min: 0.9, max: 0.98 },
      stress: { min: 0.86, max: 0.95 },
      alcohol: { min: 0.86, max: 0.96 },
      exercise: { min: 0.86, max: 0.96 },
      sexLoad: { min: 0.86, max: 0.96 },
      screenTime: { min: 0.8, max: 0.92 },
      health: { min: 0.72, max: 0.88 }
    },
    explicitNoneRate: {
      morning: { min: 0.88, max: 0.98 },
      alcohol: { min: 0.82, max: 0.94 },
      exercise: { min: 0.8, max: 0.92 },
      sexLoad: { min: 0.8, max: 0.92 }
    },
    unknownRate: {
      sleep: { min: 0.01, max: 0.04 }
    },
    burstiness: {
      streakDays: { min: 30, max: 45 },
      gapDays: { min: 0, max: 1 }
    },
    backfillLagDays: { min: 2, max: 5 }
  },
  sleep_only: {
    label: '睡眠偏科型',
    captureRate: {
      morning: { min: 0.9, max: 0.98 },
      sleep: { min: 0.88, max: 0.98 },
      stress: { min: 0.2, max: 0.4 },
      alcohol: { min: 0.12, max: 0.3 },
      exercise: { min: 0.12, max: 0.3 },
      sexLoad: { min: 0.18, max: 0.38 },
      screenTime: { min: 0.1, max: 0.25 },
      health: { min: 0.08, max: 0.2 }
    },
    explicitNoneRate: {
      morning: { min: 0.86, max: 0.98 },
      alcohol: { min: 0.3, max: 0.55 },
      exercise: { min: 0.3, max: 0.55 },
      sexLoad: { min: 0.3, max: 0.55 }
    },
    unknownRate: {
      sleep: { min: 0.02, max: 0.08 }
    },
    burstiness: {
      streakDays: { min: 14, max: 24 },
      gapDays: { min: 1, max: 2 }
    },
    backfillLagDays: { min: 1, max: 3 }
  },
  lifestyle_sparse: {
    label: '生活方式稀疏型',
    captureRate: {
      morning: { min: 0.72, max: 0.88 },
      sleep: { min: 0.65, max: 0.82 },
      stress: { min: 0.5, max: 0.75 },
      alcohol: { min: 0.25, max: 0.55 },
      exercise: { min: 0.25, max: 0.55 },
      sexLoad: { min: 0.4, max: 0.7 },
      screenTime: { min: 0.25, max: 0.45 },
      health: { min: 0.2, max: 0.35 }
    },
    explicitNoneRate: {
      morning: { min: 0.7, max: 0.88 },
      alcohol: { min: 0.25, max: 0.5 },
      exercise: { min: 0.2, max: 0.45 },
      sexLoad: { min: 0.25, max: 0.45 }
    },
    unknownRate: {
      sleep: { min: 0.04, max: 0.12 }
    },
    burstiness: {
      streakDays: { min: 6, max: 12 },
      gapDays: { min: 2, max: 4 }
    },
    backfillLagDays: { min: 0, max: 2 }
  },
  burst_logger: {
    label: '爆发记录型',
    captureRate: {
      morning: { min: 0.8, max: 0.95 },
      sleep: { min: 0.8, max: 0.95 },
      stress: { min: 0.55, max: 0.8 },
      alcohol: { min: 0.45, max: 0.72 },
      exercise: { min: 0.45, max: 0.72 },
      sexLoad: { min: 0.5, max: 0.78 },
      screenTime: { min: 0.28, max: 0.5 },
      health: { min: 0.2, max: 0.4 }
    },
    explicitNoneRate: {
      morning: { min: 0.74, max: 0.9 },
      alcohol: { min: 0.45, max: 0.7 },
      exercise: { min: 0.45, max: 0.7 },
      sexLoad: { min: 0.45, max: 0.7 }
    },
    unknownRate: {
      sleep: { min: 0.03, max: 0.1 }
    },
    burstiness: {
      streakDays: { min: 3, max: 7 },
      gapDays: { min: 2, max: 6 }
    },
    backfillLagDays: { min: 0, max: 1 }
  }
};

const rateFromRange = (seedKey: string, range: { min: number; max: number }) => (
  sampleRange(range, createSeededRandom(seedKey), 3)
);

export const buildMissingnessProfile = (
  overlayId: RecordingOverlayId,
  seed: number
): MissingnessProfile => {
  const config = OVERLAY_CONFIGS[overlayId];

  return {
    overlayId,
    captureRate: {
      morning: rateFromRange(`${overlayId}:${seed}:capture:morning`, config.captureRate.morning),
      sleep: rateFromRange(`${overlayId}:${seed}:capture:sleep`, config.captureRate.sleep),
      stress: rateFromRange(`${overlayId}:${seed}:capture:stress`, config.captureRate.stress),
      alcohol: rateFromRange(`${overlayId}:${seed}:capture:alcohol`, config.captureRate.alcohol),
      exercise: rateFromRange(`${overlayId}:${seed}:capture:exercise`, config.captureRate.exercise),
      sexLoad: rateFromRange(`${overlayId}:${seed}:capture:sexLoad`, config.captureRate.sexLoad),
      screenTime: rateFromRange(`${overlayId}:${seed}:capture:screenTime`, config.captureRate.screenTime),
      health: rateFromRange(`${overlayId}:${seed}:capture:health`, config.captureRate.health)
    },
    explicitNoneRate: {
      morning: config.explicitNoneRate.morning ? rateFromRange(`${overlayId}:${seed}:none:morning`, config.explicitNoneRate.morning) : undefined,
      alcohol: config.explicitNoneRate.alcohol ? rateFromRange(`${overlayId}:${seed}:none:alcohol`, config.explicitNoneRate.alcohol) : undefined,
      exercise: config.explicitNoneRate.exercise ? rateFromRange(`${overlayId}:${seed}:none:exercise`, config.explicitNoneRate.exercise) : undefined,
      sexLoad: config.explicitNoneRate.sexLoad ? rateFromRange(`${overlayId}:${seed}:none:sexLoad`, config.explicitNoneRate.sexLoad) : undefined
    },
    unknownRate: {
      sleep: config.unknownRate.sleep ? rateFromRange(`${overlayId}:${seed}:unknown:sleep`, config.unknownRate.sleep) : undefined
    },
    burstiness: {
      streakDays: Math.max(1, Math.round(rateFromRange(`${overlayId}:${seed}:burst:streak`, config.burstiness.streakDays))),
      gapDays: Math.max(0, Math.round(rateFromRange(`${overlayId}:${seed}:burst:gap`, config.burstiness.gapDays)))
    },
    backfillLagDays: Math.max(0, Math.round(rateFromRange(`${overlayId}:${seed}:backfill`, config.backfillLagDays))),
    fieldPolicy: FIELD_POLICY
  };
};

export const createBurstActivityMap = (
  totalDays: number,
  profile: MissingnessProfile,
  seed: number
): boolean[] => {
  if (profile.overlayId !== 'burst_logger') return Array.from({ length: totalDays }, () => true);

  const days: boolean[] = [];
  let dayIndex = 0;
  let isActive = true;

  while (dayIndex < totalDays) {
    const blockLength = isActive ? profile.burstiness.streakDays : profile.burstiness.gapDays;
    const jitter = createSeededRandom(`${seed}:burst:${dayIndex}:${isActive ? 'on' : 'off'}`).int(0, 2);
    const finalLength = Math.max(1, blockLength + (isActive ? jitter : -Math.min(jitter, blockLength - 1)));

    for (let offset = 0; offset < finalLength && dayIndex < totalDays; offset += 1) {
      days.push(isActive);
      dayIndex += 1;
    }

    isActive = !isActive;
  }

  return days;
};

const groupSeed = (profile: VirtualPersonProfile, dayIndex: number, group: SimulationFieldGroup, suffix: string) => (
  `${profile.seed}:${profile.missingnessProfile.overlayId}:${dayIndex}:${group}:${suffix}`
);

export const resolveFieldState = (
  profile: VirtualPersonProfile,
  dayIndex: number,
  group: SimulationFieldGroup,
  hasActualValue: boolean,
  isBurstActive: boolean
): DataQualityState => {
  if (!isBurstActive) return 'not_recorded';

  const { captureRate, explicitNoneRate, unknownRate, fieldPolicy } = profile.missingnessProfile;
  const capture = randomAt(groupSeed(profile, dayIndex, group, 'capture')) < captureRate[group];
  if (!capture) return 'not_recorded';

  if (fieldPolicy[group].allowUnknown && (unknownRate[group] || 0) > 0) {
    const unknownRoll = randomAt(groupSeed(profile, dayIndex, group, 'unknown'));
    if (unknownRoll < (unknownRate[group] || 0)) return 'unknown';
  }

  if (hasActualValue) return 'recorded';

  if (fieldPolicy[group].allowNone) {
    const noneRoll = randomAt(groupSeed(profile, dayIndex, group, 'none'));
    if (noneRoll < (explicitNoneRate[group] || 0)) return 'none';
  }

  return 'not_recorded';
};
