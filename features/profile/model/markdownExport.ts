import type { LogEntry } from '../../../domain';
import { StatsEngine } from '../../stats/model/StatsEngine';

const formatDateTitle = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const [year, month, day] = date.split('-');
  return `${year}/${month}/${day} ${weekdays[parsed.getDay()]}`;
};

const formatTime = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return value;
};

const formatHours = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return null;
  return Math.round(((endTime - startTime) / 3_600_000) * 10) / 10;
};

const average = (values: number[]) => values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const formatAverage = (value: number | null, digits = 1) => value === null ? '无' : value.toFixed(digits);

const formatDelta = (current: number | null, previous: number | null, digits = 1) => {
  if (current === null || previous === null) return '—';
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return '持平';
  return `${delta > 0 ? '↑' : '↓'}${Math.abs(delta).toFixed(digits)}`;
};

const getWindowValues = (series: { date: string; value: number }[], endDate: string, days: number) => {
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const start = end - (days - 1) * 86_400_000;
  return series
    .filter((point) => {
      const time = new Date(`${point.date}T00:00:00`).getTime();
      return time >= start && time <= end;
    })
    .map((point) => point.value);
};

const getPreviousWindowValues = (series: { date: string; value: number }[], endDate: string, days: number) => {
  const end = new Date(`${endDate}T00:00:00`).getTime() - days * 86_400_000;
  const start = end - (days - 1) * 86_400_000;
  return series
    .filter((point) => {
      const time = new Date(`${point.date}T00:00:00`).getTime();
      return time >= start && time <= end;
    })
    .map((point) => point.value);
};

const hasMeaningfulLog = (log: LogEntry) => (
  !!log.morning
  || !!log.sleep
  || log.sex.length > 0
  || log.masturbation.length > 0
  || log.exercise.length > 0
  || log.alcoholRecords.length > 0
  || !!log.mood
  || !!log.notes
);

const renderMorning = (log: LogEntry) => {
  if (!log.morning) return '- **晨勃**：未记录';
  const hardness = log.morning.hardness ? `硬度 ${log.morning.hardness}` : '硬度未记录';
  const retention = log.morning.retention ? `，保持 ${log.morning.retention}` : '';
  const woke = log.morning.wokeWithErection === null ? '' : log.morning.wokeWithErection ? '，醒来有勃起' : '，醒来无勃起';
  return `- **晨勃**：${hardness}${retention}${woke}`;
};

const renderSleep = (log: LogEntry) => {
  if (!log.sleep) return '- **睡眠**：未记录';
  const hours = formatHours(log.sleep.startTime, log.sleep.endTime);
  const range = log.sleep.startTime || log.sleep.endTime ? `${formatTime(log.sleep.startTime)} - ${formatTime(log.sleep.endTime)}` : '时间未记录';
  const quality = log.sleep.quality ? `，质量 ${log.sleep.quality}` : '';
  return `- **睡眠**：${range}${hours === null ? '' : ` (${hours}h)`}${quality}`;
};

const renderSex = (log: LogEntry) => {
  if (log.sex.length === 0) return '- **性事**：无';
  const partners = Array.from(new Set(log.sex.flatMap((record) => [
    record.partner,
    ...record.interactions.map((interaction) => interaction.partner)
  ].filter((value): value is string => !!value))));
  return `- **性事**：${log.sex.length} 次${partners.length > 0 ? `（伴侣：${partners.join('、')}）` : ''}`;
};

const renderMasturbation = (log: LogEntry) => (
  `- **自慰**：${log.masturbation.length > 0 ? `${log.masturbation.length} 次` : '无'}`
);

const renderExercise = (log: LogEntry) => {
  if (log.exercise.length === 0) return '- **运动**：无';
  const items = log.exercise.map((record) => `${record.type} ${record.duration}min`);
  return `- **运动**：${items.join('、')}`;
};

const renderAlcohol = (log: LogEntry) => {
  if (log.alcoholRecords.length === 0) return '- **饮酒**：无';
  const grams = log.alcoholRecords.reduce((sum, record) => sum + record.totalGrams, 0);
  return `- **饮酒**：${Math.round(grams * 10) / 10}g`;
};

const renderMood = (log: LogEntry) => (
  `- **情绪**：${log.mood || '未记录'}${log.stressLevel ? `，压力 ${log.stressLevel}` : ''}`
);

const renderTrend = (log: LogEntry, engine: StatsEngine) => {
  const hardnessSeries = engine.getSeries('hardness').filter((point) => point.value > 0);
  const sleepSeries = engine.getSeries('sleep').filter((point) => point.value > 0);
  const exerciseSeries = engine.getSeries('exercise');
  const sexLoadSeries = engine.getSeries('sexLoad');

  const hardnessCurrent = average(getWindowValues(hardnessSeries, log.date, 7));
  const hardnessPrevious = average(getPreviousWindowValues(hardnessSeries, log.date, 7));
  const sleepCurrent = average(getWindowValues(sleepSeries, log.date, 7));
  const sleepPrevious = average(getPreviousWindowValues(sleepSeries, log.date, 7));
  const exerciseDays = getWindowValues(exerciseSeries, log.date, 7).filter((value) => value > 0).length;
  const sexLoadTotal = getWindowValues(sexLoadSeries, log.date, 7).reduce((sum, value) => sum + value, 0);

  return `**近 7 日趋势**：晨勃硬度均值 ${formatAverage(hardnessCurrent)}（${formatDelta(hardnessCurrent, hardnessPrevious)}），睡眠均值 ${formatAverage(sleepCurrent)}h（${formatDelta(sleepCurrent, sleepPrevious)}），运动 ${exerciseDays}/7 天，性事+自慰负荷 ${sexLoadTotal.toFixed(1)}`;
};

const renderLog = (log: LogEntry, engine: StatsEngine) => {
  const lines = [
    `## ${formatDateTitle(log.date)}`,
    '',
    renderMorning(log),
    renderSleep(log),
    renderSex(log),
    renderMasturbation(log),
    renderExercise(log),
    renderAlcohol(log),
    renderMood(log),
    '',
    renderTrend(log, engine)
  ];

  if (log.notes) {
    lines.push('', `> 备注：${log.notes}`);
  }

  return lines.join('\n');
};

export const buildMarkdownExport = (logs: LogEntry[]) => {
  const meaningfulLogs = logs.filter(hasMeaningfulLog).sort((left, right) => right.date.localeCompare(left.date));
  const engine = new StatsEngine(logs);
  return meaningfulLogs.map((log) => renderLog(log, engine)).join('\n\n');
};
