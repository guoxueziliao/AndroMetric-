import React, { useState, useMemo, useEffect } from 'react';
import type { LogEntry } from '../../domain';
import { ChevronLeft, ChevronRight, Zap, Dumbbell, Moon, TrendingUp, Minus, Calendar as CalendarIcon, ShieldAlert, BrainCircuit } from 'lucide-react';
import { analyzeSleep } from '../../shared/lib';
import { calculateDataQuality } from '../../domain';
import { type HeatmapMetric, formatMinutes, getHeatmapMetricValue } from './model/p1Summary';

interface ActivityCalendarProps {
    logs: LogEntry[];
    onDateClick?: (date: string) => void;
}

interface DashItemProps {
    label: string;
    value: string | number;
    sub: React.ReactNode;
    icon: React.ElementType;
    colorClass: string;
}

const METRIC_OPTIONS: Array<{ id: HeatmapMetric; label: string }> = [
    { id: 'healthScore', label: '健康分' },
    { id: 'hardness', label: '硬度' },
    { id: 'sleep', label: '睡眠' },
    { id: 'exercise', label: '运动' },
    { id: 'sexLoad', label: '性负荷' },
    { id: 'dataQuality', label: '完整度' }
];

const getCalendarDays = (currentDate: Date) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) days.push(new Date(year, month, i));
    return days;
};

const getVisualsForCompleted = (level: number) => {
    switch (level) {
        case 1:
            return { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-500', score: 'text-rose-600 dark:text-rose-400' };
        case 2:
            return { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-500', score: 'text-orange-600 dark:text-orange-400' };
        case 3:
            return { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600', score: 'text-amber-600 dark:text-amber-400' };
        case 4:
            return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-500', score: 'text-emerald-600 dark:text-emerald-400' };
        case 5:
            return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-500', score: 'text-blue-600 dark:text-blue-400' };
        default:
            return { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-400', score: 'text-slate-500' };
    }
};

const CalendarHeatmap: React.FC<ActivityCalendarProps> = ({ logs, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(() => {
        try {
            const saved = localStorage.getItem('calendar_viewing_month');
            if (saved) {
                const date = new Date(saved);
                if (!isNaN(date.getTime())) return date;
            }
        } catch (e) {}
        return new Date();
    });

    const [activeMetric, setActiveMetric] = useState<HeatmapMetric>('healthScore');

    useEffect(() => {
        localStorage.setItem('calendar_viewing_month', currentDate.toISOString());
    }, [currentDate]);

    const logsMap = useMemo(() => {
        const map = new Map<string, LogEntry>();
        if (logs && Array.isArray(logs)) {
            logs.forEach(log => map.set(log.date, log));
        }
        return map;
    }, [logs]);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);

    const dateInfo = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        return { full: `${year}/${month}` };
    }, [currentDate]);

    const monthlyStats = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();

        const monthLogEntries: LogEntry[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const l = logsMap.get(dStr);
            if (l) monthLogEntries.push(l);
        }

        const metricValues = monthLogEntries
            .map((log) => getHeatmapMetricValue(log, activeMetric))
            .filter((value): value is number => value !== null);
        const averageMetric = metricValues.length > 0
            ? metricValues.reduce((sum, value) => sum + value, 0) / metricValues.length
            : 0;
        const totalExercise = monthLogEntries.reduce((sum, log) => sum + (log.exercise || []).reduce((acc, item) => acc + (item.duration || 0), 0), 0);
        const avgSleep = monthLogEntries
            .map((log) => analyzeSleep(log.sleep?.startTime, log.sleep?.endTime)?.durationHours || null)
            .filter((value): value is number => value !== null);
        const avgScreenMinutes = monthLogEntries
            .map((log) => log.screenTime?.totalMinutes || null)
            .filter((value): value is number => value !== null);

        return {
            averageMetric,
            exerciseMinutes: totalExercise,
            avgSleepHours: avgSleep.length > 0 ? avgSleep.reduce((sum, value) => sum + value, 0) / avgSleep.length : 0,
            avgScreenMinutes: avgScreenMinutes.length > 0 ? avgScreenMinutes.reduce((sum, value) => sum + value, 0) / avgScreenMinutes.length : 0
        };
    }, [activeMetric, currentDate, logsMap]);

    const getMetricVisuals = (metric: HeatmapMetric, value: number | null) => {
        if (value === null) {
            return { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-400', score: 'text-slate-500', label: '--' };
        }

        if (metric === 'hardness') {
            const visuals = getVisualsForCompleted(Math.round(value));
            return { ...visuals, label: `${Math.round(value)}` };
        }

        const normalized = metric === 'sleep'
            ? clampValue(value / 9)
            : metric === 'exercise'
                ? clampValue(value / 60)
                : metric === 'sexLoad'
                    ? clampValue(value / 4)
                    : clampValue(value / 100);

        const level = normalized > 0.8 ? 4 : normalized > 0.6 ? 3 : normalized > 0.35 ? 2 : 1;

        if (metric === 'sexLoad') {
            const tone = level >= 4
                ? { bg: 'bg-rose-50 dark:bg-rose-900/25', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-500', score: 'text-rose-600 dark:text-rose-400' }
                : level === 3
                    ? { bg: 'bg-orange-50 dark:bg-orange-900/25', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-500', score: 'text-orange-600 dark:text-orange-400' }
                    : { bg: 'bg-emerald-50 dark:bg-emerald-900/25', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-500', score: 'text-emerald-600 dark:text-emerald-400' };
            return { ...tone, label: value.toFixed(1) };
        }

        const palette = level >= 4
            ? { bg: 'bg-emerald-50 dark:bg-emerald-900/25', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-500', score: 'text-emerald-600 dark:text-emerald-400' }
            : level === 3
                ? { bg: 'bg-blue-50 dark:bg-blue-900/25', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-500', score: 'text-blue-600 dark:text-blue-400' }
                : level === 2
                    ? { bg: 'bg-amber-50 dark:bg-amber-900/25', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-500', score: 'text-amber-600 dark:text-amber-400' }
                    : { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-400', score: 'text-slate-500' };

        return {
            ...palette,
            label: metric === 'sleep' ? value.toFixed(1) : metric === 'exercise' ? `${Math.round(value)}` : `${Math.round(value)}`
        };
    };

    const renderCell = (day: Date | null, index: number) => {
        if (!day) return <div key={`empty-${index}`} className="aspect-square"></div>;

        const dateStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
        const log = logsMap.get(dateStr);
        const isToday = new Date().toDateString() === day.toDateString();

        let status: 'empty' | 'draft' | 'completed' = 'empty';
        let qualityScore = 0;
        const metricValue = getHeatmapMetricValue(log, activeMetric);

        let isSick = false;
        let isStressed = false;
        let isBadSleep = false;

        if (log) {
            qualityScore = calculateDataQuality(log);
            const isDraft = log.status === 'pending' || qualityScore < 60;
            status = isDraft ? 'draft' : 'completed';

            const sleepAnalysis = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
            if (log.health?.isSick) isSick = true;
            if ((log.stressLevel || 0) >= 4) isStressed = true;
            if (sleepAnalysis?.isInsufficient || sleepAnalysis?.isLate) isBadSleep = true;
        }

        let containerClass = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600";
        let dateClass = "text-slate-400";
        let scoreClass = "hidden";

        if (status === 'draft') {
            containerClass = "bg-yellow-50/50 dark:bg-yellow-900/10 border-dashed border-yellow-200 dark:border-yellow-800";
            dateClass = "text-yellow-700 dark:text-yellow-500 font-medium";
            scoreClass = "text-yellow-600/50 dark:text-yellow-500/50 text-[9px]";
        } else if (status === 'completed') {
            const visuals = getMetricVisuals(activeMetric, metricValue);
            containerClass = `${visuals.bg} ${visuals.border}`;
            dateClass = visuals.text;
            scoreClass = `${visuals.score} text-[10px] font-black`;
        }

        if (isToday) containerClass += " ring-2 ring-brand-accent z-10 shadow-md";

        return (
            <div
                key={dateStr}
                onClick={() => onDateClick && onDateClick(dateStr)}
                className={`relative aspect-square rounded-2xl p-1 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border ${containerClass}`}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-[10px] leading-none ml-0.5 mt-0.5 ${dateClass}`}>{day.getDate()}</span>
                    {(isSick || isStressed || isBadSleep) && (
                        <div className="flex gap-[1px] mt-0.5 mr-0.5">
                            {isSick && <ShieldAlert size={10} className="text-red-500" strokeWidth={3} />}
                            {isStressed && !isSick && <Zap size={10} className="text-orange-500" strokeWidth={3} fill="currentColor" />}
                            {isBadSleep && !isSick && !isStressed && <Moon size={10} className="text-purple-500" strokeWidth={3} />}
                        </div>
                    )}
                </div>
                <div className="flex justify-end items-end mr-0.5 mb-0.5">
                    {status !== 'empty' && <span className={`leading-none ${scoreClass}`}>{metricValue !== null ? getMetricVisuals(activeMetric, metricValue).label : qualityScore}</span>}
                </div>
            </div>
        );
    };

    const DashItem = ({ label, value, sub, icon: Icon, colorClass }: DashItemProps) => (
        <div className="flex flex-col bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
                <Icon size={14} className={colorClass} />
            </div>
            <div className={`text-lg font-black ${colorClass}`}>{value}</div>
            <div className="text-[10px] text-slate-400 font-medium">{sub}</div>
        </div>
    );

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const [y, m] = e.target.value.split('-').map(Number);
        setCurrentDate(new Date(y, m - 1, 1));
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1">
                    <button
                        onClick={prevMonth}
                        aria-label="上个月"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-brand-text dark:hover:text-slate-100 transition-colors"
                    >
                        <ChevronLeft size={20}/>
                    </button>

                    <label className="relative flex flex-col items-start px-2 min-w-[90px] cursor-pointer">
                        <span className="text-[10px] font-bold text-slate-400 leading-tight">月度视图</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-brand-text dark:text-slate-100 tracking-tight">{dateInfo.full}</span>
                            <CalendarIcon size={14} className="text-brand-accent"/>
                        </div>
                        <input
                            type="month"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                            onChange={handleMonthChange}
                            aria-label="选择月份"
                        />
                    </label>

                    <button
                        onClick={nextMonth}
                        aria-label="下个月"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-brand-text dark:hover:text-slate-100 transition-colors"
                    >
                        <ChevronRight size={20}/>
                    </button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1">
                {METRIC_OPTIONS.map(option => (
                    <button
                        key={option.id}
                        onClick={() => setActiveMetric(option.id)}
                        className={`min-h-[44px] rounded-full border px-3 text-xs font-bold whitespace-nowrap transition-all ${
                            activeMetric === option.id
                                ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div>
                <div className="grid grid-cols-7 gap-2 mb-3 text-center px-1">
                    {['一', '二', '三', '四', '五', '六', '日'].map(d => <span key={d} className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => renderCell(day, idx))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                <DashItem
                    label="月均指标"
                    icon={Zap}
                    value={monthlyStats.averageMetric > 0 ? (activeMetric === 'sleep' ? monthlyStats.averageMetric.toFixed(1) : Math.round(monthlyStats.averageMetric)) : '--'}
                    sub={<span className="flex items-center text-slate-400">{activeMetric === 'healthScore' ? <TrendingUp size={10} className="mr-1"/> : <Minus size={10} className="mr-1"/>}{METRIC_OPTIONS.find(item => item.id === activeMetric)?.label}</span>}
                    colorClass="text-brand-accent dark:text-blue-400"
                />
                <DashItem label="平均睡眠" icon={Moon} value={monthlyStats.avgSleepHours > 0 ? `${monthlyStats.avgSleepHours.toFixed(1)}h` : '--'} sub="夜间睡眠" colorClass="text-blue-500 dark:text-blue-400"/>
                <DashItem label="运动总量" icon={Dumbbell} value={monthlyStats.exerciseMinutes > 0 ? `${monthlyStats.exerciseMinutes}分` : '--'} sub="月内累计" colorClass="text-emerald-500 dark:text-emerald-400"/>
                <DashItem label="屏幕时间" icon={BrainCircuit} value={monthlyStats.avgScreenMinutes > 0 ? formatMinutes(Math.round(monthlyStats.avgScreenMinutes)) : '--'} sub="日均时长" colorClass="text-purple-500 dark:text-purple-400"/>
            </div>
        </div>
    );
};

export default React.memo(CalendarHeatmap);

const clampValue = (value: number) => Math.min(1, Math.max(0, value));
