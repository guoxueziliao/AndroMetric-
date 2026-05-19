import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, BrainCircuit } from 'lucide-react';
import type { LogEntry } from '../../domain';
import { StatsEngine } from '../stats/model/StatsEngine';
import type { MetricId } from '../stats/model/StatsEngine';

interface ImpactFindingsProps {
  logs: LogEntry[];
}

const FACTORS: ReadonlyArray<{ id: MetricId; label: string; goodWhenPositive: boolean }> = [
  { id: 'sleep', label: '睡眠', goodWhenPositive: true },
  { id: 'alcohol', label: '饮酒', goodWhenPositive: false },
  { id: 'stress', label: '压力', goodWhenPositive: false },
  { id: 'exercise', label: '运动', goodWhenPositive: true },
  { id: 'sexLoad', label: '性活动负荷', goodWhenPositive: false }
];

interface FindingRow {
  id: MetricId;
  label: string;
  diff: number;
  sampleSize: number;
  isHelpful: boolean;
}

const ImpactFindings: React.FC<ImpactFindingsProps> = ({ logs }) => {
  const findings = useMemo<FindingRow[] | null>(() => {
    const completed = logs.filter(l => l.status === 'completed');
    if (completed.length < 7) return null;
    const engine = new StatsEngine(completed);
    const rows: FindingRow[] = [];
    FACTORS.forEach(f => {
      const r = engine.analyzeImpact(f.id, 'hardness');
      if (!r || r.sampleSize < 3) return;
      if (Math.abs(r.diff) < 0.3) return;
      const isPositiveDiff = r.diff > 0;
      const isHelpful = f.goodWhenPositive ? isPositiveDiff : !isPositiveDiff;
      rows.push({ id: f.id, label: f.label, diff: r.diff, sampleSize: r.sampleSize, isHelpful });
    });
    rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    return rows.slice(0, 2);
  }, [logs]);

  if (!findings || findings.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-2">
        <BrainCircuit size={14} className="text-violet-500"/>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">高影响因子</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {findings.map(f => {
          const Arrow = f.isHelpful ? TrendingUp : TrendingDown;
          const colorClass = f.isHelpful
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-300';
          const desc = f.isHelpful
            ? `${f.label} 充足时硬度 +${f.diff.toFixed(1)} 级`
            : `${f.label}↑ 时硬度 ${f.diff > 0 ? '+' : ''}${f.diff.toFixed(1)} 级`;
          return (
            <div key={f.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${colorClass}`}>
              <Arrow size={18} className="shrink-0"/>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black truncate">{desc}</div>
                <div className="text-[10px] font-bold opacity-70">基于 {f.sampleSize} 个样本</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ImpactFindings;
