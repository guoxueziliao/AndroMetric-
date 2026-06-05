export type MetricPreferenceLevel = 'focus' | 'normal' | 'muted';

export type MetricPreferenceId =
  | 'hardness'
  | 'sleep'
  | 'stress'
  | 'exercise'
  | 'alcohol'
  | 'caffeine'
  | 'sex'
  | 'masturbation'
  | 'porn'
  | 'sexLoad'
  | 'relationship'
  | 'healthProject'
  | 'healthScore'
  | 'screenTime'
  | 'dataQuality';

export type MetricPreferenceMap = Partial<Record<MetricPreferenceId, MetricPreferenceLevel>>;

export interface MetricPreferenceDefinition {
  id: MetricPreferenceId;
  label: string;
  module: '基础状态' | '生活方式' | '成人健康' | '长期管理' | '数据质量';
  defaultLevel: MetricPreferenceLevel;
}
