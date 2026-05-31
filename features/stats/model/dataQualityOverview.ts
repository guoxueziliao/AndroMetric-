// ── Long-term data quality overview (0.2.16) ─────────────────────────────────
// Read-only coverage view for long-term users: "which of my data can support an
// observation, and which is just scattered." Pure function — no React, no Dexie,
// no DOM. Never persisted or exported. Missing data is reported neutrally and is
// never framed as the user doing something wrong.

import type { LogEntry } from '../../../domain';
import type { InsightConfidence } from '../../../shared/lib/confidence';

export interface DataQualityWindowCoverage {
  windowDays: number;
  recordedDays: number;
  /** 0..1 fraction of calendar days in the window with a completed log. */
  coverage: number;
}

export interface DataQualityGroup {
  id: string;
  label: string;
  windowDays: number;
  recordedDays: number;
  /** 0..1 fraction of calendar days in the window with usable data for this group. */
  coverage: number;
  confidence: InsightConfidence;
  note: string;
  /** Adult / relationship groups: coverage is informational, missing is never a problem. */
  sensitive: boolean;
}

export interface DataQualityOverview {
  totalRecordedDays: number;
  windows: DataQualityWindowCoverage[];
  groups: DataQualityGroup[];
  limitations: string[];
}

const GROUP_WINDOW_DAYS = 90;
const OVERVIEW_WINDOWS = [30, 90, 180];

interface GroupDef {
  id: string;
  label: string;
  sensitive: boolean;
  has: (log: LogEntry) => boolean;
}

const hasValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const GROUP_DEFS: GroupDef[] = [
  {
    id: 'basic',
    label: '基础状态',
    sensitive: false,
    has: (log) =>
      hasValue(log.morning?.wokeWithErection) ||
      hasValue(log.morning?.hardness) ||
      hasValue(log.sleep?.startTime) ||
      hasValue(log.sleep?.endTime) ||
      hasValue(log.mood) ||
      hasValue(log.stressLevel),
  },
  {
    id: 'lifestyle',
    label: '生活因素',
    sensitive: false,
    has: (log) =>
      hasValue(log.exercise) ||
      hasValue(log.alcohol) ||
      hasValue(log.alcoholRecords) ||
      hasValue(log.caffeineRecord?.items) ||
      hasValue(log.caffeineRecord?.totalCount) ||
      hasValue(log.health?.isSick) ||
      hasValue(log.supplements),
  },
  {
    id: 'adult',
    label: '成人健康',
    sensitive: true,
    has: (log) =>
      hasValue(log.sex) ||
      hasValue(log.masturbation) ||
      (hasValue(log.pornConsumption) && log.pornConsumption !== 'none'),
  },
];

const confidenceForCoverage = (coverage: number): InsightConfidence => {
  if (coverage >= 0.6) return 'medium';
  if (coverage > 0) return 'low';
  return 'none';
};

const noteForGroup = (def: GroupDef, confidence: InsightConfidence): string => {
  if (confidence === 'medium') return `${def.label}记录较完整，可用于相关观察。`;
  if (def.sensitive) {
    return confidence === 'low'
      ? `${def.label}记录较少，仅作为覆盖率参考，缺失不代表问题。`
      : `${def.label}暂无记录，缺失不代表问题。`;
  }
  return confidence === 'low'
    ? `${def.label}记录较少，相关结论需要谨慎。`
    : `${def.label}长期为空，可考虑从首页弱化。`;
};

/** Shift a YYYY-MM-DD date string back by `days`, anchored at local noon to avoid DST drift. */
const cutoffDateStr = (today: string, days: number): string => {
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() - (days - 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const computeDataQualityOverview = (
  logs: LogEntry[],
  today: string,
): DataQualityOverview => {
  const completed = logs.filter((l) => l.status === 'completed' && hasValue(l.date));

  const windows: DataQualityWindowCoverage[] = OVERVIEW_WINDOWS.map((windowDays) => {
    const cutoff = cutoffDateStr(today, windowDays);
    const recordedDays = new Set(
      completed.filter((l) => l.date >= cutoff && l.date <= today).map((l) => l.date),
    ).size;
    return { windowDays, recordedDays, coverage: recordedDays / windowDays };
  });

  const groupCutoff = cutoffDateStr(today, GROUP_WINDOW_DAYS);
  const groupLogs = completed.filter((l) => l.date >= groupCutoff && l.date <= today);

  const groups: DataQualityGroup[] = GROUP_DEFS.map((def) => {
    const recordedDays = new Set(groupLogs.filter((l) => def.has(l)).map((l) => l.date)).size;
    const coverage = recordedDays / GROUP_WINDOW_DAYS;
    const confidence = confidenceForCoverage(coverage);
    return {
      id: def.id,
      label: def.label,
      windowDays: GROUP_WINDOW_DAYS,
      recordedDays,
      coverage,
      confidence,
      note: noteForGroup(def, confidence),
      sensitive: def.sensitive,
    };
  });

  const limitations: string[] = [];
  if (completed.length < 30) {
    limitations.push('整体记录天数较少，覆盖率仅供参考，持续记录后更可靠。');
  }
  limitations.push('覆盖率只反映记录多少，不评价记录习惯好坏，也不要求补全历史。');

  return {
    totalRecordedDays: completed.length,
    windows,
    groups,
    limitations,
  };
};
