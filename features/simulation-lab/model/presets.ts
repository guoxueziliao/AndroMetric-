import { createSeededRandom, type Range, sampleRange } from './rng';
import type { CohortPresetId, MissingnessProfile, VirtualPersonProfile } from './types';

type PresetBands = Omit<VirtualPersonProfile, 'personId' | 'seed' | 'days' | 'presetId' | 'missingnessProfile'>;
type PresetRanges = { [K in keyof PresetBands]: Range };

export const PRESET_LABELS: Record<CohortPresetId, string> = {
  steady_healthy: '稳态健康型',
  high_stress_sedentary: '高压久坐型',
  weekend_alcohol_wave: '周末饮酒波动型',
  exercise_responder: '运动改善型',
  high_sexload_recovery: '高性负荷恢复型'
};

export const PRESET_RANGES: Record<CohortPresetId, PresetRanges> = {
  steady_healthy: {
    hardnessBaseline: { min: 4.1, max: 4.7 },
    hardnessNoiseSd: { min: 0.15, max: 0.35 },
    weekdaySleepHours: { min: 7.4, max: 8.4 },
    weekendShiftHours: { min: 0, max: 0.6 },
    stressBaseline: { min: 1.2, max: 2.2 },
    stressSensitivity: { min: 0.08, max: 0.18 },
    alcoholSessionsPerWeek: { min: 0, max: 1 },
    alcoholGramsPerSession: { min: 0, max: 15 },
    alcoholSensitivity: { min: 0.08, max: 0.16 },
    exerciseSessionsPerWeek: { min: 2, max: 4 },
    exerciseMinutesPerSession: { min: 25, max: 45 },
    exerciseResponsiveness: { min: 0.12, max: 0.25 },
    exerciseLagDays: { min: 1, max: 2 },
    sexLoadEventsPerWeek: { min: 2, max: 4 },
    sexLoadRecoveryDays: { min: 1, max: 2 },
    screenHoursWeekday: { min: 1.5, max: 3 },
    screenTimeSensitivity: { min: 0.04, max: 0.1 },
    illnessProbabilityPer30d: { min: 0.02, max: 0.05 }
  },
  high_stress_sedentary: {
    hardnessBaseline: { min: 2.6, max: 3.4 },
    hardnessNoiseSd: { min: 0.3, max: 0.55 },
    weekdaySleepHours: { min: 5.6, max: 6.8 },
    weekendShiftHours: { min: 0.3, max: 1 },
    stressBaseline: { min: 3.6, max: 4.6 },
    stressSensitivity: { min: 0.18, max: 0.35 },
    alcoholSessionsPerWeek: { min: 0, max: 2 },
    alcoholGramsPerSession: { min: 0, max: 25 },
    alcoholSensitivity: { min: 0.12, max: 0.22 },
    exerciseSessionsPerWeek: { min: 0, max: 1 },
    exerciseMinutesPerSession: { min: 0, max: 20 },
    exerciseResponsiveness: { min: 0.08, max: 0.18 },
    exerciseLagDays: { min: 1, max: 2 },
    sexLoadEventsPerWeek: { min: 1, max: 3 },
    sexLoadRecoveryDays: { min: 2, max: 3 },
    screenHoursWeekday: { min: 6, max: 9 },
    screenTimeSensitivity: { min: 0.1, max: 0.22 },
    illnessProbabilityPer30d: { min: 0.04, max: 0.08 }
  },
  weekend_alcohol_wave: {
    hardnessBaseline: { min: 3.2, max: 4 },
    hardnessNoiseSd: { min: 0.35, max: 0.6 },
    weekdaySleepHours: { min: 6.8, max: 7.6 },
    weekendShiftHours: { min: 1.5, max: 3 },
    stressBaseline: { min: 2, max: 3 },
    stressSensitivity: { min: 0.12, max: 0.24 },
    alcoholSessionsPerWeek: { min: 2, max: 4 },
    alcoholGramsPerSession: { min: 20, max: 55 },
    alcoholSensitivity: { min: 0.16, max: 0.3 },
    exerciseSessionsPerWeek: { min: 1, max: 2 },
    exerciseMinutesPerSession: { min: 20, max: 40 },
    exerciseResponsiveness: { min: 0.1, max: 0.22 },
    exerciseLagDays: { min: 1, max: 3 },
    sexLoadEventsPerWeek: { min: 2, max: 4 },
    sexLoadRecoveryDays: { min: 1, max: 2 },
    screenHoursWeekday: { min: 3, max: 5.5 },
    screenTimeSensitivity: { min: 0.06, max: 0.14 },
    illnessProbabilityPer30d: { min: 0.03, max: 0.06 }
  },
  exercise_responder: {
    hardnessBaseline: { min: 3, max: 3.8 },
    hardnessNoiseSd: { min: 0.2, max: 0.45 },
    weekdaySleepHours: { min: 6.8, max: 7.8 },
    weekendShiftHours: { min: 0.5, max: 1.2 },
    stressBaseline: { min: 2, max: 3 },
    stressSensitivity: { min: 0.1, max: 0.2 },
    alcoholSessionsPerWeek: { min: 0, max: 1 },
    alcoholGramsPerSession: { min: 0, max: 15 },
    alcoholSensitivity: { min: 0.08, max: 0.16 },
    exerciseSessionsPerWeek: { min: 3, max: 5 },
    exerciseMinutesPerSession: { min: 35, max: 60 },
    exerciseResponsiveness: { min: 0.22, max: 0.4 },
    exerciseLagDays: { min: 1, max: 3 },
    sexLoadEventsPerWeek: { min: 1, max: 3 },
    sexLoadRecoveryDays: { min: 1, max: 2 },
    screenHoursWeekday: { min: 2.5, max: 4.5 },
    screenTimeSensitivity: { min: 0.05, max: 0.12 },
    illnessProbabilityPer30d: { min: 0.02, max: 0.05 }
  },
  high_sexload_recovery: {
    hardnessBaseline: { min: 3.1, max: 3.9 },
    hardnessNoiseSd: { min: 0.3, max: 0.5 },
    weekdaySleepHours: { min: 6.7, max: 7.6 },
    weekendShiftHours: { min: 0.5, max: 1.3 },
    stressBaseline: { min: 2.2, max: 3.4 },
    stressSensitivity: { min: 0.14, max: 0.28 },
    alcoholSessionsPerWeek: { min: 0, max: 2 },
    alcoholGramsPerSession: { min: 0, max: 25 },
    alcoholSensitivity: { min: 0.1, max: 0.2 },
    exerciseSessionsPerWeek: { min: 1, max: 3 },
    exerciseMinutesPerSession: { min: 20, max: 40 },
    exerciseResponsiveness: { min: 0.1, max: 0.22 },
    exerciseLagDays: { min: 1, max: 2 },
    sexLoadEventsPerWeek: { min: 4, max: 7 },
    sexLoadRecoveryDays: { min: 2, max: 4 },
    screenHoursWeekday: { min: 3, max: 5.5 },
    screenTimeSensitivity: { min: 0.08, max: 0.16 },
    illnessProbabilityPer30d: { min: 0.03, max: 0.07 }
  }
};

export const sampleVirtualProfile = (
  presetId: CohortPresetId,
  seed: number,
  days: number,
  missingnessProfile: MissingnessProfile
): VirtualPersonProfile => {
  const ranges = PRESET_RANGES[presetId];
  const random = createSeededRandom(`profile:${presetId}:${seed}`);

  return {
    personId: `${presetId}-${seed}`,
    seed,
    days,
    presetId,
    hardnessBaseline: sampleRange(ranges.hardnessBaseline, random, 2),
    hardnessNoiseSd: sampleRange(ranges.hardnessNoiseSd, random, 2),
    weekdaySleepHours: sampleRange(ranges.weekdaySleepHours, random, 2),
    weekendShiftHours: sampleRange(ranges.weekendShiftHours, random, 2),
    stressBaseline: sampleRange(ranges.stressBaseline, random, 2),
    stressSensitivity: sampleRange(ranges.stressSensitivity, random, 2),
    alcoholSessionsPerWeek: sampleRange(ranges.alcoholSessionsPerWeek, random, 2),
    alcoholGramsPerSession: sampleRange(ranges.alcoholGramsPerSession, random, 2),
    alcoholSensitivity: sampleRange(ranges.alcoholSensitivity, random, 2),
    exerciseSessionsPerWeek: sampleRange(ranges.exerciseSessionsPerWeek, random, 2),
    exerciseMinutesPerSession: sampleRange(ranges.exerciseMinutesPerSession, random, 2),
    exerciseResponsiveness: sampleRange(ranges.exerciseResponsiveness, random, 2),
    exerciseLagDays: Math.round(sampleRange(ranges.exerciseLagDays, random, 0)),
    sexLoadEventsPerWeek: sampleRange(ranges.sexLoadEventsPerWeek, random, 2),
    sexLoadRecoveryDays: Math.round(sampleRange(ranges.sexLoadRecoveryDays, random, 0)),
    screenHoursWeekday: sampleRange(ranges.screenHoursWeekday, random, 2),
    screenTimeSensitivity: sampleRange(ranges.screenTimeSensitivity, random, 2),
    illnessProbabilityPer30d: sampleRange(ranges.illnessProbabilityPer30d, random, 3),
    missingnessProfile
  };
};
