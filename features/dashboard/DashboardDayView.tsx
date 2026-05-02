import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, Moon } from 'lucide-react';
import type { LogEntry, NapRecord } from '../../domain';
import { analyzeSleep } from '../../shared/lib';
import TodayGrid from './TodayGrid';
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
  <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-500">
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
      <div className="flex h-60 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-soft transition-colors dark:border-white/5 dark:bg-slate-900/40">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-1.5 text-blue-500 dark:bg-blue-500/10"><Moon size={14} fill="currentColor" fillOpacity={0.2} /></div>
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-300">7日睡眠流</span>
          </div>
          {(pendingLog || ongoingNap) && <span className="text-[9px] font-black text-emerald-500 animate-pulse">正在休息</span>}
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
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`flex flex-col gap-1 rounded-xl p-1.5 transition-all ${isToday ? 'border border-blue-100 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-900/10' : 'border border-transparent'}`}
              >
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span className="font-mono">{date.split('-').slice(1).join('/')}</span>
                  <div className="flex gap-1">
                    {analysis?.isLate && <span className="rounded bg-orange-100 px-1 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">熬夜</span>}
                    {analysis?.isInsufficient && <span className="rounded bg-red-100 px-1 text-red-600 dark:bg-red-900/30 dark:text-red-400">不足</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    {nocturnalHours > 0 && <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (nocturnalHours / 12) * 100)}%` }} />}
                    {napHours > 0 && <div className="h-full border-l border-white/20 bg-orange-400" style={{ width: `${Math.min(100, (napHours / 12) * 100)}%` }} />}
                  </div>
                  <div className="w-8 text-right text-[10px] font-black tabular-nums text-slate-600 dark:text-slate-300">{totalHours > 0 ? `${totalHours.toFixed(1)}h` : '--'}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="flex h-60 flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-soft transition-colors dark:border-white/5 dark:bg-slate-900/40">
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-full bg-orange-50 p-2 text-orange-500 dark:bg-orange-500/10"><Activity size={18} /></div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-300">今日活动</span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-400">运动</span><span className="text-lg font-black text-slate-700 dark:text-slate-200">{todayLog.exercise?.length || 0}次</span></div>
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-400">自慰</span><span className="text-lg font-black text-slate-700 dark:text-slate-200">{todayLog.masturbation?.length || 0}次</span></div>
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-400">性爱</span><span className="text-lg font-black text-slate-700 dark:text-slate-200">{todayLog.sex?.length || 0}次</span></div>
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-400">屏幕时间</span><span className="text-lg font-black text-slate-700 dark:text-slate-200">{todayLog.screenTime?.totalMinutes ? `${Math.round(todayLog.screenTime.totalMinutes / 60)}h` : '--'}</span></div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft transition-colors dark:border-white/5 dark:bg-slate-900/40">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800"><Calendar size={18} /></div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-300">今日时间线</span>
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
