import React, { lazy, Suspense, useMemo, useState } from 'react';
import type { LogEntry } from '../../domain';
import { Activity, BrainCircuit, ChevronRight, Flag, ShieldAlert, Sparkles, Target, TrendingUp } from 'lucide-react';
import { ErrorBoundary } from '../../shared/ui';
import { analyzePersonalState, type AchievableGoal, type ConfidenceLevel, type FactorImpact, type ForecastDay, type StateReason } from './model/PersonalStateEngine';

const StatsView = lazy(() => import('../stats/StatsView'));

type StateTab = 'status' | 'history';

interface StateViewProps {
  isDarkMode: boolean;
  logs: LogEntry[];
}

const confidenceClass: Record<ConfidenceLevel, string> = {
  none: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  low: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  medium: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
};

const stateToneClass: Record<string, string> = {
  peak_ready: 'from-emerald-500 via-lime-500 to-cyan-500',
  stable: 'from-sky-500 via-blue-500 to-indigo-500',
  recovering: 'from-amber-500 via-orange-500 to-rose-500',
  fatigued: 'from-orange-500 via-rose-500 to-pink-500',
  risk: 'from-rose-600 via-red-500 to-orange-500',
  insufficient_data: 'from-slate-500 via-slate-600 to-slate-700'
};

const tabClass = (active: boolean) => (
  `flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${active ? 'bg-white text-brand-accent shadow-sm dark:bg-slate-800' : 'text-brand-muted dark:text-slate-500'}`
);

const factorTone = (positive: boolean) => (
  positive
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-300'
    : 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-300'
);

const labelTone = (label: ForecastDay['label']) => {
  if (label === '高峰日') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (label === '稳定日') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';
  if (label === '恢复日') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
};

const FactorList: React.FC<{ title: string; factors: FactorImpact[]; positive: boolean }> = ({ title, factors, positive }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{title}</h3>
      <span className="text-[10px] font-bold text-slate-400">Top 5</span>
    </div>
    <div className="space-y-3">
      {factors.length === 0 ? (
        <article className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
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
            <span className={`rounded-full px-2 py-1 ${confidenceClass[factor.confidence]}`}>{factor.confidence}</span>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const ForecastCard: React.FC<{ day: ForecastDay }> = ({ day }) => (
  <article className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{day.weekday}</div>
        <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{day.date.slice(5)}</div>
      </div>
      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${labelTone(day.label)}`}>{day.label}</span>
    </div>
    <div className="mt-4 flex items-end justify-between gap-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">硬度</div>
        <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
          {day.predictedHardness !== null ? day.predictedHardness.toFixed(1) : '--'}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">状态分</div>
        <div className="mt-1 text-lg font-black text-slate-700 dark:text-slate-200">{day.predictedStateScore}</div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      {day.reasons.map((reason) => (
        <div key={reason} className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {reason}
        </div>
      ))}
    </div>
    <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400">
      <span>预测置信度</span>
      <span className={`rounded-full px-2 py-1 ${confidenceClass[day.confidence]}`}>{day.confidence}</span>
    </div>
  </article>
);

const GoalCard: React.FC<{ goal: AchievableGoal }> = ({ goal }) => (
  <article className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-black text-slate-900 dark:text-slate-100">{goal.title}</div>
        <div className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{goal.summary}</div>
      </div>
      <Target className="mt-1 text-brand-accent" size={18} />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">当前</div>
        <div className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{goal.currentValue}</div>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">目标</div>
        <div className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{goal.targetValue}</div>
      </div>
    </div>
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
        <span>预计达成度</span>
        <span>{goal.progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${goal.progress}%` }} />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      {goal.actions.map((action) => (
        <div key={action} className="flex items-start gap-2 text-[12px] font-bold text-slate-600 dark:text-slate-300">
          <ChevronRight size={14} className="mt-0.5 shrink-0 text-brand-accent" />
          <span>{action}</span>
        </div>
      ))}
    </div>
  </article>
);

const ReasonChip: React.FC<{ reason: StateReason }> = ({ reason }) => (
  <div className={`rounded-2xl border px-3 py-2 text-xs font-bold ${reason.effect === 'positive'
    ? 'border-white/20 bg-white/15 text-white'
    : 'border-black/10 bg-black/10 text-white'}`}>
    <div>{reason.label}</div>
    <div className="mt-1 text-[11px] font-medium text-white/80">{reason.detail}</div>
  </div>
);

const StateView: React.FC<StateViewProps> = ({ isDarkMode, logs }) => {
  const [activeTab, setActiveTab] = useState<StateTab>('status');
  const result = useMemo(() => analyzePersonalState(logs), [logs]);
  const stateTone = stateToneClass[result.currentState.type] || stateToneClass.stable;
  const weeklyAverageHardness = result.forecast.weeklySummary.averageHardness;

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-bold text-brand-text dark:text-slate-100">状态</h2>
          <span className={`rounded-full px-3 py-1 text-[11px] font-black ${confidenceClass[result.confidence.level]}`}>
            {result.confidence.level} confidence
          </span>
        </div>

        <div className="flex rounded-2xl border border-slate-200 bg-brand-primary p-1 dark:border-slate-800 dark:bg-slate-900/50">
          <button type="button" onClick={() => setActiveTab('status')} className={tabClass(activeTab === 'status')}>状态引擎</button>
          <button type="button" onClick={() => setActiveTab('history')} className={tabClass(activeTab === 'history')}>历史统计</button>
        </div>

        {activeTab === 'status' ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <section className={`overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-white shadow-lg ${stateTone}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">当前状态</div>
                  <div className="mt-3 text-3xl font-black">{result.currentState.label}</div>
                  <div className="mt-2 text-sm font-medium text-white/85">{result.confidence.message}</div>
                </div>
                <div className="rounded-[1.5rem] bg-white/15 px-4 py-3 text-right backdrop-blur-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">状态分</div>
                  <div className="mt-1 text-3xl font-black">{result.currentState.stateScore}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[1.5rem] bg-white/12 p-4 backdrop-blur-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">硬度基线</div>
                  <div className="mt-1 text-2xl font-black">
                    {result.currentState.hardnessBaseline !== null ? result.currentState.hardnessBaseline.toFixed(1) : '--'}
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-white/12 p-4 backdrop-blur-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">趋势</div>
                  <div className="mt-1 text-2xl font-black">
                    {result.currentState.trend === 'up' ? '上行' : result.currentState.trend === 'down' ? '下行' : result.currentState.trend === 'flat' ? '平稳' : '未知'}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {result.currentState.reasons.map((reason) => <ReasonChip key={reason.key} reason={reason} />)}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <article className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <TrendingUp size={14} />
                  7天均值
                </div>
                <div className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">
                  {weeklyAverageHardness !== null ? weeklyAverageHardness.toFixed(1) : '--'}
                </div>
                <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">预计硬度均值</div>
              </article>
              <article className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <Sparkles size={14} />
                  高峰窗口
                </div>
                <div className="mt-3 text-lg font-black text-slate-900 dark:text-slate-100">{result.forecast.weeklySummary.peakWindow}</div>
                <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">周内最适合冲高的日期</div>
              </article>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">未来 7 天</h3>
                <span className="text-[10px] font-bold text-slate-400">周级总结 + 日级预测</span>
              </div>
              <article className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">高峰窗</div>
                    <div className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">{result.forecast.weeklySummary.peakWindow}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">风险窗</div>
                    <div className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">{result.forecast.weeklySummary.riskWindow}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">状态均值</div>
                    <div className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">{result.forecast.weeklySummary.averageStateScore} 分</div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {result.forecast.weeklySummary.summary}
                </div>
              </article>
              <div className="grid gap-3 md:grid-cols-2">
                {result.forecast.days.map((day) => <ForecastCard key={day.date} day={day} />)}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">挑战目标</h3>
                <span className="text-[10px] font-bold text-slate-400">自动生成</span>
              </div>
              <div className="space-y-3">
                {result.achievableGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <FactorList title="正向影响因素" factors={result.influencingFactors.positiveTop5} positive />
              <FactorList title="负向影响因素" factors={result.influencingFactors.negativeTop5} positive={false} />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <Suspense fallback={<div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">统计加载中...</div>}>
              <StatsView isDarkMode={isDarkMode} logs={logs} />
            </Suspense>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default StateView;
