
import { LogEntry, AlcoholConsumption, PornConsumption, PreSleepState, ExerciseIntensity, SexQuality, IllnessType, StressLevel, HardnessLevel, MorningWoodRetention, Weather, Location, Mood, SleepAttire, ChangeDetail, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, AlcoholRecord, NapRecord, HistoryCategory, HistoryEventType, ChangeType } from '../types';

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

export const formatHistoryValue = (field: string, val: any): string => {
    if (!field) return val ? String(val) : '—';
    if (val === null || val === undefined || val === 'null' || val === 'undefined' || val === '空' || val === '') return '—';
    
    // Handle booleans
    if (val === true || val === 'true') return '是';
    if (val === false || val === 'false') return '否';
    
    const f = String(field);
    const sVal = String(val);

    if (['时间', '开始', '结束'].some(k => f.includes(k))) return formatTime(sVal);
    
    if (['质量', '评分', '爽度'].some(k => f.includes(k))) {
        const num = parseInt(sVal.replace(/[^\d]/g, '')); 
        if (!isNaN(num)) return '★'.repeat(num) + '☆'.repeat(5 - num);
    }
    
    if (f.includes('硬度')) {
        const num = parseInt(sVal.replace(/[^\d]/g, ''));
        if (!isNaN(num) && num >= 1 && num <= 5) return `${num}级`;
    }
    
    // Translate labels if possible
    for (const group of Object.values(LABELS)) {
        if (group[val as keyof typeof group]) {
            return group[val as keyof typeof group];
        }
    }

    return sVal;
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
    const durationHours = durationMs / (1000 * 60 * 60); // Corrected: removed division by 24
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

/**
 * Calculates the difference between two log entries.
 */
export const calculateLogDiff = (oldLog: LogEntry, newLog: LogEntry): ChangeDetail[] => {
    const diffs: ChangeDetail[] = [];

    const check = (
        field: string, 
        oldVal: any, 
        newVal: any, 
        label: string, 
        category: HistoryCategory
    ) => {
        // Normalize values for comparison
        const v1 = (oldVal === null || oldVal === undefined) ? '' : String(oldVal);
        const v2 = (newVal === null || newVal === undefined) ? '' : String(newVal);

        if (v1 !== v2) {
            let changeType: ChangeType = 'mod';
            const isEmpty1 = !v1 || v1 === 'false' || v1 === '0';
            const isEmpty2 = !v2 || v2 === 'false' || v2 === '0';

            if (isEmpty1 && !isEmpty2) changeType = 'add';
            else if (!isEmpty1 && isEmpty2) changeType = 'del';

            diffs.push({
                field: label,
                oldValue: v1,
                newValue: v2,
                category,
                changeType
            });
        }
    };

    // 1. Morning
    check('morning.wokeWithErection', oldLog.morning?.wokeWithErection, newLog.morning?.wokeWithErection, '有无晨勃', 'morning');
    if (newLog.morning?.wokeWithErection) {
        check('morning.hardness', oldLog.morning?.hardness, newLog.morning?.hardness, '晨勃硬度', 'morning');
        check('morning.retention', oldLog.morning?.retention, newLog.morning?.retention, '维持时间', 'morning');
    }

    // 2. Sleep
    check('sleep.startTime', oldLog.sleep?.startTime, newLog.sleep?.startTime, '入睡时间', 'sleep');
    check('sleep.endTime', oldLog.sleep?.endTime, newLog.sleep?.endTime, '起床时间', 'sleep');
    check('sleep.quality', oldLog.sleep?.quality, newLog.sleep?.quality, '睡眠质量', 'sleep');
    
    // Naps count
    const naps1 = oldLog.sleep?.naps?.length || 0;
    const naps2 = newLog.sleep?.naps?.length || 0;
    if (naps1 !== naps2) {
        diffs.push({
            field: '午休次数',
            oldValue: String(naps1),
            newValue: String(naps2),
            category: 'nap',
            changeType: naps2 > naps1 ? 'add' : 'del'
        });
    }

    // 3. Environment & State
    check('location', oldLog.location, newLog.location, '地点', 'lifestyle');
    check('weather', oldLog.weather, newLog.weather, '天气', 'lifestyle');
    check('mood', oldLog.mood, newLog.mood, '心情', 'lifestyle');
    check('stressLevel', oldLog.stressLevel, newLog.stressLevel, '压力', 'lifestyle');

    // 4. Activities
    // Sex
    const sex1 = oldLog.sex?.length || 0;
    const sex2 = newLog.sex?.length || 0;
    if (sex1 !== sex2) {
        diffs.push({
            field: '性生活',
            oldValue: `${sex1}次`,
            newValue: `${sex2}次`,
            category: 'sex',
            changeType: sex2 > sex1 ? 'add' : 'del'
        });
    }

    // Masturbation
    const mb1 = oldLog.masturbation?.length || 0;
    const mb2 = newLog.masturbation?.length || 0;
    if (mb1 !== mb2) {
        diffs.push({
            field: '自慰',
            oldValue: `${mb1}次`,
            newValue: `${mb2}次`,
            category: 'masturbation',
            changeType: mb2 > mb1 ? 'add' : 'del'
        });
    }

    // Exercise
    const ex1 = oldLog.exercise?.length || 0;
    const ex2 = newLog.exercise?.length || 0;
    if (ex1 !== ex2) {
        diffs.push({
            field: '运动',
            oldValue: `${ex1}组`,
            newValue: `${ex2}组`,
            category: 'exercise',
            changeType: ex2 > ex1 ? 'add' : 'del'
        });
    }

    // 5. Health
    check('health.isSick', oldLog.health?.isSick, newLog.health?.isSick, '身体不适', 'health');
    if (newLog.health?.isSick) {
        check('health.discomfortLevel', oldLog.health?.discomfortLevel, newLog.health?.discomfortLevel, '不适程度', 'health');
    }

    // 6. Lifestyle
    const alc1 = oldLog.alcoholRecord?.totalGrams || 0;
    const alc2 = newLog.alcoholRecord?.totalGrams || 0;
    if (alc1 !== alc2) {
        check('alcoholRecord.totalGrams', `${alc1}g`, `${alc2}g`, '酒精摄入', 'lifestyle');
    }
    
    check('pornConsumption', oldLog.pornConsumption, newLog.pornConsumption, '看片', 'lifestyle');
    
    const caf1 = oldLog.caffeineRecord?.totalCount || 0;
    const caf2 = newLog.caffeineRecord?.totalCount || 0;
    if (caf1 !== caf2) {
        diffs.push({
            field: '咖啡因',
            oldValue: `${caf1}杯`,
            newValue: `${caf2}杯`,
            category: 'lifestyle',
            changeType: caf2 > caf1 ? 'add' : 'del'
        });
    }

    // 7. Notes
    check('notes', oldLog.notes, newLog.notes, '备注', 'meta');

    return diffs;
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
            /**
             * Fixed Property access: r.materialsList is now defined in types.
             */
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
    
    // Morning: 20pts
    if (log.morning?.wokeWithErection !== undefined) score += 10;
    if (log.morning?.wokeWithErection && log.morning.hardness) score += 10;
    
    // Sleep: 30pts
    if (log.sleep?.startTime && log.sleep?.endTime) score += 20;
    if (log.sleep?.quality) score += 10;
    
    // Env & State: 20pts
    if (log.weather) score += 5;
    if (log.location) score += 5;
    if (log.mood) score += 5;
    if (log.stressLevel) score += 5;
    
    // Activities: Bonus points
    if (log.exercise && log.exercise.length > 0) score += 15;
    if ((log.sex && log.sex.length > 0) || (log.masturbation && log.masturbation.length > 0)) score += 15;
    
    // Health / Lifestyle Check: 15pts
    if (log.alcohol || log.pornConsumption || log.health) score += 15;

    return Math.min(100, score);
};
