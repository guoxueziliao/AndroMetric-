
import { LogEntry, AlcoholConsumption, PornConsumption, PreSleepState, ExerciseIntensity, SexQuality, IllnessType, StressLevel, HardnessLevel, MorningWoodRetention, Weather, Location, Mood, SleepAttire, ChangeDetail, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, AlcoholRecord, NapRecord, HistoryCategory, HistoryEventType } from '../types';

export const getTodayDateString = (): string => {
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = (todayDate.getMonth() + 1).toString().padStart(2, '0');
    const day = todayDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatTime = (isoString?: string): string => {
    if (!isoString) return '--:--';
    try {
        if (/^\d{1,2}:\d{2}$/.test(isoString)) return isoString;
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
        return '--:--';
    }
};

export const formatDateFriendly = (dateStr: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
};

export const formatHistoryValue = (field: string, val: string | null | undefined): string => {
    if (!field) return val ? String(val) : '—';
    const f = String(field);
    if (val === null || val === undefined || val === 'null' || val === 'undefined' || val === '空' || val === '') return '—';
    if (val === 'true') return '是';
    if (val === 'false') return '否';
    if (val === '是' || val === '否') return val;
    if (['时间', '开始', '结束'].some(k => f.includes(k))) return formatTime(val);
    if (['质量', '评分', '爽度'].some(k => f.includes(k))) {
        const num = parseInt(val.replace(/[^\d]/g, '')); 
        if (!isNaN(num)) return '★'.repeat(num) + '☆'.repeat(5 - num);
    }
    if (f.includes('硬度')) {
        const num = parseInt(val.replace(/[^\d]/g, ''));
        if (!isNaN(num) && num >= 1 && num <= 5) return `${num}级`;
    }
    return String(val);
};

export const calculateSleepDuration = (sleepTime?: string, wakeTime?: string): string | null => {
    if (!sleepTime || !wakeTime) return null;
    const start = new Date(sleepTime).getTime();
    const end = new Date(wakeTime).getTime();
    if (isNaN(start) || isNaN(end)) return null;
    if (end <= start) return null;
    const diffMinutes = Math.round((end - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}小时 ${minutes}分钟`;
};

export const analyzeSleep = (sleepTime?: string, wakeTime?: string) => {
    if (!sleepTime || !wakeTime) return null;
    const start = new Date(sleepTime);
    const end = new Date(wakeTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    if (end <= start) return null;
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const hour = start.getHours();
    const isLate = hour >= 0 && hour < 5;
    const isInsufficient = durationHours < 6;
    const isExcessive = durationHours > 9;
    return { durationHours, isLate, isInsufficient, isExcessive };
};

export const LABELS = {
    hardness: { 1: '1级 (软)', 2: '2级 (较软)', 3: '3级 (标准)', 4: '4级 (硬)', 5: '5级 (最硬)' } as Record<HardnessLevel, string>,
    retention: { instant: '瞬间消失', brief: '快速消退', normal: '正常消退', extended: '持久坚挺' } as Record<MorningWoodRetention, string>,
    stress: { 1: '放松', 2: '还好', 3: '一般', 4: '有压力', 5: '崩溃' } as Record<StressLevel, string>,
    alcohol: { none: '无', low: '少量', medium: '适量', high: '较多' } as Record<AlcoholConsumption, string>,
    porn: { none: '无', low: '少量', medium: '适量', high: '较多' } as Record<PornConsumption, string>,
    exercise: { low: '低强度', medium: '中强度', high: '高强度' } as Record<ExerciseIntensity, string>,
    illness: { cold: '感冒', fever: '发烧', headache: '头痛', other: '其他' } as Record<IllnessType, string>,
    preSleep: { tired: '疲劳', energetic: '兴奋', stressed: '压力', calm: '平静', other: '其他' } as Record<PreSleepState, string>,
    weather: { sunny: '晴', cloudy: '多云', rainy: '雨', snowy: '雪', windy: '大风', foggy: '雾' } as Record<Weather, string>,
    location: { home: '家', partner: '伴侣家', hotel: '酒店', travel: '旅途', other: '其他' } as Record<Location, string>,
    mood: { happy: '开心', excited: '兴奋', neutral: '平淡', anxious: '焦虑', sad: '低落', angry: '生气' } as Record<Mood, string>,
    attire: { naked: '裸睡', light: '内衣', pajamas: '睡衣', other: '其他' } as Record<SleepAttire, string>,
    drunkLevel: { none: '无', tipsy: '微醺', drunk: '醉', wasted: '烂醉' } as Record<string, string>,
    feeling: { normal: '正常', minor_discomfort: '轻微不适', bad: '难受' } as Record<string, string>, // Legacy
    discomfortLevel: { mild: '轻微不适', moderate: '明显不适', severe: '很难受' } as Record<string, string>,
    exFeeling: { great: '很爽', ok: '正常', tired: '累爆', bad: '不适' } as Record<string, string>,
    caffeine: { none: '无', low: '少', medium: '中', high: '多' } as Record<string, string>,
};

export const inferHistoryEventType = (summary: string): HistoryEventType => {
    if (!summary) return 'manual';
    const s = String(summary);
    if (s.includes('自动') || s.includes('修复')) return 'auto';
    if (s.includes('快速') || s.includes('开始') || s.includes('完成午休') || s.includes('记录')) return 'quick';
    return 'manual';
};

export const generateLogSummary = (log: Partial<LogEntry>): Array<{ label: string, value: string }> => {
    const summary: Array<{ label: string, value: string }> = [];
    const morning = log.morning;
    const sleepRec = log.sleep;

    // 1. Morning Wood
    const morningTxt = [];
    if (morning?.wokeWithErection) {
        morningTxt.push(`硬度: ${LABELS.hardness[morning.hardness || 3]}`);
        morningTxt.push(`维持: ${LABELS.retention[morning.retention || 'normal']}`);
        if(morning.wokenByErection) morningTxt.push('⚠️ 被晨勃弄醒');
    } else {
        morningTxt.push('无晨勃');
    }
    summary.push({ label: '晨勃情况', value: morningTxt.join(' | ') });

    // 2. Sleep & Naps
    const sleepTxt = [];
    if (sleepRec?.startTime && sleepRec?.endTime) {
        sleepTxt.push(`${formatTime(sleepRec.startTime)} - ${formatTime(sleepRec.endTime)} (${calculateSleepDuration(sleepRec.startTime, sleepRec.endTime)})`);
        const analysis = analyzeSleep(sleepRec.startTime, sleepRec.endTime);
        if (analysis) {
            const warnings = [];
            if (analysis.isLate) warnings.push('熬夜');
            if (analysis.isInsufficient) warnings.push('睡眠不足');
            if (warnings.length > 0) sleepTxt.push(`⚠️ ${warnings.join(', ')}`);
        }
    } else if (sleepRec?.startTime) {
        sleepTxt.push(`${formatTime(sleepRec.startTime)} - ... (睡觉中)`);
    }
    
    if (sleepRec) sleepTxt.push(`评分: ${sleepRec.quality}星 | 睡衣: ${LABELS.attire[sleepRec.attire || 'light']}`);
    if (sleepRec?.hasDream) sleepTxt.push(`💭 梦境: ${sleepRec.dreamTypes?.join(',') || '有'}`);
    
    const sleepEvents = [];
    if (sleepRec?.naturalAwakening) sleepEvents.push('自然醒');
    if (sleepRec?.nocturnalEmission) sleepEvents.push('遗精');
    if (sleepEvents.length > 0) sleepTxt.push(`事件: ${sleepEvents.join(', ')}`);
    
    if (sleepRec?.naps && sleepRec.naps.length > 0) {
        const napSummary = sleepRec.naps.map(n => {
            if (n.ongoing) return `😴 进行中 (${n.startTime})`;
            const dreamStr = n.hasDream ? `(梦: ${n.dreamTypes?.join(',')})` : '';
            return `😴 ${n.startTime}-${n.endTime || '?'} (${n.duration}分) ${dreamStr}`;
        }).join('\n');
        sleepTxt.push(`午休:\n${napSummary}`);
    }
    summary.push({ label: '睡眠周期', value: sleepTxt.join('\n') });

    // 3. Environment & State
    const env = [];
    env.push(`天气: ${LABELS.weather[log.weather || 'sunny']}`);
    env.push(`地点: ${LABELS.location[log.location || 'home']}`);
    env.push(`心情: ${LABELS.mood[log.mood || 'neutral']}`);
    env.push(`压力: ${LABELS.stress[log.stressLevel || 2]}`);
    summary.push({ label: '身心环境', value: env.join(' | ') });

    // 4. Lifestyle
    const life = [];
    if (log.alcoholRecord && log.alcoholRecord.totalGrams > 0) {
        const itemStr = log.alcoholRecord.items.map(i => `${i.name}x${i.count}`).join(', ');
        life.push(`🍺 饮酒: ${log.alcoholRecord.totalGrams}g纯酒精 [${LABELS.drunkLevel[log.alcoholRecord.drunkLevel || 'none']}] (${itemStr})`);
    } else {
        life.push(`饮酒: ${LABELS.alcohol[log.alcohol || 'none']}`);
    }
    life.push(`看片: ${LABELS.porn[log.pornConsumption || 'none']}`);
    
    if (log.caffeineRecord && log.caffeineRecord.totalCount > 0) {
        const detailStr = log.caffeineRecord.items
            .map(i => `${i.name} ${i.volume}ml${i.count > 1 ? 'x'+i.count : ''}`)
            .join(', ');
        life.push(`☕ 咖啡因: ${log.caffeineRecord.totalCount}杯 [${detailStr}]`);
    } else {
        life.push(`☕ 咖啡因: 无`);
    }
    
    if (log.exercise && log.exercise.length > 0) {
        const exList = log.exercise.map((e, i) => {
            if (e.steps) return `${i+1}. ${e.type} (${e.steps}步)`;
            let str = `${i+1}. ${e.startTime} ${e.type} (${e.duration}分)`;
            if(e.bodyParts && e.bodyParts.length > 0) str += ` [${e.bodyParts.join(',')}]`;
            if(e.feeling) str += ` [${LABELS.exFeeling[e.feeling || 'ok']}]`;
            return str;
        });
        summary.push({ label: `运动 (${log.exercise.length})`, value: exList.join('\n') });
    } else {
        life.push('运动: 无');
        summary.push({ label: '生活习惯', value: life.join('\n') });
    }

    // 5. Sex Life
    if (log.sex && log.sex.length > 0) {
        const sexDetails = log.sex.map((r, i) => {
            const partner = r.interactions?.[0]?.partner || r.partner || '伴侣';
            let ejocInfo = r.ejaculation ? '射精' : '';
            if (r.ejaculation && r.ejaculationLocation) {
                ejocInfo += ` (${r.ejaculationLocation}${r.semenSwallowed ? '/吞' : ''})`;
            }
            return `${i + 1}. ${r.startTime} ${partner} (${r.duration}分) ${ejocInfo}`;
        });
        summary.push({ label: `性生活 (${log.sex.length})`, value: sexDetails.join('\n') });
    } else {
        summary.push({ label: '性生活', value: '无' });
    }

    // 6. Masturbation
    if (log.masturbation && log.masturbation.length > 0) {
        const mbDetails = log.masturbation.map((r, i) => {
            const tools = r.tools?.join(',') || '手';
            let extra = '';
            if (r.volumeForceLevel) extra += ` [射精Lv.${r.volumeForceLevel}]`;
            if (r.materialsList && r.materialsList.length > 0) extra += ` [素材:${r.materialsList.length}]`;
            
            return `${i + 1}. ${r.startTime} ${tools} (${r.duration}分)${extra} ${r.status === 'inProgress' ? '[进行中]' : ''}`;
        });
        summary.push({ label: `自慰 (${log.masturbation.length})`, value: mbDetails.join('\n') });
    } else {
        summary.push({ label: '自慰', value: '无' });
    }

    // 7. Health (New V0.0.6 structure)
    if (log.health) {
        let healthText = log.health.isSick 
            ? `🔴 身体不适: ${log.health.discomfortLevel ? LABELS.discomfortLevel[log.health.discomfortLevel] : '未记录程度'}` 
            : '🟢 身体健康';
        
        if (log.health.isSick) {
            if (log.health.symptoms && log.health.symptoms.length > 0) healthText += `\n症状: ${log.health.symptoms.join(', ')}`;
            if (log.health.medications && log.health.medications.length > 0) healthText += `\n用药: ${log.health.medications.join(', ')}`;
        }
        summary.push({ label: '健康状况', value: healthText });
    }

    // 8. Notes
    if ((log.tags && log.tags.length > 0) || log.notes || (log.dailyEvents && log.dailyEvents.length > 0)) {
        const notes = [];
        if (log.dailyEvents && log.dailyEvents.length > 0) notes.push(`📅 事件: ${log.dailyEvents.join(' + ')}`);
        if (log.tags && log.tags.length > 0) notes.push(`标签: ${log.tags.join(', ')}`);
        if (log.notes) notes.push(`备注: ${log.notes}`);
        summary.push({ label: '备注信息', value: notes.join('\n') });
    }

    return summary;
};

// Calculate Inventory (Time since last ejaculation)
export const calculateInventory = (logs: LogEntry[]): string => {
    let lastEjaculationTime: number | null = null;
    
    // Sort logs descending
    const sortedLogs = [...logs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const log of sortedLogs) {
        const dateStr = log.date;
        
        // Check Sex
        if (log.sex) {
            // Check in reverse order of array
            for (let i = log.sex.length - 1; i >= 0; i--) {
                const s = log.sex[i];
                if (s.ejaculation) {
                    const time = s.startTime || '22:00';
                    lastEjaculationTime = new Date(`${dateStr}T${time}:00`).getTime();
                    break;
                }
            }
        }
        if (lastEjaculationTime) break;

        // Check Masturbation
        if (log.masturbation) {
            for (let i = log.masturbation.length - 1; i >= 0; i--) {
                const m = log.masturbation[i];
                if (m.ejaculation) {
                    const time = m.startTime || '23:00';
                    lastEjaculationTime = new Date(`${dateStr}T${time}:00`).getTime();
                    break;
                }
            }
        }
        if (lastEjaculationTime) break;
        
        // Check nocturnal emission
        if (log.sleep?.nocturnalEmission) {
             const time = log.sleep.endTime || '07:00'; // Assume wake up time
             lastEjaculationTime = new Date(`${dateStr}T${time}:00`).getTime();
             break;
        }
    }

    if (!lastEjaculationTime) return '未知';

    const now = Date.now();
    const diffMs = now - lastEjaculationTime;
    if (diffMs < 0) return '刚刚';

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffHrs / 24);
    const hours = diffHrs % 24;

    return `${days}天 ${hours}小时`;
};

// Calculate Data Quality Score (0-100) based on current log completeness
export const calculateDataQuality = (log: Partial<LogEntry>): number => {
    let score = 0;
    const maxScore = 100;
    
    // Morning: 20pts
    if (log.morning?.wokeWithErection !== undefined) score += 10;
    if (log.morning?.wokeWithErection && log.morning.hardness) score += 10;
    else if (log.morning?.wokeWithErection === false) score += 10;

    // Sleep: 30pts
    if (log.sleep?.startTime && log.sleep?.endTime) score += 15;
    if (log.sleep?.quality) score += 5;
    if (log.sleep?.hasDream !== undefined) score += 5;
    if (log.sleep?.environment?.temperature) score += 5;

    // Lifestyle: 20pts
    if (log.weather) score += 5;
    if (log.stressLevel) score += 5;
    if (log.mood) score += 5;
    if (log.caffeineIntake || (log.caffeineRecord?.totalCount || 0) > 0) score += 5;

    // Activities (Bonus up to 30)
    if (log.sex && log.sex.length > 0) score += 10;
    if (log.masturbation && log.masturbation.length > 0) score += 10;
    if (log.exercise && log.exercise.length > 0) score += 10;
    if (log.alcoholRecord && log.alcoholRecord.totalGrams > 0) score += 5;
    
    // Health Check Penalty (New in v0.0.6)
    // If Sick is TRUE but Level is Missing -> Penalty
    if (log.health?.isSick) {
        if (log.health.discomfortLevel) score += 5;
        else score -= 5;
    } else {
        score += 5; // Healthy bonus
    }

    return Math.min(maxScore, Math.max(0, score));
};

export const calculateLogDiff = (oldLog: LogEntry, newLog: LogEntry): ChangeDetail[] => {
    const diffs: ChangeDetail[] = [];

    // Morning
    if (oldLog.morning?.hardness !== newLog.morning?.hardness) {
        diffs.push({ 
            field: '晨勃硬度', 
            oldValue: String(oldLog.morning?.hardness || '无'), 
            newValue: String(newLog.morning?.hardness || '无'), 
            category: 'morning' 
        });
    }

    // Sleep
    if (oldLog.sleep?.startTime !== newLog.sleep?.startTime) {
        diffs.push({ 
            field: '入睡时间', 
            oldValue: formatTime(oldLog.sleep?.startTime) || '无', 
            newValue: formatTime(newLog.sleep?.startTime) || '无', 
            category: 'sleep' 
        });
    }
    if (oldLog.sleep?.endTime !== newLog.sleep?.endTime) {
        diffs.push({ 
            field: '起床时间', 
            oldValue: formatTime(oldLog.sleep?.endTime) || '无', 
            newValue: formatTime(newLog.sleep?.endTime) || '无', 
            category: 'sleep' 
        });
    }
    
    // Lifestyle
    const oldAlc = oldLog.alcoholRecord?.totalGrams || 0;
    const newAlc = newLog.alcoholRecord?.totalGrams || 0;
    if (oldAlc !== newAlc) {
        diffs.push({ 
            field: '酒精摄入', 
            oldValue: `${oldAlc}g`, 
            newValue: `${newAlc}g`, 
            category: 'lifestyle' 
        });
    }

    // Counts
    const sexDiff = (newLog.sex?.length || 0) - (oldLog.sex?.length || 0);
    if (sexDiff !== 0) {
        diffs.push({ 
            field: '性生活', 
            oldValue: `${oldLog.sex?.length || 0}次`, 
            newValue: `${newLog.sex?.length || 0}次`, 
            category: 'sex' 
        });
    }
    
    // Fallback if no specific diffs but updated
    if (diffs.length === 0 && JSON.stringify(oldLog) !== JSON.stringify(newLog)) {
         diffs.push({ field: '记录详情', oldValue: '...', newValue: '已更新', category: 'meta' });
    }

    return diffs;
};