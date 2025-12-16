
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Zap, Activity, Hand, HeartPulse, Clock, Dumbbell, Footprints, Timer, CloudSun, Swords, TrendingUp, Beer, Film, ChevronLeft, ChevronRight, MapPin, Target, Play, ShieldAlert, Edit3, Trash2, FastForward, Coffee, Bed, ArrowRight, User } from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import { formatTime, calculateSleepDuration, analyzeSleep } from '../utils/helpers';
import { getPrediction } from '../utils/alcoholHelpers';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { LogHistory } from './LogHistory';

interface DashboardProps {
  onEdit: (date: string) => void;
  onDateClick: (date: string) => void;
  onNavigateToBackup: () => void;
  onFinishExercise?: (record: ExerciseRecord) => void;
  onFinishMasturbation?: (record: MasturbationRecordDetails) => void;
}

const SleepWidget = ({ log }: { log?: LogEntry | null }) => {
    const sleep = log?.sleep;
    const duration = calculateSleepDuration(sleep?.startTime, sleep?.endTime);
    // Parse duration to hours for progress bar
    let durationHours = 0;
    if (duration) {
        const match = duration.match(/(\d+)小时/);
        if (match) durationHours = parseInt(match[1]);
    }
    const progress = Math.min(100, (durationHours / 8) * 100);
    const analysis = analyzeSleep(sleep?.startTime, sleep?.endTime);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-card p-6 shadow-soft border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-pastel-blue rounded-lg">
                            <Moon size={16} className="text-pastel-blue-text" fill="currentColor"/>
                        </div>
                        <h3 className="font-bold text-lg text-brand-text dark:text-slate-100">睡眠</h3>
                    </div>
                    <div className="flex gap-2 text-xs text-brand-muted font-medium">
                        <span>{sleep?.startTime ? formatTime(sleep.startTime) : '--:--'}</span>
                        <span>-</span>
                        <span>{sleep?.endTime ? formatTime(sleep.endTime) : '--:--'}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-brand-text dark:text-slate-100">
                        {durationHours}<span className="text-sm font-bold text-brand-muted ml-1">h</span>
                    </div>
                    <div className="text-xs text-brand-muted font-medium">Quality</div>
                </div>
            </div>

            {/* Visual Graph Area */}
            <div className="h-16 flex items-end gap-1 mb-4">
                {[40, 60, 45, 70, 50, 80, 65, 55, 40, 30].map((h, i) => (
                    <div key={i} className="flex-1 bg-pastel-blue dark:bg-slate-800 rounded-t-sm relative group">
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-brand-accent rounded-t-sm transition-all duration-1000 opacity-80" 
                            style={{ height: `${h}%` }}
                        ></div>
                    </div>
                ))}
            </div>

            {/* Footer Stats */}
            <div className="flex justify-between items-center relative z-10">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${analysis?.isLate ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                        <span className="text-xs font-bold text-slate-500">{analysis?.isLate ? '熬夜' : '作息'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span className="text-xs font-bold text-slate-500">深睡</span>
                    </div>
                </div>
                {sleep?.quality && (
                    <span className="text-xs font-bold bg-pastel-green text-pastel-green-text px-2 py-1 rounded-lg">
                        {sleep.quality >= 4 ? 'Good' : 'Avg'}
                    </span>
                )}
            </div>
        </div>
    );
};

const ActivityWidget = ({ log }: { log?: LogEntry | null }) => {
    const hasWorkout = log?.exercise && log.exercise.length > 0;
    const hasSex = log?.sex && log.sex.length > 0;
    const hasMb = log?.masturbation && log.masturbation.length > 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-card p-6 shadow-soft border border-slate-100 dark:border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             
             <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-pastel-orange rounded-lg">
                        <Activity size={16} className="text-pastel-orange-text"/>
                    </div>
                    <h3 className="font-bold text-lg text-brand-text dark:text-slate-100">活力</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    {hasWorkout || hasSex || hasMb ? 'Active' : 'Rest'}
                </span>
             </div>

             <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-orange-500 shadow-sm">
                            <Dumbbell size={16}/>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500">运动</div>
                            <div className="text-sm font-black text-brand-text dark:text-slate-200">
                                {hasWorkout ? `${log?.exercise?.length} Sets` : '0'}
                            </div>
                        </div>
                    </div>
                    {hasWorkout && <div className="text-xs font-bold text-green-500">Done</div>}
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-pink-500 shadow-sm">
                            <HeartPulse size={16}/>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500">释放</div>
                            <div className="text-sm font-black text-brand-text dark:text-slate-200">
                                {(log?.sex?.length || 0) + (log?.masturbation?.length || 0)} 次
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onFinishMasturbation }) => {
  const { logs, deleteLog, toggleNap, addOrUpdateLog } = useData();
  const { showToast } = useToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [isHistoryView, setIsHistoryView] = useState(false);
  
  // Masturbation Action Modal
  const [isMbActionModalOpen, setIsMbActionModalOpen] = useState(false);

  const completedLogs = useMemo(() => logs.filter(log => log.status !== 'pending'), [logs]);
  const sortedHistoryLogs = useMemo(() => [...completedLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [completedLogs]);
  const latestLog = useMemo(() => logs.length > 0 ? logs[0] : null, [logs]);
  const pendingLog = useMemo(() => logs.find(log => log.status === 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);

  const greeting = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 5) return '夜深了';
      if (hour < 12) return '早上好';
      if (hour < 18) return '下午好';
      return '晚上好';
  }, []);

  const handleDeleteRequest = (date: string) => { setLogToDelete(date); setIsDeleteModalOpen(true); };
  const handleConfirmDelete = async () => { 
      if (logToDelete) {
          try {
              await deleteLog(logToDelete);
              showToast('记录已删除', 'success');
          } catch (e: any) {
              showToast(e.message, 'error');
          }
      }
      setIsDeleteModalOpen(false); 
      setLogToDelete(null); 
  };
  
  const handleDateClickForSummary = (date: string) => {
    const log = logs.find(l => l.date === date);
    if (log) {
        if (log.status === 'pending') onEdit(log.date);
        else { setSummaryLog(log); setIsSummaryModalOpen(true); setIsHistoryView(false); }
    } else {
        onDateClick(date);
    }
  };

  const handleToggleNap = async () => {
      try {
          await toggleNap();
          showToast('午休状态已更新', 'success');
      } catch (e: any) {
          showToast(e.message, 'error');
      }
  };
  
  // --- Masturbation Actions ---
  const handleQuickFinishMb = async () => {
      if (!ongoingMb) return;
      const now = new Date();
      const [h, m] = ongoingMb.startTime.split(':').map(Number);
      const startDate = new Date(); startDate.setHours(h); startDate.setMinutes(m); startDate.setSeconds(0);
      let duration = Math.round((now.getTime() - startDate.getTime()) / 60000);
      if (duration < 0) duration += 24 * 60;
      if (duration === 0) duration = 1;

      // Find the log containing this record
      const parentLog = logs.find(l => l.masturbation?.some(r => r.id === ongoingMb.id));
      if (parentLog) {
          const updatedMb = parentLog.masturbation?.map(r => 
              r.id === ongoingMb.id 
              ? { ...r, status: 'completed' as const, duration, quickLog: true } 
              : r
          );
          await addOrUpdateLog({ ...parentLog, masturbation: updatedMb });
          showToast(`已快速记录: ${duration}分钟`, 'success');
      }
      setIsMbActionModalOpen(false);
  };

  const handleCancelMb = async () => {
      if (!ongoingMb) return;
      if (!confirm('确定要取消并删除这条开始记录吗？')) return;
      
      const parentLog = logs.find(l => l.masturbation?.some(r => r.id === ongoingMb.id));
      if (parentLog) {
          const updatedMb = parentLog.masturbation?.filter(r => r.id !== ongoingMb.id);
          await addOrUpdateLog({ ...parentLog, masturbation: updatedMb });
          showToast('记录已取消', 'info');
      }
      setIsMbActionModalOpen(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end px-2">
            <div>
                <h1 className="text-3xl font-black text-brand-text dark:text-slate-100 tracking-tight">{greeting}</h1>
                <p className="text-brand-muted dark:text-slate-400 text-sm font-medium">今天感觉如何？</p>
            </div>
            <div className="w-10 h-10 bg-brand-card rounded-full shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <User size={20} className="text-brand-muted"/>
            </div>
        </div>

        {/* Ongoing Tasks */}
        {(ongoingNap || ongoingExercise || ongoingMb || pendingLog) && (
            <section className="space-y-3">
                {pendingLog && !ongoingExercise && !ongoingNap && !ongoingMb && (
                    <div onClick={() => onEdit(pendingLog.date)} className="bg-pastel-orange dark:bg-orange-900/20 p-4 rounded-3xl border border-orange-100 dark:border-orange-900/50 flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-200">
                                <Bed size={20}/>
                            </div>
                            <div>
                                <h4 className="font-bold text-orange-900 dark:text-orange-100 text-sm">记录待完成</h4>
                                <p className="text-xs text-orange-700 dark:text-orange-300">昨晚的睡眠记录是空的</p>
                            </div>
                        </div>
                        <ArrowRight size={18} className="text-orange-400"/>
                    </div>
                )}
                
                {ongoingNap && (
                    <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-4 rounded-3xl shadow-lg shadow-orange-500/20 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm"><CloudSun size={20}/></div>
                            <div>
                                <div className="font-bold text-sm">午休中...</div>
                                <div className="text-xs opacity-90 font-mono">{ongoingNap.startTime} 开始</div>
                            </div>
                        </div>
                        <button onClick={handleToggleNap} className="px-4 py-2 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm">醒了</button>
                    </div>
                )}

                {ongoingMb && onFinishMasturbation && (
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm"><Hand size={20}/></div>
                            <div>
                                <div className="font-bold text-sm">施法中...</div>
                                <div className="text-xs opacity-90 font-mono">{ongoingMb.startTime} 开始</div>
                            </div>
                        </div>
                        <button onClick={() => setIsMbActionModalOpen(true)} className="px-4 py-2 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm">结束</button>
                    </div>
                )}
            </section>
        )}

        {/* Widgets Grid */}
        <div className="grid grid-cols-2 gap-4">
            <SleepWidget log={latestLog} />
            <ActivityWidget log={latestLog} />
        </div>

        {/* Calendar */}
        <section className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-soft border border-slate-100 dark:border-slate-800">
            <CalendarHeatmap logs={logs} onDateClick={handleDateClickForSummary} />
        </section>
      </div>
      
      {/* Modal Definitions (Summary, Actions, etc.) */}
      <Modal isOpen={isSummaryModalOpen} onClose={() => { setIsSummaryModalOpen(false); setIsHistoryView(false); }} title={isHistoryView ? "修改历史" : "记录详情"}>
        {summaryLog && (
            <div className="space-y-4 pb-4">
                {!isHistoryView && (
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-black text-2xl text-brand-text dark:text-slate-200">{new Date(summaryLog.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setIsHistoryView(true)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><Clock size={18}/></button>
                            <button onClick={() => { setIsSummaryModalOpen(false); handleDeleteRequest(summaryLog.date); }} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500"><Trash2 size={18}/></button>
                        </div>
                    </div>
                )}
                
                {isHistoryView ? <LogHistory log={summaryLog} /> : (
                    // Simple Summary View (Can be elaborate)
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                        {/* Reuse the helper to generate text, or build a custom UI here */}
                        {/* For brevity, using the text generator logic or custom */}
                        <div className="space-y-4">
                            {summaryLog.morning?.wokeWithErection && (
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">晨勃</div>
                                    <div className="flex items-center gap-2">
                                        <Zap size={16} className="text-brand-accent"/>
                                        <span className="font-bold">Level {summaryLog.morning.hardness}</span>
                                    </div>
                                </div>
                            )}
                            {/* ... more details ... */}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                            <button onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} className="px-6 py-2 bg-brand-accent text-white rounded-full font-bold shadow-md hover:bg-blue-600 transition-colors">
                                编辑详情
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
        <SafeDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} message="确认要删除这一整天的记录吗？"/>
      </Modal>

      {/* Masturbation Action Modal */}
      <Modal isOpen={isMbActionModalOpen} onClose={() => setIsMbActionModalOpen(false)} title="施法结束">
          <div className="space-y-3 pb-2">
              <p className="text-sm text-center text-slate-500 mb-4">辛苦了！请选择如何记录本次施法。</p>
              
              <button onClick={handleQuickFinishMb} className="w-full bg-pastel-blue dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex items-center justify-between group hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
                          <FastForward size={20} />
                      </div>
                      <div className="text-left">
                          <h4 className="font-bold text-brand-text dark:text-slate-200">快速结案</h4>
                          <p className="text-xs text-slate-500">仅记录时间，跳过详情</p>
                      </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-500"/>
              </button>

              <button 
                onClick={() => { 
                    if (ongoingMb && onFinishMasturbation) onFinishMasturbation(ongoingMb); 
                    setIsMbActionModalOpen(false); 
                }} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                          <Edit3 size={20} />
                      </div>
                      <div className="text-left">
                          <h4 className="font-bold text-brand-text dark:text-slate-200">补全详情</h4>
                          <p className="text-xs text-slate-500">记录素材、感受与评价</p>
                      </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-brand-accent"/>
              </button>

              <button onClick={handleCancelMb} className="w-full mt-4 py-3 text-red-500 dark:text-red-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                  <Trash2 size={16} /> 放弃 / 删除记录
              </button>
          </div>
      </Modal>
    </>
  );
};

export default Dashboard;
