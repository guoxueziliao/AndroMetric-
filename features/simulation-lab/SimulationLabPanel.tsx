import React, { useMemo, useState } from 'react';
import { FlaskConical, Radar, ShieldCheck, Sparkles } from 'lucide-react';
import { PRESET_LABELS } from './model/presets';
import { OVERLAY_CONFIGS } from './model/missingness';
import { SCENARIO_SPECS } from './model/scenarios';
import { runVirtualCohortBacktest } from './model/backtest';
import type { CohortPresetId, RecordingOverlayId, ScenarioId } from './model/types';

const SelectField = ({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) => (
  <label className="space-y-1.5 block">
    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-accent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </label>
);

const StatCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className={`rounded-2xl border p-4 ${tone}`}>
    <div className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</div>
    <div className="mt-2 text-2xl font-black">{value}</div>
  </div>
);

const SimulationLabPanel: React.FC = () => {
  const [presetId, setPresetId] = useState<CohortPresetId>('steady_healthy');
  const [overlayId, setOverlayId] = useState<RecordingOverlayId>('full_logger');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('baseline');
  const [seed, setSeed] = useState(1001);
  const [observedDays, setObservedDays] = useState(90);

  const result = useMemo(() => runVirtualCohortBacktest({
    presetId,
    overlayId,
    scenarioId,
    seed,
    observedDays
  }), [presetId, overlayId, scenarioId, seed, observedDays]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-sky-200/70 dark:border-sky-900/50 bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 p-3">
            <FlaskConical size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">虚拟回测实验室</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">只使用种子化虚拟人群，不读取真实日志。</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SelectField
          label="人设"
          value={presetId}
          onChange={(value) => setPresetId(value as CohortPresetId)}
          options={Object.entries(PRESET_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="记录风格"
          value={overlayId}
          onChange={(value) => setOverlayId(value as RecordingOverlayId)}
          options={Object.entries(OVERLAY_CONFIGS).map(([value, config]) => ({ value, label: config.label }))}
        />
        <SelectField
          label="情境"
          value={scenarioId}
          onChange={(value) => setScenarioId(value as ScenarioId)}
          options={Object.values(SCENARIO_SPECS).map((scenario) => ({ value: scenario.id, label: scenario.label }))}
        />
        <label className="space-y-1.5 block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">种子</span>
          <input
            type="number"
            value={seed}
            onChange={(event) => setSeed(Number(event.target.value) || 1001)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-accent"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>观察窗口</span>
          <span>{observedDays} 天</span>
        </div>
        <input
          type="range"
          min={30}
          max={180}
          step={5}
          value={observedDays}
          onChange={(event) => setObservedDays(Number(event.target.value))}
          className="w-full"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="当前状态" value={result.analysis.currentState.label} tone="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100" />
        <StatCard label="置信度" value={result.analysis.confidence.level.toUpperCase()} tone="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300" />
        <StatCard label="方向正确率" value={`${Math.round(result.evaluation.directionCorrectness * 100)}%`} tone="bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300" />
        <StatCard label="排序稳定性" value={`${Math.round(result.evaluation.factorRankingStability * 100)}%`} tone="bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300" />
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
          <Sparkles size={16} />
          7 天预测摘要
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{result.analysis.forecast.weeklySummary.summary}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">高峰窗</div>
            <div className="mt-1 font-bold">{result.analysis.forecast.weeklySummary.peakWindow}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">风险窗</div>
            <div className="mt-1 font-bold">{result.analysis.forecast.weeklySummary.riskWindow}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
          <Radar size={16} />
          因素排行
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">正向 Top 5</div>
            <div className="mt-2 space-y-1 text-sm">
              {result.analysis.influencingFactors.positiveTop5.map((item) => (
                <div key={item.key}>{item.label}</div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-300">负向 Top 5</div>
            <div className="mt-2 space-y-1 text-sm">
              {result.analysis.influencingFactors.negativeTop5.map((item) => (
                <div key={item.key}>{item.label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
          <ShieldCheck size={16} />
          可用性与回测
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">校准误差</div>
            <div className="mt-1 font-bold">{result.evaluation.forecastCalibrationError ?? '--'}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">误报代理</div>
            <div className="mt-1 font-bold">{result.evaluation.reminderFalsePositiveProxy}</div>
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(result.availabilitySummary).map(([metricId, summary]) => (
            <div key={metricId} className="flex items-center justify-between text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 px-3 py-2">
              <span className="font-medium">{metricId}</span>
              <span className="text-slate-500 dark:text-slate-400">
                usable {Math.round(summary.usableRate * 100)}% / none {summary.noneDays} / miss {summary.missingDays}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulationLabPanel;
