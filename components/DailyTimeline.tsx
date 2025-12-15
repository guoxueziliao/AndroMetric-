
import React, { useMemo } from 'react';
import { LogEntry } from '../types';
import { BedDouble, SunMedium, Coffee, Dumbbell, Hand, Heart, Beer, CloudSun, Clock, Moon } from 'lucide-react';

interface DailyTimelineProps {
    log: LogEntry;
}

interface TimelineEvent {
    id: string;
    time: string; // HH:MM
    sortTime: number; // minutes from start of day (considering physiologic day starts early)
    type: 'sleep_start' | 'sleep_end' | 'wake_up' | 'nap' | 'caffeine' | 'alcohol' | 'exercise' | 'masturbation' | 'sex';
    title: string;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
}

const getSortTime = (timeStr: string) => {
    if (!timeStr) return -1;
    const [h, m] = timeStr.includes('T') 
        ? new Date(timeStr).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'}).split(':').map(Number)
        : timeStr.split(':').map(Number);
    
    // Adjust for physiological day (0-4 AM counts as late night of previous day logic, 
    // but for timeline display we want chronological order of the date).
    // Simple chronological sort: 00:00 -> 23:59
    return h * 60 + m;
};

const formatEventTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
    return timeStr.substring(0, 5);
};

export const DailyTimeline: React.FC<DailyTimelineProps> = ({ log }) => {
    
    const events = useMemo(() => {
        const list: TimelineEvent[] = [];

        // 1. Sleep (Yesterday's sleep end = Wake Up)
        // Note: Currently log.sleep records the sleep that happened the night BEFORE this date (usually).
        if (log.sleep?.endTime) {
            list.push({
                id: 'wake_up',
                time: formatEventTime(log.sleep.endTime),
                sortTime: getSortTime(formatEventTime(log.sleep.endTime)),
                type: 'wake_up',
                title: '起床',
                subtitle: log.sleep.quality ? `睡眠质量 ${log.sleep.quality}/5` : undefined,
                icon: SunMedium,
                color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
            });
        }

        // 2. Caffeine
        log.caffeineRecords?.forEach(c => {
            list.push({
                id: c.id,
                time: c.time,
                sortTime: getSortTime(c.time),
                type: 'caffeine',
                title: '咖啡因',
                subtitle: c.type,
                icon: Coffee,
                color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400'
            });
        });

        // 3. Naps
        log.sleep?.naps?.forEach(n => {
            list.push({
                id: n.id,
                time: n.startTime,
                sortTime: getSortTime(n.startTime),
                type: 'nap',
                title: '午休',
                subtitle: `${n.duration}分钟`,
                icon: CloudSun,
                color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
            });
        });

        // 4. Exercise
        log.exercise?.forEach(e => {
            list.push({
                id: e.id,
                time: e.startTime,
                sortTime: getSortTime(e.startTime),
                type: 'exercise',
                title: e.type,
                subtitle: e.duration ? `${e.duration}分钟` : e.steps ? `${e.steps}步` : undefined,
                icon: Dumbbell,
                color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
            });
        });

        // 5. Masturbation
        log.masturbation?.forEach(m => {
            if (m.startTime) {
                list.push({
                    id: m.id,
                    time: m.startTime,
                    sortTime: getSortTime(m.startTime),
                    type: 'masturbation',
                    title: '自慰',
                    subtitle: m.ejaculation ? '射精' : 'Edging',
                    icon: Hand,
                    color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30'
                });
            }
        });

        // 6. Sex
        log.sex?.forEach(s => {
            if (s.startTime) {
                list.push({
                    id: s.id,
                    time: s.startTime,
                    sortTime: getSortTime(s.startTime),
                    type: 'sex',
                    title: '性生活',
                    subtitle: s.interactions?.[0]?.partner || '未知伴侣',
                    icon: Heart,
                    color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30'
                });
            }
        });

        // 7. Alcohol
        if (log.alcoholRecord?.startTime) {
            list.push({
                id: 'alcohol',
                time: log.alcoholRecord.startTime,
                sortTime: getSortTime(log.alcoholRecord.startTime),
                type: 'alcohol',
                title: '饮酒',
                subtitle: `${log.alcoholRecord.totalGrams}g`,
                icon: Beer,
                color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30'
            });
        }

        // Sort by time
        return list.sort((a, b) => a.sortTime - b.sortTime);
    }, [log]);

    if (events.length === 0) return null;

    return (
        <div className="py-4">
            <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-4 pl-4 flex items-center">
                <Clock size={14} className="mr-2"/> 全天时间轴
            </h3>
            <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
                {events.map((event, idx) => (
                    <div key={`${event.type}-${idx}`} className="relative group">
                        {/* Dot */}
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${event.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
                        
                        {/* Content */}
                        <div className="flex items-start gap-3">
                            <span className="text-xs font-mono text-slate-400 mt-0.5 w-10 shrink-0">{event.time}</span>
                            <div className={`p-2 rounded-xl flex items-center gap-3 shadow-sm border border-transparent transition-all hover:scale-[1.02] ${event.color} bg-opacity-20`}>
                                <event.icon size={16} />
                                <div>
                                    <div className="text-xs font-bold">{event.title}</div>
                                    {event.subtitle && <div className="text-[10px] opacity-80">{event.subtitle}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* End of day marker */}
                <div className="relative">
                    <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600 pl-14 text-xs font-bold uppercase tracking-widest pt-1">
                        <Moon size={12}/> Day End
                    </div>
                </div>
            </div>
        </div>
    );
};
