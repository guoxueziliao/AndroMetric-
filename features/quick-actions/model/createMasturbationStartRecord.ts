import type { MasturbationRecordDetails } from '../../../domain';

const formatStartTime = (date: Date) => (
  date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
);

/**
 * 创建一条仅含开始时间的自慰记录。
 * 其他字段保持中性占位 — 用户在 finish modal 里必须主动填写,
 * 避免快速启动后字段被默认值"伪造"成已发生的行为。
 */
export const createMasturbationStartRecord = (date: Date = new Date()): MasturbationRecordDetails => ({
  id: date.getTime().toString(),
  startTime: formatStartTime(date),
  duration: 0,
  status: 'inProgress',
  tools: [],
  contentItems: [],
  edging: 'none',
  edgingCount: 0,
  lubricant: '',
  useCondom: false,
  ejaculation: false,
  orgasmIntensity: 0,
  mood: 'neutral',
  stressLevel: 0,
  energyLevel: 0,
  interrupted: false,
  interruptionReasons: [],
  notes: ''
});
