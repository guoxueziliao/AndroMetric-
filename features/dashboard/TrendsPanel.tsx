import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LogEntry } from '../../domain';
import { StatsEngine, METRICS } from '../stats/model/StatsEngine';
import type { MetricId } from '../stats/model/StatsEngine';

interface TrendsPanelProps {
  logs: LogEntry[];
}

interface TrendRow {
  id: MetricId;
  label: string;
  unit: string;
  current: number | null;
  delta: number | null;
  digits: number;
}

const TREND_METRICS: ReadonlyArray<{ id: MetricId; label: string; unit: string; digits: number }> = [
  { id: 'hardness', label: '硬度均线', unit: '级', digits: 1 },
  { id: 'sleep', label: '睡眠均线', unit: 'h', digits: 1 },
  { id: 'screenTime', label: '屏幕均线', unit: 'h', digits: 1 },
  { id: 'masturbation', label: '自慰频次', unit: '次', digits: 1 },
  { id: 'exercise', label: '运动均线', unit: 'min', digits: 0 }
];

const computeRow = (engine: StatsEngine, metric: { id: MetricId; label: string; unit: string; digits: number }): TrendRow => {
  const sma = engine.getSMA(metric.id, 7);
  const current = sma.length >= 1 ? sma[sma.length - 1] : null;
  const prior = sma.length >= 8 ? sma[sma.length - 8] : null;
  const delta = current !== null && prior !== null ? current - prior : null;
  return { id: metric.id, label: metric.label, unit: metric.unit, current, delta, digits: metric.digits };
};

const TrendsPanel: React.FC<TrendsPanelProps> = ({ logs }) => {
  const rows = useMemo(() => {
    const completed = logs.filter(l => l.status === 'completed');
    if (completed.length < 3) return null;
    const engine = new StatsEngine(completed);
    return TREND_METRICS.map(m => computeRow(engine, m));
  }, [logs]);

  return (
    <div className="flex h-60 flex-col rounded-3xl border border-surface-border bg-surface-card p-5 shadow-soft transition-colors">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-full bg-chart-tertiary/10 p-2 text-chart-tertiary"><TrendingUp size={18}/></div>
        <span className="text-sm font-bold text-text-primary">近 7 日趋势</span>
      </div>
      {rows === null ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-surface-border px-4 py-6 text-center text-xs font-medium text-text-muted">
          至少需要 3 条记录才能算均线
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 custom-scrollbar">
          {rows.map(row => {
            const currentText = row.current !== null ? row.current.toFixed(row.digits) : '--';
            const isUp = row.delta !== null && row.delta > 0.05;
            const isDown = row.delta !== null && row.delta < -0.05;
            const Arrow = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
            const colorClass = isUp
              ? 'text-state-success-text'
              : isDown
                ? 'text-state-danger-text'
                : 'text-text-muted';
            const deltaText = row.delta !== null
              ? `${row.delta > 0 ? '+' : ''}${row.delta.toFixed(row.digits)}`
              : 'n/a';
            return (
              <div key={row.id} className="flex items-center justify-between text-sm">
                <span className="font-bold text-text-muted">{row.label}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black tabular-nums text-text-primary">
                    {currentText}<span className="text-[10px] font-bold text-text-muted ml-0.5">{row.unit}</span>
                  </span>
                  <span className={`flex items-center gap-0.5 text-[10px] font-black tabular-nums ${colorClass}`}>
                    <Arrow size={11}/>{deltaText}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="pt-1 text-[10px] text-text-muted">
            对比上一个 7 日窗口 · 基于 {METRICS.hardness.label} 等指标
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendsPanel;
