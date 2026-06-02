// ── Advanced review filter (0.2.17) ──────────────────────────────────────────
// Pure, read-only structured filtering over LogEntry[] for long-term review.
// NOT a search box, NOT full-text, NOT a saved view — temporary in-memory views
// only. No React, no Dexie, no DOM. Never persisted or exported.
//
// Dimensions implemented in v1 (all derivable from LogEntry alone):
//   - time:        last-N-days / natural week / natural month / custom range
//   - behavior:    sleep / exercise / alcohol / caffeine / sex / masturbation /
//                  porn / partnerInvolved  (OR within the dimension)
//   - dataQuality: complete / missingSleep / missingHardness / lowConfidence
// Dimensions are combined with AND; selections inside one dimension are OR.
//
// Relationship-context and health-project dimensions are intentionally NOT in v1:
// that data lives in separate Dexie tables (sex_events / health_project_logs),
// cannot be derived from LogEntry, and carries private notes. Adding them would
// need join inputs + a privacy pass — out of scope for this read-only v1.

import type { LogEntry } from '../../../domain';

export type TimePreset = 'last7' | 'last14' | 'last30' | 'last90' | 'last180' | 'thisWeek' | 'thisMonth' | 'custom';

export type BehaviorKey =
  | 'sleep'
  | 'exercise'
  | 'alcohol'
  | 'caffeine'
  | 'sex'
  | 'masturbation'
  | 'porn'
  | 'partnerInvolved';

export type DataQualityKey = 'complete' | 'missingSleep' | 'missingHardness' | 'lowConfidence';

export interface ReviewFilterDraft {
  time: TimePreset;
  /** Only used when time === 'custom'. YYYY-MM-DD inclusive bounds. */
  customFrom?: string;
  customTo?: string;
  behaviors: BehaviorKey[];
  dataQuality: DataQualityKey[];
}

export interface ReviewFilter {
  from: string;
  to: string;
  behaviors: BehaviorKey[];
  dataQuality: DataQualityKey[];
}

export interface ReviewFilterSummary {
  hitDays: number;
  /** Total behavior occurrences across hit logs (sex + masturbation + exercise counts). */
  behaviorEvents: number;
  from: string;
  to: string;
  /** Coverage of the selected window: hitDays / window days, 0..1. */
  coverage: number;
}

export interface ReviewFilterResult {
  filter: ReviewFilter;
  logs: LogEntry[];
  summary: ReviewFilterSummary;
  /** True when too few results to draw any conclusion — UI should suggest widening. */
  tooFew: boolean;
}

const MAX_RANGE_DAYS = 366;

const isValidDateStr = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00`).getTime());

/** Shift a YYYY-MM-DD back by `days`, anchored at local noon to avoid DST drift. */
const shiftDays = (dateStr: string, days: number): string => {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Days between two inclusive YYYY-MM-DD bounds (>= 1). */
const inclusiveDayCount = (from: string, to: string): number => {
  const a = new Date(`${from}T12:00:00`).getTime();
  const b = new Date(`${to}T12:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
};

/** Resolve a draft's time dimension into concrete [from, to] bounds, anchored at `today`. */
export const resolveTimeRange = (draft: ReviewFilterDraft, today: string): { from: string; to: string } => {
  const safeToday = isValidDateStr(today) ? today : '1970-01-01';

  switch (draft.time) {
    case 'last7':
      return { from: shiftDays(safeToday, -6), to: safeToday };
    case 'last14':
      return { from: shiftDays(safeToday, -13), to: safeToday };
    case 'last30':
      return { from: shiftDays(safeToday, -29), to: safeToday };
    case 'last90':
      return { from: shiftDays(safeToday, -89), to: safeToday };
    case 'last180':
      return { from: shiftDays(safeToday, -179), to: safeToday };
    case 'thisWeek': {
      // ISO week: Monday start. getDay(): 0=Sun..6=Sat.
      const d = new Date(`${safeToday}T12:00:00`);
      const dow = d.getDay();
      const back = dow === 0 ? 6 : dow - 1;
      return { from: shiftDays(safeToday, -back), to: safeToday };
    }
    case 'thisMonth': {
      const d = new Date(`${safeToday}T12:00:00`);
      const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      return { from: first, to: safeToday };
    }
    case 'custom': {
      const from = isValidDateStr(draft.customFrom) ? draft.customFrom : safeToday;
      const to = isValidDateStr(draft.customTo) ? draft.customTo : safeToday;
      // Normalise reversed bounds.
      return from <= to ? { from, to } : { from: to, to: from };
    }
  }
};

/** Normalise a UI draft into a concrete filter with a bounded time range. */
export const normalizeFilter = (draft: ReviewFilterDraft, today: string): ReviewFilter => {
  let { from, to } = resolveTimeRange(draft, today);
  // Enforce an upper bound on range size so we never try to render an unbounded span.
  if (inclusiveDayCount(from, to) > MAX_RANGE_DAYS) {
    from = shiftDays(to, -(MAX_RANGE_DAYS - 1));
  }
  return {
    from,
    to,
    behaviors: [...draft.behaviors],
    dataQuality: [...draft.dataQuality],
  };
};

const hasArray = (v: unknown): boolean => Array.isArray(v) && v.length > 0;

const matchesBehavior = (log: LogEntry, key: BehaviorKey): boolean => {
  switch (key) {
    case 'sleep':
      return !!(log.sleep && (log.sleep.startTime || log.sleep.endTime || hasArray(log.sleep.naps)));
    case 'exercise':
      return hasArray(log.exercise);
    case 'alcohol':
      return hasArray(log.alcoholRecords) || (!!log.alcohol && log.alcohol !== 'none');
    case 'caffeine':
      return hasArray(log.caffeineRecord?.items) || (log.caffeineRecord?.totalCount ?? 0) > 0;
    case 'sex':
      return hasArray(log.sex);
    case 'masturbation':
      return hasArray(log.masturbation);
    case 'porn':
      return !!log.pornConsumption && log.pornConsumption !== 'none';
    case 'partnerInvolved':
      return (
        (log.sex ?? []).some((r) => typeof r.partner === 'string' && r.partner.trim().length > 0) ||
        log.sleep?.withPartner === true ||
        log.location === 'partner' ||
        !!log.menstrual?.partnerId
      );
  }
};

const isLowConfidenceLog = (log: LogEntry): boolean => {
  const q = log.dataQuality;
  if (!q) return true; // no quality metadata → treat as low-confidence for review purposes
  if (q.partial) return true;
  return false;
};

const matchesDataQuality = (log: LogEntry, key: DataQualityKey): boolean => {
  const hasHardness = !!(log.morning && (log.morning.wokeWithErection != null || log.morning.hardness != null));
  const hasSleep = !!(log.sleep && (log.sleep.startTime || log.sleep.endTime));
  switch (key) {
    case 'complete':
      return hasHardness && hasSleep && !isLowConfidenceLog(log);
    case 'missingSleep':
      return !hasSleep;
    case 'missingHardness':
      return !hasHardness;
    case 'lowConfidence':
      return isLowConfidenceLog(log);
  }
};

const behaviorCount = (log: LogEntry): number =>
  (log.sex?.length ?? 0) + (log.masturbation?.length ?? 0) + (log.exercise?.length ?? 0);

const MIN_MEANINGFUL_HITS = 3;

/** Apply a normalised filter to logs. Pure; returns hit logs sorted newest-first. */
export const applyReviewFilter = (logs: LogEntry[], filter: ReviewFilter): ReviewFilterResult => {
  const hits = logs.filter((log) => {
    if (log.status !== 'completed') return false;
    if (!isValidDateStr(log.date)) return false;
    if (log.date < filter.from || log.date > filter.to) return false;

    // OR within the behavior dimension; dimension applies only if any selected.
    if (filter.behaviors.length > 0 && !filter.behaviors.some((b) => matchesBehavior(log, b))) {
      return false;
    }
    // OR within the data-quality dimension.
    if (filter.dataQuality.length > 0 && !filter.dataQuality.some((d) => matchesDataQuality(log, d))) {
      return false;
    }
    return true;
  });

  const sorted = [...hits].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const hitDays = new Set(sorted.map((l) => l.date)).size;
  const windowDays = inclusiveDayCount(filter.from, filter.to);

  return {
    filter,
    logs: sorted,
    summary: {
      hitDays,
      behaviorEvents: sorted.reduce((acc, l) => acc + behaviorCount(l), 0),
      from: filter.from,
      to: filter.to,
      coverage: hitDays / windowDays,
    },
    tooFew: hitDays > 0 && hitDays < MIN_MEANINGFUL_HITS,
  };
};

/** Convenience: normalise a draft and apply it in one step. */
export const runReviewFilter = (
  logs: LogEntry[],
  draft: ReviewFilterDraft,
  today: string,
): ReviewFilterResult => applyReviewFilter(logs, normalizeFilter(draft, today));
