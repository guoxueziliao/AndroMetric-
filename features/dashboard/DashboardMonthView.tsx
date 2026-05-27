import React, { lazy, Suspense } from 'react';
import type { LogEntry } from '../../domain';

const CalendarHeatmap = lazy(() => import('./CalendarHeatmap'));

interface DashboardMonthViewProps {
  logs: LogEntry[];
  onDateClick: (date: string) => void;
}

const inlineLoader = (
  <div className="flex items-center justify-center rounded-3xl border border-dashed border-surface-border bg-surface-card/70 p-4 text-xs font-bold text-text-muted">
    加载中...
  </div>
);

const DashboardMonthView: React.FC<DashboardMonthViewProps> = ({ logs, onDateClick }) => (
  <Suspense fallback={inlineLoader}>
    <CalendarHeatmap logs={logs} onDateClick={onDateClick} />
  </Suspense>
);

export default DashboardMonthView;
