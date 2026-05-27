import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, Moon } from 'lucide-react';
import type { LogEntry, NapRecord } from '../../domain';
import { analyzeSleep } from '../../shared/lib';
import { motionDuration } from '../../shared/ui/motionTokens';
import TodayGrid from './TodayGrid';
import TrendsPanel from './TrendsPanel';
import type { TodayTile, TodayTileKey } from './model/p1Summary';

const GlobalTimeline = lazy(() => import('./GlobalTimeline').then((module) => ({ default: module.GlobalTimeline })));

interface DashboardDayViewProps {
  logs: LogEntry[];
  todayLog: LogEntry;
  todayTiles: TodayTile[];
  last7Days: string[];
  pendingLog: LogEntry | null;
  ongoingNap: NapRecord | null;
  onSelectTile: (key: TodayTileKey) => void;
}

const inlineLoader = (
  <div className="flex items-center justify-center rounded-3xl border border-dashed border-surface-border bg-surface-card/70 p-4 text-xs font-bold text-text-muted">
    加载中...
  </div>
);

const DashboardDayView: React.FC<DashboardDayViewProps> = ({
  logs,
  todayLog,
  todayTiles,
  last7Days,
  pendingLog,
  ongoingNap,
  onSelectTile
}) => (
  <div className="space-y-4">
    <TodayGrid tiles={todayTiles} onSelect={onSelectTile} />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TrendsPanel logs={logs} />
      <div className="flex h-60 flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface-card p-4 shadow-soft transition-colors">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-state-info-bg p-1.5 text-state-info-text"><Moon size={14} fill="currentColor" fillOpacity={0.2} /></div>
            <span className="text-[11px] font-black text-text-primary">7日睡眠流</span>
          </div>
          {(pendingLog || ongoingNap) && <span className="text-[9px] font-black text-state-success-text animate-pulse">正在休息</span>}
        </div>
        <motion.div
          className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-0.5"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {last7Days.map((date, index) => {
            const log = logs.find((item) => item.date === date);
            const analysis = log?.sleep?.startTime && log?.sleep?.endTime ? analyzeSleep(log.sleep.startTime, log.sleep.endTime) : null;
            const nocturnalHours = analysis?.durationHours || 0;
            const totalNapMinutes = log?.sleep?.naps?.reduce((acc, item) => acc + (item.duration || 0), 0) || 0;
            const napHours = totalNapMinutes / 60;
            const totalHours = nocturnalHours + napHours;
            const isToday = date === last7Days[0];

            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: motionDuration.slow }}
                className={`flex flex-col gap-1 rounded-xl p-1.5 transition-all ${isToday ? 'border border-state-info-text/25 bg-state-info-bg/40' : 'border border-transparent'}`}
              >
                <div className="flex items-center justify-between text-[9px] font-bold text-text-muted">
                  <span className="font-mono">{date.split('-').slice(1).join('/')}</span>
                  <div className="flex gap-1">
                    {analysis?.isLate && <span className="rounded bg-state-warning-bg px-1 text-state-warning-text">熬夜</span>}
                    {analysis?.isInsufficient && <span className="rounded bg-state-danger-bg px-1 text-state-danger-text">不足</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    {nocturnalHours > 0 && <div className="h-full bg-state-info-text" style={{ width: `${Math.min(100, (nocturnalHours / 12) * 100)}%` }} />}
                    {napHours > 0 && <div className="h-full border-l border-surface-card/30 bg-state-warning-text" style={{ width: `${Math.min(100, (napHours / 12) * 100)}%` }} />}
                  </div>
                  <div className="w-8 text-right text-[10px] font-black tabular-nums text-text-secondary">{totalHours > 0 ? `${totalHours.toFixed(1)}h` : '--'}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="flex h-60 flex-col rounded-3xl border border-surface-border bg-surface-card p-5 shadow-soft transition-colors">
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-full bg-state-warning-bg p-2 text-state-warning-text"><Activity size={18} /></div>
          <span className="text-sm font-bold text-text-primary">今日活动</span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-text-muted">运动</span><span className="text-lg font-black text-text-primary">{todayLog.exercise?.length || 0}次</span></div>
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-text-muted">自慰</span><span className="text-lg font-black text-text-primary">{todayLog.masturbation?.length || 0}次</span></div>
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-text-muted">性爱</span><span className="text-lg font-black text-text-primary">{todayLog.sex?.length || 0}次</span></div>
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-text-muted">屏幕时间</span><span className="text-lg font-black text-text-primary">{todayLog.screenTime?.totalMinutes ? `${Math.round(todayLog.screenTime.totalMinutes / 60)}h` : '--'}</span></div>
        </div>
      </div>

      <div className="rounded-3xl border border-surface-border bg-surface-card p-5 shadow-soft transition-colors">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-full bg-surface-muted p-2 text-text-muted"><Calendar size={18} /></div>
          <span className="text-sm font-bold text-text-primary">今日时间线</span>
        </div>
        <div className="max-h-[180px] overflow-y-auto pr-1">
          <Suspense fallback={inlineLoader}>
            <GlobalTimeline log={todayLog} allLogs={logs} />
          </Suspense>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardDayView;
