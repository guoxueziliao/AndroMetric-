import React, { lazy, Suspense } from 'react';
import type { LogEntry } from '../../domain';

const CalendarHeatmap = lazy(() => import('./CalendarHeatmap'));

interface DashboardMonthViewProps {
  logs: LogEntry[];
  onDateClick: (date: string) => void;
}

const inlineLoader = (
  <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-500">
    加载中...
  </div>
);

const DashboardMonthView: React.FC<DashboardMonthViewProps> = ({ logs, onDateClick }) => (
  <Suspense fallback={inlineLoader}>
    <CalendarHeatmap logs={logs} onDateClick={onDateClick} mode="monthOnly" />
  </Suspense>
);

export default DashboardMonthView;
