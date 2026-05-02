import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Baby, CalendarClock, HeartHandshake, ShieldAlert, TestTube2, Trash2 } from 'lucide-react';
import type { CycleEvent, PartnerProfile, PregnancyEvent, ReproductiveGoal } from '../../domain';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import {
  buildCycleTimeline,
  buildPregnancyStatus,
  buildMenstrualSummary,
  countEventsByKind,
  estimateFertileWindow,
  getTrackedPartner,
  predictNextPeriod
} from './model/p4Derivations';

interface ReproductivePanelProps {
  date: string;
}

const GOAL_OPTIONS: Array<{ value: ReproductiveGoal; label: string }> = [
  { value: 'none', label: '仅记录' },
  { value: 'trying_to_conceive', label: '共同备孕' },
  { value: 'avoid_pregnancy', label: '暂不怀孕' },
  { value: 'pregnant', label: '已怀孕' },
  { value: 'post_loss_recovery', label: '恢复期' }
];

const tileClass = 'rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900';

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const getProfile = (partner: PartnerProfile) => partner.reproductiveProfile || {
  trackingEnabled: false,
  goal: 'none' as const,
  cycleRegularity: 'unknown' as const,
  typicalCycleLengthDays: null,
  typicalPeriodLengthDays: null,
  lastMenstrualPeriodStart: null,
  pregnancyHistorySummary: {
    priorPregnancies: null,
    priorLosses: null,
    ectopicHistory: null
  },
  riskFlags: []
};

const ReproductivePanel: React.FC<ReproductivePanelProps> = ({ date }) => {
  const {
    logs,
    partners,
    cycleEvents,
    pregnancyEvents,
    addOrUpdatePartner,
    saveCycleEvent,
    deleteCycleEvent,
    savePregnancyEvent,
    deletePregnancyEvent
  } = useData();
  const { showToast } = useToast();

  const trackedPartner = useMemo(() => getTrackedPartner(partners), [partners]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(trackedPartner?.id || null);

  useEffect(() => {
    if (!selectedPartnerId && trackedPartner?.id) {
      setSelectedPartnerId(trackedPartner.id);
    }
  }, [selectedPartnerId, trackedPartner]);

  const selectedPartner = useMemo(
    () => partners.find((partner) => partner.id === selectedPartnerId) || trackedPartner || null,
    [partners, selectedPartnerId, trackedPartner]
  );

  const partnerCycleEvents = useMemo(
    () => cycleEvents.filter((event) => event.partnerId === selectedPartner?.id).sort((left, right) => right.date.localeCompare(left.date)),
    [cycleEvents, selectedPartner?.id]
  );
  const partnerPregnancyEvents = useMemo(
    () => pregnancyEvents.filter((event) => event.partnerId === selectedPartner?.id).sort((left, right) => right.date.localeCompare(left.date)),
    [pregnancyEvents, selectedPartner?.id]
  );

  const cycleTimeline = useMemo(
    () => selectedPartner ? buildCycleTimeline(selectedPartner.id, partnerCycleEvents.filter((event) => event.date <= date)) : null,
    [date, partnerCycleEvents, selectedPartner]
  );
  const nextPeriod = useMemo(
    () => selectedPartner ? predictNextPeriod(selectedPartner.id, partnerCycleEvents.filter((event) => event.date <= date)) : null,
    [date, partnerCycleEvents, selectedPartner]
  );
  const fertileWindow = useMemo(
    () => selectedPartner ? estimateFertileWindow(selectedPartner.id, partnerCycleEvents.filter((event) => event.date <= date), date) : null,
    [date, partnerCycleEvents, selectedPartner]
  );
  const menstrualSummary = useMemo(
    () => (selectedPartner && cycleTimeline ? buildMenstrualSummary(date, selectedPartner.id, cycleTimeline) : null),
    [cycleTimeline, date, selectedPartner]
  );
  const pregnancyStatus = useMemo(
    () => selectedPartner ? buildPregnancyStatus(selectedPartner.id, partnerPregnancyEvents.filter((event) => event.date <= date)) : null,
    [date, partnerPregnancyEvents, selectedPartner]
  );

  const recentLogs = useMemo(() => {
    const endDate = date;
    const start = new Date(`${date}T00:00:00`);
    start.setDate(start.getDate() - 13);
    const startDate = start.toISOString().slice(0, 10);
    return logs.filter((log) => log.date >= startDate && log.date <= endDate);
  }, [date, logs]);

  const conceptionReadiness = useMemo(() => {
    const todayLog = logs.find((log) => log.date === date);
    const supplementTaken = Boolean(todayLog?.supplements?.some((item) => item.taken));
    const totalSleep = recentLogs.reduce((sum, log) => {
      const startTime = log.sleep?.startTime ? new Date(log.sleep.startTime).getTime() : null;
      const endTime = log.sleep?.endTime ? new Date(log.sleep.endTime).getTime() : null;
      if (!startTime || !endTime || endTime <= startTime) return sum;
      return sum + ((endTime - startTime) / (1000 * 60 * 60));
    }, 0);
    const sleepSamples = recentLogs.filter((log) => log.sleep?.startTime && log.sleep?.endTime).length;
    const avgSleep = sleepSamples > 0 ? totalSleep / sleepSamples : 0;
    const alcoholGrams = recentLogs.reduce((sum, log) => sum + (log.alcoholRecords || []).reduce((inner, item) => inner + item.totalGrams, 0), 0);
    let score = 0;
    if (selectedPartner?.reproductiveProfile?.trackingEnabled) score += 20;
    if (selectedPartner?.reproductiveProfile?.goal === 'trying_to_conceive') score += 20;
    if (supplementTaken) score += 20;
    if (avgSleep >= 7) score += 20;
    if (alcoholGrams <= 20) score += 20;

    return {
      score,
      supplementTaken,
      avgSleep,
      alcoholGrams
    };
  }, [date, logs, recentLogs, selectedPartner]);

  const delayedPeriodAlert = useMemo(() => {
    if (!selectedPartner || !nextPeriod?.date) return null;
    const daysLate = Math.max(0, Math.floor((new Date(`${date}T00:00:00`).getTime() - new Date(`${nextPeriod.date}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)));
    if (daysLate < 7) return null;

    const hasRecentUnprotectedSex = recentLogs.some((log) => (
      log.sex || []
    ).some((record) => record.protection.includes('无')));

    return hasRecentUnprotectedSex ? '月经预计已延迟 7 天以上，且近 14 天有无保护同房，建议先验孕。' : null;
  }, [date, nextPeriod?.date, recentLogs, selectedPartner]);

  if (!selectedPartner) {
    return (
      <div className="space-y-4">
        <div className={`${tileClass} text-sm font-medium text-slate-500 dark:text-slate-400`}>
          先在伴侣档案中建立一个当前关注伴侣，再开始记录周期、备孕和怀孕事件。
        </div>
      </div>
    );
  }

  const profile = getProfile(selectedPartner);

  const handleProfileUpdate = async (nextProfile: PartnerProfile['reproductiveProfile']) => {
    try {
      await addOrUpdatePartner({
        ...selectedPartner,
        reproductiveProfile: nextProfile
      });
      showToast('伴侣生殖档案已更新', 'success');
    } catch (error) {
      console.error(error);
      showToast('伴侣生殖档案保存失败', 'error');
    }
  };

  const recordCycleEvent = async (event: Omit<CycleEvent, 'id' | 'partnerId' | 'date' | 'source'>) => {
    try {
      await saveCycleEvent({
        id: createId('cycle'),
        partnerId: selectedPartner.id,
        date,
        source: 'manual',
        ...event
      });
      showToast('周期事件已记录', 'success');
    } catch (error) {
      console.error(error);
      showToast('周期事件保存失败', 'error');
    }
  };

  const recordPregnancyEvent = async (event: Omit<PregnancyEvent, 'id' | 'partnerId' | 'date' | 'source'>) => {
    try {
      await savePregnancyEvent({
        id: createId('preg'),
        partnerId: selectedPartner.id,
        date,
        source: 'manual',
        ...event
      });
      showToast('怀孕事件已记录', 'success');
    } catch (error) {
      console.error(error);
      showToast('怀孕事件保存失败', 'error');
    }
  };

  const handleDeleteCycleEvent = async (id: string) => {
    try {
      await deleteCycleEvent(id);
      showToast('周期事件已删除', 'info');
    } catch (error) {
      console.error(error);
      showToast('删除周期事件失败', 'error');
    }
  };

  const handleDeletePregnancyEvent = async (id: string) => {
    try {
      await deletePregnancyEvent(id);
      showToast('怀孕事件已删除', 'info');
    } catch (error) {
      console.error(error);
      showToast('删除怀孕事件失败', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <section className={tileClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">当前伴侣</div>
            <div className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">{selectedPartner.name}</div>
            <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              {menstrualSummary?.predictedPeriod ? '预计月经中' : menstrualSummary?.predictedFertileWindow ? '预计窗口期' : menstrualSummary?.status === 'period' ? `经期第 ${menstrualSummary.cycleDay || 1} 天` : '当前非经期'}
            </div>
          </div>
          {partners.length > 1 && (
            <select
              value={selectedPartner.id}
              onChange={(event) => setSelectedPartnerId(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">下次月经</div>
            <div className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{nextPeriod?.date || '数据不足'}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">易孕窗口</div>
            <div className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">
              {fertileWindow?.startDate && fertileWindow?.endDate ? `${fertileWindow.startDate.slice(5)}-${fertileWindow.endDate.slice(5)}` : '数据不足'}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">备孕准备度</div>
            <div className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{conceptionReadiness.score}</div>
          </div>
        </div>
      </section>

      <section className={tileClass}>
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-violet-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">周期记录</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => recordCycleEvent({ kind: 'period_start' })} className="rounded-2xl bg-violet-50 px-3 py-3 text-xs font-black text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">月经开始</button>
          <button type="button" onClick={() => recordCycleEvent({ kind: 'period_end' })} className="rounded-2xl bg-violet-50 px-3 py-3 text-xs font-black text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">月经结束</button>
          <button type="button" onClick={() => recordCycleEvent({ kind: 'ovulation_test', payload: { ovulationTest: 'peak' } })} className="rounded-2xl bg-pink-50 px-3 py-3 text-xs font-black text-pink-700 dark:bg-pink-900/20 dark:text-pink-300">排卵峰值</button>
          <button type="button" onClick={() => recordCycleEvent({ kind: 'ovulation_test', payload: { ovulationTest: 'negative' } })} className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">排卵阴性</button>
          <button type="button" onClick={() => recordCycleEvent({ kind: 'flow', payload: { flow: 'heavy' } })} className="rounded-2xl bg-rose-50 px-3 py-3 text-xs font-black text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">流量偏多</button>
          <button type="button" onClick={() => recordCycleEvent({ kind: 'cramp', payload: { crampLevel: 4 } })} className="rounded-2xl bg-orange-50 px-3 py-3 text-xs font-black text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">痛经明显</button>
          <button type="button" onClick={() => recordCycleEvent({ kind: 'spotting' })} className="rounded-2xl bg-amber-50 px-3 py-3 text-xs font-black text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">点滴出血</button>
          <button type="button" onClick={() => recordCycleEvent({ kind: 'intercourse_for_conception', payload: { intercourseProtected: false } })} className="rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">备孕同房</button>
        </div>
        <div className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
          已记录：月经 {countEventsByKind(partnerCycleEvents, ['period_start', 'period_end'])} 条，排卵 {countEventsByKind(partnerCycleEvents, ['ovulation_test'])} 条
        </div>
      </section>

      <section className={tileClass}>
        <div className="flex items-center gap-2">
          <HeartHandshake size={16} className="text-emerald-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">共同备孕</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleProfileUpdate({ ...profile, trackingEnabled: !profile.trackingEnabled })}
            className={`rounded-2xl px-3 py-3 text-xs font-black ${profile.trackingEnabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {profile.trackingEnabled ? '已开启协同追踪' : '开启协同追踪'}
          </button>
          <div className="rounded-2xl bg-slate-50 px-3 py-3 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            今日补剂 {conceptionReadiness.supplementTaken ? '已记录' : '未记录'}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleProfileUpdate({ ...profile, trackingEnabled: true, goal: option.value })}
              className={`rounded-2xl border px-3 py-3 text-xs font-black transition-all ${
                profile.goal === option.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          平均睡眠 {conceptionReadiness.avgSleep > 0 ? `${conceptionReadiness.avgSleep.toFixed(1)}h` : '数据不足'}，近 14 天酒精 {conceptionReadiness.alcoholGrams.toFixed(0)}g。
        </div>
      </section>

      <section className={tileClass}>
        <div className="flex items-center gap-2">
          <Baby size={16} className="text-sky-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">怀孕事件</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => recordPregnancyEvent({ kind: 'pregnancy_test', payload: { pregnancyTest: 'positive' } })} className="rounded-2xl bg-sky-50 px-3 py-3 text-xs font-black text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">试纸阳性</button>
          <button type="button" onClick={() => recordPregnancyEvent({ kind: 'pregnancy_test', payload: { pregnancyTest: 'negative' } })} className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">试纸阴性</button>
          <button type="button" onClick={() => recordPregnancyEvent({ kind: 'bleeding', payload: { bleedingLevel: 'heavy' } })} className="rounded-2xl bg-rose-50 px-3 py-3 text-xs font-black text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">大量出血</button>
          <button type="button" onClick={() => recordPregnancyEvent({ kind: 'pain', payload: { painSeverity: 4, painSide: 'left', withDizziness: true } })} className="rounded-2xl bg-orange-50 px-3 py-3 text-xs font-black text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">单侧腹痛</button>
          <button type="button" onClick={() => recordPregnancyEvent({ kind: 'ultrasound', payload: { intrauterineConfirmed: true, gestationalSacSeen: true } })} className="rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">宫内妊娠确认</button>
          <button type="button" onClick={() => recordPregnancyEvent({ kind: 'pregnancy_outcome', payload: { pregnancyOutcome: 'early_loss' } })} className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">记录结局</button>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          当前状态：
          {' '}
          {pregnancyStatus?.state === 'intrauterine_confirmed'
            ? '宫内妊娠已确认'
            : pregnancyStatus?.state === 'suspected_or_confirmed_pregnancy'
              ? '疑似或已确认怀孕'
              : pregnancyStatus?.state === 'ended'
                ? '本次妊娠已记录结局'
                : '暂无怀孕状态'}
        </div>
      </section>

      {(delayedPeriodAlert || (pregnancyStatus?.alerts.length || 0) > 0) && (
        <section className={`${tileClass} border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10`}>
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-600" />
            <h3 className="text-sm font-black text-amber-800 dark:text-amber-300">提醒与风险</h3>
          </div>
          <div className="mt-4 space-y-2">
            {delayedPeriodAlert && (
              <div className="flex items-start gap-2 rounded-2xl bg-white/70 px-3 py-3 text-xs font-bold text-amber-900 dark:bg-slate-900/40 dark:text-amber-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{delayedPeriodAlert}</span>
              </div>
            )}
            {(pregnancyStatus?.alerts || []).map((alert) => (
              <div key={alert} className="flex items-start gap-2 rounded-2xl bg-white/70 px-3 py-3 text-xs font-bold text-amber-900 dark:bg-slate-900/40 dark:text-amber-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{alert}</span>
              </div>
            ))}
            <div className="flex items-start gap-2 rounded-2xl bg-white/70 px-3 py-3 text-xs font-bold text-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
              <TestTube2 size={14} className="mt-0.5 shrink-0" />
              <span>所有窗口和月经预测仅作估算，不能作为避孕依据。</span>
            </div>
          </div>
        </section>
      )}

      <section className={tileClass}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">最近周期事件</div>
            <div className="space-y-2">
              {partnerCycleEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span>{event.date} · {event.kind}</span>
                  <button type="button" onClick={() => handleDeleteCycleEvent(event.id)} className="rounded-full p-1 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">最近怀孕事件</div>
            <div className="space-y-2">
              {partnerPregnancyEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span>{event.date} · {event.kind}</span>
                  <button type="button" onClick={() => handleDeletePregnancyEvent(event.id)} className="rounded-full p-1 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReproductivePanel;
