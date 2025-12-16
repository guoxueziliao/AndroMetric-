
export type ValidationLevel = 'P0' | 'P1' | 'P2' | 'OK';
export type TagType = 'xp' | 'event' | 'symptom' | 'health_check';

export interface ValidationResult {
    level: ValidationLevel;
    message?: string;
    suggestion?: string;
}

// --- P0: Absolute Blocklist ---

// Platforms / Channels (Should be Source/Platform field)
const PLATFORMS = [
    'pornhub', 'xvideos', 'telegram', 'onlyfans', 'twitter', 'x.com', 'jable', 'tiktok', 'douyin', 'bilibili', 'youtube', 'missav', '91', 'wechat', 'qq', 'whatsapp', 'facebook', 'instagram', 'snapchat', 'x', 'fc2'
];

// Content Forms (Should be Source field)
const CONTENT_FORMS = [
    'video', 'image', 'picture', 'novel', 'text', 'audio', 'asmr', 'comic', 'manga', 'pic', 'vid', 'gif',
    '视频', '直播', '图片', '图集', '小说', '文学', '回忆', '幻想', '音声', '漫画', '本子', '动画', '里番'
];

// Specific forbidden chars from doc
const ILLEGAL_CHARS_REGEX = /[\/\\|→=&+@#*]|=>/;

// Time/Number patterns
const TIME_PATTERN = /\d{1,2}[:：]\d{2}/;
const YEAR_PATTERN = /^\d{4}$/;
const NUMBER_UNIT_PATTERN = /\d+(ml|ml|L|l|g|kg|cm|mm|次|个|分钟|h|小时|岁)/i;
const PURE_NUMBER = /^\d+$/;

// --- Exported Rules for Health Check ---

// P1: Compound Tags (The "Must Split" List)
export const COMPOUND_TAGS: Record<string, { dimensions: string, split: string[] }> = {
    '人妻出轨': { dimensions: '角色 + 剧情', split: ['人妻', '出轨'] },
    '师生调教': { dimensions: '角色 + 行为', split: ['老师/学生', '调教'] },
    '制服诱惑': { dimensions: '装扮 + 剧情', split: ['制服', '诱惑'] },
    '强制高潮': { dimensions: '剧情 + 行为', split: ['强制', '高潮'] },
    '黑丝足交': { dimensions: '装扮 + 行为', split: ['黑丝', '足交'] },
    '护士打针': { dimensions: '角色 + 行为', split: ['护士', '医疗Play'] },
    '露脸自拍': { dimensions: '身体 + 形式', split: ['露脸', '自拍'] }
};

// P1: Misclassified / Semantic Drift
export const MISCLASSIFIED_TAGS: Record<string, { correctDim: string, reason: string }> = {
    '自拍': { correctDim: '形式与风格', reason: '主体不清，属于拍摄形式' },
    '偷拍': { correctDim: '剧情/形式', reason: '属于拍摄形式或剧情背景' },
    '中年女性': { correctDim: '外貌与身体', reason: '年龄特征不等于社会角色' },
    '颜射': { correctDim: '玩法与行为', reason: '这是行为，不是外貌特征' },
    'cosplay': { correctDim: '形式与风格', reason: '这是表现形式，具体角色请记在角色栏' }
};

// P1: Non-tag Semantics (State/Emotion)
export const STATE_EMOTION_TAGS = ['很爽', '一般', '满足', '后悔', '开心', '难过', '舒服', '好看', '刺激', '极品', '社保', '牛逼', '垃圾', '无聊', '好冲'];

// P1: Technical/Gen Methods
export const TECH_TERMS = [
    'ai', 'deepfake', 'vr', 'mmd', 'sd', 'mj', 'stable diffusion', 'midjourney', '换脸', '模型', '生成', '虚拟现实'
];

// P1: Synonyms / Standardization
export const SYNONYMS: Record<string, string> = {
    '中出': '内射',
    '群p': '群交',
    'sp': '打屁股',
    '打飞机': '手冲',
    '撸管': '手冲',
    '做爱': '性爱'
};

export const validateTag = (tagName: string, type: TagType = 'xp'): ValidationResult => {
    const lower = tagName.trim().toLowerCase();

    // 1. P0: Blocking Validations
    // ----------------------------------------

    // 2.1 Not Empty
    if (!lower || lower.length === 0) return { level: 'P0', message: '标签名称不能为空' };

    // 2.2 Length Limit (20 chars)
    if (lower.length > 20) return { level: 'P0', message: '标签名称过长，建议简化（≤20字）' };

    // 2.4 Illegal Chars
    if (ILLEGAL_CHARS_REGEX.test(lower)) return { level: 'P0', message: '标签名称不应包含连接符或结构符号，请拆分为多个标签' };
    if (/[<>{}[\]]/.test(lower)) return { level: 'P0', message: '包含非法字符' };

    // 2.5 Time/Number Patterns
    if (TIME_PATTERN.test(lower)) return { level: 'P0', message: '标签不应包含时间或数值，请使用字段记录' };
    if (YEAR_PATTERN.test(lower)) return { level: 'P0', message: '标签不应包含时间或数值，请使用字段记录' };
    if (NUMBER_UNIT_PATTERN.test(lower)) return { level: 'P0', message: '标签不应包含时间或数值，请使用字段记录' };
    if (PURE_NUMBER.test(lower)) return { level: 'P0', message: '标签不应包含时间或数值，请使用字段记录' };

    // Platform checks
    if (PLATFORMS.some(p => lower === p || lower.includes(p))) {
        return { level: 'P0', message: '平台或网站不属于标签，请在「素材来源」中选择。' };
    }
    // Content Form checks
    if (CONTENT_FORMS.some(f => lower === f || (lower.length > 1 && lower.includes(f)))) {
        return { level: 'P0', message: '内容形式已由「素材来源」描述，不应作为标签。' };
    }

    // 2. P1: Risk Validations (Warning)
    // ----------------------------------------

    // 3.1 Compound Tags
    for (const [badTag, info] of Object.entries(COMPOUND_TAGS)) {
        if (lower.includes(badTag)) {
            return { 
                level: 'P1', 
                message: `该标签可能同时包含多个语义维度，建议拆分为多个标签以便长期统计`, 
                suggestion: `建议拆分为：${info.split.join(' + ')}` 
            };
        }
    }

    // 3.2 Ambiguous Dimensions
    for (const [tag, info] of Object.entries(MISCLASSIFIED_TAGS)) {
        if (lower === tag) {
            return {
                level: 'P1',
                message: `该标签维度不够明确，后续可能影响统计准确性`,
                suggestion: info.reason
            };
        }
    }

    // 3.3 Non-tag Semantics (State/Emotion)
    if (STATE_EMOTION_TAGS.some(t => lower.includes(t))) {
        return { level: 'P1', message: '该内容更像状态或结果，通常不建议作为标签' };
    }

    // 6. Technical Terms (Style check)
    if (TECH_TERMS.some(t => lower.includes(t))) {
        return { level: 'P1', message: '该标签属于“形式与风格”维度，请确保不要与内容特征混淆。' };
    }

    // 7. Synonyms
    for (const [key, standard] of Object.entries(SYNONYMS)) {
        if (key === 'sp' && lower.includes('cosplay')) continue; // Exception
        if (lower === key || lower.includes(key)) {
            return { level: 'P1', message: `存在标准化标签 "${standard}"，建议合并。`, suggestion: standard };
        }
    }

    // 3. Type Specific Checks
    // ----------------------------------------

    // 4.1 Symptom
    if (type === 'symptom') {
        const BAD_SYMPTOMS = ['压力', '心情', '熬夜', '看片', '欲望'];
        if (BAD_SYMPTOMS.some(t => lower.includes(t))) {
            return { level: 'P1', message: '症状标签应描述身体不适本身，而非原因或感受' };
        }
    }

    // 4.2 Event
    if (type === 'event') {
        const BAD_EVENTS = ['头痛', '巨乳', '口交', '感冒', '发烧']; // Symptoms or XP
        if (BAD_EVENTS.some(t => lower.includes(t))) {
            return { level: 'P1', message: '事件标签应描述当天发生的事情，而非状态或偏好' };
        }
    }

    // 4.3 XP
    if (type === 'xp') {
        if (lower.includes(' ') && lower.length > 8) {
            return { level: 'P1', message: 'XP 标签应只描述一个刺激维度，建议拆分以保持清晰' };
        }
    }

    return { level: 'OK' };
};
