
import React, { useState, useMemo, useRef } from 'react';
import { LogEntry } from '../types';
import { ChevronLeft, ChevronRight, Heart, Hand, ShieldAlert, Zap, Activity, Moon, Beer, Film, BrainCircuit, Star, Dumbbell, Clock, BatteryWarning, TrendingUp, TrendingDown, Minus, Flame, Sparkles, Calendar as CalendarIcon, ChevronDown as ChevronDownIcon, SunMedium, Footprints } from 'lucide-react';
import { analyzeSleep, calculateDataQuality } from '../utils/helpers';

interface ActivityCalendarProps {
    logs: LogEntry[];
    onDateClick?: (date: string) => void;
    children?: React.ReactNode;
}

type FilterType = 'all' | 'morning_wood' | 'sex' | 'masturbation' | 'sick' | 'alcohol' | 'porn' | 'exercise' | 'stress' | 'good_sleep' | 'late_sleep' | 'insufficient_sleep';

const FILTERS: { id: FilterType; label: string; icon?: React.ElementType }[] = [
    { id: 'all', label: '全部' },
    { id: 'morning_wood', label: '晨勃', icon: Zap },
    { id: 'sex', label: '性生活', icon: Heart },
    { id: 'masturbation', label: '自慰', icon: Hand },
    { id: 'exercise', label: '运动', icon: Dumbbell },
    { id: 'good_sleep', label: '好梦', icon: Moon },
    { id: 'late_sleep', label: '熬夜', icon: Clock },
    { id: 'insufficient_sleep', label: '缺觉', icon: BatteryWarning },
    { id: 'stress', label: '高压', icon: BrainCircuit },
    { id: 'alcohol', label: '饮酒', icon: Beer },
    { id: 'porn', label: '看片', icon: Film },
    { id: 'sick', label: '生病', icon: ShieldAlert },
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

const getHardnessColor = (level: number) => {
    switch (level) {
        case 1: return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800', text: 'text-red-500' };
        case 2: return { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800', text: 'text-orange-500' };
        case 3: return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800', text: 'text-blue-500' };
        case 4: return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800', text: 'text-emerald-500' };
        case 5: return { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-100 dark:border-teal-800', text: 'text-teal-500' };
        default: return { bg: 'bg-slate-50 dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', text: 'text-slate-400' };
    }
};

const CalendarHeatmap: React.FC<ActivityCalendarProps> = ({ logs, onDateClick, children }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX; }
    const onTouchMove = (e: React.TouchEvent) => { touchEnd.current = e.targetTouches[0].clientX; }
    const onTouchEnd = () => { if (!touchStart.current || !touchEnd.current) return; const distance = touchStart.current - touchEnd.current; if (distance > minSwipeDistance) nextMonth(); if (distance < -minSwipeDistance) prevMonth(); }

    const logsMap = useMemo(() => { const map = new Map<string, LogEntry>(); logs.forEach(log => map.set(log.date, log)); return map; }, [logs]);
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // --- Stats Logic ---
    const getStatsForDate = (targetDate: Date) => {
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        
        const monthLogEntries: LogEntry[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const l = logsMap.get(dStr);
            if (l) monthLogEntries.push(l);
        }

        // Previous month for trend
        const prevDate = new Date(y, m - 1, 1);
        const prevY = prevDate.getFullYear();
        const prevM = prevDate.getMonth();
        const prevDaysInMonth = new Date(prevY, prevM + 1, 0).getDate();
        const prevMonthLogs: LogEntry[] = [];
        for (let i = 1; i <= prevDaysInMonth; i++) {
            const dStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const l = logsMap.get(dStr);
            if (l) prevMonthLogs.push(l);
        }

        const calcAvgHardness = (list: LogEntry[]) => {
            const valid = list.filter(l => l.morning?.wokeWithErection && l.morning.hardness);
            return valid.length ? valid.reduce((a,b) => a + (b.morning?.hardness||0), 0) / valid.length : 0;
        };

        const currentAvg = calcAvgHardness(monthLogEntries);
        const prevAvg = calcAvgHardness(prevMonthLogs);
        const trend = prevAvg > 0 ? (currentAvg - prevAvg) : 0;
        const erectionCount = monthLogEntries.filter(l => l.morning?.wokeWithErection && (l.morning.hardness || 0) > 0).length;
        const morningWoodRate = monthLogEntries.length > 0 ? Math.round((erectionCount / monthLogEntries.length) * 100) : 0;
        const exerciseDays = monthLogEntries.filter(l => l.exercise && l.exercise.length > 0).length;
        const masturbationCount = monthLogEntries.reduce((acc, l) => acc + (l.masturbation?.length || 0), 0);
        const sexCount = monthLogEntries.reduce((acc, l) => acc + (l.sex?.length || 0), 0);
        
        const xpCounts: Record<string, number> = {};
        monthLogEntries.forEach(l => l.masturbation?.forEach(m => m.assets?.categories?.forEach(c => xpCounts[c] = (xpCounts[c]||0)+1)));
        const topXP = Object.entries(xpCounts).sort((a,b) => b[1] - a[1])[0];
        const drunkDays = monthLogEntries.filter(l => l.alcoholRecord && l.alcoholRecord.totalGrams > 20);
        const soberDays = monthLogEntries.filter(l => !l.alcoholRecord || l.alcoholRecord.totalGrams === 0);
        const drunkAvg = calcAvgHardness(drunkDays);
        const soberAvg = calcAvgHardness(soberDays);
        const alcoholImpact = (drunkDays.length > 0 && soberDays.length > 0) ? (drunkAvg - soberAvg) : null;

        let score = 0;
        if (monthLogEntries.length > 0) {
            const hScore = (currentAvg / 5) * 50;
            const avgSleep = monthLogEntries.reduce((acc, l) => {
                const a = analyzeSleep(l.sleep?.startTime, l.sleep?.endTime);
                return acc + (a?.durationHours || 0);
            }, 0) / monthLogEntries.length;
            const sScore = isNaN(avgSleep) ? 0 : Math.min(1, avgSleep / 8) * 30;
            const exRate = exerciseDays / daysInMonth;
            const eScore = exRate * 20;
            score = Math.round(hScore + sScore + eScore);
        }

        return { 
            totalLogs: monthLogEntries.length, 
            days: daysInMonth, 
            avgHardness: currentAvg.toFixed(1), 
            morningWoodRate, 
            exerciseDays, 
            masturbationCount, 
            sexCount,
            trend, 
            topXP: topXP ? topXP[0] : '无', 
            alcoholImpact, 
            recoveryScore: score, 
            bestSexDay: monthLogEntries.filter(l => l.sex && l.sex.some(s => s.indicators.partnerOrgasm)).length 
        };
    };

    const monthlyStats = useMemo(() => getStatsForDate(currentDate), [currentDate, logsMap]);

    const renderCell = (day: Date | null, index: number) => {
        if (!day) return <div key={`empty-${index}`} className="aspect-square"></div>;
        const dateStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
        const log = logsMap.get(dateStr);
        const isToday = new Date().toDateString() === day.toDateString();
        let visual = { bg: "bg-white dark:bg-slate-900", border: "border-slate-100 dark:border-slate-800", text: "text-slate-400 dark:text-slate-600" };
        let opacityClass = "opacity-100";
        let ringClass = isToday ? 'ring-2 ring-brand-accent z-10' : '';
        let qualityScore = 0;
        
        if (log) {
            qualityScore = calculateDataQuality(log);
            const sleepAnalysis = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
            const checks: Record<FilterType, boolean> = {
                all: true,
                morning_wood: !!(log.morning?.wokeWithErection && (log.morning.hardness || 0) > 0),
                sex: !!(log.sex && log.sex.length > 0),
                masturbation: !!(log.masturbation && log.masturbation.length > 0),
                sick: !!log.health?.isSick,
                alcohol: !!(log.alcohol && log.alcohol !== 'none') || !!(log.alcoholRecord && log.alcoholRecord.totalGrams > 0),
                porn: !!(log.pornConsumption && log.pornConsumption !== 'none'),
                exercise: !!(log.exercise && log.exercise.length > 0),
                stress: (log.stressLevel || 0) >= 4,
                good_sleep: (log.sleep?.quality || 0) >= 4,
                late_sleep: !!sleepAnalysis?.isLate,
                insufficient_sleep: !!sleepAnalysis?.isInsufficient
            };
            if (!checks[activeFilter]) opacityClass = "opacity-20 grayscale";
            else {
                if (log.morning?.wokeWithErection && log.morning.hardness) visual = getHardnessColor(log.morning.hardness);
                else if (log.status === 'pending') visual = { bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 border-dashed", text: "text-yellow-600" };
            }
        } else { if (activeFilter !== 'all') opacityClass = "opacity-20"; }

        return (
            <div key={dateStr} onClick={() => onDateClick && onDateClick(dateStr)} className={`relative aspect-square rounded-2xl p-1 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border ${visual.bg} ${visual.border} ${opacityClass} ${ringClass}`}>
                <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold ${visual.text} ml-1`}>{day.getDate()}</span>
                    {log?.morning?.wokeWithErection && log.morning.hardness && (
                        <div className={`w-1.5 h-1.5 rounded-full ${visual.text.replace('text-', 'bg-')}`}></div>
                    )}
                </div>
                <div className="flex justify-center items-center h-full">
                    {/* Centered Icon for main activity */}
                    {log?.sex && log.sex.length > 0 ? <Heart size={14} className="text-pink-500 fill-pink-500"/> :
                     log?.masturbation && log.masturbation.length > 0 ? <Hand size={14} className="text-blue-500"/> :
                     log?.alcoholRecord && log.alcoholRecord.totalGrams > 0 ? <Beer size={14} className="text-amber-500"/> : null}
                </div>
            </div>
        );
    };

    const DashItem = ({ label, value, sub, icon: Icon, colorClass }: any) => (
        <div className="flex flex-col bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
                <Icon size={14} className={colorClass} />
            </div>
            <div className={`text-lg font-black ${colorClass}`}>{value}</div>
            <div className="text-[10px] text-slate-400 font-medium">{sub}</div>
        </div>
    );

    // Month Picker logic
    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const [y, m] = e.target.value.split('-').map(Number);
        setCurrentDate(new Date(y, m - 1, 1));
    };

    const monthValue = `${year}-${String(month).padStart(2, '0')}`;

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-2 relative group">
                    <div className="relative">
                        <h2 className="text-2xl font-black text-brand-text dark:text-slate-100 tracking-tight cursor-pointer flex items-center gap-2">
                            {year}.{String(month).padStart(2,'0')}
                            <ChevronDownIcon size={16} className="text-slate-300"/>
                        </h2>
                        <input 
                            type="month" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={monthValue}
                            onChange={handleMonthChange}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ChevronLeft size={18} className="text-slate-500"/></button>
                    <button onClick={nextMonth} className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={18} className="text-slate-500"/></button>
                </div>
            </div>
            
            <div className="touch-pan-y" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                <div className="grid grid-cols-7 gap-2 mb-3 text-center px-1">
                    {['一', '二', '三', '四', '五', '六', '日'].map(d => <span key={d} className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">{calendarDays.map((day, idx) => renderCell(day, idx))}</div>
            </div>
            
            {children}
            
            {/* Monthly Stats Summary */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <DashItem 
                    label="平均硬度" 
                    icon={Zap} 
                    value={monthlyStats.avgHardness} 
                    sub={<span className={`flex items-center ${monthlyStats.trend > 0 ? 'text-green-500' : monthlyStats.trend < 0 ? 'text-red-500' : 'text-slate-400'}`}>{monthlyStats.trend > 0 ? <TrendingUp size={10} className="mr-1"/> : monthlyStats.trend < 0 ? <TrendingDown size={10} className="mr-1"/> : <Minus size={10} className="mr-1"/>}{Math.abs(monthlyStats.trend).toFixed(1)} 环比</span>} 
                    colorClass="text-brand-accent dark:text-blue-400"
                />
                <DashItem label="晨勃率" icon={SunMedium} value={`${monthlyStats.morningWoodRate}%`} sub="出现概率" colorClass="text-blue-500 dark:text-blue-400"/>
                <DashItem label="自慰次数" icon={Hand} value={`${monthlyStats.masturbationCount}次`} sub="本月释放" colorClass="text-purple-500 dark:text-purple-400"/>
                <DashItem label="性爱次数" icon={Heart} value={`${monthlyStats.sexCount}次`} sub="High Quality" colorClass="text-pink-500 dark:text-pink-400"/>
            </div>
        </div>
    );
};

export default React.memo(CalendarHeatmap);
