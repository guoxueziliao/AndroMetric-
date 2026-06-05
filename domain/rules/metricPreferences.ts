import type {
  MetricPreferenceDefinition,
  MetricPreferenceId,
  MetricPreferenceLevel,
  MetricPreferenceMap
} from '../types/metricPreferences';

export const METRIC_PREFERENCE_DEFINITIONS: readonly MetricPreferenceDefinition[] = [
  { id: 'hardness', label: '晨间硬度', module: '基础状态', defaultLevel: 'normal' },
  { id: 'sleep', label: '睡眠', module: '基础状态', defaultLevel: 'normal' },
  { id: 'stress', label: '压力', module: '基础状态', defaultLevel: 'normal' },
  { id: 'exercise', label: '运动', module: '生活方式', defaultLevel: 'normal' },
  { id: 'alcohol', label: '饮酒', module: '生活方式', defaultLevel: 'normal' },
  { id: 'caffeine', label: '咖啡因', module: '生活方式', defaultLevel: 'normal' },
  { id: 'screenTime', label: '屏幕时间', module: '生活方式', defaultLevel: 'normal' },
  { id: 'sex', label: '性生活', module: '成人健康', defaultLevel: 'normal' },
  { id: 'masturbation', label: '自慰', module: '成人健康', defaultLevel: 'normal' },
  { id: 'porn', label: '色情使用', module: '成人健康', defaultLevel: 'normal' },
  { id: 'sexLoad', label: '性活动负荷', module: '成人健康', defaultLevel: 'normal' },
  { id: 'relationship', label: '关系上下文', module: '成人健康', defaultLevel: 'normal' },
  { id: 'healthProject', label: '健康项目/补剂', module: '长期管理', defaultLevel: 'normal' },
  { id: 'healthScore', label: '健康分', module: '长期管理', defaultLevel: 'normal' },
  { id: 'dataQuality', label: '记录完整度', module: '数据质量', defaultLevel: 'normal' }
] as const;

export const METRIC_PREFERENCE_LEVEL_LABEL: Record<MetricPreferenceLevel, string> = {
  focus: '重点',
  normal: '普通',
  muted: '弱化'
};

const KNOWN_METRICS = new Set<MetricPreferenceId>(METRIC_PREFERENCE_DEFINITIONS.map((item) => item.id));

const LEVEL_RANK: Record<MetricPreferenceLevel, number> = {
  focus: 0,
  normal: 1,
  muted: 2
};

export const isMetricPreferenceId = (id: string): id is MetricPreferenceId => (
  KNOWN_METRICS.has(id as MetricPreferenceId)
);

export const getMetricPreferenceLevel = (
  preferences: MetricPreferenceMap | undefined,
  id: MetricPreferenceId | string
): MetricPreferenceLevel => {
  if (!isMetricPreferenceId(id)) return 'normal';
  return preferences?.[id] ?? 'normal';
};

export const isMetricMuted = (
  preferences: MetricPreferenceMap | undefined,
  id: MetricPreferenceId | string
): boolean => getMetricPreferenceLevel(preferences, id) === 'muted';

export const sortByMetricPreference = <T>(
  items: readonly T[],
  getMetricId: (item: T) => MetricPreferenceId | string | null | undefined,
  preferences: MetricPreferenceMap | undefined
): T[] => items
  .map((item, index) => ({
    item,
    index,
    rank: LEVEL_RANK[getMetricPreferenceLevel(preferences, getMetricId(item) ?? '')]
  }))
  .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
  .map((entry) => entry.item);

export const setMetricPreferenceLevel = (
  preferences: MetricPreferenceMap | undefined,
  id: MetricPreferenceId,
  level: MetricPreferenceLevel
): MetricPreferenceMap => {
  const next: MetricPreferenceMap = { ...(preferences ?? {}) };
  if (level === 'normal') {
    delete next[id];
  } else {
    next[id] = level;
  }
  return next;
};
