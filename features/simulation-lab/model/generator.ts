import type {
  AlcoholRecord,
  DataQuality,
  DataQualityState,
  ExerciseRecord,
  Health,
  HardnessLevel,
  LogEntry,
  MasturbationRecordDetails,
  MorningRecord,
  ScreenTimeRecord,
  SleepRecord,
  StressLevel
} from '../../../domain';
import { buildDataQualityForLog } from '../../../utils/dataQuality';
import { analyzeSleep } from '../../../shared/lib';
import { buildMissingnessProfile, createBurstActivityMap, resolveFieldState } from './missingness';
import { sampleVirtualProfile } from './presets';
import { applyScenarioAdjustments } from './scenarios';
import { clamp, randomAt } from './rng';
import type {
  GenerateVirtualCohortOptions,
  SimulationFieldGroup,
  VirtualCohortRun,
  VirtualDayPlan,
  VirtualPersonProfile
} from './types';

const DEFAULT_START_DATE = '2026-01-01';
const DEFAULT_FORECAST_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateStr: string, offset: number) => {
  const base = new Date(`${dateStr}T00:00:00`);
  base.setDate(base.getDate() + offset);
  return toDateKey(base);
};

const roundedLevel = (value: number): HardnessLevel | null => {
  if (value < 1.7) return null;
  return clamp(Math.round(value), 1, 5) as HardnessLevel;
};

const quantizeStress = (value: number): StressLevel => clamp(Math.round(value), 1, 5) as StressLevel;

const noise = (seed: number | string, ...parts: Array<string | number>) => (randomAt(seed, ...parts) - 0.5) * 2;

const eventProbability = (perWeek: number, weekday: number) => {
  const weekendBoost = weekday === 0 || weekday === 6 ? 1.2 : 0.9;
  return clamp((perWeek / 7) * weekendBoost, 0, 0.95);
};

const buildBasePlan = (
  profile: VirtualPersonProfile,
  dayIndex: number,
  date: string
): Omit<VirtualDayPlan, 'fieldStates'> => {
  const weekday = new Date(`${date}T00:00:00`).getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const priorScreenBias = noise(profile.seed, 'screen', dayIndex) * 0.8;
  const baseSleep = profile.weekdaySleepHours + (isWeekend ? profile.weekendShiftHours : 0) + (noise(profile.seed, 'sleep', dayIndex) * 0.55);
  const stressRaw = profile.stressBaseline + (isWeekend ? -0.35 : 0.15) + (noise(profile.seed, 'stress', dayIndex) * 0.9);
  const exerciseMinutes = randomAt(profile.seed, 'exercise-hit', dayIndex) < eventProbability(profile.exerciseSessionsPerWeek, weekday)
    ? Math.max(0, Math.round(profile.exerciseMinutesPerSession + (noise(profile.seed, 'exercise-minutes', dayIndex) * 18)))
    : 0;
  const alcoholGrams = randomAt(profile.seed, 'alcohol-hit', dayIndex) < eventProbability(profile.alcoholSessionsPerWeek, weekday)
    ? Math.max(0, Math.round(profile.alcoholGramsPerSession + (noise(profile.seed, 'alcohol-grams', dayIndex) * 12)))
    : 0;
  const sexLoad = randomAt(profile.seed, 'sexload-hit', dayIndex) < eventProbability(profile.sexLoadEventsPerWeek, weekday)
    ? clamp(profile.sexLoadEventsPerWeek >= 4 ? 1.5 + ((randomAt(profile.seed, 'sexload-level', dayIndex) > 0.5) ? 0.5 : 0) : 1, 0, 2.5)
    : 0;
  const screenHours = randomAt(profile.seed, 'screen-zero', dayIndex) < 0.05
    ? 0
    : Math.max(0, profile.screenHoursWeekday + (isWeekend ? 0.6 : 0) + priorScreenBias);
  const isSick = randomAt(profile.seed, 'health', Math.floor(dayIndex / 3), dayIndex % 3) < (profile.illnessProbabilityPer30d / 30);

  return {
    date,
    dayIndex,
    weekday,
    sleepHours: Math.max(4.8, Math.round(baseSleep * 10) / 10),
    sleepQuality: clamp(Math.round(4 - Math.max(0, stressRaw - 2) * 0.6 + (baseSleep >= 7 ? 0.5 : -0.4)), 2, 5),
    stressLevel: quantizeStress(stressRaw),
    alcoholGrams,
    exerciseMinutes,
    sexLoad: Math.round(sexLoad * 10) / 10,
    screenMinutes: Math.round(screenHours * 60),
    isSick,
    wokeWithErection: true,
    morningHardness: 3
  };
};

const deriveHardness = (
  profile: VirtualPersonProfile,
  plans: Array<Omit<VirtualDayPlan, 'fieldStates'>>,
  dayIndex: number
): HardnessLevel | null => {
  const plan = plans[dayIndex];
  const exerciseLagEffect = Array.from({ length: profile.exerciseLagDays }, (_, offset) => {
    const target = plans[dayIndex - (offset + 1)];
    if (!target || target.exerciseMinutes <= 0) return 0;
    return (target.exerciseMinutes / 45) * profile.exerciseResponsiveness * (offset === 0 ? 0.8 : 1);
  }).reduce((sum, value) => sum + value, 0);
  const recoveryPenalty = Array.from({ length: profile.sexLoadRecoveryDays }, (_, offset) => {
    const target = plans[dayIndex - (offset + 1)];
    if (!target) return 0;
    const weight = offset === 0 ? 1 : Math.max(0.2, 1 - (offset * 0.25));
    return Math.max(0, target.sexLoad - 0.5) * 0.18 * weight;
  }).reduce((sum, value) => sum + value, 0);
  const sleepEffect = plan.sleepHours !== null ? (plan.sleepHours - 7) * 0.3 : -0.25;
  const stressEffect = ((plan.stressLevel ?? 3) - 2) * profile.stressSensitivity;
  const alcoholEffect = (plan.alcoholGrams / 20) * profile.alcoholSensitivity;
  const screenEffect = plan.screenMinutes !== null ? Math.max(0, (plan.screenMinutes / 60) - 3.5) * profile.screenTimeSensitivity : 0;
  const illnessPenalty = plan.isSick ? 0.6 : 0;
  const noiseEffect = noise(profile.seed, 'hardness', dayIndex) * profile.hardnessNoiseSd;

  const raw = profile.hardnessBaseline + sleepEffect + exerciseLagEffect - stressEffect - alcoholEffect - screenEffect - recoveryPenalty - illnessPenalty + noiseEffect;
  return roundedLevel(raw);
};

const applyRootState = (
  quality: DataQuality,
  path: string,
  state: DataQualityState,
  updatedAt: number
) => {
  quality.fields[path] = {
    state,
    source: 'manual',
    confidence: state === 'recorded' ? 1 : state === 'inferred' ? 0.75 : undefined,
    updatedAt
  };
};

const finalizeDataQuality = (
  log: LogEntry,
  fieldStates: Partial<Record<string, DataQualityState>>
): DataQuality => {
  const now = log.updatedAt;
  const quality = buildDataQualityForLog(log, 'manual', now);

  Object.entries(fieldStates).forEach(([path, state]) => {
    applyRootState(quality, path, state, now);
  });

  quality.partial = Object.values(quality.fields).some(
    (field) => field.state === 'not_recorded' || field.state === 'unknown'
  );

  return quality;
};

const buildMorningRecord = (date: string, plan: VirtualDayPlan): MorningRecord | undefined => {
  if (plan.fieldStates['morning.wokeWithErection'] === 'not_recorded') return undefined;

  return {
    id: `morning-${date}`,
    timestamp: new Date(`${date}T07:00:00`).getTime(),
    wokeWithErection: plan.wokeWithErection,
    hardness: plan.morningHardness,
    retention: plan.morningHardness ? 'normal' : undefined,
    wokenByErection: false
  };
};

const buildSleepRecord = (date: string, plan: VirtualDayPlan): SleepRecord | undefined => {
  const state = plan.fieldStates['sleep.startTime'];
  if (state === 'not_recorded') return undefined;

  const endTime = new Date(`${date}T07:00:00`);
  const startTime = new Date(endTime.getTime() - ((plan.sleepHours ?? 0) * 60 * 60 * 1000));

  return {
    id: `sleep-${date}`,
    startTime: state === 'unknown' ? null : startTime.toISOString(),
    endTime: state === 'unknown' ? null : endTime.toISOString(),
    quality: plan.sleepQuality ?? 3,
    attire: 'light',
    naturalAwakening: true,
    nocturnalEmission: false,
    withPartner: false,
    preSleepState: (plan.stressLevel ?? 2) >= 4 ? 'stressed' : 'calm',
    naps: [],
    hasDream: false,
    dreamTypes: [],
    environment: {
      location: 'home',
      temperature: 'comfortable'
    }
  };
};

const buildAlcoholRecords = (date: string, grams: number): AlcoholRecord[] => (
  grams > 0
    ? [{
        id: `alc-${date}`,
        totalGrams: grams,
        durationMinutes: 90,
        isLate: grams >= 20,
        items: [{
          key: `drink-${date}`,
          name: 'simulated-drink',
          volume: 500,
          abv: 5,
          count: Math.max(1, Math.round(grams / 12)),
          pureAlcohol: grams
        }],
        time: '21:30',
        ongoing: false,
        drunkLevel: grams >= 40 ? 'drunk' : grams >= 20 ? 'tipsy' : 'none'
      }]
    : []
);

const buildExercise = (date: string, minutes: number): ExerciseRecord[] => (
  minutes > 0
    ? [{
        id: `ex-${date}`,
        type: 'simulated-cardio',
        startTime: '18:30',
        duration: minutes,
        intensity: minutes >= 45 ? 'high' : 'medium',
        feeling: 'ok'
      }]
    : []
);

const buildSexAndMasturbation = (date: string, sexLoad: number): Pick<LogEntry, 'sex' | 'masturbation'> => {
  if (sexLoad >= 1.5) {
    return {
      sex: [{
        id: `sex-${date}`,
        startTime: '22:10',
        duration: 24,
        protection: '无保护措施',
        indicators: {
          lingerie: false,
          orgasm: true,
          partnerOrgasm: false,
          squirting: false,
          toys: false
        },
        ejaculation: sexLoad >= 2,
        mood: 'happy',
        interactions: []
      }],
      masturbation: []
    };
  }

  if (sexLoad > 0) {
    return {
      sex: [],
      masturbation: [{
        id: `mb-${date}`,
        startTime: '22:00',
        duration: 12,
        status: 'completed',
        tools: ['hand'],
        contentItems: [],
        edging: 'none',
        edgingCount: 0,
        lubricant: 'none',
        useCondom: false,
        ejaculation: true,
        orgasmIntensity: 3,
        mood: 'neutral',
        stressLevel: 2,
        energyLevel: 3,
        interrupted: false,
        interruptionReasons: [],
        notes: ''
      }]
    };
  }

  return { sex: [], masturbation: [] };
};

const buildHealth = (plan: VirtualDayPlan): Health | undefined => (
  plan.fieldStates['health.isSick'] === 'not_recorded'
    ? undefined
    : {
        isSick: plan.isSick,
        discomfortLevel: plan.isSick ? 'moderate' : undefined,
        symptoms: plan.isSick ? ['fatigue'] : [],
        medications: []
      }
);

const buildScreenTime = (plan: VirtualDayPlan): ScreenTimeRecord | undefined => {
  if (plan.fieldStates['screenTime.totalMinutes'] === 'not_recorded') return undefined;
  return {
    totalMinutes: plan.screenMinutes ?? 0,
    source: 'manual',
    notes: ''
  };
};

const compilePlanToLog = (plan: VirtualDayPlan): LogEntry => {
  const sexAndMasturbation = buildSexAndMasturbation(plan.date, plan.sexLoad);
  const log: LogEntry = {
    date: plan.date,
    status: 'completed',
    updatedAt: new Date(`${plan.date}T12:00:00`).getTime(),
    morning: buildMorningRecord(plan.date, plan),
    sleep: buildSleepRecord(plan.date, plan),
    stressLevel: plan.fieldStates.stressLevel === 'recorded' ? plan.stressLevel : undefined,
    alcoholRecords: plan.fieldStates.alcoholRecords === 'recorded' ? buildAlcoholRecords(plan.date, plan.alcoholGrams) : [],
    tags: [],
    exercise: plan.fieldStates.exercise === 'recorded' ? buildExercise(plan.date, plan.exerciseMinutes) : [],
    sex: plan.fieldStates.sex === 'recorded' ? sexAndMasturbation.sex : [],
    masturbation: plan.fieldStates.masturbation === 'recorded' ? sexAndMasturbation.masturbation : [],
    health: buildHealth(plan),
    screenTime: buildScreenTime(plan),
    changeHistory: []
  };

  log.dataQuality = finalizeDataQuality(log, plan.fieldStates);
  return log;
};

const deriveFieldStates = (
  profile: VirtualPersonProfile,
  dayIndex: number,
  plan: Omit<VirtualDayPlan, 'fieldStates'>,
  isBurstActive: boolean
): Partial<Record<string, DataQualityState>> => {
  const states: Partial<Record<string, DataQualityState>> = {};
  const baseGroupState = (group: SimulationFieldGroup, hasActualValue: boolean) => (
    resolveFieldState(profile, dayIndex, group, hasActualValue, isBurstActive)
  );

  const morningState = baseGroupState('morning', true);
  states['morning.wokeWithErection'] = morningState;
  if (morningState === 'recorded' && !plan.wokeWithErection) {
    states['morning.hardness'] = 'none';
    states['morning.retention'] = 'none';
    states['morning.wokenByErection'] = 'none';
  } else {
    states['morning.hardness'] = morningState === 'recorded' ? 'recorded' : morningState;
  }

  const sleepState = baseGroupState('sleep', true);
  states['sleep.startTime'] = sleepState;
  states['sleep.endTime'] = sleepState;
  states['sleep.quality'] = sleepState === 'not_recorded' ? 'not_recorded' : 'recorded';

  states.stressLevel = baseGroupState('stress', true);
  states.alcoholRecords = baseGroupState('alcohol', plan.alcoholGrams > 0);
  states.exercise = baseGroupState('exercise', plan.exerciseMinutes > 0);

  const sexLoadState = baseGroupState('sexLoad', plan.sexLoad > 0);
  states.sex = plan.sexLoad >= 1.5 ? sexLoadState : plan.sexLoad > 0 ? 'none' : sexLoadState;
  states.masturbation = plan.sexLoad > 0 && plan.sexLoad < 1.5 ? sexLoadState : plan.sexLoad === 0 ? sexLoadState : 'none';

  states['health.isSick'] = baseGroupState('health', true);
  states['screenTime.totalMinutes'] = baseGroupState('screenTime', true);

  return states;
};

export const generateVirtualCohortRun = (options: GenerateVirtualCohortOptions): VirtualCohortRun => {
  const {
    presetId,
    overlayId,
    scenarioId,
    seed,
    observedDays,
    forecastDays = DEFAULT_FORECAST_DAYS,
    startDate = DEFAULT_START_DATE
  } = options;
  const totalDays = observedDays + forecastDays;
  const missingnessProfile = buildMissingnessProfile(overlayId, seed);
  const profile = sampleVirtualProfile(presetId, seed, totalDays, missingnessProfile);
  const burstActivity = createBurstActivityMap(totalDays, missingnessProfile, seed);
  const basePlans: Array<Omit<VirtualDayPlan, 'fieldStates'>> = [];

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const date = addDays(startDate, dayIndex);
    const basePlan = buildBasePlan(profile, dayIndex, date);
    const adjustedPlan = applyScenarioAdjustments(scenarioId, { ...basePlan, fieldStates: {} }, {
      dayIndex,
      observedDays,
      totalDays,
      weekday: basePlan.weekday
    });
    basePlans.push({
      ...adjustedPlan,
      morningHardness: 3,
      wokeWithErection: true
    });
  }

  const plans: VirtualDayPlan[] = basePlans.map((plan, dayIndex) => {
    const morningHardness = deriveHardness(profile, basePlans, dayIndex);
    const sleepAnalysis = plan.sleepHours !== null
      ? analyzeSleep(
          new Date(new Date(`${plan.date}T07:00:00`).getTime() - (plan.sleepHours * 60 * 60 * 1000)).toISOString(),
          new Date(`${plan.date}T07:00:00`).toISOString()
        )
      : null;
    const updated = {
      ...plan,
      sleepQuality: plan.sleepHours === null
        ? null
        : clamp(Math.round((plan.sleepQuality ?? 3) + (sleepAnalysis?.isLate ? -1 : 0) + (plan.isSick ? -1 : 0)), 2, 5),
      wokeWithErection: morningHardness !== null,
      morningHardness
    };
    const fieldStates = deriveFieldStates(profile, dayIndex, updated, burstActivity[dayIndex]);
    return {
      ...updated,
      fieldStates
    };
  });

  const observedLogs = plans.slice(0, observedDays).map(compilePlanToLog);
  const futureLogs = plans.slice(observedDays).map(compilePlanToLog);

  return {
    id: `${presetId}:${overlayId}:${scenarioId}:${seed}:${observedDays}`,
    presetId,
    overlayId,
    scenarioId,
    seed,
    observedDays,
    forecastDays,
    profile,
    dayPlans: plans,
    observedLogs,
    futureLogs
  };
};
