import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { LogEntry } from '../../domain';
import { ChevronLeft, ChevronRight, Zap, Dumbbell, Moon, Clock, BatteryWarning, TrendingUp, TrendingDown, Minus, Calendar as CalendarIcon, SunMedium, Hand, Heart, Beer, ShieldAlert, Film, BrainCircuit } from 'lucide-react';
import { analyzeSleep, calculateDataQuality } from '../../shared/lib';

interface ActivityCalendarProps {
    logs: LogEntry[];
    onDateClick?: (date: string) => void;
    children?: React.ReactNode;
}

interface DashItemProps {
    label: string;
    value: string | number;
    sub: React.ReactNode;
    icon: React.ElementType;
    colorClass: string;
}

type FilterType = 'all' | 'morning_wood' | 'sex' | 'masturbation' | 'sick' | 'alcohol' | 'porn' | 'exercise' | 'stress' | 'good_sleep' | 'late_sleep' | 'insufficient_sleep';
type TimeScope = 'today' | 'week' | 'month' | 'year';

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

const TIME_SCOPES: { id: TimeScope; label: string }[] = [
    { id: 'today', label: '本日' },
    { id: 'week', label: '本周' },
    { id: 'month', label: '当月' },
    { id: 'year', label: '今年' },
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

const CalendarHeatmap: React.FC<ActivityCalendarProps> = ({ logs, onDateClick, children }) => {
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

    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [activeScope, setActiveScope] = useState<TimeScope>('month');
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        localStorage.setItem('calendar_viewing_month', currentDate.toISOString());
    }, [currentDate]);

    const onTouchStart = (e: React.TouchEvent) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX; }
    const onTouchMove = (e: React.TouchEvent) => { touchEnd.current = e.targetTouches[0].clientX; }
    const onTouchEnd = () => { if (!touchStart.current || !touchEnd.current) return; const distance = touchStart.current - touchEnd.current; if (distance > minSwipeDistance) nextMonth(); if (distance < -minSwipeDistance) prevMonth(); }

    const logsMap = useMemo(() => { 
        const map = new Map<string, LogEntry>(); 
        if (logs && Array.isArray(logs)) {
            logs.forEach(log => map.set(log.date, log)); 
        }
        return map; 
    }, [logs]);
    
    const prevMonth = () => {
        if (activeScope === 'today' || activeScope === 'week') {
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() - 7);
            setCurrentDate(nextDate);
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        }
    };
    
    const nextMonth = () => {
        if (activeScope === 'today' || activeScope === 'week') {
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 7);
            setCurrentDate(nextDate);
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        }
    };

    const calendarDays = useMemo(() => {
        const fullMonthDays = getCalendarDays(currentDate);
        
        if (activeScope === 'month' || activeScope === 'year') {
            return fullMonthDays;
        }

        if (activeScope === 'today' || activeScope === 'week') {
            // 获取当前 currentDate 所在周的 7 天
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay();
            // 调整为周一作为开始
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            
            const weekDays = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                weekDays.push(d);
            }
            return weekDays;
        }

        return fullMonthDays;
    }, [currentDate, activeScope]);
    
    const dateInfo = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const weekday = currentDate.toLocaleDateString('zh-CN', { weekday: 'short' });
        return {
            full: activeScope === 'month' ? `${year}/${month}` : `${year}/${month}/${day}`,
            weekday
        };
    }, [currentDate, activeScope]);

    const handleScopeChange = (scope: TimeScope) => {
        setActiveScope(scope);
        if (scope === 'today' || scope === 'week') {
            setCurrentDate(new Date()); // 点击本日或本周，强制跳转回今天
        }
    };

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

        const validHardnessLogs = monthLogEntries.filter(l => l.morning?.wokeWithErection && l.morning.hardness);
        const avgHardness = validHardnessLogs.length ? validHardnessLogs.reduce((a,b) => a + (b.morning?.hardness||0), 0) / validHardnessLogs.length : 0;
        
        const morningWoodRate = monthLogEntries.length > 0 ? Math.round((validHardnessLogs.length / monthLogEntries.length) * 100) : 0;
        const masturbationCount = monthLogEntries.reduce((acc, l) => acc + (l.masturbation?.length || 0), 0);
        const sexCount = monthLogEntries.reduce((acc, l) => acc + (l.sex?.length || 0), 0);

        return { avgHardness: avgHardness.toFixed(1), morningWoodRate, masturbationCount, sexCount, trend: 0 };
    }, [currentDate, logsMap]);

    const renderCell = (day: Date | null, index: number) => {
        if (!day) return <div key={`empty-${index}`} className="aspect-square"></div>;
        
        const dateStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
        const log = logsMap.get(dateStr);
        const isToday = new Date().toDateString() === day.toDateString();
        
        let status: 'empty' | 'draft' | 'completed' = 'empty';
        let qualityScore = 0;
        
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

        let isDimmed = false;
        if (activeFilter !== 'all') {
            const checks: Record<FilterType, boolean> = {
                all: true,
                morning_wood: !!(log?.morning?.wokeWithErection && (log.morning.hardness || 0) > 0),
                sex: !!(log?.sex && log.sex.length > 0),
                masturbation: !!(log?.masturbation && log.masturbation.length > 0),
                sick: !!log?.health?.isSick,
                alcohol: !!(log?.alcohol && log.alcohol !== 'none') || !!(log?.alcoholRecords && log.alcoholRecords.length > 0),
                porn: !!(log?.pornConsumption && log.pornConsumption !== 'none'),
                exercise: !!(log?.exercise && log.exercise.length > 0),
                stress: (log?.stressLevel || 0) >= 4,
                good_sleep: (log?.sleep?.quality || 0) >= 4,
                late_sleep: !!(analyzeSleep(log?.sleep?.startTime, log?.sleep?.endTime)?.isLate),
                insufficient_sleep: !!(analyzeSleep(log?.sleep?.startTime, log?.sleep?.endTime)?.isInsufficient)
            };
            if (!checks[activeFilter]) isDimmed = true;
        }

        let containerClass = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600";
        let dateClass = "text-slate-400";
        let scoreClass = "hidden";
        
        if (status === 'draft') {
            containerClass = "bg-yellow-50/50 dark:bg-yellow-900/10 border-dashed border-yellow-200 dark:border-yellow-800";
            dateClass = "text-yellow-700 dark:text-yellow-500 font-medium";
            scoreClass = "text-yellow-600/50 dark:text-yellow-500/50 text-[9px]";
        } else if (status === 'completed') {
            const level = log?.morning?.wokeWithErection ? (log?.morning?.hardness || 3) : 0;
            const visuals = getVisualsForCompleted(level);
            containerClass = `${visuals.bg} ${visuals.border}`;
            dateClass = visuals.text;
            scoreClass = `${visuals.score} text-[10px] font-black`;
        }

        if (isToday) containerClass += " ring-2 ring-brand-accent z-10 shadow-md";
        if (isDimmed) containerClass += " opacity-20 grayscale";

        return (
            <div 
                key={dateStr} 
                onClick={() => onDateClick && onDateClick(dateStr)} 
                className={`relative aspect-square rounded-2xl p-1 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border ${containerClass}`}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-[10px] leading-none ml-0.5 mt-0.5 ${dateClass}`}>{day.getDate()}</span>
                    {!isDimmed && (isSick || isStressed || isBadSleep) && (
                        <div className="flex gap-[1px] mt-0.5 mr-0.5">
                            {isSick && <ShieldAlert size={10} className="text-red-500" strokeWidth={3} />}
                            {isStressed && !isSick && <Zap size={10} className="text-orange-500" strokeWidth={3} fill="currentColor" />}
                            {isBadSleep && !isSick && !isStressed && <Moon size={10} className="text-purple-500" strokeWidth={3} />}
                        </div>
                    )}
                </div>
                <div className="flex justify-end items-end mr-0.5 mb-0.5">
                    {status !== 'empty' && <span className={`leading-none ${scoreClass}`}>{qualityScore}</span>}
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
                        className="p-2 text-slate-400 hover:text-brand-text dark:hover:text-slate-100 transition-colors"
                    >
                        <ChevronLeft size={20}/>
                    </button>
                    
                    <div className="relative flex flex-col items-start px-2 min-w-[90px]">
                        <span className="text-[10px] font-bold text-slate-400 leading-tight">
                            {activeScope === 'month' ? '月度视图' : dateInfo.weekday}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-brand-text dark:text-slate-100 tracking-tight">
                                {dateInfo.full}
                            </span>
                            <div className="relative w-4 h-4 flex items-center justify-center">
                                <CalendarIcon size={14} className="text-brand-accent"/>
                                <input 
                                    type="month" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                                    onChange={handleMonthChange}
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={nextMonth} 
                        className="p-2 text-slate-400 hover:text-brand-text dark:hover:text-slate-100 transition-colors"
                    >
                        <ChevronRight size={20}/>
                    </button>
                </div>
                
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-700">
                    {TIME_SCOPES.map(scope => (
                        <button
                            key={scope.id}
                            onClick={() => handleScopeChange(scope.id)}
                            className={`px-2.5 py-1.5 rounded-full text-[10px] font-black transition-all ${
                                activeScope === scope.id 
                                ? 'bg-white dark:bg-slate-700 text-brand-text dark:text-slate-100 shadow-sm scale-105' 
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        >
                            {scope.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1">
                {FILTERS.map(f => {
                    const isActive = activeFilter === f.id;
                    const Icon = f.icon;
                    return (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                                isActive 
                                ? 'bg-brand-accent text-white border-brand-accent shadow-sm' 
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            {Icon && <Icon size={12}/>}
                            {f.label}
                        </button>
                    );
                })}
            </div>
            
            <div className="touch-pan-y" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                <div className="grid grid-cols-7 gap-2 mb-3 text-center px-1">
                    {['一', '二', '三', '四', '五', '六', '日'].map(d => <span key={d} className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => renderCell(day, idx))}
                </div>
            </div>
            
            {children}
            
            <div className="grid grid-cols-2 gap-3 mt-4">
                <DashItem 
                    label="平均硬度" 
                    icon={Zap} 
                    value={monthlyStats.avgHardness} 
                    sub={<span className={`flex items-center ${monthlyStats.trend > 0 ? 'text-green-500' : monthlyStats.trend < 0 ? 'text-red-500' : 'text-slate-400'}`}>{monthlyStats.trend > 0 ? <TrendingUp size={10} className="mr-1"/> : monthlyStats.trend < 0 ? <TrendingDown size={10} className="mr-1"/> : <Minus size={10} className="mr-1"/>}稳定</span>} 
                    colorClass="text-brand-accent dark:text-blue-400"
                />
                <DashItem label="晨勃率" icon={SunMedium} value={`${monthlyStats.morningWoodRate}%`} sub="出现概率" colorClass="text-blue-500 dark:text-blue-400"/>
                <DashItem label="自慰次数" icon={Hand} value={`${monthlyStats.masturbationCount}次`} sub="周期总计" colorClass="text-purple-500 dark:text-purple-400"/>
                <DashItem label="性爱次数" icon={Heart} value={`${monthlyStats.sexCount}次`} sub="High Quality" colorClass="text-pink-500 dark:text-pink-400"/>
            </div>
        </div>
    );
};

export default React.memo(CalendarHeatmap);
