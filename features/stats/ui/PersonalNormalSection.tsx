import React, { useMemo, useState, useCallback } from 'react';
import { StatsEngine } from '../model/StatsEngine';
import { computePersonalNormal } from '../model/personalNormalEngine';
import type { PersonalNormalResult, PersonalNormalMetric, PersonalNormalState } from '../model/personalNormalTypes';
import { FIRST_LAYER_METRICS, SECONDARY_METRICS } from '../model/personalNormalTypes';
import type { LogEntry } from '../../../domain';
import { StorageService } from '../../../core/storage';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';
import { BarChart3, AlertCircle, Info, ChevronDown, ChevronRight } from 'lucide-react';
import ExplanationLayerSection from './ExplanationLayerSection';
import ObservationPlanConfirmModal from './ObservationPlanConfirmModal';
import ObservationPlanSection from './ObservationPlanSection';
import ExperienceCardSaveModal from './ExperienceCardSaveModal';
import ExperienceCardSection from './ExperienceCardSection';
import type { ObservationPlanDraft } from '../model/observationPlanService';
import { draftToGoalInput } from '../model/observationPlanService';
import { createGoalFromDraft, validateGoalDraft } from '../model/trainingGoalService';
import type { ExperienceCardDraft } from '../model/experienceCardService';
import { draftToCheckin } from '../model/experienceCardService';

// ── State styling ────────────────────────────────────────────────────────────

const STATE_STYLE: Record<PersonalNormalState, { bg: string; text: string; label: string }> = {
  within_personal_normal: { bg: 'bg-state-success-bg', text: 'text-state-success-text', label: '在个人常态内' },
  shift_with_limited_confidence: { bg: 'bg-state-warning-bg', text: 'text-state-warning-text', label: '偏离个人常态' },
  insufficient_data: { bg: 'bg-surface-muted', text: 'text-text-muted', label: '数据不足' },
};

const CONFIDENCE_LABEL: Record<string, string> = {
  none: '',
  low: '样本有限',
  medium: '初步可看',
};

const METRIC_LABELS: Record<string, string> = Object.fromEntries(
  [...FIRST_LAYER_METRICS, ...SECONDARY_METRICS].map((m) => [m.id, m.label])
);

// ── Sub-components ───────────────────────────────────────────────────────────

const MetricCard: React.FC<{ metric: PersonalNormalMetric }> = ({ metric }) => {
  const [expanded, setExpanded] = useState(false);
  const style = STATE_STYLE[metric.state];

  return (
    <div className={`p-3 rounded-xl border border-surface-border ${style.bg}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-text-primary">{metric.label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.text}`}>
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] mb-1">
        <div>
          <p className="text-text-muted">当前值</p>
          <p className="font-bold text-text-primary">
            {metric.currentValue != null ? metric.currentValue.toFixed(1) : '--'}
          </p>
        </div>
        <div>
          <p className="text-text-muted">个人常态</p>
          <p className="font-bold text-text-primary">
            {metric.baselineRange
              ? `${metric.baselineRange[0].toFixed(1)}-${metric.baselineRange[1].toFixed(1)}`
              : '--'}
          </p>
        </div>
        <div>
          <p className="text-text-muted">中位数</p>
          <p className="font-bold text-text-primary">
            {metric.baselineMedian != null ? metric.baselineMedian.toFixed(1) : '--'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <span>n={metric.sampleSize}</span>
        <span>基线 n={metric.baselineSampleSize}</span>
        {metric.coverage > 0 && <span>覆盖 {Math.round(metric.coverage * 100)}%</span>}
        {metric.confidence !== 'none' && <span className={style.text}>{CONFIDENCE_LABEL[metric.confidence]}</span>}
      </div>

      {metric.limitations.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1 text-[10px] text-text-muted hover:text-accent"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          {metric.limitations.length} 条说明
        </button>
      )}

      {expanded && (
        <ul className="mt-1 space-y-0.5 text-[10px] text-text-muted">
          {metric.limitations.map((lim, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="text-text-muted mt-0.5">-</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

interface PersonalNormalSectionProps {
  logs: LogEntry[];
}

const PersonalNormalSection: React.FC<PersonalNormalSectionProps> = ({ logs }) => {
  const [windowDays, setWindowDays] = useState<14 | 30>(14);
  const [observationDraft, setObservationDraft] = useState<ObservationPlanDraft | null>(null);
  const [experienceDraft, setExperienceDraft] = useState<ExperienceCardDraft | null>(null);
  const [planRefreshKey, setPlanRefreshKey] = useState(0);
  const [expRefreshKey, setExpRefreshKey] = useState(0);
  const today = useMemo(() => getActivityTargetDate(new Date()), []);

  const result: PersonalNormalResult = useMemo(() => {
    const engine = new StatsEngine(logs);
    return computePersonalNormal(
      (metricName) => engine.getSeries(metricName as Parameters<typeof engine.getSeries>[0]),
      windowDays,
      today,
    );
  }, [logs, windowDays, today]);

  const primaryMetrics = result.metrics.filter((m) => m.layer === 'primary');
  const secondaryMetrics = result.metrics.filter((m) => m.layer === 'secondary');

  const handleStartObservation = useCallback((draft: ObservationPlanDraft) => {
    setObservationDraft(draft);
  }, []);

  const handleConfirmObservation = useCallback(async (selectedWindowDays: 7 | 14) => {
    if (!observationDraft) return;
    const adjusted = { ...observationDraft, windowDays: selectedWindowDays };
    const goalInput = draftToGoalInput(adjusted);
    const errors = validateGoalDraft(goalInput);
    if (errors.length > 0) return; // keep modal open on validation failure
    const goal = createGoalFromDraft(goalInput, today);
    await StorageService.trainingGoals.save(goal);
    setObservationDraft(null);
    setPlanRefreshKey((k) => k + 1);
  }, [observationDraft, today]);

  const handleSaveExperience = useCallback((draft: ExperienceCardDraft) => {
    setExperienceDraft(draft);
  }, []);

  const handleConfirmExperience = useCallback(async (updated: ExperienceCardDraft) => {
    const checkin = draftToCheckin(updated);
    await StorageService.goalCheckins.save(checkin);
    setExperienceDraft(null);
    setExpRefreshKey((k) => k + 1);
  }, []);

  if (result.metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-6 text-center space-y-2">
        <BarChart3 size={24} className="mx-auto text-text-muted" />
        <p className="text-sm text-text-secondary">暂无足够数据生成个人常态。</p>
        <p className="text-xs text-text-muted">持续记录至少 30 天后再查看。</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {/* Window toggle */}
      <div className="flex p-1 bg-surface-muted rounded-xl border border-surface-border">
        {([14, 30] as const).map((d) => (
          <button
            key={d}
            onClick={() => setWindowDays(d)}
            className={`flex-1 min-h-[36px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
              windowDays === d
                ? 'bg-surface-card text-accent shadow-sm'
                : 'text-text-muted'
            }`}
          >
            近 {d} 天
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 size={12} className="text-accent" />
          <span className="text-xs font-bold text-text-primary">个人常态摘要</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-black text-state-success-text">{result.summary.withinCount}</p>
            <p className="text-[10px] text-text-muted">常态内</p>
          </div>
          <div>
            <p className="text-lg font-black text-state-warning-text">{result.summary.shiftedCount}</p>
            <p className="text-[10px] text-text-muted">有偏离</p>
          </div>
          <div>
            <p className="text-lg font-black text-text-muted">{result.summary.insufficientCount}</p>
            <p className="text-[10px] text-text-muted">数据不足</p>
          </div>
        </div>
      </div>

      {/* Primary metric cards */}
      <div>
        <h3 className="text-xs font-bold text-text-primary mb-2">核心指标</h3>
        <div className="space-y-2">
          {primaryMetrics.map((m) => <MetricCard key={m.id} metric={m} />)}
        </div>
      </div>

      {/* Secondary metric cards */}
      {secondaryMetrics.length > 0 && secondaryMetrics.some((m) => m.state !== 'insufficient_data') && (
        <div>
          <h3 className="text-xs font-bold text-text-primary mb-2">参考指标</h3>
          <div className="space-y-2">
            {secondaryMetrics.map((m) => <MetricCard key={m.id} metric={m} />)}
          </div>
        </div>
      )}

      {/* Explanation layer */}
      {result.summary.shiftedCount > 0 && (
        <ExplanationLayerSection logs={logs} windowDays={windowDays} onStartObservation={handleStartObservation} />
      )}

      {/* Observation plans */}
      <ObservationPlanSection refreshKey={planRefreshKey} onSaveExperience={handleSaveExperience} />

      {/* Experience cards */}
      <ExperienceCardSection refreshKey={expRefreshKey} />

      {/* Record gaps */}
      {result.recordGaps.length > 0 && (
        <div className="p-3 bg-warning/10 rounded-xl border border-warning/30">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertCircle size={12} className="text-warning" />
            <span className="text-xs font-bold text-warning">记录缺口</span>
          </div>
          <div className="space-y-1 text-[10px] text-warning">
            {result.recordGaps.slice(0, 5).map((gap, i) => (
              <p key={i}>
                {METRIC_LABELS[gap.metricId] ?? gap.metricId}：{gap.window === 'current' ? '当前窗口' : '基线'}缺 {gap.missingDays} 天
              </p>
            ))}
            {result.recordGaps.length > 5 && (
              <p>另有 {result.recordGaps.length - 5} 条缺口未展开</p>
            )}
          </div>
        </div>
      )}

      {/* Global limitations */}
      {result.limitations.length > 0 && (
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Info size={12} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted">说明</span>
          </div>
          <ul className="space-y-0.5 text-[10px] text-text-muted">
            {result.limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* Observation plan confirm modal */}
    {observationDraft && (
      <ObservationPlanConfirmModal
        draft={observationDraft}
        onConfirm={handleConfirmObservation}
        onCancel={() => setObservationDraft(null)}
      />
    )}

    {/* Experience card save modal */}
    {experienceDraft && (
      <ExperienceCardSaveModal
        draft={experienceDraft}
        onSave={handleConfirmExperience}
        onCancel={() => setExperienceDraft(null)}
      />
    )}
    </>
  );
};

export default PersonalNormalSection;
