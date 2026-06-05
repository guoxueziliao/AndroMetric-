import React, { lazy, Suspense, useMemo, useState } from 'react';
import type { LogEntry, MetricPreferenceMap } from '../../domain';
import { sortByMetricPreference } from '../../domain';
import { ChevronRight, Sparkles, Target, TrendingUp } from 'lucide-react';
import { ErrorBoundary } from '../../shared/ui';
import { analyzePersonalState, type AchievableGoal, type ConfidenceLevel, type FactorImpact, type ForecastDay, type StateReason } from './model/PersonalStateEngine';

const StatsView = lazy(() => import('../stats/StatsView'));

type StateTab = 'status' | 'history';

interface StateViewProps {
  isDarkMode: boolean;
  logs: LogEntry[];
  metricPreferences?: MetricPreferenceMap;
}

const confidenceClass: Record<ConfidenceLevel, string> = {
  none: 'bg-surface-muted text-text-muted',
  low: 'bg-state-warning-bg text-state-warning-text',
  medium: 'bg-state-info-bg text-state-info-text',
  high: 'bg-state-success-bg text-state-success-text'
};

const confidenceLabel: Record<ConfidenceLevel, string> = {
  none: '无',
  low: '低',
  medium: '中',
  high: '高'
};

const stateToneClass: Record<string, string> = {
  peak_ready: 'from-state-success-text via-accent-muted to-accent',
  stable: 'from-chart-primary via-chart-tertiary to-accent',
  recovering: 'from-state-warning-text via-accent-vivid to-chart-tertiary',
  fatigued: 'from-state-warning-text via-state-danger-text to-accent-vivid',
  risk: 'from-state-danger-text via-accent-vivid to-state-warning-text',
  insufficient_data: 'from-surface-muted via-surface-border to-surface-muted'
};

const tabClass = (active: boolean) => (
  `flex-1 min-h-[44px] rounded-xl px-3 py-2 text-xs font-bold transition-all ${active ? 'bg-surface-card text-accent shadow-sm' : 'text-text-muted'}`
);

const factorTone = (positive: boolean) => (
  positive
    ? 'border-state-success-text/20 bg-state-success-bg text-state-success-text'
    : 'border-state-danger-text/20 bg-state-danger-bg text-state-danger-text'
);

const labelTone = (label: ForecastDay['label']) => {
  if (label === '高峰日') return 'bg-state-success-bg text-state-success-text';
  if (label === '稳定日') return 'bg-state-info-bg text-state-info-text';
  if (label === '恢复日') return 'bg-state-warning-bg text-state-warning-text';
  return 'bg-state-danger-bg text-state-danger-text';
};

const FactorList: React.FC<{ title: string; factors: FactorImpact[]; positive: boolean }> = ({ title, factors, positive }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">{title}</h3>
      <span className="text-[10px] font-bold text-text-muted">Top 5</span>
    </div>
    <div className="space-y-3">
      {factors.length === 0 ? (
        <article className="rounded-[1.5rem] border border-dashed border-surface-border bg-surface-muted p-5 text-sm font-medium text-text-muted">
          目前没有足够的历史对比样本，先继续补齐睡眠、压力、运动和晨勃记录。
        </article>
      ) : factors.map((factor) => (
        <article key={factor.key} className={`rounded-[1.5rem] border p-4 shadow-sm ${factorTone(positive)}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black">{factor.label}</div>
              <div className="mt-1 text-xs font-medium opacity-80">{factor.summary}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black">{factor.delta.toFixed(1)}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">级差</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold opacity-75">
            <span>样本 {factor.sampleSize}</span>
            <span className={`rounded-full px-2 py-1 ${confidenceClass[factor.confidence]}`}>{confidenceLabel[factor.confidence]}</span>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const ForecastCard: React.FC<{ day: ForecastDay }> = ({ day }) => (
  <article className="rounded-[1.5rem] border border-surface-border bg-surface-card p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{day.weekday}</div>
        <div className="mt-1 text-xs font-bold text-text-muted">{day.date.slice(5)}</div>
      </div>
      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${labelTone(day.label)}`}>{day.label}</span>
    </div>
    <div className="mt-4 flex items-end justify-between gap-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">硬度</div>
        <div className="mt-1 text-2xl font-black text-text-primary">
          {day.predictedHardness !== null ? day.predictedHardness.toFixed(1) : '--'}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">状态分</div>
        <div className="mt-1 text-lg font-black text-text-secondary">{day.predictedStateScore}</div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      {day.reasons.map((reason) => (
        <div key={reason} className="rounded-xl bg-surface-muted px-3 py-2 text-[11px] font-bold text-text-secondary">
          {reason}
        </div>
      ))}
    </div>
    <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-text-muted">
      <span>预测置信度</span>
      <span className={`rounded-full px-2 py-1 ${confidenceClass[day.confidence]}`}>{confidenceLabel[day.confidence]}</span>
    </div>
  </article>
);

const GoalCard: React.FC<{ goal: AchievableGoal }> = ({ goal }) => (
  <article className="rounded-[1.75rem] border border-surface-border bg-surface-card p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-black text-text-primary">{goal.title}</div>
        <div className="mt-2 text-sm leading-relaxed text-text-secondary">{goal.summary}</div>
      </div>
      <Target className="mt-1 text-accent" size={18} />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-surface-muted p-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">当前</div>
        <div className="mt-1 text-sm font-black text-text-primary">{goal.currentValue}</div>
      </div>
      <div className="rounded-2xl bg-surface-muted p-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">目标</div>
        <div className="mt-1 text-sm font-black text-text-primary">{goal.targetValue}</div>
      </div>
    </div>
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-text-muted">
        <span>预计达成度</span>
        <span>{goal.progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-muted">
        <div className="h-2 rounded-full bg-gradient-to-r from-chart-primary to-accent" style={{ width: `${goal.progress}%` }} />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      {goal.actions.map((action) => (
        <div key={action} className="flex items-start gap-2 text-[12px] font-bold text-text-secondary">
          <ChevronRight size={14} className="mt-0.5 shrink-0 text-accent" />
          <span>{action}</span>
        </div>
      ))}
    </div>
  </article>
);

const ReasonChip: React.FC<{ reason: StateReason }> = ({ reason }) => (
  <div className={`rounded-2xl border px-3 py-2 text-xs font-bold ${reason.effect === 'positive'
    ? 'border-surface-card/20 bg-surface-card/15 text-text-on-accent'
    : 'border-overlay-scrim/10 bg-overlay-scrim/10 text-text-on-accent'}`}>
    <div>{reason.label}</div>
    <div className="mt-1 text-[11px] font-medium text-text-on-accent/80">{reason.detail}</div>
  </div>
);

const StateView: React.FC<StateViewProps> = ({ isDarkMode, logs, metricPreferences }) => {
  const [activeTab, setActiveTab] = useState<StateTab>('status');
  const result = useMemo(() => analyzePersonalState(logs), [logs]);
  const currentReasons = useMemo(
    () => sortByMetricPreference(result.currentState.reasons, (reason) => reason.key, metricPreferences),
    [metricPreferences, result.currentState.reasons]
  );
  const positiveFactors = useMemo(
    () => sortByMetricPreference(result.influencingFactors.positiveTop5, (factor) => factor.key.replace(/-(positive|negative)$/, ''), metricPreferences),
    [metricPreferences, result.influencingFactors.positiveTop5]
  );
  const negativeFactors = useMemo(
    () => sortByMetricPreference(result.influencingFactors.negativeTop5, (factor) => factor.key.replace(/-(positive|negative)$/, ''), metricPreferences),
    [metricPreferences, result.influencingFactors.negativeTop5]
  );
  const stateTone = stateToneClass[result.currentState.type] || stateToneClass.stable;
  const weeklyAverageHardness = result.forecast.weeklySummary.averageHardness;

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-bold text-text-primary">状态</h2>
          <span className={`rounded-full px-3 py-1 text-[11px] font-black ${confidenceClass[result.confidence.level]}`}>
            置信度 {confidenceLabel[result.confidence.level]}
          </span>
        </div>

        <div className="flex rounded-2xl border border-surface-border bg-surface-muted p-1">
          <button type="button" onClick={() => setActiveTab('status')} className={tabClass(activeTab === 'status')}>状态引擎</button>
          <button type="button" onClick={() => setActiveTab('history')} className={tabClass(activeTab === 'history')}>历史统计</button>
        </div>

        {activeTab === 'status' ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <section className={`overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-text-on-accent shadow-lg ${stateTone}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-text-on-accent/70">当前状态</div>
                  <div className="mt-3 text-3xl font-black">{result.currentState.label}</div>
                  <div className="mt-2 text-sm font-medium text-text-on-accent/85">{result.confidence.message}</div>
                </div>
                <div className="rounded-[1.5rem] bg-surface-card/15 px-4 py-3 text-right backdrop-blur-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-on-accent/65">状态分</div>
                  <div className="mt-1 text-3xl font-black">{result.currentState.stateScore}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[1.5rem] bg-surface-card/15 p-4 backdrop-blur-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-on-accent/65">硬度基线</div>
                  <div className="mt-1 text-2xl font-black">
                    {result.currentState.hardnessBaseline !== null ? result.currentState.hardnessBaseline.toFixed(1) : '--'}
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-surface-card/15 p-4 backdrop-blur-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-on-accent/65">趋势</div>
                  <div className="mt-1 text-2xl font-black">
                    {result.currentState.trend === 'up' ? '上行' : result.currentState.trend === 'down' ? '下行' : result.currentState.trend === 'flat' ? '平稳' : '未知'}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {currentReasons.map((reason) => <ReasonChip key={reason.key} reason={reason} />)}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <article className="rounded-[1.5rem] border border-surface-border bg-surface-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">
                  <TrendingUp size={14} />
                  7天均值
                </div>
                <div className="mt-3 text-3xl font-black text-text-primary">
                  {weeklyAverageHardness !== null ? weeklyAverageHardness.toFixed(1) : '--'}
                </div>
                <div className="mt-1 text-xs font-bold text-text-muted">预计硬度均值</div>
              </article>
              <article className="rounded-[1.5rem] border border-surface-border bg-surface-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">
                  <Sparkles size={14} />
                  高峰窗口
                </div>
                <div className="mt-3 text-lg font-black text-text-primary">{result.forecast.weeklySummary.peakWindow}</div>
                <div className="mt-1 text-xs font-bold text-text-muted">周内最适合冲高的日期</div>
              </article>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">未来 7 天</h3>
                <span className="text-[10px] font-bold text-text-muted">周级总结 + 日级预测</span>
              </div>
              <article className="rounded-[1.75rem] border border-surface-border bg-surface-card p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">高峰窗</div>
                    <div className="mt-2 text-sm font-black text-text-primary">{result.forecast.weeklySummary.peakWindow}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">风险窗</div>
                    <div className="mt-2 text-sm font-black text-text-primary">{result.forecast.weeklySummary.riskWindow}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">状态均值</div>
                    <div className="mt-2 text-sm font-black text-text-primary">{result.forecast.weeklySummary.averageStateScore} 分</div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm font-medium text-text-secondary">
                  {result.forecast.weeklySummary.summary}
                </div>
              </article>
              <div className="grid gap-3 md:grid-cols-2">
                {result.forecast.days.map((day) => <ForecastCard key={day.date} day={day} />)}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">挑战目标</h3>
                <span className="text-[10px] font-bold text-text-muted">自动生成</span>
              </div>
              <div className="space-y-3">
                {result.achievableGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <FactorList title="正向影响因素" factors={positiveFactors} positive />
              <FactorList title="负向影响因素" factors={negativeFactors} positive={false} />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <Suspense fallback={<div className="rounded-[1.5rem] border border-dashed border-surface-border bg-surface-muted p-5 text-sm font-medium text-text-muted">统计加载中...</div>}>
              <StatsView isDarkMode={isDarkMode} logs={logs} metricPreferences={metricPreferences} />
            </Suspense>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default StateView;
