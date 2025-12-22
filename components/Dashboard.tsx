
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, NapRecord, AlcoholRecord } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Zap, Activity, Hand, Clock, Dumbbell, Beer, Edit3, Trash2, Bed, User, ArrowRight, Sparkles, AlertTriangle, Sofa, X, Pill } from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import { formatTime, calculateSleepDuration, analyzeSleep, LABELS } from '../utils/helpers';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { LogHistory } from './LogHistory';
import { GlobalTimeline } from './GlobalTimeline';
import SupplementCycleBar from './SupplementCycleBar'; // 新增

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

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onFinishMasturbation, onFinishNap, onFinishAlcohol }) => {
  const { logs, deleteLog, cancelOngoingNap, toggleSleepLog, cancelAlcoholRecord, cancelOngoingExercise, cancelOngoingMasturbation, supplements } = useData();
  const { showToast } = useToast();

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState<SummaryTab>('diary');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);

  const latestLog = useMemo(() => logs.length > 0 ? logs[0] : null, [logs]);
  const pendingLog = useMemo(() => logs.find(log => log.status === 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);
  const ongoingAlcohol = useMemo(() => logs.flatMap(l => l.alcoholRecords || []).find(r => r.ongoing), [logs]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

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
    } else { onDateClick(date); }
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

  const handleCancelTask = async (type: 'sleep' | 'nap' | 'mb' | 'exercise' | 'alcohol') => {
      if (!confirm('确定要取消并丢弃当前计时的记录吗？')) return;
      try {
          switch(type) {
              case 'sleep': await toggleSleepLog(pendingLog || undefined); break;
              case 'nap': await cancelOngoingNap(); break;
              case 'mb': await cancelOngoingMasturbation(); break;
              case 'exercise': await cancelOngoingExercise(); break;
              case 'alcohol': await cancelAlcoholRecord(); break;
          }
          showToast('记录已取消', 'info');
      } catch (e) {
          showToast('取消失败', 'error');
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
          <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-3xl p-5 space-y-4">
              {children}
          </div>
      </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-end px-2">
            <div>
                <h1 className="text-3xl font-black tracking-tight dark:text-slate-100">{greeting}</h1>
                <p className="text-brand-muted text-sm font-medium">今天感觉如何？</p>
            </div>
            <div className="w-10 h-10 bg-brand-card dark:bg-slate-900 rounded-full shadow-sm flex items-center justify-center border border-slate-100 dark:border-white/5 transition-colors">
                <User size={20} className="text-brand-muted"/>
            </div>
        </div>

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
                            <button onClick={() => handleCancelTask('sleep')} className="p-2 text-white/60 hover:text-white transition-colors"><X size={18}/></button>
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
                            <button onClick={() => handleCancelTask('nap')} className="p-2 text-white/60 hover:text-white transition-colors"><X size={18}/></button>
                            <button onClick={() => onFinishNap?.(ongoingNap)} className="px-5 py-2 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all">醒了</button>
                        </div>
                    </div>
                )}
            </section>
        )}

        <CalendarHeatmap logs={logs} onDateClick={handleDateClickForSummary}>
            
            <SupplementCycleBar supplements={supplements} currentDate={todayStr} />

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-4 shadow-soft border border-slate-100 dark:border-white/5 flex flex-col h-60 transition-colors overflow-hidden">
                    <div className="flex justify-between items-center mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-500"><Moon size={14} fill="currentColor" fillOpacity={0.2}/></div>
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-300">7日睡眠流</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-2">
                        {last7Days.map(date => {
                            const log = logs.find(l => l.date === date);
                            const analysis = log?.sleep?.startTime && log?.sleep?.endTime ? analyzeSleep(log.sleep.startTime, log.sleep.endTime) : null;
                            const nocturnalHours = analysis?.durationHours || 0;
                            const totalNapMinutes = log?.sleep?.naps?.reduce((acc, n) => acc + (n.duration || 0), 0) || 0;
                            const totalHours = nocturnalHours + (totalNapMinutes / 60);
                            return (
                                <div key={date} className="flex flex-col gap-1 p-1.5 rounded-xl border border-transparent">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                        <span className="font-mono">{date.split('-').slice(1).join('/')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                                            {totalHours > 0 && <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (totalHours / 12) * 100)}%` }} />}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-600 dark:text-slate-300 w-8 text-right tabular-nums">
                                            {totalHours > 0 ? `${totalHours.toFixed(1)}h` : '--'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-5 shadow-soft border border-slate-100 dark:border-white/5 flex flex-col justify-between h-60 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-full text-orange-500"><Activity size={18}/></div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-300">活跃</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-400 font-bold">运动</span><span className="font-black text-slate-700 dark:text-slate-200">{latestLog?.exercise?.length || 0}次</span></div>
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-400 font-bold">自慰</span><span className="font-black text-slate-700 dark:text-slate-200">{latestLog?.masturbation?.length || 0}次</span></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Zap size={10} className="text-amber-500"/> 今日能量状态正常
                        </div>
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
            <div className="w-full px-2 pb-2">
                <button onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[2rem] font-black shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    <Edit3 size={20}/> 编辑详情
                </button>
            </div>
        )}
      >
        {summaryLog && (
            <div className="space-y-6 animate-in fade-in duration-300 min-h-[450px] flex flex-col -mt-4">
                <div className="flex justify-between items-start pb-2">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-black text-brand-text dark:text-slate-100 leading-tight">{diaryDateInfo.main}</h2>
                        <span className="text-sm font-bold text-brand-muted mt-1">{diaryDateInfo.sub}</span>
                    </div>
                    <button onClick={() => handleDeleteRecord(summaryLog.date)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors rounded-xl"><Trash2 size={20}/></button>
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
                    {[{ id: 'diary', label: '日记' }, { id: 'track', label: '轨迹' }, { id: 'source', label: '溯源' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveSummaryTab(tab.id as SummaryTab)} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeSummaryTab === tab.id ? 'bg-white dark:bg-slate-700 text-brand-accent shadow-md' : 'text-slate-400'}`}>{tab.label}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
                    {activeSummaryTab === 'diary' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                            {summaryLog.supplementIntake?.length > 0 && (
                                <SummarySection title="补剂摄入" icon={Pill} colorClass="text-indigo-500">
                                    <div className="flex flex-wrap gap-2">
                                        {summaryLog.supplementIntake.map(i => {
                                            const def = supplements.find(s => s.id === i.supplementId);
                                            return (
                                                <div key={i.supplementId} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: def?.color || '#ccc' }}></div>
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{def?.name || '未知补剂'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SummarySection>
                            )}
                            <SummarySection title="晨间生理反馈" icon={Zap} colorClass="text-amber-500">
                                {summaryLog.morning?.wokeWithErection ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{LABELS.hardness[summaryLog.morning.hardness || 3].split('(')[0]}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">晨勃硬度评级</span>
                                            </div>
                                            <div className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                                                <span className="text-xs font-black text-amber-700 dark:text-amber-400">{LABELS.retention[summaryLog.morning.retention || 'normal']}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : <div className="text-sm font-bold text-slate-400 italic py-2">今晨未察觉到晨勃</div>}
                            </SummarySection>
                        </div>
                    )}
                </div>
            </div>
        )}
      </Modal>

      <SafeDeleteModal isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={confirmDelete} message={`确定要删除 ${dateToDelete} 的所有记录吗？`} />
    </>
  );
};

export default Dashboard;
