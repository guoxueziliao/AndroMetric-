
export type ValidationLevel = 'P0' | 'P1' | 'P2' | 'OK';

export interface ValidationResult {
    level: ValidationLevel;
    message?: string;
    suggestion?: string;
}

// P0: Blocked Words (Platforms / Channels) - PRD 7.2
const PLATFORMS = [
    'pornhub', 'xvideos', 'telegram', 'onlyfans', 'twitter', 'x.com', 'jable', 'tiktok', 'douyin', 'bilibili', 'youtube', 'missav', '91', 'wechat', 'qq', 'whatsapp', 'facebook', 'instagram', 'snapchat', 'x'
];

// P0: Blocked Words (Content Forms) - PRD 7.3
const CONTENT_FORMS = [
    'video', 'image', 'picture', 'novel', 'text', 'audio', 'asmr', 'comic', 'manga', 'pic', 'vid', 'gif',
    '视频', '直播', '图片', '图集', '小说', '文学', '回忆', '幻想', '音声', '漫画', '本子', '动画', '里番'
];

// P1: Technical/Gen Methods - PRD 8.1
const TECH_TERMS = [
    'ai', 'deepfake', 'vr', 'mmd', 'sd', 'mj', 'stable diffusion', 'midjourney', '换脸', '模型', '生成', '虚拟现实'
];

// P1: Synonyms / Standardization Map - PRD 8.2
const SYNONYMS: Record<string, string> = {
    '中出': '内射',
    '群p': '群交',
    'sp': '打屁股',
    '打飞机': '手冲',
    '撸管': '手冲',
    '做爱': '性爱'
};

export const validateTag = (tagName: string): ValidationResult => {
    const lower = tagName.trim().toLowerCase();

    // 1. P0: Basic Legality - PRD 7.1
    if (!lower || lower.length === 0) return { level: 'P0', message: '标签不能为空' };
    if (lower.length > 24) return { level: 'P0', message: '标签过长 (最多24字)' };
    // Basic illegal chars
    if (/[<>{}[\]\\]/.test(lower)) return { level: 'P0', message: '包含非法字符' };

    // New: Strict Creation Rules (Tag System Definition 7.2)
    // - Time/Number Patterns
    if (/^\d{1,2}:\d{2}$/.test(lower)) return { level: 'P0', message: '禁止包含时间格式 (如 09:00)' };
    if (/^\d{4}$/.test(lower)) return { level: 'P0', message: '禁止纯年份 (如 2025)' };
    if (/^\d+(\.\d+)?[a-z]+$/.test(lower)) return { level: 'P0', message: '禁止包含数值单位 (如 350ml)' };
    
    // - Compound Separators
    if (/[/&+\u2192|]/.test(lower)) return { level: 'P0', message: '禁止使用复合连接词 (/, &, +, |)' };

    // 2. P0: Platforms - PRD 7.2
    if (PLATFORMS.some(p => lower === p || lower.includes(p))) {
        return { level: 'P0', message: '平台或网站不属于标签，请在「素材来源」中选择。' };
    }

    // 3. P0: Content Forms - PRD 7.3
    if (CONTENT_FORMS.some(f => lower === f || (lower.length > 1 && lower.includes(f)))) {
        return { level: 'P0', message: '内容形式已由「素材来源」描述，不应作为标签。' };
    }

    // 4. P1: Technical Terms - PRD 8.1
    if (TECH_TERMS.some(t => lower.includes(t))) {
        return { level: 'P1', message: '该标签更接近“形式与风格”，而非内容特征，确认继续吗？' };
    }

    // 5. P1: Synonyms - PRD 8.2
    for (const [key, standard] of Object.entries(SYNONYMS)) {
        // Prevent false positives (e.g., "Cosplay" contains "sp")
        if (key === 'sp' && lower.includes('cosplay')) continue;
        
        if (lower === key || lower.includes(key)) {
            return { level: 'P1', message: `已存在含义相近的常用标签，建议统一为 "${standard}"。`, suggestion: standard };
        }
    }

    // 6. P1: Compound Tags (Heuristic) - PRD 8.3
    if ((lower.includes(' ') && lower.length > 8)) {
        return { level: 'P1', message: '检测到复合含义标签，建议拆分为多个标签以便长期分析。' };
    }

    // 7. P2: Generic / Emotional - PRD 9
    const GENERIC_TERMS = ['好看', '刺激', '极品', '社保', '爽', '牛逼', '一般', '垃圾', '无聊', '好冲', '满意'];
    if (GENERIC_TERMS.some(t => lower.includes(t))) {
        return { level: 'P2', message: '该标签过于主观或空泛，可能对长期分析价值有限。' };
    }

    return { level: 'OK' };
};
