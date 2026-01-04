
import React, { useMemo } from 'react';
import { LogEntry } from '../types';
import { SunMedium, Moon, Coffee, Beer, Hand, HeartPulse, Dumbbell, Circle, Clock, RotateCcw, Bed } from 'lucide-react';

interface GlobalTimelineProps {
    log: LogEntry;
    allLogs: LogEntry[];
}

interface TimelineEvent {
    time: string; // HH:mm
    type: 'sleep_start' | 'wakeup' | 'sleep_end' | 'caffeine' | 'alcohol' | 'masturbation' | 'sex' | 'exercise';
    title: string;
    desc?: string;
    icon: React.ElementType;
    color: string;
    timestamp: number; // 生理排序权重
}

export const GlobalTimeline: React.FC<GlobalTimelineProps> = ({ log, allLogs }) => {
    
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
        return isoString;
    };

    const events = useMemo(() => {
        const list: TimelineEvent[] = [];

        /**
         * 生理日排序权重算法：
         * 1. 昨晚入睡 (Sleep Start of Current Log): 固定权重 -2000 (极早)
         * 2. 今早起床 (Wakeup of Current Log): 固定权重 -1000 (次早)
         * 3. 白天活动 (05:00 - 23:59): 映射为 5 - 23 
         * 4. 深夜活动 (00:00 - 04:59): 映射为 24 - 28 (排在 23:59 之后)
         * 5. 今晚入睡 (Sleep Start of Next Log): 固定权重 5000 (极晚)
         */
        const getPhysioWeight = (timeStr: string) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            let sortH = h;
            if (h < 5) sortH += 24; // 凌晨活动属于生理日的深夜
            return sortH * 60 + m;
        };

        // 1. 昨晚入睡（当前日记记录的“入睡时间”，即本次睡眠的开始）
        const sleepStartTime = getLocalTime(log.sleep?.startTime);
        if (sleepStartTime) {
            list.push({
                time: sleepStartTime,
                type: 'sleep_start',
                title: '入睡',
                desc: '昨晚入睡',
                icon: Moon,
                color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30',
                timestamp: -2000
            });
        }

        // 2. 今早起床（生理日正式开启）
        const wakeTime = getLocalTime(log.sleep?.endTime);
        if (wakeTime) {
            list.push({
                time: wakeTime,
                type: 'wakeup',
                title: '起床',
                desc: log.morning?.wokeWithErection ? `晨勃 Lv${log.morning.hardness}` : '无晨勃',
                icon: SunMedium,
                color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
                timestamp: -1000
            });
        }

        // 3. 今日活动（基于生理时钟排序）
        if (log.caffeineRecord?.items) {
            log.caffeineRecord.items.forEach(item => {
                list.push({
                    time: item.time,
                    type: 'caffeine',
                    title: item.isDaily ? '全天饮茶' : '提神饮品',
                    desc: `${item.name} (${item.volume}ml)`,
                    icon: item.isDaily ? RotateCcw : Coffee,
                    color: item.isDaily ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30' : 'text-amber-700 bg-amber-100 dark:bg-amber-900/30',
                    timestamp: getPhysioWeight(item.time)
                });
            });
        }

        log.exercise?.forEach(ex => {
            const time = ex.startTime.includes(':') ? ex.startTime : '18:00';
            list.push({
                time,
                type: 'exercise',
                title: '运动',
                desc: `${ex.type} (${ex.duration}m)`,
                icon: Dumbbell,
                color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
                timestamp: getPhysioWeight(time)
            });
        });

        if (log.alcoholRecords) {
            log.alcoholRecords.forEach(r => {
                list.push({
                    time: r.time,
                    type: 'alcohol',
                    title: '饮酒',
                    desc: `${r.totalGrams}g 纯酒精`,
                    icon: Beer,
                    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
                    timestamp: getPhysioWeight(r.time)
                });
            });
        }

        log.masturbation?.forEach(m => {
            const time = m.startTime || '22:00';
            list.push({
                time,
                type: 'masturbation',
                title: '自慰',
                desc: `${m.duration}m ${m.ejaculation ? '(射精)' : '(Edging)'}`,
                icon: Hand,
                color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
                timestamp: getPhysioWeight(time)
            });
        });

        log.sex?.forEach(s => {
            const time = s.startTime || '22:00';
            list.push({
                time,
                type: 'sex',
                title: '性生活',
                desc: `${s.duration}m 与伴侣`,
                icon: HeartPulse,
                color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
                timestamp: getPhysioWeight(time)
            });
        });

        // 4. 今晚入睡（生理日终点，存放在下一份日记里）
        const nextLog = allLogs.find(l => new Date(l.date).getTime() > new Date(log.date).getTime());
        if (nextLog && nextLog.sleep?.startTime) {
            const nextSleepTime = getLocalTime(nextLog.sleep.startTime);
            if (nextSleepTime) {
                list.push({
                    time: nextSleepTime,
                    type: 'sleep_end',
                    title: '今晚入睡',
                    desc: nextLog.sleep.environment?.location === 'home' ? '休息中...' : nextLog.sleep.environment?.location,
                    icon: Bed,
                    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
                    timestamp: 5000 // 确保在当天所有活动之后
                });
            }
        }

        return list.sort((a, b) => a.timestamp - b.timestamp);
    }, [log, allLogs]);

    if (events.length === 0) return null;

    return (
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                <Clock size={14} className="mr-2"/> PHYSIOLOGICAL CYCLE
            </h3>
            <div className="relative pl-5 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
                {events.map((e, i) => (
                    <div key={i} className="relative flex items-start gap-4 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 50}ms` }}>
                        {/* Dot */}
                        <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-4 border-white dark:border-[#020617] shadow-sm ${e.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
                        
                        {/* Time */}
                        <div className="text-[11px] font-mono font-black text-slate-400 dark:text-slate-500 pt-1 min-w-[38px] tabular-nums">{e.time}</div>
                        
                        {/* Event Card */}
                        <div className={`flex-1 p-3.5 rounded-2xl flex items-center justify-between transition-all ${e.color.split(' ')[1]}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-white/60 dark:bg-black/20 ${e.color.split(' ')[0]}`}>
                                    <e.icon size={18} strokeWidth={2.5}/>
                                </div>
                                <div>
                                    <div className={`text-xs font-black ${e.color.split(' ')[0]}`}>{e.title}</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{e.desc}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {!allLogs.find(l => new Date(l.date).getTime() > new Date(log.date).getTime()) && (
                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-bold italic">“今晚入睡”将在明天醒来打卡后自动同步至此。</p>
                </div>
            )}
        </div>
    );
};
