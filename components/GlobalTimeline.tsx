
import React, { useMemo } from 'react';
import { LogEntry } from '../types';
import { SunMedium, Moon, Coffee, Beer, Hand, HeartPulse, Dumbbell, Circle, Clock, RotateCcw } from 'lucide-react';

interface GlobalTimelineProps {
    log: LogEntry;
    allLogs: LogEntry[]; // 传入全量日志以寻找下一本日记
}

interface TimelineEvent {
    time: string; // HH:mm
    type: 'wakeup' | 'sleep' | 'caffeine' | 'alcohol' | 'masturbation' | 'sex' | 'exercise';
    title: string;
    desc?: string;
    icon: React.ElementType;
    color: string;
    timestamp: number; // 排序用权重
    isDaily?: boolean;
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

        // 生理日排序权重逻辑：
        // 起床时间固定为 0
        // 白天时间 (05:00 - 23:59) 权重为 1-19
        // 深夜时间 (00:00 - 04:59) 权重为 20-25
        // 最终入睡固定为 26
        const getWeight = (timeStr: string) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            let sortH = h;
            // 凌晨活动（0-4点）属于生理日的深夜，排在24点之后
            if (h < 5) sortH += 24; 
            return sortH * 60 + m;
        };

        // 1. 起床事件（生理日开始）
        const wakeTime = getLocalTime(log.sleep?.endTime);
        if (wakeTime) {
            list.push({
                time: wakeTime,
                type: 'wakeup',
                title: '起床',
                desc: log.morning?.wokeWithErection ? `晨勃 Lv${log.morning.hardness}` : '无晨勃',
                icon: SunMedium,
                color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
                timestamp: -1 // 强制置顶
            });
        }

        // 2. 今日活动
        if (log.caffeineRecord?.items) {
            log.caffeineRecord.items.forEach(item => {
                list.push({
                    time: item.time,
                    type: 'caffeine',
                    title: item.isDaily ? '全天饮茶' : '提神饮品',
                    desc: item.isDaily ? `${item.name} (日常反复冲泡)` : `${item.name} (${item.volume}ml x ${item.count})`,
                    icon: item.isDaily ? RotateCcw : Coffee,
                    color: item.isDaily ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30' : 'text-amber-700 bg-amber-100 dark:bg-amber-900/30',
                    timestamp: getWeight(item.time)
                });
            });
        }

        log.exercise?.forEach(ex => {
            const time = ex.startTime.includes(':') ? ex.startTime : '18:00';
            list.push({
                time,
                type: 'exercise',
                title: '运动',
                desc: `${ex.type} (${ex.duration}m) ${ex.feeling ? '- ' + ex.feeling : ''}`,
                icon: Dumbbell,
                color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
                timestamp: getWeight(time)
            });
        });

        if (log.alcoholRecords && log.alcoholRecords.length > 0) {
            log.alcoholRecords.forEach(r => {
                list.push({
                    time: r.time,
                    type: 'alcohol',
                    title: '饮酒',
                    desc: `${r.totalGrams}g ${r.drunkLevel !== 'none' ? `(${r.drunkLevel})` : ''}`,
                    icon: Beer,
                    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
                    timestamp: getWeight(r.time)
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
                timestamp: getWeight(time)
            });
        });

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
                timestamp: getWeight(time)
            });
        });

        // 3. 今晚入睡事件（生理日终点）
        // 核心修复逻辑：今晚入睡的时间存放在“下一本日记”里
        const currentTS = new Date(log.date).getTime();
        const nextLog = allLogs.find(l => new Date(l.date).getTime() > currentTS);
        
        if (nextLog && nextLog.sleep?.startTime) {
            const sleepTime = getLocalTime(nextLog.sleep.startTime);
            if (sleepTime) {
                list.push({
                    time: sleepTime,
                    type: 'sleep',
                    title: '入睡',
                    desc: nextLog.sleep.environment?.location === 'home' ? '在家' : nextLog.sleep.environment?.location,
                    icon: Moon,
                    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
                    timestamp: 99999 // 强制置底
                });
            }
        }

        return list.sort((a, b) => a.timestamp - b.timestamp);
    }, [log, allLogs]);

    if (events.length === 0) return null;

    return (
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                <Clock size={14} className="mr-1.5"/> 生理日时间轴
            </h3>
            <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
                {events.map((e, i) => (
                    <div key={i} className="relative flex items-start gap-3 group">
                        {/* Dot */}
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${e.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
                        
                        {/* Time */}
                        <div className="text-xs font-mono font-bold text-slate-400 pt-0.5 min-w-[36px]">{e.time}</div>
                        
                        {/* Card */}
                        <div className={`flex-1 p-2.5 rounded-xl flex items-center justify-between transition-colors ${e.color.split(' ')[1]}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full bg-white/50 dark:bg-black/20 ${e.color.split(' ')[0]}`}>
                                    <e.icon size={16}/>
                                </div>
                                <div>
                                    <div className={`text-xs font-bold ${e.color.split(' ')[0]}`}>{e.title}</div>
                                    <div className="text-[10px] opacity-80 font-medium">{e.desc}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {!allLogs.find(l => new Date(l.date).getTime() > new Date(log.date).getTime()) && (
                <p className="mt-4 text-[10px] text-slate-400 text-center italic">明天醒来打卡后，今晚的“入睡”点将自动同步。</p>
            )}
        </div>
    );
};
