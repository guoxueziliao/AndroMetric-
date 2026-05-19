import type { HistoryEventType } from '../types';

/**
 * 根据 ChangeRecord 的 summary 文本反推它属于哪种事件类型。
 * 用于把旧数据的 summary 兼容映射成新的 HistoryEventType 字段。
 */
export const inferHistoryEventType = (summary: string): HistoryEventType => {
    if (!summary) return 'manual';
    const s = String(summary);
    if (s.includes('自动') || s.includes('修复')) return 'auto';
    if (s.includes('快速') || s.includes('开始') || s.includes('完成午休') || s.includes('记录')) return 'quick';
    return 'manual';
};
