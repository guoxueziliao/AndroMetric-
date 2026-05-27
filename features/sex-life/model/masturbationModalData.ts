import { Car, Droplets, Home, MapPin, Monitor, Sofa } from 'lucide-react';

export const CONTENT_TYPES = ['视频', '直播', '图片', '小说', '回忆', '幻想', '音频', '漫画'];
export const PLATFORMS = ['Telegram', 'ONE', 'Pornhub', 'Twitter', 'Xvideos', 'OnlyFans', 'Jable', 'TikTok', '微信/QQ', '本地硬盘', '91', 'MissAV'];
export const TOOL_OPTIONS = ['手', '润滑液', '飞机杯', '名器/倒模', '电动玩具', '前列腺按摩器', '枕头'];
export const LUBRICANT_OPTIONS = ['无润滑', '水基润滑液', '硅基润滑液', '油基润滑液', '人体分泌', '唾液', '其他'];

export const LOCATION_OPTIONS = [
  { id: '卧室/床上', icon: Home },
  { id: '书桌/电脑前', icon: Monitor },
  { id: '浴室/卫生间', icon: Droplets },
  { id: '客厅/沙发', icon: Sofa },
  { id: '车内', icon: Car },
  { id: '酒店/外出', icon: MapPin }
];

export const FORCE_LEVELS = [
  { lvl: 1, label: '滞留', desc: '几乎没出来，黏在根部' },
  { lvl: 2, label: '流出', desc: '缓缓流出，一张纸轻松搞定' },
  { lvl: 3, label: '喷射', desc: '有明显的喷射节奏' },
  { lvl: 4, label: '汹涌', desc: '量大浓厚，纸巾完全湿透' },
  { lvl: 5, label: '爆发', desc: '极强冲力，射穿或喷射极远' }
];

export const ORGASM_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: '无感', color: 'text-text-muted' },
  2: { label: '一般', color: 'text-chart-primary' },
  3: { label: '舒服', color: 'text-state-warning' },
  4: { label: '很爽', color: 'text-state-warning' },
  5: { label: '极致', color: 'text-accent-vivid' }
};

export const SATISFACTION_LEVELS = [
  { lvl: 1, label: '毫无感觉', desc: '还是憋得慌', color: 'bg-surface-border' },
  { lvl: 2, label: '解压一般', desc: '完成了任务', color: 'bg-chart-primary' },
  { lvl: 3, label: '基本达标', desc: '不怎么想了', color: 'bg-chart-primary' },
  { lvl: 4, label: '非常舒爽', desc: '完全放松', color: 'bg-chart-primary' },
  { lvl: 5, label: '灵魂升华', desc: '彻底清空，大贤者模式', color: 'bg-chart-tertiary' }
];

export const POST_MOOD_OPTIONS = ['满足/愉悦', '平静/贤者', '空虚/后悔', '焦虑/负罪', '恶心/厌恶'];
export const FATIGUE_OPTIONS = ['精神焕发', '无明显疲劳', '轻微困倦', '身体沉重', '秒睡'];
export const INTERRUPTION_REASONS = ['电话/消息', '有人敲门/进入', '突然没兴致', '身体不适', '环境干扰', '被迫中止'];

/**
 * 由"HH:MM"形式的起止时间算出持续分钟,跨天回绕。
 */
export const calculateDurationFromTimes = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  if (isNaN(h1) || isNaN(h2)) return 0;
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60;
  return diff;
};
