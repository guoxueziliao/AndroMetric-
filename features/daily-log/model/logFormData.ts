export type MidTabType = 'life' | 'env' | 'health';

export const SUPPLEMENT_OPTIONS = ['维生素D', '锌', '镁', '鱼油', '辅酶Q10', '益生菌'];

export const MENSTRUAL_OPTIONS = [
  { id: 'unknown', label: '未记录' },
  { id: 'none', label: '非经期' },
  { id: 'period', label: '经期中' },
  { id: 'fertile_window', label: '窗口期' }
] as const;
