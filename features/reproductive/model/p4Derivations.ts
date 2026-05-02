import type {
  CycleEvent,
  CycleEventKind,
  LogEntry,
  MenstrualDailySummary,
  PartnerProfile,
  PregnancyEvent
} from '../../../domain';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (date: string) => new Date(`${date}T00:00:00`);
const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date: string, days: number) => {
  const next = toDate(date);
  next.setDate(next.getDate() + days);
  return toDateString(next);
};

const diffDays = (startDate: string, endDate: string) => Math.round((toDate(endDate).getTime() - toDate(startDate).getTime()) / DAY_MS);

const isSameOrAfter = (date: string, target: string) => date >= target;
const isSameOrBefore = (date: string, target: string) => date <= target;

const inRange = (date: string, startDate: string, endDate: string) => (
  isSameOrAfter(date, startDate) && isSameOrBefore(date, endDate)
);

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  return sorted[middle];
};

const sortByDate = <T extends { date: string }>(items: T[]) => [...items].sort((left, right) => left.date.localeCompare(right.date));

const isPeakTest = (event: CycleEvent) => (
  event.kind === 'ovulation_test' && event.payload?.ovulationTest === 'peak'
);

export interface CycleTimeline {
  partnerId: string;
  events: CycleEvent[];
  periodStarts: string[];
  periodEnds: string[];
  completedCycleLengths: number[];
  medianCycleLengthDays: number | null;
  lastPeriodStart: string | null;
  activePeriodStart: string | null;
  latestPeakTestDate: string | null;
  confidence: 'insufficient' | 'low' | 'medium';
}

export interface PeriodPrediction {
  date: string | null;
  cycleLengthDays: number | null;
  confidence: 'insufficient' | 'low' | 'medium';
  reason: string;
}

export interface FertileWindowEstimate {
  startDate: string | null;
  endDate: string | null;
  ovulationDate: string | null;
  source: 'peak_test' | 'calendar' | 'insufficient';
  confidence: 'insufficient' | 'low' | 'medium';
  reason: string;
}

export interface PregnancyStatus {
  state: 'none' | 'suspected_or_confirmed_pregnancy' | 'intrauterine_confirmed' | 'ended';
  latestTestResult: 'negative' | 'faint_positive' | 'positive' | 'invalid' | null;
  latestPositiveDate: string | null;
  latestOutcome:
    | 'ongoing'
    | 'chemical'
    | 'early_loss'
    | 'ectopic'
    | 'terminated'
    | 'unknown'
    | null;
  alerts: string[];
}

export const getTrackedPartner = (partners: PartnerProfile[]): PartnerProfile | null => {
  const tracked = partners.find((partner) => partner.reproductiveProfile?.trackingEnabled);
  return tracked || partners[0] || null;
};

export const buildCycleTimeline = (partnerId: string, cycleEvents: CycleEvent[]): CycleTimeline => {
  const events = sortByDate(cycleEvents.filter((event) => event.partnerId === partnerId));
  const periodStarts = events.filter((event) => event.kind === 'period_start').map((event) => event.date);
  const periodEnds = events.filter((event) => event.kind === 'period_end').map((event) => event.date);
  const completedCycleLengths = periodStarts
    .slice(1)
    .map((date, index) => diffDays(periodStarts[index], date))
    .filter((value) => value >= 15 && value <= 60)
    .slice(-6);
  const medianCycleLengthDays = median(completedCycleLengths);
  const lastPeriodStart = periodStarts.length > 0 ? periodStarts[periodStarts.length - 1] : null;
  const lastPeriodEnd = periodEnds.length > 0 ? periodEnds[periodEnds.length - 1] : null;
  const activePeriodStart = lastPeriodStart && (!lastPeriodEnd || isSameOrAfter(lastPeriodEnd, lastPeriodStart) === false)
    ? lastPeriodStart
    : lastPeriodStart && lastPeriodEnd && isSameOrAfter(lastPeriodEnd, lastPeriodStart) ? null : lastPeriodStart;
  const latestPeakTestDate = [...events].reverse().find(isPeakTest)?.date || null;

  let confidence: CycleTimeline['confidence'] = 'insufficient';
  if (completedCycleLengths.length >= 3) confidence = completedCycleLengths.length >= 5 ? 'medium' : 'low';

  return {
    partnerId,
    events,
    periodStarts,
    periodEnds,
    completedCycleLengths,
    medianCycleLengthDays,
    lastPeriodStart,
    activePeriodStart,
    latestPeakTestDate,
    confidence
  };
};

export const predictNextPeriod = (partnerId: string, cycleEvents: CycleEvent[]): PeriodPrediction => {
  const timeline = buildCycleTimeline(partnerId, cycleEvents);
  if (!timeline.lastPeriodStart || !timeline.medianCycleLengthDays || timeline.completedCycleLengths.length < 3) {
    return {
      date: null,
      cycleLengthDays: timeline.medianCycleLengthDays,
      confidence: 'insufficient',
      reason: '数据不足'
    };
  }

  return {
    date: addDays(timeline.lastPeriodStart, timeline.medianCycleLengthDays),
    cycleLengthDays: timeline.medianCycleLengthDays,
    confidence: timeline.confidence,
    reason: timeline.latestPeakTestDate ? '结合近 72 小时排卵试纸峰值与周期中位数估算' : '基于最近完整周期中位数估算'
  };
};

export const estimateFertileWindow = (partnerId: string, cycleEvents: CycleEvent[], referenceDate?: string): FertileWindowEstimate => {
  const timeline = buildCycleTimeline(partnerId, cycleEvents);
  const relevantEvents = referenceDate
    ? timeline.events.filter((event) => event.date <= referenceDate)
    : timeline.events;
  const peakEvent = [...relevantEvents].reverse().find(isPeakTest);

  if (peakEvent && (!referenceDate || diffDays(peakEvent.date, referenceDate) <= 3)) {
    const ovulationDate = addDays(peakEvent.date, 1);
    return {
      startDate: addDays(ovulationDate, -5),
      endDate: addDays(ovulationDate, 1),
      ovulationDate,
      source: 'peak_test',
      confidence: 'medium',
      reason: '近 72 小时排卵试纸峰值覆盖了默认窗口估算'
    };
  }

  const prediction = predictNextPeriod(partnerId, relevantEvents);
  if (!prediction.date) {
    return {
      startDate: null,
      endDate: null,
      ovulationDate: null,
      source: 'insufficient',
      confidence: 'insufficient',
      reason: '数据不足'
    };
  }

  const ovulationDate = addDays(prediction.date, -14);
  return {
    startDate: addDays(ovulationDate, -5),
    endDate: addDays(ovulationDate, 1),
    ovulationDate,
    source: 'calendar',
    confidence: prediction.confidence,
    reason: '基于预测月经日前 14 天估算排卵日'
  };
};

export const buildMenstrualSummary = (
  date: string,
  partnerId: string,
  cycleState: CycleTimeline
): MenstrualDailySummary => {
  const events = cycleState.events.filter((event) => event.date <= date);
  const latestPeriodStart = [...events].reverse().find((event) => event.kind === 'period_start');
  const periodEndAfterStart = latestPeriodStart
    ? events.find((event) => event.kind === 'period_end' && event.date >= latestPeriodStart.date)
    : null;

  if (latestPeriodStart && (!periodEndAfterStart || periodEndAfterStart.date >= date)) {
    return {
      partnerId,
      status: 'period',
      cycleDay: Math.max(1, diffDays(latestPeriodStart.date, date) + 1),
      notes: ''
    };
  }

  const fertileWindow = estimateFertileWindow(partnerId, cycleState.events, date);
  if (fertileWindow.startDate && fertileWindow.endDate && inRange(date, fertileWindow.startDate, fertileWindow.endDate)) {
    return {
      partnerId,
      status: 'fertile_window',
      predictedFertileWindow: true,
      notes: '预计窗口期'
    };
  }

  const nextPeriod = predictNextPeriod(partnerId, cycleState.events);
  if (nextPeriod.date) {
    const predictedEnd = addDays(nextPeriod.date, 4);
    if (inRange(date, nextPeriod.date, predictedEnd)) {
      return {
        partnerId,
        status: 'none',
        predictedPeriod: true,
        notes: '预计月经'
      };
    }
  }

  return {
    partnerId,
    status: 'none',
    notes: cycleState.completedCycleLengths.length < 3 ? '数据不足' : ''
  };
};

export const buildPregnancyStatus = (partnerId: string, pregnancyEvents: PregnancyEvent[]): PregnancyStatus => {
  const events = sortByDate(pregnancyEvents.filter((event) => event.partnerId === partnerId));
  const reversed = [...events].reverse();
  const latestTest = reversed.find((event) => event.kind === 'pregnancy_test');
  const latestPositive = reversed.find((event) => event.kind === 'pregnancy_test' && ['positive', 'faint_positive'].includes(event.payload?.pregnancyTest || ''));
  const rawLatestOutcome = reversed.find((event) => event.kind === 'pregnancy_outcome');
  const latestOutcome = rawLatestOutcome && latestPositive && rawLatestOutcome.date < latestPositive.date ? null : rawLatestOutcome;
  const eventsAfterLatestPositive = latestPositive ? events.filter((event) => event.date >= latestPositive.date) : events;
  const reversedAfterPositive = [...eventsAfterLatestPositive].reverse();
  const confirmedUltrasound = reversedAfterPositive.find((event) => event.kind === 'ultrasound' && event.payload?.intrauterineConfirmed);
  const recentBleeding = reversedAfterPositive.find((event) => event.kind === 'bleeding' && event.payload?.bleedingLevel === 'heavy');
  const recentPain = reversedAfterPositive.find((event) => event.kind === 'pain' && (
    Boolean(event.payload?.withDizziness)
    || Boolean(event.payload?.withShoulderPain)
    || event.payload?.painSide === 'left'
    || event.payload?.painSide === 'right'
  ));
  const alerts: string[] = [];

  if (latestPositive && !latestOutcome) {
    alerts.push('阳性试纸后建议继续补充叶酸/补剂，避免酒精和吸烟，并尽快安排就医。');
  }
  if (latestPositive && (recentBleeding || recentPain)) {
    alerts.push('疑似妊娠同时出现大量出血或单侧腹痛/头晕/肩痛，请尽快急诊评估。');
  }

  if (latestOutcome) {
    return {
      state: 'ended',
      latestTestResult: latestTest?.payload?.pregnancyTest || null,
      latestPositiveDate: latestPositive?.date || null,
      latestOutcome: latestOutcome.payload?.pregnancyOutcome || 'unknown',
      alerts
    };
  }

  if (confirmedUltrasound) {
    return {
      state: 'intrauterine_confirmed',
      latestTestResult: latestTest?.payload?.pregnancyTest || null,
      latestPositiveDate: latestPositive?.date || null,
      latestOutcome: null,
      alerts
    };
  }

  if (latestPositive) {
    return {
      state: 'suspected_or_confirmed_pregnancy',
      latestTestResult: latestTest?.payload?.pregnancyTest || null,
      latestPositiveDate: latestPositive.date,
      latestOutcome: null,
      alerts
    };
  }

  return {
    state: 'none',
    latestTestResult: latestTest?.payload?.pregnancyTest || null,
    latestPositiveDate: null,
    latestOutcome: null,
    alerts
  };
};

export const deriveMenstrualSummaryForDate = (
  date: string,
  partners: PartnerProfile[],
  cycleEvents: CycleEvent[]
): MenstrualDailySummary | null => {
  const trackedPartner = getTrackedPartner(partners);
  if (!trackedPartner) return null;

  const timeline = buildCycleTimeline(
    trackedPartner.id,
    cycleEvents.filter((event) => event.date <= date)
  );

  return buildMenstrualSummary(date, trackedPartner.id, timeline);
};

export const attachMenstrualSummary = (
  log: LogEntry,
  partners: PartnerProfile[],
  cycleEvents: CycleEvent[]
): LogEntry => {
  const summary = deriveMenstrualSummaryForDate(log.date, partners, cycleEvents);
  if (!summary) return log;
  return {
    ...log,
    menstrual: summary
  };
};

export const countEventsByKind = (events: CycleEvent[], kinds: CycleEventKind[]) => (
  events.filter((event) => kinds.includes(event.kind)).length
);
