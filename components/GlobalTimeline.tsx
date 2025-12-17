
import React, { useMemo } from 'react';
import { LogEntry } from '../types';
import { SunMedium, Moon, Coffee, Beer, Hand, HeartPulse, Dumbbell, Circle, Clock } from 'lucide-react';

interface GlobalTimelineProps {
    log: LogEntry;
}

interface TimelineEvent {
    time: string; // HH:mm
    type: 'wakeup' | 'sleep' | 'caffeine' | 'alcohol' | 'masturbation' | 'sex' | 'exercise';
    title: string;
    desc?: string;
    icon: React.ElementType;
    color: string;
    timestamp: number; // For sorting
}

export const GlobalTimeline: React.FC<GlobalTimelineProps> = ({ log }) => {
    
    // Helper to extract local HH:mm from ISO string or return as is
    const getLocalTime = (isoString?: string): string | undefined => {
        if (!isoString) return undefined;
        if (isoString.includes('T')) {
            try {
                const date = new Date(isoString);
                if (isNaN(date.getTime())) return isoString.split('T')[1]?.slice(0, 5);
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                return `${h}:${m}`;
            } catch {
                return isoString.split('T')[1]?.slice(0, 5);
            }
        }
        return isoString; // Already HH:mm
    };

    const events = useMemo(() => {
        const list: TimelineEvent[] = [];

        const getTimestamp = (timeStr: string) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            let sortH = h;
            if (h < 5) sortH += 24; 
            return sortH * 60 + m;
        };

        // 1. Wake Up (from Sleep End)
        const wakeTime = getLocalTime(log.sleep?.endTime);
        if (wakeTime) {
            list.push({
                time: wakeTime,
                type: 'wakeup',
                title: '起床',
                desc: log.morning?.wokeWithErection ? `晨勃 Lv${log.morning.hardness}` : '无晨勃',
                icon: SunMedium,
                color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
                timestamp: getTimestamp(wakeTime)
            });
        }

        // 2. Caffeine
        if (log.caffeineRecord?.items) {
            log.caffeineRecord.items.forEach(item => {
                list.push({
                    time: item.time,
                    type: 'caffeine',
                    title: '咖啡因',
                    desc: `${item.name} (${item.volume}ml x ${item.count})`,
                    icon: Coffee,
                    color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30',
                    timestamp: getTimestamp(item.time)
                });
            });
        }

        // 3. Exercise
        log.exercise?.forEach(ex => {
            const time = ex.startTime.includes(':') ? ex.startTime : '18:00'; 
            list.push({
                time,
                type: 'exercise',
                title: '运动',
                desc: `${ex.type} (${ex.duration}m) ${ex.feeling ? '- ' + ex.feeling : ''}`,
                icon: Dumbbell,
                color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
                timestamp: getTimestamp(time)
            });
        });

        // 4. Alcohol
        if (log.alcoholRecord && log.alcoholRecord.totalGrams > 0) {
            const time = log.alcoholRecord.time || '20:00';
            list.push({
                time,
                type: 'alcohol',
                title: '饮酒',
                desc: `${log.alcoholRecord.totalGrams}g ${log.alcoholRecord.drunkLevel !== 'none' ? `(${log.alcoholRecord.drunkLevel})` : ''}`,
                icon: Beer,
                color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
                timestamp: getTimestamp(time)
            });
        }

        // 5. Masturbation
        log.masturbation?.forEach(m => {
            const time = m.startTime || '22:00';
            list.push({
                time,
                type: 'masturbation',
                title: '自慰',
                desc: `${m.duration}m ${m.ejaculation ? '(射精)' : '(Edging)'}`,
                icon: Hand,
                color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
                timestamp: getTimestamp(time)
            });
        });

        // 6. Sex
        log.sex?.forEach(s => {
            const time = s.startTime || '22:00';
            const partner = s.interactions?.[0]?.partner || s.partner || '伴侣';
            list.push({
                time,
                type: 'sex',
                title: '性生活',
                desc: `with ${partner} (${s.duration}m)`,
                icon: HeartPulse,
                color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
                timestamp: getTimestamp(time)
            });
        });

        // 7. Sleep Start (Bedtime)
        const sleepTime = getLocalTime(log.sleep?.startTime);
        if (sleepTime) {
            list.push({
                time: sleepTime,
                type: 'sleep',
                title: '入睡',
                desc: log.sleep?.environment?.location === 'home' ? '在家' : log.sleep?.environment?.location,
                icon: Moon,
                color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
                timestamp: getTimestamp(sleepTime)
            });
        }

        return list.sort((a, b) => a.timestamp - b.timestamp);
    }, [log]);

    if (events.length === 0) return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Clock size={32} className="mb-2 opacity-50"/>
            <p className="text-xs">暂无时间轴数据</p>
        </div>
    );

    return (
        <div className="mt-4 pt-4">
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6">
                {events.map((e, i) => (
                    <div key={i} className="relative flex items-start gap-4 group">
                        {/* Timeline Connector */}
                        <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 z-10 flex items-center justify-center`}>
                            <div className={`w-2 h-2 rounded-full ${e.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
                        </div>
                        
                        {/* Time Column */}
                        <div className="text-xs font-mono font-bold text-slate-400 pt-1.5 min-w-[40px] text-right">{e.time}</div>
                        
                        {/* Card Content */}
                        <div className={`flex-1 p-3 rounded-2xl flex items-center justify-between transition-all bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${e.color.split(' ')[0]}`}>
                                    <e.icon size={18}/>
                                </div>
                                <div>
                                    <div className={`text-sm font-bold text-slate-700 dark:text-slate-200`}>{e.title}</div>
                                    <div className="text-xs text-slate-500 font-medium">{e.desc}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
