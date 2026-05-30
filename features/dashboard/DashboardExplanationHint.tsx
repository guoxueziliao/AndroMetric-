import React, { useMemo } from 'react';
import type { LogEntry } from '../../domain';
import { StatsEngine } from '../stats/model/StatsEngine';
import { computePersonalNormal } from '../stats/model/personalNormalEngine';
import { getActivityTargetDate } from '../../shared/lib/targetDate';
import { Eye, ChevronRight, Lightbulb } from 'lucide-react';

interface DashboardExplanationHintProps {
  logs: LogEntry[];
  onNavigateToStats?: () => void;
}

const DashboardExplanationHint: React.FC<DashboardExplanationHintProps> = ({ logs, onNavigateToStats }) => {
  const today = useMemo(() => getActivityTargetDate(new Date()), []);

  const { shiftedCount, windowDays } = useMemo(() => {
    const engine = new StatsEngine(logs);
    const result = computePersonalNormal(
      (metricName) => engine.getSeries(metricName as Parameters<typeof engine.getSeries>[0]),
      14,
      today,
    );
    return {
      shiftedCount: result.summary.shiftedCount,
      windowDays: result.currentWindowDays,
    };
  }, [logs, today]);

  if (shiftedCount === 0) return null;

  return (
    <div className="p-3 bg-accent/5 rounded-2xl border border-accent/20">
      <div className="flex items-center gap-1.5 mb-1">
        <Lightbulb size={14} className="text-accent" />
        <span className="text-xs font-bold text-accent">变化提示</span>
      </div>

      <p className="text-[11px] text-text-secondary mb-1.5">
        近 {windowDays} 天有 {shiftedCount} 个指标偏离个人常态，可以查看变化附近的上下文。
      </p>

      {onNavigateToStats && (
        <button
          onClick={onNavigateToStats}
          className="flex items-center gap-1 text-[10px] text-accent hover:underline"
        >
          <Eye size={10} />
          在统计中查看
          <ChevronRight size={10} />
        </button>
      )}
    </div>
  );
};

export default DashboardExplanationHint;
