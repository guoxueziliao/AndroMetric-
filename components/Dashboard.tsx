
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, NapRecord, AlcoholRecord } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { 
  Moon, Zap, Activity, Hand, HeartPulse, Clock, Dumbbell, Footprints, 
  Timer, CloudSun, Beer, TrendingUp, ShieldAlert, Edit3, Trash2, 
  FastForward, Coffee, Bed, ArrowRight, User, Heart, RotateCcw, 
  MapPin, Sparkles, Shirt, Star, Thermometer, BrainCircuit, Tag, 
  Film, Smile, AlertTriangle, ChevronRight, ChevronLeft, Calendar, Check, 
  AlertCircle, Sofa, X, MoreHorizontal, StickyNote
} from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import { formatTime, calculateSleepDuration, analyzeSleep, formatDateFriendly, LABELS } from '../utils/helpers';
import { hydrateLog } from '../utils/hydrateLog';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { LogHistory } from './LogHistory';
import { GlobalTimeline } from './GlobalTimeline';

interface DashboardProps {
  onEdit: (date: string) => void;
  onDateClick: (date: string) => void;
  onNavigateToBackup: () => void;
  onFinishExercise?: (record: ExerciseRecord) => void;
  onFinishMasturbation?: (record: MasturbationRecordDetails) => void;
  onFinishNap?: (record: NapRecord) => void;
  onFinishAlcohol?: (record: AlcoholRecord) => void;
}

type SummaryTab = 'diary' | 'track' | 'source';

const WEATHER_LABELS: Record<string, string> = { sunny: '晴', cloudy: '多云', rainy: '雨', snowy: '雪', windy: '大风', foggy: '雾' };
const LOCATION_LABELS: Record<string, string> = { home: '家', partner: '伴侣家', hotel: '酒店', travel: '旅途', other: '其他' };
const MOOD_LABELS: Record<string, string> = { happy: '开心', excited: '兴奋', neutral: '平静', anxious: '焦虑', sad: '低落', angry: '生气' };
const PORN_LABELS: Record<string, string> = { none: '无', low: '少量', medium: '适量', high: '沉迷' };

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onFinishMasturbation, onFinishNap, onFinishAlcohol }) => {
  const { logs: rawLogs, deleteLog, toggleNap, cancelOngoingNap, addOrUpdateLog, toggleSleepLog, cancelAlcoholRecord, cancelOngoingExercise, cancelOngoingMasturbation } = useData();
  const logs = useMemo(() => Array.isArray(rawLogs) ? rawLogs : [], [rawLogs]);
  const { showToast } = useToast();

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState<SummaryTab>('diary');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);
  const [taskToCancel, setTaskToCancel] = useState<'sleep' | 'nap' | 'mb' | 'exercise' | 'alcohol' | null>(null);

  const latestLog = useMemo(() => logs.length > 0 ? logs[0] : null, [logs]);
  const pendingLog = useMemo(() => logs.find(log => log.status === 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);
  const ongoingAlcohol = useMemo(() => logs.flatMap(l => l.alcoholRecords || []).find(r => r.ongoing), [logs]);

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

  const handleDateClickForSummary = (date: string) => {
    const log = logs.find(l => l.date === date);
    if (log) {
        if (log.status === 'pending') onEdit(log.date);
        else { 
          setSummaryLog(log); 
          setActiveSummaryTab('diary');
          setIsSummaryModalOpen(true); 
        }
    } else { 
        setSummaryLog(hydrateLog({ date }));
        setActiveSummaryTab('diary');
        setIsSummaryModalOpen(true);
    }
  };

  const handleNavigateDate = (direction: number) => {
    if (!summaryLog) return;
    const current = new Date(summaryLog.date + 'T12:00:00');
    current.setDate(current.getDate() + direction);
    const targetDateStr = current.toISOString().split('T')[0];
    
    const existing = logs.find(l => l.date === targetDateStr);
    setSummaryLog(existing || hydrateLog({ date: targetDateStr }));
  };

  const handleDeleteRecord = (date: string) => {
      setDateToDelete(date);
      setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
      if (dateToDelete) {
          await deleteLog(dateToDelete);
          setIsSummaryModalOpen(false);
          showToast('记录已成功删除', 'success');
      }
  };

  const handleRequestCancel = (type: 'sleep' | 'nap' | 'mb' | 'exercise' | 'alcohol') => {
      setTaskToCancel(type);
  };

  const confirmCancel = async () => {
      if (!taskToCancel) return;
      try {
          switch(taskToCancel) {
              case 'sleep': await toggleSleepLog(pendingLog || undefined); break;
              case 'nap': await cancelOngoingNap(); break;
              case 'mb': await cancelOngoingMasturbation(); break;
              case 'exercise': await cancelOngoingExercise(); break;
              case 'alcohol': await cancelAlcoholRecord(); break;
          }
          showToast('记录已取消', 'info');
      } catch (e) {
          showToast('取消失败', 'error');
      } finally {
          setTaskToCancel(null);
      }
  };

  const diaryDateInfo = useMemo(() => {
    if (!summaryLog) return { main: '', sub: '' };
    const d = new Date(summaryLog.date + 'T00:00:00');
    return {
      main: `${d.getMonth() + 1}月${d.getDate()}日`,
      sub: d.toLocaleDateString('zh-CN', { weekday: 'long' })
    };
  }, [summaryLog]);

  const SummarySection = ({ title, icon: Icon, children, colorClass = "text-slate-400" }: any) => (
      <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
              <Icon size={14} className={colorClass} />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
          </div>
          <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm space-y-4">
              {children}
          </div>
      </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end px-2">
            <div>
                <h1 className="text-3xl font-black tracking-tight dark:text-slate-100">{greeting}</h1>
                <p className="text-brand-muted text-sm font-medium">今天感觉如何？</p>
            </div>
        </div>

        {/* Ongoing Tasks Banners */}
        {(ongoingNap || ongoingExercise || ongoingMb || pendingLog || ongoingAlcohol) && (
            <section className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                {pendingLog && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center transform transition-transform hover:scale-[1.01]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Bed size={20}/></div>
                            <div>
                                <div className="font-bold text-sm">正在睡觉中...</div>
                                <div className="text-[10px] opacity-70">{formatTime(pendingLog.sleep?.startTime)} 开始</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleRequestCancel('sleep')} className="p-2 text-white/60 hover:text-white transition-colors"><X size={18}/></button>
                            <button onClick={() => onEdit(pendingLog.date)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all">醒了</button>
                        </div>
                    </div>
                )}
                {ongoingNap && (
                    <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center transform transition-transform hover:scale-[1.01]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Sofa size={20}/></div>
                            <div>
                                <div className="font-bold text-sm">正在午休中...</div>
                                <div className="text-[10px] opacity-70">{ongoingNap.startTime} 开始</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleRequestCancel('nap')} className="p-2 text-white/60 hover:text-white transition-colors"><X size={18}/></button>
                            <button onClick={() => onFinishNap?.(ongoingNap)} className="px-5 py-2 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all">醒了</button>
                        </div>
                    </div>
                )}
                {ongoingMb && (
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center transform transition-transform hover:scale-[1.01]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Hand size={20}/></div>
                            <div>
                                <div className="font-bold text-sm">正在施法中...</div>
                                <div className="text-[10px] opacity-70">{ongoingMb.startTime} 开始</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleRequestCancel('mb')} className="p-2 text-white/60 hover:text-white transition-colors"><X size={18}/></button>
                            <button onClick={() => onFinishMasturbation?.(ongoingMb)} className="px-5 py-2 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all">收工</button>
                        </div>
                    </div>
                )}
                {ongoingExercise && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center transform transition-transform hover:scale-[1.01]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Dumbbell size={20}/></div>
                            <div>
                                <div className="font-bold text-sm">正在{ongoingExercise.type}中...</div>
                                <div className="text-[10px] opacity-70">{ongoingExercise.startTime} 开始</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleRequestCancel('exercise')} className="p-2 text-white/60 hover:text-white transition-colors"><X size={18}/></button>
                            <button onClick={() => onFinishExercise?.(ongoingExercise)} className="px-5 py-2 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all">完成</button>
                        </div>
                    </div>
                )}
                {ongoingAlcohol && (
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center transform transition-transform hover:scale-[1.01]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Beer size={20}/></div>
                            <div>
                                <div className="font-bold text-sm">正在酒局中...</div>
                                <div className="text-[10px] opacity-70">{ongoingAlcohol.time} 开始</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleRequestCancel('alcohol')} className="p-2 text-white/60 hover:text-white transition-colors"><X size={18}/></button>
                            <button onClick={() => onFinishAlcohol?.(ongoingAlcohol)} className="px-5 py-2 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all">结算</button>
                        </div>
                    </div>
                )}
            </section>
        )}

        <CalendarHeatmap logs={logs} onDateClick={handleDateClickForSummary}>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-4 shadow-soft border border-slate-100 dark:border-white/5 flex flex-col h-60 transition-colors overflow-hidden">
                    <div className="flex justify-between items-center mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-500"><Moon size={14} fill="currentColor" fillOpacity={0.2}/></div>
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-300">7日睡眠流</span>
                        </div>
                        {(pendingLog || ongoingNap) && <span className="text-[9px] font-black text-emerald-500 animate-pulse">正在休息</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-2">
                        {last7Days.map(date => {
                            const log = logs.find(l => l.date === date);
                            const analysis = log?.sleep?.startTime && log?.sleep?.endTime ? analyzeSleep(log.sleep.startTime, log.sleep.endTime) : null;
                            const nocturnalHours = analysis?.durationHours || 0;
                            const totalNapMinutes = log?.sleep?.naps?.reduce((acc, n) => acc + (n.duration || 0), 0) || 0;
                            const napHours = totalNapMinutes / 60;
                            const totalHours = nocturnalHours + napHours;
                            const isToday = date === last7Days[0];
                            return (
                                <div key={date} className={`flex flex-col gap-1 p-1.5 rounded-xl transition-all ${isToday ? 'bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30' : 'border border-transparent'}`}>
                                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                        <span className="font-mono">{date.split('-').slice(1).join('/')}</span>
                                        <div className="flex gap-1">
                                            {analysis?.isLate && <span className="px-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">熬夜</span>}
                                            {analysis?.isInsufficient && <span className="px-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">不足</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                                            {nocturnalHours > 0 && <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (nocturnalHours / 12) * 100)}%` }}/>}
                                            {napHours > 0 && <div className="bg-orange-400 h-full border-l border-white/20" style={{ width: `${Math.min(100, (napHours / 12) * 100)}%` }}/>}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-600 dark:text-slate-300 w-8 text-right tabular-nums">{totalHours > 0 ? `${totalHours.toFixed(1)}h` : '--'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-5 shadow-soft border border-slate-100 dark:border-white/5 flex flex-col h-60 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-full text-orange-500"><Activity size={18}/></div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-300">活跃</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm"><span className="text-slate-400 font-bold">运动</span><span className="font-black text-slate-700 dark:text-slate-200 text-lg">{latestLog?.exercise?.length || 0}次</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-slate-400 font-bold">自慰</span><span className="font-black text-slate-700 dark:text-slate-200 text-lg">{latestLog?.masturbation?.length || 0}次</span></div>
                    </div>
                </div>
            </div>
        </CalendarHeatmap>
      </div>
      
      <Modal 
        isOpen={isSummaryModalOpen} 
        onClose={() => setIsSummaryModalOpen(false)} 
        title=""
        footer={summaryLog && (
            <div className="flex gap-3 w-full px-2 pb-2">
                <button 
                    onClick={() => handleDeleteRecord(summaryLog.date)}
                    className="p-5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full hover:bg-red-100 transition-colors active:scale-95"
                    title="删除记录"
                >
                    <Trash2 size={20}/>
                </button>
                <button 
                    onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} 
                    className="flex-1 py-5 bg-slate-100 dark:bg-white text-slate-900 font-black rounded-full shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <Edit3 size={20}/> 编辑详情
                </button>
            </div>
        )}
      >
        {summaryLog && (
            <div className="space-y-6 animate-in fade-in duration-300 min-h-[500px] flex flex-col -mt-4">
                {/* Custom Header from Screenshot */}
                <div className="flex justify-between items-center pb-2">
                    <button 
                        onClick={() => handleNavigateDate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-brand-accent"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex flex-col items-center text-center px-4 flex-1">
                        <h2 className="text-2xl font-black text-brand-text dark:text-slate-100 leading-tight">{diaryDateInfo.main}</h2>
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">{diaryDateInfo.sub}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleNavigateDate(1)} 
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-brand-accent"
                        >
                          <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs from Screenshot */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
                    {[{ id: 'diary', label: '日记' }, { id: 'track', label: '轨迹' }, { id: 'source', label: '溯源' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveSummaryTab(tab.id as SummaryTab)} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeSummaryTab === tab.id ? 'bg-white dark:bg-slate-700 text-brand-accent shadow-md' : 'text-slate-400'}`}>{tab.label}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
                    {activeSummaryTab === 'diary' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                            {(!summaryLog.updatedAt || summaryLog.updatedAt < 0) ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <Calendar size={48} className="mb-4 text-slate-300"/>
                                    <p className="text-sm font-bold">该日期暂无记录</p>
                                    <p className="text-[10px] mt-1">点击下方“编辑详情”开始记录</p>
                                </div>
                            ) : (
                                <>
                                    <SummarySection title="晨间生理反馈" icon={Zap} colorClass="text-amber-500">
                                        {summaryLog.morning?.wokeWithErection ? (
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{summaryLog.morning.hardness}级</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">晨勃硬度评级</span>
                                                </div>
                                                <div className="bg-amber-100/50 dark:bg-amber-900/30 px-4 py-2 rounded-2xl border border-amber-200/50 dark:border-amber-800/50">
                                                    <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                                                        {LABELS.retention[summaryLog.morning.retention || 'normal']}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : <div className="text-sm font-bold text-slate-400 italic py-2">今晨未察觉到晨勃</div>}
                                    </SummarySection>

                                    <SummarySection title="睡眠报告" icon={Moon} colorClass="text-blue-500">
                                        <div className="space-y-5">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                                    {calculateSleepDuration(summaryLog.sleep?.startTime, summaryLog.sleep?.endTime) || '--'}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">总睡眠</span>
                                            </div>
                                            
                                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-inner">
                                                <div className="flex flex-col items-center flex-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">入睡</span>
                                                    <span className="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">{formatTime(summaryLog.sleep?.startTime)}</span>
                                                </div>
                                                <div className="px-4">
                                                    <ArrowRight size={18} className="text-slate-300 dark:text-slate-700" />
                                                </div>
                                                <div className="flex flex-col items-center flex-1">
                                                    <span className="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">{formatTime(summaryLog.sleep?.endTime)}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase mt-1">醒来</span>
                                                </div>
                                            </div>

                                            {summaryLog.sleep?.naps && summaryLog.sleep.naps.length > 0 && (
                                                <div className="pt-2 space-y-2">
                                                    {summaryLog.sleep.naps.map(nap => (
                                                        <div key={nap.id} className="flex justify-between items-center text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                                                <span>午休 ({nap.startTime})</span>
                                                            </div>
                                                            <span className="text-slate-400">{nap.duration}分钟</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </SummarySection>

                                    <SummarySection title="活力记录" icon={Activity} colorClass="text-emerald-500">
                                        <div className="space-y-3">
                                            {summaryLog.exercise?.map((ex, i) => (
                                                <div key={ex.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl text-emerald-500 shadow-sm"><Dumbbell size={20}/></div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">{ex.type}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">{ex.startTime} · {ex.duration}分钟</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {summaryLog.sex?.map(s => (
                                                <div key={s.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl text-pink-500 shadow-sm"><Heart size={20} fill="currentColor" fillOpacity={0.2}/></div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">{s.interactions?.[0]?.partner || '性爱记录'}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">{s.startTime} · {s.duration}分钟</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {summaryLog.masturbation?.map(m => (
                                                <div key={m.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl text-blue-500 shadow-sm"><Hand size={20}/></div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">自慰记录</div>
                                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">{m.startTime} · {m.duration}分钟</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {summaryLog.alcoholRecords?.map(alc => (
                                                <div key={alc.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl text-amber-500 shadow-sm"><Beer size={20}/></div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">饮酒 ({alc.totalGrams}g)</div>
                                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">{alc.time} · {alc.items.map(i => i.name).join('+')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {(!summaryLog.exercise?.length && !summaryLog.sex?.length && !summaryLog.masturbation?.length && !summaryLog.alcoholRecords?.length) && (
                                                <div className="py-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-40">
                                                    无活动记录
                                                </div>
                                            )}
                                        </div>
                                    </SummarySection>

                                    {(summaryLog.weather || summaryLog.location || (summaryLog.caffeineRecord?.items && summaryLog.caffeineRecord.items.length > 0) || (summaryLog.pornConsumption && summaryLog.pornConsumption !== 'none')) && (
                                        <SummarySection title="生活与环境" icon={CloudSun} colorClass="text-sky-500">
                                            <div className="flex flex-wrap gap-3">
                                                {summaryLog.weather && (
                                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                                        <CloudSun size={18} className="text-sky-500"/>
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{WEATHER_LABELS[summaryLog.weather] || summaryLog.weather}</span>
                                                    </div>
                                                )}
                                                {summaryLog.location && (
                                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                                        <MapPin size={18} className="text-emerald-500"/>
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{LOCATION_LABELS[summaryLog.location] || summaryLog.location}</span>
                                                    </div>
                                                )}
                                                {summaryLog.pornConsumption && summaryLog.pornConsumption !== 'none' && (
                                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                                        <Film size={18} className="text-pink-500"/>
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">看片: {PORN_LABELS[summaryLog.pornConsumption] || summaryLog.pornConsumption}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {summaryLog.caffeineRecord?.items && summaryLog.caffeineRecord.items.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {summaryLog.caffeineRecord.items.map(item => (
                                                        <div key={item.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                                            <div className="flex items-center gap-3">
                                                                <Coffee size={16} className="text-orange-500"/>
                                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{item.name}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-400">{item.time} · {item.isDaily ? '全天' : `${item.volume}ml`}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </SummarySection>
                                    )}

                                    {(summaryLog.mood || summaryLog.stressLevel || summaryLog.health?.isSick) && (
                                        <SummarySection title="健康与情绪" icon={Smile} colorClass="text-purple-500">
                                            <div className="flex flex-wrap gap-3">
                                                {summaryLog.mood && (
                                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                                        <Smile size={18} className="text-purple-500"/>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">心情</span>
                                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">{MOOD_LABELS[summaryLog.mood] || summaryLog.mood}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryLog.stressLevel && (
                                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                                        <BrainCircuit size={18} className="text-orange-500"/>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">压力</span>
                                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">{summaryLog.stressLevel}级</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryLog.health?.isSick && (
                                                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-900/30 w-full">
                                                        <ShieldAlert size={18} className="text-red-500"/>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-red-400 font-bold uppercase">身体不适</span>
                                                            <span className="text-sm font-black text-red-700 dark:text-red-400">
                                                                {summaryLog.health.discomfortLevel === 'mild' ? '轻微' : summaryLog.health.discomfortLevel === 'moderate' ? '明显' : '很难受'}
                                                                {summaryLog.health.symptoms?.length ? ` · ${summaryLog.health.symptoms.join(', ')}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </SummarySection>
                                    )}

                                    {(summaryLog.notes || (summaryLog.dailyEvents && summaryLog.dailyEvents.length > 0)) && (
                                        <SummarySection title="备注与事件" icon={StickyNote} colorClass="text-yellow-500">
                                            {summaryLog.dailyEvents && summaryLog.dailyEvents.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {summaryLog.dailyEvents.map(evt => (
                                                        <span key={evt} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold">
                                                            {evt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {summaryLog.notes && (
                                                <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{summaryLog.notes}</p>
                                                </div>
                                            )}
                                        </SummarySection>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeSummaryTab === 'track' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <GlobalTimeline log={summaryLog} allLogs={logs} />
                        </div>
                    )}

                    {activeSummaryTab === 'source' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 pt-2">
                            <LogHistory log={summaryLog} />
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
                <button onClick={() => setTaskToCancel(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-300">保留</button>
                <button onClick={confirmCancel} className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-bold shadow-sm">确认丢弃</button>
            </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
            确定要取消并丢弃当前计时的记录吗？此操作无法撤销。
        </p>
      </Modal>

      <SafeDeleteModal 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        message={`确定要删除 ${dateToDelete} 的所有记录吗？删除后将无法找回。`}
      />
    </>
  );
};

export default Dashboard;
