import React, { useMemo, useState } from 'react';
import type { LogEntry, MetricPreferenceMap } from '../../../domain';
import { sortByMetricPreference } from '../../../domain';
import {
  runReviewFilter,
  type ReviewFilterDraft,
  type TimePreset,
  type BehaviorKey,
  type DataQualityKey,
} from '../model/advancedReviewFilter';
import { generateLogSummary } from '../../../shared/lib/logPresentation';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';
import { Filter, X, CalendarRange, Info } from 'lucide-react';

// ── Option labels ────────────────────────────────────────────────────────────

const TIME_OPTIONS: { key: TimePreset; label: string }[] = [
  { key: 'last7', label: '近 7 天' },
  { key: 'last14', label: '近 14 天' },
  { key: 'last30', label: '近 30 天' },
  { key: 'last90', label: '近 90 天' },
  { key: 'last180', label: '近 180 天' },
  { key: 'thisWeek', label: '本周' },
  { key: 'thisMonth', label: '本月' },
  { key: 'custom', label: '自定义' },
];

const BEHAVIOR_OPTIONS: { key: BehaviorKey; label: string }[] = [
  { key: 'sleep', label: '睡眠' },
  { key: 'exercise', label: '运动' },
  { key: 'alcohol', label: '饮酒' },
  { key: 'caffeine', label: '咖啡因' },
  { key: 'sex', label: '性生活' },
  { key: 'masturbation', label: '自慰' },
  { key: 'porn', label: '色情使用' },
  { key: 'partnerInvolved', label: '涉及伴侣' },
];

const QUALITY_OPTIONS: { key: DataQualityKey; label: string }[] = [
  { key: 'complete', label: '记录完整' },
  { key: 'missingSleep', label: '缺睡眠' },
  { key: 'missingHardness', label: '缺晨间硬度' },
  { key: 'lowConfidence', label: '可信度低' },
];

const TIME_LABEL: Record<TimePreset, string> = Object.fromEntries(
  TIME_OPTIONS.map((o) => [o.key, o.label]),
) as Record<TimePreset, string>;
const BEHAVIOR_LABEL: Record<BehaviorKey, string> = Object.fromEntries(
  BEHAVIOR_OPTIONS.map((o) => [o.key, o.label]),
) as Record<BehaviorKey, string>;
const QUALITY_LABEL: Record<DataQualityKey, string> = Object.fromEntries(
  QUALITY_OPTIONS.map((o) => [o.key, o.label]),
) as Record<DataQualityKey, string>;

// ── Toggle pill ──────────────────────────────────────────────────────────────

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-h-[36px] px-3 py-1 text-[11px] font-bold rounded-full border transition-colors ${
      active
        ? 'bg-accent text-text-on-accent border-transparent'
        : 'bg-transparent text-text-muted border-surface-border'
    }`}
  >
    {children}
  </button>
);

// ── Result row ───────────────────────────────────────────────────────────────

const ResultRow: React.FC<{ log: LogEntry }> = ({ log }) => {
  const summary = useMemo(() => generateLogSummary(log).slice(0, 4), [log]);
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-2.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary">{log.date}</span>
        <span className="text-[10px] text-text-muted">
          {(log.sex?.length ?? 0) + (log.masturbation?.length ?? 0) + (log.exercise?.length ?? 0)} 项行为
        </span>
      </div>
      {summary.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-text-secondary">
          {summary.map((s, i) => (
            <span key={i}>
              <span className="text-text-muted">{s.label}</span> {s.value}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-text-muted">仅基础记录</p>
      )}
    </div>
  );
};

// ── Main section ─────────────────────────────────────────────────────────────

interface AdvancedReviewSectionProps {
  logs: LogEntry[];
  metricPreferences?: MetricPreferenceMap;
}

const MAX_RENDER = 60;

const BEHAVIOR_METRIC_ID: Record<BehaviorKey, string> = {
  sleep: 'sleep',
  exercise: 'exercise',
  alcohol: 'alcohol',
  caffeine: 'caffeine',
  sex: 'sex',
  masturbation: 'masturbation',
  porn: 'porn',
  partnerInvolved: 'relationship'
};

const QUALITY_METRIC_ID: Record<DataQualityKey, string> = {
  complete: 'dataQuality',
  missingSleep: 'sleep',
  missingHardness: 'hardness',
  lowConfidence: 'dataQuality'
};

const AdvancedReviewSection: React.FC<AdvancedReviewSectionProps> = ({ logs, metricPreferences }) => {
  const today = useMemo(() => getActivityTargetDate(new Date()), []);
  const [time, setTime] = useState<TimePreset>('last30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [behaviors, setBehaviors] = useState<BehaviorKey[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQualityKey[]>([]);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const draft: ReviewFilterDraft = useMemo(
    () => ({ time, customFrom, customTo, behaviors, dataQuality }),
    [time, customFrom, customTo, behaviors, dataQuality],
  );

  const result = useMemo(() => runReviewFilter(logs, draft, today), [logs, draft, today]);
  const behaviorOptions = useMemo(
    () => sortByMetricPreference(BEHAVIOR_OPTIONS, (option) => BEHAVIOR_METRIC_ID[option.key], metricPreferences),
    [metricPreferences]
  );
  const qualityOptions = useMemo(
    () => sortByMetricPreference(QUALITY_OPTIONS, (option) => QUALITY_METRIC_ID[option.key], metricPreferences),
    [metricPreferences]
  );

  const hasNonDefault = behaviors.length > 0 || dataQuality.length > 0 || time !== 'last30';

  const clearAll = () => {
    setTime('last30');
    setCustomFrom('');
    setCustomTo('');
    setBehaviors([]);
    setDataQuality([]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Filter size={14} className="text-accent" />
        <span className="text-sm font-bold text-text-primary">自定义回看</span>
        <span className="ml-auto text-[10px] text-text-muted">只读筛选，不保存视图</span>
      </div>

      {/* Time dimension */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">时间</p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((o) => (
            <Pill key={o.key} active={time === o.key} onClick={() => setTime(o.key)}>
              {o.label}
            </Pill>
          ))}
        </div>
        {time === 'custom' && (
          <div className="flex items-center gap-2 pt-1">
            <CalendarRange size={12} className="text-text-muted" />
            <input
              type="date"
              value={customFrom}
              max={today}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="min-h-[36px] rounded-lg border border-surface-border bg-surface-card px-2 text-[11px] text-text-primary"
            />
            <span className="text-[10px] text-text-muted">至</span>
            <input
              type="date"
              value={customTo}
              max={today}
              onChange={(e) => setCustomTo(e.target.value)}
              className="min-h-[36px] rounded-lg border border-surface-border bg-surface-card px-2 text-[11px] text-text-primary"
            />
          </div>
        )}
      </div>

      {/* Behavior dimension */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">行为（多选取并集）</p>
        <div className="flex flex-wrap gap-1.5">
          {behaviorOptions.map((o) => (
            <Pill key={o.key} active={behaviors.includes(o.key)} onClick={() => setBehaviors(toggle(behaviors, o.key))}>
              {o.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Data-quality dimension */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">记录质量</p>
        <div className="flex flex-wrap gap-1.5">
          {qualityOptions.map((o) => (
            <Pill
              key={o.key}
              active={dataQuality.includes(o.key)}
              onClick={() => setDataQuality(toggle(dataQuality, o.key))}
            >
              {o.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Active condition chips */}
      {hasNonDefault && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-surface-muted p-2">
          <span className="rounded-full bg-surface-card px-2 py-0.5 text-[10px] font-bold text-text-secondary">
            {TIME_LABEL[time]}
          </span>
          {behaviors.map((b) => (
            <span key={b} className="rounded-full bg-surface-card px-2 py-0.5 text-[10px] text-text-secondary">
              {BEHAVIOR_LABEL[b]}
            </span>
          ))}
          {dataQuality.map((d) => (
            <span key={d} className="rounded-full bg-surface-card px-2 py-0.5 text-[10px] text-text-secondary">
              {QUALITY_LABEL[d]}
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 text-[10px] font-bold text-accent hover:underline"
          >
            <X size={10} /> 清空
          </button>
        </div>
      )}

      {/* Result summary */}
      <div className="rounded-xl border border-surface-border bg-surface-muted p-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-black text-accent">{result.summary.hitDays}</p>
            <p className="text-[10px] text-text-muted">命中天数</p>
          </div>
          <div>
            <p className="text-lg font-black text-text-primary">{result.summary.behaviorEvents}</p>
            <p className="text-[10px] text-text-muted">行为次数</p>
          </div>
          <div>
            <p className="text-lg font-black text-text-primary">{Math.round(result.summary.coverage * 100)}%</p>
            <p className="text-[10px] text-text-muted">窗口覆盖</p>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-text-muted">
          {result.summary.from} 至 {result.summary.to}
        </p>
      </div>

      {/* Too-few hint */}
      {result.tooFew && (
        <div className="flex items-start gap-1.5 rounded-xl bg-state-info-bg/60 p-2.5">
          <Info size={12} className="mt-0.5 shrink-0 text-state-info-text" />
          <p className="text-[10px] leading-relaxed text-state-info-text">
            命中记录较少，建议放宽时间或减少筛选条件，不在此基础上下结论。
          </p>
        </div>
      )}

      {/* Result list */}
      {result.logs.length > 0 ? (
        <div className="space-y-2">
          {result.logs.slice(0, MAX_RENDER).map((log) => (
            <ResultRow key={log.date} log={log} />
          ))}
          {result.logs.length > MAX_RENDER && (
            <p className="text-center text-[10px] text-text-muted">
              仅展示最近 {MAX_RENDER} 天，共 {result.logs.length} 天命中，请缩小时间范围查看更早记录。
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-6 text-center">
          <p className="text-xs text-text-secondary">当前条件下没有命中记录。</p>
          <p className="mt-1 text-[10px] text-text-muted">放宽时间或减少筛选条件再试。</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedReviewSection;
