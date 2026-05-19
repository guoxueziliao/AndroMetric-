import type {
    AlcoholConsumption,
    ExerciseIntensity,
    HardnessLevel,
    IllnessType,
    Location,
    MorningWoodRetention,
    Mood,
    PornConsumption,
    PreSleepState,
    SleepAttire,
    SleepLocation,
    StressLevel,
    Weather
} from '../../domain';
import { formatTime } from './dates';

/**
 * 各种 domain enum → 中文展示字符串映射。
 * 单层数据查表,没有运行时逻辑;UI 文案在这里集中。
 */
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
    sleepLocation: { home: '家里', hotel: '酒店', others_home: '别人家', dorm: '宿舍', office: '办公室', transport: '通勤中', other: '其他' } as Record<SleepLocation, string>,
    mood: { happy: '开心', excited: '兴奋', neutral: '平淡', anxious: '焦虑', sad: '低落', angry: '生气' } as Record<Mood, string>,
    attire: { naked: '裸睡', light: '内衣', pajamas: '睡衣', other: '其他' } as Record<SleepAttire, string>,
    drunkLevel: { none: '无', tipsy: '微醺', drunk: '醉', wasted: '烂醉' } as Record<string, string>,
    feeling: { normal: '正常', minor_discomfort: '轻微不适', bad: '难受' } as Record<string, string>, // Legacy
    discomfortLevel: { mild: '轻微不适', moderate: '明显不适', severe: '很难受' } as Record<string, string>,
    exFeeling: { great: '很爽', ok: '正常', tired: '累爆', bad: '不适' } as Record<string, string>,
    caffeine: { none: '无', low: '少', medium: '中', high: '多' } as Record<string, string>,
    satisfaction: { 1: '毫无感觉', 2: '解压一般', 3: '基本达标', 4: '非常舒爽', 5: '灵魂升华' } as Record<number, string>
};

/**
 * 把 changeHistory 里的 oldValue/newValue 渲染成更友好的展示。
 * 根据 field 名称中的关键字推断格式(时间/星级/硬度...)。
 */
export const formatHistoryValue = (field: string, val: string | null | undefined): string => {
    if (!field) return val ? String(val) : '—';
    const f = String(field);
    if (val === null || val === undefined || val === 'null' || val === 'undefined' || val === '空' || val === '') return '—';
    if (val === 'true') return '是';
    if (val === 'false') return '否';
    if (val === '是' || val === '否') return val;
    if (['时间', '开始', '结束'].some(k => f.includes(k))) return formatTime(val);
    if (['质量', '评分', '爽度', '满足'].some(k => f.includes(k))) {
        const num = parseInt(val.replace(/[^\d]/g, ''));
        if (!isNaN(num)) return '★'.repeat(num) + '☆'.repeat(5 - num);
    }
    if (f.includes('硬度')) {
        const num = parseInt(val.replace(/[^\d]/g, ''));
        if (!isNaN(num) && num >= 1 && num <= 5) return `${num}级`;
    }
    return String(val);
};
