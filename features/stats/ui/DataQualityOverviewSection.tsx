import React, { useMemo, useState } from 'react';
import type { LogEntry } from '../../../domain';
import { computeDataQualityOverview } from '../model/dataQualityOverview';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';
import { confidenceBadgeLabel, confidenceTierLabel } from '../../../shared/lib/confidence';
import { Database, Info, ChevronDown, ChevronRight } from 'lucide-react';

interface DataQualityOverviewSectionProps {
  logs: LogEntry[];
}

const DataQualityOverviewSection: React.FC<DataQualityOverviewSectionProps> = ({ logs }) => {
  const [expanded, setExpanded] = useState(false);
  const today = useMemo(() => getActivityTargetDate(new Date()), []);
  const overview = useMemo(() => computeDataQualityOverview(logs, today), [logs, today]);

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-3 space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5"
      >
        <Database size={12} className="text-accent" />
        <span className="text-xs font-bold text-text-primary">数据质量</span>
        <span className="text-[10px] text-text-muted">共 {overview.totalRecordedDays} 天记录</span>
        <span className="ml-auto text-text-muted">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {/* Window coverage */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {overview.windows.map((w) => (
          <div key={w.windowDays} className="rounded-xl bg-surface-muted p-2">
            <p className="text-sm font-black text-text-primary">{Math.round(w.coverage * 100)}%</p>
            <p className="text-[10px] text-text-muted">近 {w.windowDays} 天覆盖</p>
          </div>
        ))}
      </div>

      {expanded && (
        <>
          {/* Per-group coverage */}
          <div className="space-y-2">
            {overview.groups.map((g) => (
              <div key={g.id} className="rounded-xl border border-surface-border bg-surface-muted p-2.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">{g.label}</span>
                  <span className="text-[10px] text-text-muted">
                    {confidenceTierLabel(g.confidence)}
                    {confidenceBadgeLabel(g.confidence) && ` · ${confidenceBadgeLabel(g.confidence)}`}
                  </span>
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-border">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${Math.min(100, Math.round(g.coverage * 100))}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-[10px] tabular-nums text-text-muted">
                    {g.recordedDays}/{g.windowDays} 天
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-text-secondary">{g.note}</p>
              </div>
            ))}
          </div>

          {/* Limitations */}
          {overview.limitations.length > 0 && (
            <div className="flex items-start gap-1.5 rounded-xl bg-surface-muted p-2.5">
              <Info size={12} className="mt-0.5 shrink-0 text-text-muted" />
              <ul className="space-y-0.5 text-[10px] text-text-muted">
                {overview.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataQualityOverviewSection;
