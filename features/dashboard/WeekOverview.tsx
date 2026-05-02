import React from 'react';
import type { WeekDaySummary } from './model/p1Summary';
import { formatMinutes } from './model/p1Summary';

interface WeekOverviewProps {
  days: WeekDaySummary[];
  onOpenDate: (date: string) => void;
}

const WeekOverview: React.FC<WeekOverviewProps> = ({ days, onOpenDate }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">周视图</h2>
      <span className="text-[10px] font-bold text-slate-400">7天对比</span>
    </div>
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[760px] grid-cols-7 gap-3">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onOpenDate(day.date)}
            className="rounded-[1.5rem] border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{day.weekday}</div>
            <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{day.date.slice(5)}</div>
            <div className="mt-4 space-y-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">睡眠</span>
                <span>{day.sleepHours !== null ? `${day.sleepHours}h` : '未记'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">运动</span>
                <span>{day.exerciseMinutes > 0 ? `${day.exerciseMinutes}分` : '未记'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">屏幕</span>
                <span>{formatMinutes(day.screenMinutes)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">负荷</span>
                <span>{day.sexLoad > 0 ? day.sexLoad.toFixed(1) : '0'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                <span className="text-slate-400">健康分</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-100">{day.healthScore ?? '--'}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  </section>
);

export default WeekOverview;
