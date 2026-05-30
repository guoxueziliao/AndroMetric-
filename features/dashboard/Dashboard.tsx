import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { LogEntry } from '../../domain';
import { StorageService } from '../../core/storage';
import { 
  Moon, Zap, Activity, Hand, Dumbbell, CloudSun, Beer, ShieldAlert, Edit3,
  Trash2, Coffee, Bed, ArrowRight, Heart, MapPin, BrainCircuit, Film, Smile,
  ChevronRight, ChevronLeft, Calendar, Sofa, X, StickyNote
} from 'lucide-react';
import { BottomSheet, Modal, ConfirmModal } from '../../shared/ui';
import { formatTime, calculateSleepDuration, getTodayDateString, LABELS } from '../../shared/lib';
import { useDashboardController, type DashboardActions, type SummaryTab } from './model/useDashboardController';
import { buildTodayTiles, buildWeekSummary, type TodayTileKey } from './model/p1Summary';
import { hydrateLog } from '../../core/storage';
import { usePartners } from '../../contexts/PartnerContext';
import { useReproductive } from '../../contexts/ReproductiveContext';
import { attachMenstrualSummary } from '../reproductive/model/p4Derivations';
import DashboardDayView from './DashboardDayView';
import ImpactFindings from './ImpactFindings';
import DashboardTrainingHint from './DashboardTrainingHint';
import DashboardExplanationHint from './DashboardExplanationHint';
import DashboardObservationHint from './DashboardObservationHint';
import TodayHealthCard from './TodayHealthCard';

const GlobalTimeline = lazy(() => import('./GlobalTimeline').then((module) => ({ default: module.GlobalTimeline })));
const LogHistory = lazy(() => import('./LogHistory').then((module) => ({ default: module.LogHistory })));
const ReproductivePanel = lazy(() => import('../reproductive/ReproductivePanel'));
const DashboardWeekView = lazy(() => import('./DashboardWeekView'));
const DashboardMonthView = lazy(() => import('./DashboardMonthView'));

interface DashboardProps {
  logs: LogEntry[];
  actions: DashboardActions;
  onNavigateToReview?: () => void;
}

const WEATHER_LABELS: Record<string, string> = { sunny: '晴', cloudy: '多云', rainy: '雨', snowy: '雪', windy: '大风', foggy: '雾' };
const LOCATION_LABELS: Record<string, string> = { home: '家', partner: '伴侣家', hotel: '酒店', travel: '旅途', other: '其他' };
const MOOD_LABELS: Record<string, string> = { happy: '开心', excited: '兴奋', neutral: '平静', anxious: '焦虑', sad: '低落', angry: '生气' };
const PORN_LABELS: Record<string, string> = { none: '无', low: '少量', medium: '适量', high: '沉迷' };
const panelLoadingClass = 'flex items-center justify-center rounded-3xl border border-dashed border-surface-border bg-surface-card/70 p-4 text-xs font-bold text-text-muted';
const summaryItemClass = 'flex items-center gap-2 bg-surface-muted p-3 rounded-2xl border border-surface-border';
const activityItemClass = 'bg-surface-muted p-4 rounded-[1.5rem] border border-surface-border flex items-center justify-between';
const activityIconBaseClass = 'p-2.5 bg-surface-card rounded-2xl shadow-soft';

interface SummarySectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  colorClass?: string;
}

type DashboardView = 'day' | 'week' | 'month';

const Dashboard: React.FC<DashboardProps> = ({
  logs: rawLogs,
  actions,
  onNavigateToReview
}) => {
  const {
    onEdit,
    onFinishExercise,
    onFinishMasturbation,
    onFinishNap,
    onFinishAlcohol
  } = actions;
  const { partners } = usePartners();
  const { cycleEvents } = useReproductive();

  const logs = useMemo(() => Array.isArray(rawLogs) ? rawLogs : [], [rawLogs]);
  const [activeView, setActiveView] = useState<DashboardView>('day');
  const [selectedTileKey, setSelectedTileKey] = useState<TodayTileKey | null>(null);
  const [trainingGoals, setTrainingGoals] = useState<import('../../domain').TrainingGoal[]>([]);

  useEffect(() => {
    let cancelled = false;
    StorageService.trainingGoals.queries.all().then((g) => {
      if (!cancelled) setTrainingGoals(g);
    });
    return () => { cancelled = true; };
  }, []);

  const {
    isSummaryModalOpen,
    setIsSummaryModalOpen,
    summaryLog,
    activeSummaryTab,
    setActiveSummaryTab,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    dateToDelete,
    taskToCancel,
    setTaskToCancel,
    pendingLog,
    ongoingExercise,
    ongoingNap,
    ongoingMb,
    ongoingAlcohol,
    onDateClickForSummary,
    onNavigateDate,
    onDeleteRecord,
    onConfirmDelete,
    onRequestCancel,
    onConfirmCancel
  } = useDashboardController({
    logs,
    partners,
    cycleEvents,
    actions
  });

  const todayDate = useMemo(() => getTodayDateString(), []);
  const todayLog = useMemo(
    () => attachMenstrualSummary(logs.find((item) => item.date === todayDate) || hydrateLog({ date: todayDate }), partners, cycleEvents),
    [cycleEvents, logs, partners, todayDate]
  );
  const todayTiles = useMemo(() => buildTodayTiles(todayLog), [todayLog]);
  const selectedTile = useMemo(() => todayTiles.find((item) => item.key === selectedTileKey) || null, [todayTiles, selectedTileKey]);
  const weekSummary = useMemo(() => buildWeekSummary(logs), [logs]);

  const last7Days = useMemo(() => {
      const dates = [];
      for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${day}`);
      }
      return dates;
  }, []);

  const greeting = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 5) return '夜深了';
      if (hour < 12) return '早上好';
      if (hour < 18) return '下午好';
      return '晚上好';
  }, []);

  const diaryDateInfo = useMemo(() => {
    if (!summaryLog) return { main: '', sub: '' };
    const d = new Date(summaryLog.date + 'T00:00:00');
    return {
      main: `${d.getMonth() + 1}月${d.getDate()}日`,
      sub: d.toLocaleDateString('zh-CN', { weekday: 'long' })
    };
  }, [summaryLog]);

  const SummarySection = ({ title, icon: Icon, children, colorClass = "text-text-muted" }: SummarySectionProps) => (
      <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
              <Icon size={14} className={colorClass} />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-text-muted">{title}</h3>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-[2rem] p-5 shadow-soft space-y-4">
              {children}
          </div>
      </div>
  );

  const inlineLoader = (
    <div className={panelLoadingClass}>加载中...</div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end px-2">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-text-primary">{greeting}</h1>
                <p className="text-text-muted text-sm font-medium">今天感觉如何？</p>
            </div>
        </div>

        <div className="flex rounded-2xl border border-surface-border bg-surface-muted p-1">
            {[
                { id: 'day', label: '日视图' },
                { id: 'week', label: '周视图' },
                { id: 'month', label: '月视图' }
            ].map((item) => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id as DashboardView)}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                        activeView === item.id
                            ? 'bg-surface-card text-accent shadow-soft'
                            : 'text-text-muted'
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>

        {/* Ongoing Tasks Banners */}
        {logs.length === 0 && (
            <section className="bg-gradient-to-br from-state-info-bg to-accent-muted/10 rounded-3xl p-6 border border-state-info-text/20 animate-in fade-in">
                <h2 className="text-base font-black text-text-primary mb-1">还没有任何记录</h2>
                <p className="text-sm text-text-muted mb-4 leading-relaxed">
                    点击右下角的 <span className="inline-flex items-center justify-center w-6 h-6 bg-accent text-text-on-accent rounded-full font-black text-xs mx-0.5">+</span> 按钮开始第一条快记 ——
                    睡眠、运动、饮品、性事件都可以从这里录入。
                </p>
                <p className="text-xs text-text-muted">
                    或者在底部"日历"里直接点今天,写完整日记。
                </p>
            </section>
        )}
        {(() => {
            const ongoingItems: Array<{
                kind: 'sleep' | 'nap' | 'mb' | 'exercise' | 'alcohol';
                Icon: typeof Bed;
                title: string;
                startLabel: string | undefined;
                panelClass: string;
                textColor: string;
                finishLabel: string;
                onFinish: () => void;
            }> = [];
            if (pendingLog) ongoingItems.push({
                kind: 'sleep', Icon: Bed, title: '正在睡觉中...',
                startLabel: formatTime(pendingLog.sleep?.startTime),
                panelClass: 'bg-gradient-to-r from-state-success-text to-accent', textColor: 'text-state-success-text',
                finishLabel: '醒了', onFinish: () => onEdit(pendingLog.date)
            });
            if (ongoingNap) ongoingItems.push({
                kind: 'nap', Icon: Sofa, title: '正在午休中...',
                startLabel: ongoingNap.startTime,
                panelClass: 'bg-gradient-to-r from-state-warning-text to-accent-muted', textColor: 'text-state-warning-text',
                finishLabel: '醒了', onFinish: () => onFinishNap?.(ongoingNap)
            });
            if (ongoingMb) ongoingItems.push({
                kind: 'mb', Icon: Hand, title: '正在施法中...',
                startLabel: ongoingMb.startTime,
                panelClass: 'bg-gradient-to-r from-accent-vivid to-chart-tertiary', textColor: 'text-accent-vivid',
                finishLabel: '收工', onFinish: () => onFinishMasturbation?.(ongoingMb)
            });
            if (ongoingExercise) ongoingItems.push({
                kind: 'exercise', Icon: Dumbbell, title: `正在${ongoingExercise.type}中...`,
                startLabel: ongoingExercise.startTime,
                panelClass: 'bg-gradient-to-r from-state-warning-text to-state-success-text', textColor: 'text-state-warning-text',
                finishLabel: '完成', onFinish: () => onFinishExercise?.(ongoingExercise)
            });
            if (ongoingAlcohol) ongoingItems.push({
                kind: 'alcohol', Icon: Beer, title: '正在酒局中...',
                startLabel: ongoingAlcohol.time,
                panelClass: 'bg-gradient-to-r from-chart-tertiary to-state-info-text', textColor: 'text-chart-tertiary',
                finishLabel: '结算', onFinish: () => onFinishAlcohol?.(ongoingAlcohol)
            });

            if (ongoingItems.length === 0) return null;

            return (
                <section className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-slow">
                    {ongoingItems.length > 1 && (
                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest px-2 pt-1">
                            进行中 ({ongoingItems.length})
                        </div>
                    )}
                    {ongoingItems.map(item => (
                        <div key={item.kind} className={`${item.panelClass} p-4 rounded-3xl shadow-glow text-text-on-accent flex justify-between items-center transform transition-transform hover:scale-[1.01]`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-surface-card/20 rounded-full animate-pulse"><item.Icon size={20}/></div>
                                <div>
                                    <div className="font-bold text-sm">{item.title}</div>
                                    <div className="text-[10px] opacity-70">{item.startLabel} 开始</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onRequestCancel(item.kind)} aria-label={`取消${item.title}`} className="p-2 text-text-on-accent/60 hover:text-text-on-accent transition-colors"><X size={18}/></button>
                                <button onClick={item.onFinish} className={`px-5 py-2 bg-surface-card ${item.textColor} rounded-full text-xs font-bold shadow-soft active:scale-95 transition-all`}>{item.finishLabel}</button>
                            </div>
                        </div>
                    ))}
                </section>
            );
        })()}

        {activeView === 'day' && (
            <>
                <ImpactFindings logs={logs} />
                <DashboardTrainingHint goals={trainingGoals} onNavigateToReview={onNavigateToReview} />
                <DashboardExplanationHint logs={logs} onNavigateToStats={onNavigateToReview} />
                <DashboardObservationHint onNavigateToStats={onNavigateToReview} />
                <TodayHealthCard />
                <DashboardDayView
                    logs={logs}
                    todayLog={todayLog}
                    todayTiles={todayTiles}
                    last7Days={last7Days}
                    pendingLog={pendingLog ?? null}
                    ongoingNap={ongoingNap ?? null}
                    onSelectTile={setSelectedTileKey}
                />
            </>
        )}

        {activeView === 'week' && (
            <Suspense fallback={inlineLoader}>
                <DashboardWeekView days={weekSummary} onOpenDate={onDateClickForSummary} />
            </Suspense>
        )}

        {activeView === 'month' && (
            <Suspense fallback={inlineLoader}>
                <DashboardMonthView logs={logs} onDateClick={onDateClickForSummary} />
            </Suspense>
        )}
      </div>

      <BottomSheet
        isOpen={selectedTile !== null}
        onClose={() => setSelectedTileKey(null)}
        title={selectedTile?.label || ''}
        footer={selectedTile?.key === 'menstrual' ? null : (
            <button
                type="button"
                onClick={() => {
                    setSelectedTileKey(null);
                    onEdit(todayLog.date);
                }}
                className="w-full rounded-2xl bg-surface-inverted py-3 text-sm font-black text-text-inverted shadow-soft transition-all active:scale-[0.98]"
            >
                编辑今日记录
            </button>
        )}
      >
        {selectedTile?.key === 'menstrual' ? (
            <Suspense fallback={inlineLoader}>
                <ReproductivePanel date={todayLog.date} />
            </Suspense>
        ) : selectedTile && (
            <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-surface-border bg-surface-muted p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{selectedTile.label}</div>
                    <div className="mt-2 text-3xl font-black text-text-primary">{selectedTile.value}</div>
                    <div className="mt-2 text-sm font-bold text-text-muted">{selectedTile.status}</div>
                </div>
                <div className="space-y-2">
                    {selectedTile.details.map((detail) => (
                        <div key={`${selectedTile.key}-${detail.label}`} className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm">
                            <span className="font-bold text-text-muted">{detail.label}</span>
                            <span className="text-right font-black text-text-primary">{detail.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </BottomSheet>
      
      <Modal 
        isOpen={isSummaryModalOpen} 
        onClose={() => setIsSummaryModalOpen(false)} 
        title={undefined}
        footer={summaryLog && (
            <div className="flex gap-3 w-full px-2 pb-2">
                <button 
                    onClick={() => onDeleteRecord(summaryLog.date)}
                    className="p-5 bg-state-danger-bg text-state-danger-text rounded-full hover:bg-state-danger-bg/80 transition-colors active:scale-95"
                    title="删除记录"
                >
                    <Trash2 size={20}/>
                </button>
                <button 
                    onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} 
                    className="flex-1 py-5 bg-surface-inverted text-text-inverted font-black rounded-full shadow-soft active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <Edit3 size={20}/> 编辑详情
                </button>
            </div>
        )}
      >
        {summaryLog && (
            <div className="space-y-6 animate-in fade-in duration-slow min-h-[500px] flex flex-col -mt-4">
                {/* Custom Header from Screenshot */}
                <div className="flex justify-between items-center pb-2">
                    <button 
                        onClick={() => onNavigateDate(-1)}
                        className="p-2 hover:bg-surface-muted rounded-full transition-colors text-text-muted hover:text-accent"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex flex-col items-center text-center px-4 flex-1">
                        <h2 className="text-2xl font-black text-text-primary leading-tight">{diaryDateInfo.main}</h2>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">{diaryDateInfo.sub}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button 
                          onClick={() => onNavigateDate(1)}
                          className="p-2 hover:bg-surface-muted rounded-full transition-colors text-text-muted hover:text-accent"
                        >
                          <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs from Screenshot */}
                <div className="flex p-1 bg-surface-muted rounded-2xl shrink-0">
                    {[{ id: 'diary', label: '日记' }, { id: 'track', label: '轨迹' }, { id: 'source', label: '溯源' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveSummaryTab(tab.id as SummaryTab)} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeSummaryTab === tab.id ? 'bg-surface-card text-accent shadow-soft' : 'text-text-muted'}`}>{tab.label}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
                    {activeSummaryTab === 'diary' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-slow pb-10">
                            {(!summaryLog.updatedAt || summaryLog.updatedAt < 0) ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <Calendar size={48} className="mb-4 text-text-muted"/>
                                    <p className="text-sm font-bold">该日期暂无记录</p>
                                    <p className="text-[10px] mt-1">点击下方“编辑详情”开始记录</p>
                                </div>
                            ) : (
                                <>
                                    <SummarySection title="晨间生理反馈" icon={Zap} colorClass="text-state-warning-text">
                                        {summaryLog.morning?.wokeWithErection ? (
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-4xl font-black text-text-primary">{summaryLog.morning.hardness}级</span>
                                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">晨勃硬度评级</span>
                                                </div>
                                                <div className="bg-state-warning-bg/70 px-4 py-2 rounded-2xl border border-state-warning-text/25">
                                                    <span className="text-sm font-black text-state-warning-text">
                                                        {LABELS.retention[summaryLog.morning.retention || 'normal']}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : <div className="text-sm font-bold text-text-muted italic py-2">今晨未察觉到晨勃</div>}
                                    </SummarySection>

                                    <SummarySection title="睡眠报告" icon={Moon} colorClass="text-state-info-text">
                                        <div className="space-y-5">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-text-primary tracking-tight">
                                                    {calculateSleepDuration(summaryLog.sleep?.startTime, summaryLog.sleep?.endTime) || '--'}
                                                </span>
                                                <span className="text-[10px] font-black text-text-muted uppercase">总睡眠</span>
                                            </div>
                                            
                                            <div className="bg-surface-muted p-4 rounded-3xl border border-surface-border flex items-center justify-between shadow-inner">
                                                <div className="flex flex-col items-center flex-1">
                                                    <span className="text-[9px] font-black text-text-muted uppercase mb-1">入睡</span>
                                                    <span className="text-lg font-mono font-bold text-text-secondary">{formatTime(summaryLog.sleep?.startTime)}</span>
                                                </div>
                                                <div className="px-4">
                                                    <ArrowRight size={18} className="text-text-muted" />
                                                </div>
                                                <div className="flex flex-col items-center flex-1">
                                                    <span className="text-lg font-mono font-bold text-text-secondary">{formatTime(summaryLog.sleep?.endTime)}</span>
                                                    <span className="text-[9px] font-black text-text-muted uppercase mt-1">醒来</span>
                                                </div>
                                            </div>

                                            {summaryLog.sleep?.naps && summaryLog.sleep.naps.length > 0 && (
                                                <div className="pt-2 space-y-2">
                                                    {summaryLog.sleep.naps.map(nap => (
                                                        <div key={nap.id} className="flex justify-between items-center text-xs font-bold text-text-secondary bg-surface-muted p-3 rounded-2xl">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-state-warning-text"></div>
                                                                <span>午休 ({nap.startTime})</span>
                                                            </div>
                                                            <span className="text-text-muted">{nap.duration}分钟</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </SummarySection>

                                    <SummarySection title="活力记录" icon={Activity} colorClass="text-state-success-text">
                                        <div className="space-y-3">
                                            {summaryLog.exercise?.map((ex) => (
                                                <div key={ex.id} className={activityItemClass}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`${activityIconBaseClass} text-state-success-text`}><Dumbbell size={20}/></div>
                                                        <div>
                                                            <div className="text-sm font-black text-text-secondary">{ex.type}</div>
                                                            <div className="text-[10px] text-text-muted font-bold mt-0.5">{ex.startTime} · {ex.duration}分钟</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {summaryLog.sex?.map(s => (
                                                <div key={s.id} className={activityItemClass}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`${activityIconBaseClass} text-accent-vivid`}><Heart size={20} fill="currentColor" fillOpacity={0.2}/></div>
                                                        <div>
                                                            <div className="text-sm font-black text-text-secondary">{s.interactions?.[0]?.partner || '性爱记录'}</div>
                                                            <div className="text-[10px] text-text-muted font-bold mt-0.5">{s.startTime} · {s.duration}分钟</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {summaryLog.masturbation?.map(m => (
                                                <div key={m.id} className={activityItemClass}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`${activityIconBaseClass} text-accent`}><Hand size={20}/></div>
                                                        <div>
                                                            <div className="text-sm font-black text-text-secondary">自慰记录</div>
                                                            <div className="text-[10px] text-text-muted font-bold mt-0.5">{m.startTime} · {m.duration}分钟</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {summaryLog.alcoholRecords?.map(alc => (
                                                <div key={alc.id} className={activityItemClass}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`${activityIconBaseClass} text-state-warning-text`}><Beer size={20}/></div>
                                                        <div>
                                                            <div className="text-sm font-black text-text-secondary">饮酒 ({alc.totalGrams}g)</div>
                                                            <div className="text-[10px] text-text-muted font-bold mt-0.5">{alc.time} · {alc.items.map(i => i.name).join('+')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {(!summaryLog.exercise?.length && !summaryLog.sex?.length && !summaryLog.masturbation?.length && !summaryLog.alcoholRecords?.length) && (
                                                <div className="py-6 text-center text-[10px] text-text-muted font-bold uppercase tracking-widest italic opacity-40">
                                                    无活动记录
                                                </div>
                                            )}
                                        </div>
                                    </SummarySection>

                                    {(summaryLog.weather || summaryLog.location || (summaryLog.caffeineRecord?.items && summaryLog.caffeineRecord.items.length > 0) || (summaryLog.pornConsumption && summaryLog.pornConsumption !== 'none')) && (
                                        <SummarySection title="生活与环境" icon={CloudSun} colorClass="text-state-info-text">
                                            <div className="flex flex-wrap gap-3">
                                                {summaryLog.weather && (
                                                    <div className={summaryItemClass}>
                                                        <CloudSun size={18} className="text-state-info-text"/>
                                                        <span className="text-sm font-black text-text-secondary">{WEATHER_LABELS[summaryLog.weather] || summaryLog.weather}</span>
                                                    </div>
                                                )}
                                                {summaryLog.location && (
                                                    <div className={summaryItemClass}>
                                                        <MapPin size={18} className="text-state-success-text"/>
                                                        <span className="text-sm font-black text-text-secondary">{LOCATION_LABELS[summaryLog.location] || summaryLog.location}</span>
                                                    </div>
                                                )}
                                                {summaryLog.pornConsumption && summaryLog.pornConsumption !== 'none' && (
                                                    <div className={summaryItemClass}>
                                                        <Film size={18} className="text-accent-vivid"/>
                                                        <span className="text-sm font-black text-text-secondary">看片: {PORN_LABELS[summaryLog.pornConsumption] || summaryLog.pornConsumption}</span>
                                                    </div>
                                                )}
                                                {summaryLog.screenTime?.totalMinutes ? (
                                                    <div className={summaryItemClass}>
                                                        <BrainCircuit size={18} className="text-state-warning-text"/>
                                                        <span className="text-sm font-black text-text-secondary">屏幕时间: {Math.round(summaryLog.screenTime.totalMinutes / 60)}h</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                            {summaryLog.caffeineRecord?.items && summaryLog.caffeineRecord.items.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {summaryLog.caffeineRecord.items.map(item => (
                                                        <div key={item.id} className="flex items-center justify-between bg-surface-muted p-3 rounded-2xl border border-surface-border">
                                                            <div className="flex items-center gap-3">
                                                                <Coffee size={16} className="text-state-warning-text"/>
                                                                <span className="text-sm font-black text-text-secondary">{item.name}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-text-muted">{item.time} · {item.isDaily ? '全天' : `${item.volume}ml`}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </SummarySection>
                                    )}

                                    {(summaryLog.mood || summaryLog.stressLevel || summaryLog.health?.isSick || (summaryLog.supplements && summaryLog.supplements.length > 0) || summaryLog.menstrual) && (
                                        <SummarySection title="健康与情绪" icon={Smile} colorClass="text-chart-tertiary">
                                            <div className="flex flex-wrap gap-3">
                                                {summaryLog.mood && (
                                                    <div className={summaryItemClass}>
                                                        <Smile size={18} className="text-chart-tertiary"/>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-text-muted font-bold uppercase">心情</span>
                                                            <span className="text-sm font-black text-text-secondary">{MOOD_LABELS[summaryLog.mood] || summaryLog.mood}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryLog.stressLevel && (
                                                    <div className={summaryItemClass}>
                                                        <BrainCircuit size={18} className="text-state-warning-text"/>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-text-muted font-bold uppercase">压力</span>
                                                            <span className="text-sm font-black text-text-secondary">{summaryLog.stressLevel}级</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryLog.health?.isSick && (
                                                    <div className="flex items-center gap-2 bg-state-danger-bg p-3 rounded-2xl border border-state-danger-text/25 w-full">
                                                        <ShieldAlert size={18} className="text-state-danger-text"/>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-state-danger-text/75 font-bold uppercase">身体不适</span>
                                                            <span className="text-sm font-black text-state-danger-text">
                                                                {summaryLog.health.discomfortLevel === 'mild' ? '轻微' : summaryLog.health.discomfortLevel === 'moderate' ? '明显' : '很难受'}
                                                                {summaryLog.health.symptoms?.length ? ` · ${summaryLog.health.symptoms.join(', ')}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryLog.supplements && summaryLog.supplements.length > 0 && (
                                                    <div className="flex items-center gap-2 bg-state-success-bg p-3 rounded-2xl border border-state-success-text/25 w-full">
                                                        <Coffee size={18} className="text-state-success-text"/>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-state-success-text/75 font-bold uppercase">补剂</span>
                                                            <span className="text-sm font-black text-state-success-text">
                                                                {summaryLog.supplements.map(item => item.name).join('、')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryLog.menstrual && (
                                                    <div className="flex items-center gap-2 bg-chart-tertiary/10 p-3 rounded-2xl border border-chart-tertiary/25 w-full">
                                                        <Calendar size={18} className="text-chart-tertiary"/>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-chart-tertiary/75 font-bold uppercase">周期状态</span>
                                                            <span className="text-sm font-black text-chart-tertiary">
                                                                {summaryLog.menstrual.predictedPeriod
                                                                    ? '预计月经'
                                                                    : summaryLog.menstrual.predictedFertileWindow
                                                                        ? '预计窗口期'
                                                                        : summaryLog.menstrual.status === 'period'
                                                                            ? `经期中${summaryLog.menstrual.cycleDay ? ` · 第${summaryLog.menstrual.cycleDay}天` : ''}`
                                                                            : summaryLog.menstrual.status === 'fertile_window'
                                                                                ? '窗口期'
                                                                                : summaryLog.menstrual.status === 'none'
                                                                                    ? '非经期'
                                                                                    : '未记录'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </SummarySection>
                                    )}

                                    {(summaryLog.notes || (summaryLog.dailyEvents && summaryLog.dailyEvents.length > 0)) && (
                                        <SummarySection title="备注与事件" icon={StickyNote} colorClass="text-state-warning-text">
                                            {summaryLog.dailyEvents && summaryLog.dailyEvents.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {summaryLog.dailyEvents.map(evt => (
                                                        <span key={evt} className="px-3 py-1.5 bg-surface-muted text-text-secondary rounded-xl text-xs font-bold">
                                                            {evt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {summaryLog.notes && (
                                                <div className="bg-state-warning-bg/50 p-4 rounded-2xl border border-state-warning-text/20">
                                                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{summaryLog.notes}</p>
                                                </div>
                                            )}
                                        </SummarySection>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeSummaryTab === 'track' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-slow">
                            <Suspense fallback={inlineLoader}>
                                <GlobalTimeline log={summaryLog} allLogs={logs} />
                            </Suspense>
                        </div>
                    )}

                    {activeSummaryTab === 'source' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-slow pt-2">
                            <Suspense fallback={inlineLoader}>
                                <LogHistory log={summaryLog} />
                            </Suspense>
                        </div>
                    )}
                </div>
            </div>
        )}
      </Modal>

      <Modal 
        isOpen={!!taskToCancel} 
        onClose={() => setTaskToCancel(null)} 
        title="确认取消"
        footer={
            <div className="flex gap-3 w-full">
                <button onClick={() => setTaskToCancel(null)} className="flex-1 py-3 bg-surface-muted rounded-xl font-bold text-text-secondary">保留</button>
                <button onClick={onConfirmCancel} className="flex-1 py-3 bg-state-danger-bg text-state-danger-text rounded-xl font-bold shadow-soft">确认丢弃</button>
            </div>
        }
      >
        <p className="text-sm text-text-secondary">
            确定要取消并丢弃当前计时的记录吗？此操作无法撤销。
        </p>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={onConfirmDelete}
        title="删除当日记录"
        message={`确定要删除 ${dateToDelete} 的所有记录吗?删除后将无法找回。`}
        confirmLabel="删除"
      />
    </>
  );
};

export default Dashboard;
