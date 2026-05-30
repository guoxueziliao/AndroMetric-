import React, { useMemo, useState } from 'react';
import type { LogEntry } from '../../../domain';
import type { TrainingGoal, GoalCheckin } from '../../../domain';
import { StatsEngine } from '../model/StatsEngine';
import { computePersonalNormal } from '../model/personalNormalEngine';
import { computeContextExplanations } from '../model/contextExplanationEngine';
import { getExperienceCards } from '../model/experienceCardService';
import { isObservationPlan } from '../model/observationPlanService';
import { buildStageReview, getCurrentMonth, getPreviousMonth, getMonthRange, getQuarterRange } from '../model/stageReviewBuilder';
import type { StageReview, PeriodType, StageReviewSummary, ReviewObservationPlan } from '../model/stageReviewTypes';
import type { PersonalNormalResult } from '../model/personalNormalTypes';
import type { ContextExplanationCard } from '../model/contextExplanationTypes';
import type { ExperienceCard } from '../model/experienceCardService';
import { StorageService } from '../../../core/storage';
import { Calendar, Info, ChevronDown, ChevronRight } from 'lucide-react';

// ── Context labels ───────────────────────────────────────────────────────────

const CONTEXT_LABELS: Record<string, string> = {
  sleep: '睡眠', stress: '压力', sex_load: '性活动负荷', recovery: '恢复感受',
  porn_use: '色情使用', exercise: '运动', alcohol: '饮酒', screen_time: '屏幕使用',
};

const STATE_LABELS: Record<string, string> = {
  within_personal_normal: '在个人常态内',
  shift_with_limited_confidence: '偏离个人常态',
  insufficient_data: '数据不足',
};

// ── Period selector ──────────────────────────────────────────────────────────

interface PeriodOption {
  label: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
}

const buildPeriodOptions = (): PeriodOption[] => {
  const cur = getCurrentMonth();
  const prev = getPreviousMonth();
  const curMonth = getMonthRange(cur.year, cur.month);
  const prevMonth = getMonthRange(prev.year, prev.month);
  const curQuarter = getQuarterRange(cur.year, Math.ceil(cur.month / 3));

  return [
    { label: `本月 (${cur.month} 月)`, periodType: 'month', ...curMonth },
    { label: `上月 (${prev.month} 月)`, periodType: 'month', ...prevMonth },
    { label: `本季度 (Q${Math.ceil(cur.month / 3)})`, periodType: 'quarter', ...curQuarter },
  ];
};

// ── Summary card ─────────────────────────────────────────────────────────────

const SummaryCard: React.FC<{ summary: StageReviewSummary }> = ({ summary }) => (
  <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
    <div className="flex items-center gap-1.5 mb-2">
      <Calendar size={12} className="text-accent" />
      <span className="text-xs font-bold text-text-primary">{summary.periodLabel}</span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
      <div>
        <p className="text-lg font-black text-state-success-text">{summary.metricsAtNormal}</p>
        <p className="text-text-muted">常态内</p>
      </div>
      <div>
        <p className="text-lg font-black text-state-warning-text">{summary.metricsShifted}</p>
        <p className="text-text-muted">有偏离</p>
      </div>
      <div>
        <p className="text-lg font-black text-text-muted">{summary.metricsInsufficient}</p>
        <p className="text-text-muted">数据不足</p>
      </div>
    </div>
    <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
      <span>记录覆盖 {Math.round(summary.coverage * 100)}%</span>
      <span>{summary.daysWithLogs}/{summary.totalDays} 天</span>
      {summary.observationPlanCount > 0 && <span>{summary.observationPlanCount} 个观察计划</span>}
      {summary.experienceCardCount > 0 && <span>{summary.experienceCardCount} 条经验卡</span>}
    </div>
  </div>
);

// ── Section renderers ────────────────────────────────────────────────────────

const PersonalNormalSummary: React.FC<{ data: PersonalNormalResult }> = ({ data }) => (
  <div className="space-y-1.5">
    {data.metrics.map((m) => (
      <div key={m.id} className="flex items-center justify-between text-[11px]">
        <span className="text-text-secondary">{m.label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-primary">
            {m.currentValue != null ? m.currentValue.toFixed(1) : '--'}
          </span>
          <span className={`text-[10px] ${m.state === 'within_personal_normal' ? 'text-state-success-text' : m.state === 'shift_with_limited_confidence' ? 'text-state-warning-text' : 'text-text-muted'}`}>
            {STATE_LABELS[m.state]}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const ExplanationSummary: React.FC<{ data: ContextExplanationCard[] }> = ({ data }) => (
  <div className="space-y-1">
    {data.slice(0, 3).map((card) => (
      <div key={card.id} className="p-2 bg-surface-card rounded-lg border border-surface-border">
        <p className="text-[11px] text-text-secondary">{card.message}</p>
        <span className="text-[10px] text-text-muted">{CONTEXT_LABELS[card.contextType] ?? card.contextType} · n={card.sampleSize}</span>
      </div>
    ))}
  </div>
);

const ObservationPlanSummary: React.FC<{ data: ReviewObservationPlan[] }> = ({ data }) => (
  <div className="space-y-1">
    {data.map((plan) => (
      <div key={plan.goalId} className="flex items-center justify-between text-[11px] p-2 bg-surface-card rounded-lg border border-surface-border">
        <span className="text-text-primary font-medium">{plan.title}</span>
        <span className="text-[10px] text-text-muted">{plan.windowDays} 天 · {plan.status}</span>
      </div>
    ))}
  </div>
);

const ExperienceCardSummary: React.FC<{ data: ExperienceCard[] }> = ({ data }) => (
  <div className="space-y-1">
    {data.slice(0, 3).map((card) => (
      <div key={card.checkinId} className="p-2 bg-surface-card rounded-lg border border-surface-border">
        <p className="text-[11px] font-medium text-text-primary">{card.title}</p>
        {card.userReflection && <p className="text-[10px] text-text-muted mt-0.5">{card.userReflection}</p>}
      </div>
    ))}
  </div>
);

// ── Collapsible section ──────────────────────────────────────────────────────

const CollapsibleSection: React.FC<{
  title: string;
  available: boolean;
  hiddenReason?: string;
  children: React.ReactNode;
}> = ({ title, available, hiddenReason, children }) => {
  const [expanded, setExpanded] = useState(true);

  if (!available) {
    return (
      <div className="p-3 bg-surface-muted/50 rounded-xl border border-dashed border-surface-border">
        <p className="text-[10px] text-text-muted">{title}：{hiddenReason ?? '数据不足'}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-3 text-left"
      >
        <span className="text-xs font-bold text-text-primary">{title}</span>
        {expanded ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
      </button>
      {expanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

interface StageReviewSectionProps {
  logs: LogEntry[];
}

const StageReviewSection: React.FC<StageReviewSectionProps> = ({ logs }) => {
  const periodOptions = useMemo(() => buildPeriodOptions(), []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [checkins, setCheckins] = useState<GoalCheckin[]>([]);

  // Load goals and checkins once
  React.useEffect(() => {
    const load = async () => {
      const allGoals = await StorageService.trainingGoals.queries.all();
      const allCheckins = await StorageService.goalCheckins.queries.all();
      setGoals(allGoals);
      setCheckins(allCheckins);
    };
    void load();
  }, []);

  const selected = periodOptions[selectedIdx];

  const review: StageReview = useMemo(() => {
    const { startDate, endDate, periodType } = selected;

    // Compute personal normal for the period end date
    const engine = new StatsEngine(logs);
    const personalNormal = computePersonalNormal(
      (name) => engine.getSeries(name as Parameters<typeof engine.getSeries>[0]),
      periodType === 'quarter' ? 30 : 14,
      endDate,
    );

    // Explanation cards
    const explanationCards = computeContextExplanations(
      personalNormal,
      (name) => engine.getSeries(name as Parameters<typeof engine.getSeries>[0]),
      endDate,
    ).cards;

    // Observation plans in period
    const obsPlans: ReviewObservationPlan[] = goals
      .filter(isObservationPlan)
      .filter((g) => g.startDate <= endDate && g.startDate >= startDate || g.status === 'active')
      .map((g) => ({
        goalId: g.id,
        title: g.title,
        status: g.status,
        windowDays: g.targetWindowDays,
        startDate: g.startDate,
        endDate: g.startDate,
      }));

    // Experience cards in period
    const expCards = getExperienceCards(goals, checkins)
      .filter((c) => c.savedAt.slice(0, 10) >= startDate && c.savedAt.slice(0, 10) <= endDate);

    return buildStageReview({
      periodType,
      startDate,
      endDate,
      logs,
      personalNormal,
      explanationCards: explanationCards.length > 0 ? explanationCards : undefined,
      observationPlans: obsPlans.length > 0 ? obsPlans : undefined,
      experienceCards: expCards.length > 0 ? expCards : undefined,
    });
  }, [selected, logs, goals, checkins]);

  const summarySection = review.sections.find((s) => s.type === 'summary');

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex p-1 bg-surface-muted rounded-xl border border-surface-border">
        {periodOptions.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`flex-1 min-h-[36px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
              selectedIdx === idx
                ? 'bg-surface-card text-accent shadow-sm'
                : 'text-text-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {summarySection?.available && (
        <SummaryCard summary={summarySection.data as StageReviewSummary} />
      )}

      {/* Sections */}
      {review.sections.filter((s) => s.type !== 'summary').map((section) => (
        <CollapsibleSection
          key={section.type}
          title={section.title}
          available={section.available}
          hiddenReason={section.hiddenReason}
        >
          {section.type === 'personal_normal' && section.available && (
            <PersonalNormalSummary data={section.data as PersonalNormalResult} />
          )}
          {section.type === 'context_explanations' && section.available && (
            <ExplanationSummary data={section.data as ContextExplanationCard[]} />
          )}
          {section.type === 'observation_plans' && section.available && (
            <ObservationPlanSummary data={section.data as ReviewObservationPlan[]} />
          )}
          {section.type === 'experience_cards' && section.available && (
            <ExperienceCardSummary data={section.data as ExperienceCard[]} />
          )}
          {section.type === 'record_gaps' && section.available && (
            <div className="space-y-0.5 text-[10px] text-warning">
              {(section.data as string[]).map((gap, i) => <p key={i}>{gap}</p>)}
            </div>
          )}
        </CollapsibleSection>
      ))}

      {/* Limitations */}
      {review.limitations.length > 0 && (
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Info size={12} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted">说明</span>
          </div>
          <ul className="space-y-0.5 text-[10px] text-text-muted">
            {review.limitations.map((lim, i) => <li key={i}>{lim}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StageReviewSection;
