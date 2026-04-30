import type { MasturbationRecordDetails } from '../../../domain';

const formatStartTime = (date: Date) => (
  date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
);

export const createMasturbationStartRecord = (date: Date = new Date()): MasturbationRecordDetails => ({
  id: date.getTime().toString(),
  startTime: formatStartTime(date),
  duration: 0,
  status: 'inProgress',
  tools: ['手'],
  contentItems: [],
  materials: [],
  props: [],
  assets: { sources: [], platforms: [], categories: [], target: '', actors: [] },
  materialsList: [],
  edging: 'none',
  edgingCount: 0,
  lubricant: '无润滑',
  useCondom: false,
  ejaculation: true,
  orgasmIntensity: 3,
  mood: 'neutral',
  stressLevel: 3,
  energyLevel: 3,
  interrupted: false,
  interruptionReasons: [],
  notes: ''
});
