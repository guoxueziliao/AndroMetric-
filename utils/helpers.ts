
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
        // Handle HH:mm format directly
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
    
    // Booleans
    if (val === 'true') return '是';
    if (val === 'false') return '否';
    if (val === '是' || val === '否') return val;

    // Time Fields
    if (['时间', '开始', '结束'].some(k => f.includes(k))) {
        return formatTime(val);
    }

    // Rating Fields (1-5) -> Stars
    if (['质量', '评分', '爽度'].some(k => f.includes(k))) {
        const num = parseInt(val.replace(/[^\d]/g, '')); 
        if (!isNaN(num)) {
             return '★'.repeat(num) + '☆'.repeat(5 - num);
        }
    }
    
    // Hardness -> Level
    if (f.includes('硬度')) {
        const num = parseInt(val.replace(/[^\d]/g, ''));
        if (!isNaN(num) && num >= 1 && num <= 5) {
            return `${num}级`;
        }
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
    stress: { 1: '平静', 2: '还好', 3: '有压力', 4: '压力大', 5: '崩溃' } as Record<StressLevel, string>,
    alcohol: { none: '无', low: '少量', medium: '适量', high: '较多' } as Record<AlcoholConsumption, string>,
    porn: { none: '无', low: '少量', medium: '适量', high: '较多' } as Record<PornConsumption, string>,
    exercise: { low: '低强度', medium: '中强度', high: '高强度' } as Record<ExerciseIntensity, string>,
    illness: { cold: '感冒', fever: '发烧', headache: '头痛', other: '其他' } as Record<IllnessType, string>,
    preSleep: { tired: '疲劳', energetic: '兴奋', stressed: '压力', calm: '平静', other: '其他' } as Record<PreSleepState, string>,
    weather: { sunny: '晴', cloudy: '多云', rainy: '雨', snowy: '雪', windy: '大风', foggy: '雾' } as Record<Weather, string>,
    location: { home: '家', partner: '伴侣家', hotel: '酒店', travel: '旅途', other: '其他' } as Record<Location, string>,
    mood: { happy: '开心', excited: '兴奋', neutral: '平淡', anxious: '焦虑', sad: '低落', angry: '生气' } as Record<Mood, string>,
    attire: { naked: '裸睡', light: '内衣', pajamas: '睡衣', other: '其他' } as Record<SleepAttire, string>,
    // v0.0.5 additions
    drunkLevel: { none: '无', tipsy: '微醺', drunk: '醉', wasted: '烂醉' } as Record<string, string>,
    feeling: { normal: '正常', minor_discomfort: '轻微不适', bad: '难受' } as Record<string, string>,
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
    
    if (sleepRec) sleepTxt.push(`质量: ${sleepRec.quality}星 | 睡衣: ${LABELS.attire[sleepRec.attire || 'light']}`);
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
    life.push(`☕ 咖啡因: ${LABELS.caffeine[log.caffeineIntake || 'none']}`);
    
    if (log.exercise && log.exercise.length > 0) {
        const exList = log.exercise.map((e, i) => {
            if (e.steps) return `${i+1}. ${e.type} (${e.steps}步)`;
            let str = `${i+1}. ${e.startTime} ${e.type} (${e.duration}分)`;
            if(e.bodyParts && e.bodyParts.length > 0) str += ` [${e.bodyParts.join(',')}]`;
            if(e.feeling) str += ` [${LABELS.exFeeling[e.feeling]}]`;
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
            return `${i + 1}. ${r.startTime} ${tools} (${r.duration}分) ${r.status === 'inProgress' ? '[进行中]' : ''}`;
        });
        summary.push({ label: `自慰 (${log.masturbation.length})`, value: mbDetails.join('\n') });
    } else {
        summary.push({ label: '自慰', value: '无' });
    }

    // 7. Health
    if (log.health) {
        let healthText = log.health.isSick ? `🔴 生病: ${LABELS.feeling[log.health.feeling || 'bad']}` : '🟢 健康';
        if (log.health.symptoms && log.health.symptoms.length > 0) healthText += `\n症状: ${log.health.symptoms.join(', ')}`;
        if (log.health.medications && log.health.medications.length > 0) healthText += `\n用药: ${log.health.medications.join(', ')}`;
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

const getFieldLabel = (key: string): string => {
    const map: Record<string, string> = {
        hardness: '硬度', retention: '晨勃维持', wokeWithErection: '有无晨勃', wokenByErection: '被晨勃弄醒',
        sleepDateTime: '入睡时间', wakeUpDateTime: '起床时间', sleepQuality: '睡眠质量', sleepAttire: '睡衣',
        naturalAwakening: '自然醒', nocturnalEmission: '梦遗',
        alcohol: '饮酒', pornConsumption: '看片', mood: '心情', stressLevel: '压力', weather: '天气', location: '地点', notes: '备注',
        caffeineIntake: '咖啡因'
    };
    return map[key] || key;
}

// --- Category Logic ---
export const getCategory = (field: string): HistoryCategory => {
    if (field.includes('性爱')) return 'sex';
    if (field.includes('自慰')) return 'masturbation';
    if (field.includes('运动')) return 'exercise';
    if (field.includes('午休')) return 'nap';
    if (field.includes('睡眠') || field.includes('入睡') || field.includes('起床') || field.includes('梦')) return 'sleep';
    if (field.includes('晨勃') || field.includes('硬度')) return 'morning';
    if (field.includes('饮酒') || field.includes('看片') || field.includes('酒精') || field.includes('咖啡因')) return 'lifestyle';
    if (field.includes('生病') || field.includes('心情') || field.includes('压力') || field.includes('症状') || field.includes('用药')) return 'health';
    return 'meta';
};

// --- Diff Logic Helpers ---

const compareArrays = <T extends { id: string }>(
    oldArr: T[] | undefined,
    newArr: T[] | undefined,
    itemLabel: (item: T) => string,
    diffs: ChangeDetail[],
    compareFn: (a: T, b: T) => ChangeDetail[]
) => {
    const oldList = oldArr || [];
    const newList = newArr || [];
    const oldMap = new Map(oldList.map(i => [i.id, i]));
    const newMap = new Map(newList.map(i => [i.id, i]));

    // Added
    newList.forEach(item => {
        if (!oldMap.has(item.id)) {
            const label = itemLabel(item);
            diffs.push({ field: label, oldValue: '无', newValue: '新增', category: getCategory(label) });
        }
    });

    // Removed
    oldList.forEach(item => {
        if (!newMap.has(item.id)) {
            const label = itemLabel(item);
            diffs.push({ field: label, oldValue: '存在', newValue: '已删除', category: getCategory(label) });
        }
    });

    // Modified
    newList.forEach(newItem => {
        const oldItem = oldMap.get(newItem.id);
        if (oldItem) {
            const changes = compareFn(oldItem, newItem);
            diffs.push(...changes);
        }
    });
};

const compareExercise = (a: ExerciseRecord, b: ExerciseRecord): ChangeDetail[] => {
    const details: ChangeDetail[] = [];
    const label = `运动`;
    const category: HistoryCategory = 'exercise';
    
    if (a.type !== b.type) details.push({ field: `${label}类型`, oldValue: a.type, newValue: b.type, category });
    if (a.duration !== b.duration) details.push({ field: `${label}时长`, oldValue: `${a.duration}m`, newValue: `${b.duration}m`, category });
    if (a.steps !== b.steps) details.push({ field: `${label}步数`, oldValue: `${a.steps || 0}`, newValue: `${b.steps || 0}`, category });
    if (a.intensity !== b.intensity) details.push({ field: `${label}强度`, oldValue: LABELS.exercise[a.intensity || 'medium'] || a.intensity || '', newValue: LABELS.exercise[b.intensity || 'medium'] || b.intensity || '', category });
    if (a.feeling !== b.feeling) details.push({ field: `${label}感受`, oldValue: LABELS.exFeeling[a.feeling || 'ok'] || a.feeling || '', newValue: LABELS.exFeeling[b.feeling || 'ok'] || b.feeling || '', category });
    
    return details;
};

const compareSex = (a: SexRecordDetails, b: SexRecordDetails): ChangeDetail[] => {
    const details: ChangeDetail[] = [];
    const label = `性爱`;
    const category: HistoryCategory = 'sex';
    
    // Basic
    if (a.startTime !== b.startTime) details.push({ field: `${label}开始`, oldValue: a.startTime || '-', newValue: b.startTime || '-', category });
    if (a.duration !== b.duration) details.push({ field: `${label}时长`, oldValue: `${a.duration}分`, newValue: `${b.duration}分`, category });
    
    // Partner (First one for simplicity or joined)
    const getPartners = (r: SexRecordDetails) => Array.from(new Set(r.interactions?.map(i => i.partner).filter(Boolean) || [r.partner].filter(Boolean))).join(',');
    const pA = getPartners(a);
    const pB = getPartners(b);
    if (pA !== pB) details.push({ field: `${label}伴侣`, oldValue: pA || '无', newValue: pB || '无', category });

    // Outcome
    if (a.protection !== b.protection) details.push({ field: `${label}保护`, oldValue: a.protection || '无', newValue: b.protection || '无', category });
    if (a.ejaculation !== b.ejaculation) details.push({ field: `${label}射精`, oldValue: String(a.ejaculation), newValue: String(b.ejaculation), category });
    if (a.ejaculation && a.ejaculationLocation !== b.ejaculationLocation) details.push({ field: `${label}射精点`, oldValue: a.ejaculationLocation || '未知', newValue: b.ejaculationLocation || '未知', category });

    // Indicators
    if (a.indicators.orgasm !== b.indicators.orgasm) details.push({ field: `${label}我高潮`, oldValue: String(a.indicators.orgasm), newValue: String(b.indicators.orgasm), category });
    if (a.indicators.partnerOrgasm !== b.indicators.partnerOrgasm) details.push({ field: `${label}她高潮`, oldValue: String(a.indicators.partnerOrgasm), newValue: String(b.indicators.partnerOrgasm), category });
    if (a.partnerScore !== b.partnerScore) details.push({ field: `${label}评分`, oldValue: `${a.partnerScore || 0}`, newValue: `${b.partnerScore || 0}`, category });

    return details;
};

const compareMb = (a: MasturbationRecordDetails, b: MasturbationRecordDetails): ChangeDetail[] => {
    const details: ChangeDetail[] = [];
    const label = `自慰`;
    const category: HistoryCategory = 'masturbation';

    if (a.startTime !== b.startTime) details.push({ field: `${label}时间`, oldValue: a.startTime || '-', newValue: b.startTime || '-', category });
    if (a.duration !== b.duration) details.push({ field: `${label}时长`, oldValue: `${a.duration}分`, newValue: `${b.duration}分`, category });
    if (a.ejaculation !== b.ejaculation) details.push({ field: `${label}射精`, oldValue: String(a.ejaculation), newValue: String(b.ejaculation), category });
    if (a.orgasmIntensity !== b.orgasmIntensity) details.push({ field: `${label}爽度`, oldValue: `${a.orgasmIntensity}`, newValue: `${b.orgasmIntensity}`, category });
    if (a.status !== b.status) details.push({ field: `${label}状态`, oldValue: a.status || 'completed', newValue: b.status || 'completed', category });
    
    // Arrays comparison
    const toolsA = (a.tools || []).sort().join(',');
    const toolsB = (b.tools || []).sort().join(',');
    if (toolsA !== toolsB) details.push({ field: `${label}工具`, oldValue: toolsA || '无', newValue: toolsB || '无', category });

    const catsA = (a.assets?.categories || []).sort().join(',');
    const catsB = (b.assets?.categories || []).sort().join(',');
    if (catsA !== catsB) details.push({ field: `${label}标签`, oldValue: catsA || '无', newValue: catsB || '无', category });

    return details;
};

const compareNap = (a: NapRecord, b: NapRecord): ChangeDetail[] => {
    const details: ChangeDetail[] = [];
    const label = `午休`;
    const category: HistoryCategory = 'nap';
    
    if (a.startTime !== b.startTime) details.push({ field: `${label}开始`, oldValue: a.startTime, newValue: b.startTime, category });
    if (a.duration !== b.duration) details.push({ field: `${label}时长`, oldValue: `${a.duration}m`, newValue: `${b.duration}m`, category });
    if (a.endTime !== b.endTime) details.push({ field: `${label}结束`, oldValue: a.endTime || '...', newValue: b.endTime || '...', category });
    if (a.hasDream !== b.hasDream) details.push({ field: `${label}梦境`, oldValue: a.hasDream ? '有' : '无', newValue: b.hasDream ? '有' : '无', category });
    
    return details;
};

const compareAlcoholRecord = (a: AlcoholRecord | null | undefined, b: AlcoholRecord | null | undefined, diffs: ChangeDetail[]) => {
    const category: HistoryCategory = 'lifestyle';
    if (!a && !b) return;
    if (!a && b) { diffs.push({ field: '饮酒记录', oldValue: '无', newValue: `${b.totalGrams}g`, category }); return; }
    if (a && !b) { diffs.push({ field: '饮酒记录', oldValue: `${a!.totalGrams}g`, newValue: '删除', category }); return; }
    if (a && b) {
        if (a.totalGrams !== b.totalGrams) diffs.push({ field: '酒精摄入', oldValue: `${a.totalGrams}g`, newValue: `${b.totalGrams}g`, category });
        if (a.isLate !== b.isLate) diffs.push({ field: '熬夜饮酒', oldValue: String(a.isLate), newValue: String(b.isLate), category });
        if (a.drunkLevel !== b.drunkLevel) diffs.push({ field: '醉意', oldValue: LABELS.drunkLevel[a.drunkLevel || 'none'] || a.drunkLevel || '', newValue: LABELS.drunkLevel[b.drunkLevel || 'none'] || b.drunkLevel || '', category });
        if (a.alcoholScene !== b.alcoholScene) diffs.push({ field: '饮酒场景', oldValue: a.alcoholScene || '无', newValue: b.alcoholScene || '无', category });
    }
}

export const calculateLogDiff = (oldLog: Partial<LogEntry>, newLog: Partial<LogEntry>): ChangeDetail[] => {
    const diffs: ChangeDetail[] = [];
    if (!oldLog) return diffs;

    const fmt = (key: string, val: any): string => {
        if (val === undefined || val === null) return 'null';
        // Store raw values where possible to allow formatter to do the job
        if (key === 'hardness') return String(val); // 3
        if (key === 'retention') return LABELS.retention[val as MorningWoodRetention] || String(val);
        if (key === 'sleepQuality') return String(val); // 3
        if (key === 'alcohol') return LABELS.alcohol[val as AlcoholConsumption] || String(val);
        if (key === 'pornConsumption') return LABELS.porn[val as PornConsumption] || String(val);
        if (key === 'stressLevel') return LABELS.stress[val as StressLevel] || String(val);
        if (key === 'mood') return LABELS.mood[val as Mood] || String(val);
        if (key === 'weather') return LABELS.weather[val as Weather] || String(val);
        if (key === 'location') return LABELS.location[val as Location] || String(val);
        if (key === 'caffeineIntake') return LABELS.caffeine[val as any] || String(val);
        if (key.includes('Time')) return String(val); // 2023-01-01T...
        if (typeof val === 'boolean') return String(val); // 'true'/'false'
        return String(val);
    };

    // Check Flat properties
    const keysToCheck: (keyof LogEntry)[] = ['pornConsumption', 'mood', 'stressLevel', 'weather', 'location', 'notes', 'caffeineIntake'];
    keysToCheck.forEach(key => {
        const v1 = oldLog[key];
        const v2 = newLog[key];
        if (v1 !== v2) {
             if ((v1 === undefined || v1 === null) && (v2 === undefined || v2 === null)) return;
             const label = getFieldLabel(key as string);
             diffs.push({ field: label, oldValue: fmt(key, v1), newValue: fmt(key, v2), category: getCategory(label) });
        }
    });
    
    // Check Daily Events
    const oldEvents = (oldLog.dailyEvents || []).sort().join(',');
    const newEvents = (newLog.dailyEvents || []).sort().join(',');
    if (oldEvents !== newEvents) {
        diffs.push({ field: '今日事件', oldValue: oldEvents || '无', newValue: newEvents || '无', category: 'meta' });
    }

    // Check Morning Object
    if (oldLog.morning && newLog.morning) {
        if (oldLog.morning.hardness !== newLog.morning.hardness) diffs.push({ field: '硬度', oldValue: fmt('hardness', oldLog.morning.hardness), newValue: fmt('hardness', newLog.morning.hardness), category: 'morning' });
        if (oldLog.morning.retention !== newLog.morning.retention) diffs.push({ field: '晨勃维持', oldValue: fmt('retention', oldLog.morning.retention), newValue: fmt('retention', newLog.morning.retention), category: 'morning' });
        if (oldLog.morning.wokeWithErection !== newLog.morning.wokeWithErection) diffs.push({ field: '有无晨勃', oldValue: fmt('wokeWithErection', oldLog.morning.wokeWithErection), newValue: fmt('wokeWithErection', newLog.morning.wokeWithErection), category: 'morning' });
    }

    // Check Sleep Object
    if (oldLog.sleep && newLog.sleep) {
        if (oldLog.sleep.startTime !== newLog.sleep.startTime) diffs.push({ field: '入睡时间', oldValue: fmt('sleepDateTime', oldLog.sleep.startTime), newValue: fmt('sleepDateTime', newLog.sleep.startTime), category: 'sleep' });
        if (oldLog.sleep.endTime !== newLog.sleep.endTime) diffs.push({ field: '起床时间', oldValue: fmt('wakeUpDateTime', oldLog.sleep.endTime), newValue: fmt('wakeUpDateTime', newLog.sleep.endTime), category: 'sleep' });
        if (oldLog.sleep.quality !== newLog.sleep.quality) diffs.push({ field: '睡眠质量', oldValue: fmt('sleepQuality', oldLog.sleep.quality), newValue: fmt('sleepQuality', newLog.sleep.quality), category: 'sleep' });
        if (oldLog.sleep.withPartner !== newLog.sleep.withPartner) diffs.push({ field: '伴侣同睡', oldValue: fmt('withPartner', oldLog.sleep.withPartner), newValue: fmt('withPartner', newLog.sleep.withPartner), category: 'sleep' });
        if (oldLog.sleep.hasDream !== newLog.sleep.hasDream) diffs.push({ field: '做梦', oldValue: oldLog.sleep.hasDream ? '有' : '无', newValue: newLog.sleep.hasDream ? '有' : '无', category: 'sleep' });
        
        const oldLoc = oldLog.sleep.environment?.location;
        const newLoc = newLog.sleep.environment?.location;
        if (oldLoc !== newLoc) diffs.push({ field: '睡眠地点', oldValue: oldLoc || 'home', newValue: newLoc || 'home', category: 'sleep' });
    }

    // Check Health Object
    if (oldLog.health && newLog.health) {
        if (oldLog.health.isSick !== newLog.health.isSick) {
            diffs.push({ field: '生病状态', oldValue: String(oldLog.health.isSick), newValue: String(newLog.health.isSick), category: 'health' });
        }
        if (oldLog.health.feeling !== newLog.health.feeling) diffs.push({ field: '身体感觉', oldValue: LABELS.feeling[oldLog.health.feeling || 'normal'] || oldLog.health.feeling || '', newValue: LABELS.feeling[newLog.health.feeling || 'normal'] || newLog.health.feeling || '', category: 'health' });
        
        const oldSym = (oldLog.health.symptoms || []).sort().join(',');
        const newSym = (newLog.health.symptoms || []).sort().join(',');
        if (oldSym !== newSym) diffs.push({ field: '症状', oldValue: oldSym || '无', newValue: newSym || '无', category: 'health' });

        const oldMed = (oldLog.health.medications || []).sort().join(',');
        const newMed = (newLog.health.medications || []).sort().join(',');
        if (oldMed !== newMed) diffs.push({ field: '用药', oldValue: oldMed || '无', newValue: newMed || '无', category: 'health' });
    }

    // Deep Array Comparisons
    compareArrays(oldLog.sex, newLog.sex, (i) => `性爱`, diffs, compareSex);
    compareArrays(oldLog.masturbation, newLog.masturbation, (i) => `自慰`, diffs, compareMb);
    compareArrays(oldLog.exercise, newLog.exercise, (i) => `运动`, diffs, compareExercise);
    compareArrays(oldLog.sleep?.naps, newLog.sleep?.naps, (i) => `午休`, diffs, compareNap);

    // Alcohol Record
    compareAlcoholRecord(oldLog.alcoholRecord, newLog.alcoholRecord, diffs);

    return diffs;
};
