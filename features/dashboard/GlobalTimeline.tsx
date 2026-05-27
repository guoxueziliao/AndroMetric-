import React, { useMemo } from 'react';
import type { LogEntry } from '../../domain';
import { SunMedium, Moon, Coffee, Beer, Hand, HeartPulse, Dumbbell, Clock, RotateCcw, Bed } from 'lucide-react';

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
    tone: {
        dot: string;
        surface: string;
        icon: string;
        text: string;
    };
    timestamp: number; // 生理排序权重
}

const timelineTone = {
    sleep: { dot: 'bg-chart-tertiary', surface: 'bg-chart-tertiary/10', icon: 'text-chart-tertiary', text: 'text-chart-tertiary' },
    wake: { dot: 'bg-state-warning-text', surface: 'bg-state-warning-bg', icon: 'text-state-warning-text', text: 'text-state-warning-text' },
    success: { dot: 'bg-state-success-text', surface: 'bg-state-success-bg', icon: 'text-state-success-text', text: 'text-state-success-text' },
    alcohol: { dot: 'bg-chart-tertiary', surface: 'bg-chart-tertiary/10', icon: 'text-chart-tertiary', text: 'text-chart-tertiary' },
    info: { dot: 'bg-state-info-text', surface: 'bg-state-info-bg', icon: 'text-state-info-text', text: 'text-state-info-text' },
    adult: { dot: 'bg-accent-vivid', surface: 'bg-accent-vivid/10', icon: 'text-accent-vivid', text: 'text-accent-vivid' },
    warning: { dot: 'bg-state-warning-text', surface: 'bg-state-warning-bg', icon: 'text-state-warning-text', text: 'text-state-warning-text' }
} as const;

export const GlobalTimeline: React.FC<GlobalTimelineProps> = ({ log, allLogs }) => {
    
    const getLocalTime = (isoString?: string | null): string | undefined => {
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
                tone: timelineTone.sleep,
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
                tone: timelineTone.wake,
                timestamp: -1000
            });
        }

        // 3. 今日活动（基于生理时钟排序）
        if (log.caffeineRecord?.items && Array.isArray(log.caffeineRecord.items)) {
            log.caffeineRecord.items.forEach(item => {
                list.push({
                    time: item.time,
                    type: 'caffeine',
                    title: item.isDaily ? '全天饮茶' : '提神饮品',
                    desc: `${item.name} (${item.volume}ml)`,
                    icon: item.isDaily ? RotateCcw : Coffee,
                    tone: item.isDaily ? timelineTone.success : timelineTone.warning,
                    timestamp: getPhysioWeight(item.time)
                });
            });
        }

        if (log.exercise && Array.isArray(log.exercise)) {
            log.exercise.forEach(ex => {
                const time = ex.startTime && ex.startTime.includes(':') ? ex.startTime : '18:00';
                list.push({
                    time,
                    type: 'exercise',
                    title: '运动',
                    desc: `${ex.type} (${ex.duration}m)`,
                    icon: Dumbbell,
                    tone: timelineTone.success,
                    timestamp: getPhysioWeight(time)
                });
            });
        }

        if (log.alcoholRecords && Array.isArray(log.alcoholRecords)) {
            log.alcoholRecords.forEach(r => {
                list.push({
                    time: r.time,
                    type: 'alcohol',
                    title: '饮酒',
                    desc: `${r.totalGrams}g 纯酒精`,
                    icon: Beer,
                    tone: timelineTone.alcohol,
                    timestamp: getPhysioWeight(r.time)
                });
            });
        }

        if (log.masturbation && Array.isArray(log.masturbation)) {
            log.masturbation.forEach(m => {
                const time = m.startTime || '22:00';
                list.push({
                    time,
                    type: 'masturbation',
                    title: '自慰',
                    desc: `${m.duration}m ${m.ejaculation ? '(射精)' : '(Edging)'}`,
                    icon: Hand,
                    tone: timelineTone.info,
                    timestamp: getPhysioWeight(time)
                });
            });
        }

        if (log.sex && Array.isArray(log.sex)) {
            log.sex.forEach(s => {
                const time = s.startTime || '22:00';
                list.push({
                    time,
                    type: 'sex',
                    title: '性生活',
                    desc: `${s.duration}m 与伴侣`,
                    icon: HeartPulse,
                    tone: timelineTone.adult,
                    timestamp: getPhysioWeight(time)
                });
            });
        }

        // 4. 今晚入睡（生理日终点，存放在【明天】的日记里）
        // 修复点：限定查找当前日期的后一天记录
        const currentLogDate = new Date(log.date + 'T12:00:00');
        const tomorrowDate = new Date(currentLogDate);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0];

        const nextLog = allLogs.find(l => l.date === tomorrowDateStr);
        
        if (nextLog && nextLog.sleep?.startTime) {
            const nextSleepTime = getLocalTime(nextLog.sleep.startTime);
            if (nextSleepTime) {
                list.push({
                    time: nextSleepTime,
                    type: 'sleep_end',
                    title: '今晚入睡',
                    desc: nextLog.sleep.environment?.location === 'home' ? '休息中...' : (nextLog.sleep.environment?.location ?? undefined),
                    icon: Bed,
                    tone: timelineTone.sleep,
                    timestamp: 5000 // 确保在当天所有活动之后
                });
            }
        }

        return list.sort((a, b) => a.timestamp - b.timestamp);
    }, [log, allLogs]);

    if (events.length === 0) return null;

    return (
        <div className="mt-6 border-t border-surface-border pt-6">
            <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 flex items-center">
                <Clock size={14} className="mr-2"/> 生理日时间线
            </h3>
            <div className="relative pl-5 border-l-2 border-surface-border space-y-6">
                {events.map((e, i) => (
                    <div key={i} className="relative flex items-start gap-4 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 50}ms` }}>
                        {/* Dot */}
                        <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-4 border-surface-base shadow-sm ${e.tone.dot}`}></div>
                        
                        {/* Time */}
                        <div className="text-[11px] font-mono font-black text-text-muted pt-1 min-w-[38px] tabular-nums">{e.time}</div>
                        
                        {/* Event Card */}
                        <div className={`flex-1 p-3.5 rounded-2xl flex items-center justify-between transition-all ${e.tone.surface}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-surface-card/60 ${e.tone.icon}`}>
                                    <e.icon size={18} strokeWidth={2.5}/>
                                </div>
                                <div>
                                    <div className={`text-xs font-black ${e.tone.text}`}>{e.title}</div>
                                    <div className="text-[10px] text-text-muted font-bold mt-0.5">{e.desc}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {!allLogs.find(l => {
                const d = new Date(log.date + 'T12:00:00');
                d.setDate(d.getDate() + 1);
                return l.date === d.toISOString().split('T')[0];
            }) && (
                <div className="mt-8 p-4 bg-surface-muted rounded-2xl border border-dashed border-surface-border text-center">
                    <p className="text-[10px] text-text-muted font-bold italic">“今晚入睡”将在明天醒来打卡后自动同步至此。</p>
                </div>
            )}
        </div>
    );
};
