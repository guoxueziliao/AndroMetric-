import type {
  LogEntry,
  PornUseEvent,
  MasturbationEvent,
  SexEvent,
} from '../../../domain';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';

// ── Window types ─────────────────────────────────────────────────────────────

export type ReviewWindowKind =
  | 'rolling_7d'
  | 'rolling_14d'
  | 'rolling_30d'
  | 'week'
  | 'month';

export interface ReviewWindow {
  kind: ReviewWindowKind;
  startDate: string;
  endDate: string;
  label: string;
}

// ── Daily log input ──────────────────────────────────────────────────────────

export interface AdultBehaviorDailyLogInput {
  targetDate: string;
  morningHardness?: number | null;
  erectionQuality?: number | null;
  sleepDurationMinutes?: number | null;
  sleepQuality?: number | null;
  alcohol?: boolean | null;
  exerciseMinutes?: number | null;
  stressLevel?: number | null;
  moodLevel?: number | null;
  fatigueLevel?: number | null;
  notesPresent?: boolean;
}

// ── Review input ─────────────────────────────────────────────────────────────

export interface AdultBehaviorReviewInput {
  generatedAt: string;
  window: ReviewWindow;
  physiologicalDayBoundaryHour: 3;
  pornUseEvents: PornUseEvent[];
  masturbationEvents: MasturbationEvent[];
  sexEvents: SexEvent[];
  dailyLogs: AdultBehaviorDailyLogInput[];
}

// ── Date helpers ─────────────────────────────────────────────────────────────

export const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
};

// ── Window computation ───────────────────────────────────────────────────────

export const computeWindow = (
  kind: ReviewWindowKind,
  anchorDate: string,
): ReviewWindow => {
  const endDate = anchorDate;

  switch (kind) {
    case 'rolling_7d':
      return {
        kind,
        startDate: addDays(endDate, -6),
        endDate,
        label: '近 7 天',
      };
    case 'rolling_14d':
      return {
        kind,
        startDate: addDays(endDate, -13),
        endDate,
        label: '近 14 天',
      };
    case 'rolling_30d':
      return {
        kind,
        startDate: addDays(endDate, -29),
        endDate,
        label: '近 30 天',
      };
    case 'week': {
      // Natural week: Monday to Sunday, anchored to the week containing anchorDate
      const d = new Date(anchorDate + 'T12:00:00');
      const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = addDays(anchorDate, mondayOffset);
      const sunday = addDays(monday, 6);
      const mondayDate = new Date(monday + 'T12:00:00');
      const label = `${mondayDate.getMonth() + 1}月${mondayDate.getDate()}日周`;
      return {
        kind,
        startDate: monday,
        endDate: sunday < anchorDate ? sunday : (anchorDate < monday ? monday : (sunday > anchorDate ? anchorDate : sunday)),
        label,
      };
    }
    case 'month': {
      const monthStr = anchorDate.slice(0, 7); // YYYY-MM
      const firstDay = `${monthStr}-01`;
      // Last day of month — pure string arithmetic to avoid timezone issues
      const [year, month] = monthStr.split('-').map(Number);
      const lastDayNum = new Date(year, month, 0).getDate();
      const lastDay = `${monthStr}-${String(lastDayNum).padStart(2, '0')}`;
      return {
        kind,
        startDate: firstDay,
        endDate: lastDay < anchorDate ? lastDay : anchorDate,
        label: `${month}月`,
      };
    }
  }
};

// ── Daily log mapper ─────────────────────────────────────────────────────────

const computeSleepDurationMinutes = (log: LogEntry): number | null => {
  if (!log.sleep?.startTime || !log.sleep?.endTime) return null;
  const start = new Date(`2000-01-01T${log.sleep.startTime}:00`);
  let end = new Date(`2000-01-01T${log.sleep.endTime}:00`);
  if (end <= start) {
    end = new Date(`2000-01-02T${log.sleep.endTime}:00`);
  }
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  return minutes > 0 ? minutes : null;
};

const moodToNumeric = (mood: string | null | undefined): number | null => {
  if (!mood) return null;
  const map: Record<string, number> = {
    happy: 5, excited: 4, neutral: 3, anxious: 2, sad: 1, angry: 1,
  };
  return map[mood] ?? null;
};

export const mapLogToDailyInput = (log: LogEntry): AdultBehaviorDailyLogInput => {
  const totalExerciseMinutes = (log.exercise ?? []).reduce(
    (sum, ex) => sum + (ex.duration ?? 0), 0,
  );
  const alcoholValue = log.alcohol === null || log.alcohol === undefined
    ? null
    : log.alcohol !== 'none';

  return {
    targetDate: log.date,
    morningHardness: log.morning?.hardness ?? null,
    erectionQuality: log.morning?.wokeWithErection === true
      ? (log.morning?.hardness ?? null)
      : null,
    sleepDurationMinutes: computeSleepDurationMinutes(log),
    sleepQuality: log.sleep?.quality ?? null,
    alcohol: alcoholValue,
    exerciseMinutes: totalExerciseMinutes > 0 ? totalExerciseMinutes : null,
    stressLevel: log.stressLevel ?? null,
    moodLevel: moodToNumeric(log.mood),
    fatigueLevel: null, // LogEntry has no top-level fatigue field
    notesPresent: typeof log.notes === 'string' && log.notes.length > 0,
  };
};

// ── Adapter ──────────────────────────────────────────────────────────────────

export const buildReviewInput = (input: {
  window: ReviewWindow;
  logs: LogEntry[];
  pornUseEvents: PornUseEvent[];
  masturbationEvents: MasturbationEvent[];
  sexEvents: SexEvent[];
}): AdultBehaviorReviewInput => {
  const { window: win, logs, pornUseEvents, masturbationEvents, sexEvents } = input;

  const windowLogs = logs.filter(
    (log) => log.date >= win.startDate && log.date <= win.endDate,
  );

  const windowPornUse = pornUseEvents.filter(
    (e) => e.targetDate >= win.startDate && e.targetDate <= win.endDate,
  );

  const windowMasturbation = masturbationEvents.filter(
    (e) => e.targetDate >= win.startDate && e.targetDate <= win.endDate,
  );

  const windowSex = sexEvents.filter(
    (e) => e.targetDate >= win.startDate && e.targetDate <= win.endDate,
  );

  return {
    generatedAt: new Date().toISOString(),
    window: win,
    physiologicalDayBoundaryHour: 3,
    pornUseEvents: windowPornUse,
    masturbationEvents: windowMasturbation,
    sexEvents: windowSex,
    dailyLogs: windowLogs.map(mapLogToDailyInput),
  };
};

// ── Convenience: build from current physiological day ────────────────────────

export const buildReviewInputForWindow = (
  kind: ReviewWindowKind,
  logs: LogEntry[],
  pornUseEvents: PornUseEvent[],
  masturbationEvents: MasturbationEvent[],
  sexEvents: SexEvent[],
  anchorDate?: string,
): AdultBehaviorReviewInput => {
  const anchor = anchorDate ?? getActivityTargetDate(new Date());
  const win = computeWindow(kind, anchor);
  return buildReviewInput({ window: win, logs, pornUseEvents, masturbationEvents, sexEvents });
};
