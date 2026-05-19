import type { LogEntry, PartnerProfile, PartnerType } from '../../../domain';

export const COLORS = [
  'bg-pink-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-orange-500'
];

export const SENSITIVE_SPOTS = [
  '阴蒂', '阴道G点', '乳头/乳晕', '后颈/脖子', '耳朵/耳垂',
  '大腿内侧', '嘴唇/舌头', '下背/腰窝', '阴毛际线', '臀部(下臀)',
  '腹部', '脚/足部', '手/手指', '会阴', '腋下', '全身皮肤'
];

export const STIMULATION_METHODS = [
  '轻咬/啃噬', '舌舔', '深吻', '指尖爱抚', '吹气/哈气',
  '温差(冰/热)', '拍打', '抓挠', '吮吸', '语言挑逗'
];

export const TYPE_CONFIG: Record<PartnerType, { label: string; color: string; desc: string }> = {
  stable: { label: '固定伴侣', color: 'bg-pink-500 border-pink-600', desc: '老婆/女友/长期' },
  dating: { label: '约会/炮友', color: 'bg-purple-500 border-purple-600', desc: '情人/Py/Dating' },
  casual: { label: '露水/偶遇', color: 'bg-blue-500 border-blue-600', desc: '一夜情/捡尸/艳遇' },
  service: { label: '服务/交易', color: 'bg-slate-600 border-slate-700', desc: '技师/外围/交易' }
};

export const ORIGIN_PRESETS = [
  '探探/Tinder', '夜店/酒吧', '洗浴/SPA', '外围经纪', '朋友介绍', '搭讪', '工作/同学'
];

export const MILESTONE_PRESETS = [
  '第一次做爱', '第一次口交', '第一次足交', '第一次肛交', '第一次内射', '第一次过夜', '解锁新姿势'
];

export interface PartnerCategory {
  label: string;
  color: string;
}

export const getPartnerCategory = (p: PartnerProfile): PartnerCategory | null => {
  if (p.isMarried) return { label: '人妻', color: 'bg-rose-50 text-white' };

  if (p.age !== undefined) {
    if (p.age < 25) return { label: '少女', color: 'bg-pink-400 text-white' };
    if (p.age <= 35) return { label: '少妇', color: 'bg-purple-500 text-white' };
    return { label: '熟妇', color: 'bg-amber-600 text-white' };
  }
  return null;
};

export interface PartnerInteractionStats {
  lastDate: string;
  daysAgo: number;
  myCum: number;
  partnerCum: number;
}

export type PartnerStatsMap = Record<string, PartnerInteractionStats>;

/**
 * 从日志里聚合每位伴侣的最近互动日期 + 双方高潮/射精计数。
 */
export const computePartnerStats = (logs: LogEntry[] | undefined): PartnerStatsMap => {
  const stats: PartnerStatsMap = {};
  const today = new Date();

  if (!logs || !Array.isArray(logs)) return stats;

  logs.forEach(log => {
    if (!log.sex) return;
    log.sex.forEach(record => {
      const partnersInRecord = new Set<string>();
      if (record.interactions) {
        record.interactions.forEach(i => {
          if (i.partner) partnersInRecord.add(i.partner);
        });
      } else if (record.partner) {
        partnersInRecord.add(record.partner);
      }

      partnersInRecord.forEach(name => {
        const logDate = new Date(log.date);

        if (!stats[name]) stats[name] = { lastDate: log.date, daysAgo: 0, myCum: 0, partnerCum: 0 };

        if (record.ejaculation) stats[name].myCum++;
        if (record.indicators.partnerOrgasm) stats[name].partnerCum++;

        if (logDate >= new Date(stats[name].lastDate)) {
          const diffTime = Math.abs(today.getTime() - logDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          stats[name].lastDate = log.date;
          stats[name].daysAgo = diffDays;
        }
      });
    });
  });

  return stats;
};

/**
 * 排序规则:有过互动 > 没互动;30 天内活跃 > 30 天以外沉寂;同档按最近活动时间升序。
 */
export const sortPartnersByActivity = (
  partners: PartnerProfile[],
  stats: PartnerStatsMap
): PartnerProfile[] => {
  return [...partners].sort((a, b) => {
    const statsA = stats[a.name];
    const statsB = stats[b.name];

    if (statsA && !statsB) return -1;
    if (!statsA && statsB) return 1;
    if (!statsA && !statsB) return 0;

    const isInactiveA = statsA.daysAgo > 30;
    const isInactiveB = statsB.daysAgo > 30;

    if (isInactiveA && !isInactiveB) return 1;
    if (!isInactiveA && isInactiveB) return -1;

    return statsA.daysAgo - statsB.daysAgo;
  });
};
