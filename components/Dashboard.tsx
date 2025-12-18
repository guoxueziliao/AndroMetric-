
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, NapRecord, AlcoholRecord } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Zap, Activity, Hand, HeartPulse, Clock, Dumbbell, Footprints, Timer, CloudSun, Beer, TrendingUp, ShieldAlert, Edit3, Trash2, FastForward, Coffee, Bed, ArrowRight, User } from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import { formatTime, calculateSleepDuration, analyzeSleep } from '../utils/helpers';
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

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onFinishMasturbation, onFinishNap, onFinishAlcohol }) => {
  const { logs, deleteLog, toggleNap, cancelOngoingNap, addOrUpdateLog, toggleSleepLog } = useData();
  const { showToast } = useToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [isHistoryView, setIsHistoryView] = useState(false);
  
  // 恢复自慰的操作弹窗状态
  const [isMbActionModalOpen, setIsMbActionModalOpen] = useState(false);

  const latestLog = useMemo(() => logs.length > 0 ? logs[0] : null, [logs]);
  const pendingLog = useMemo(() => logs.find(log => log.status === 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);
  const ongoingAlcohol = useMemo(() => logs.find(l => l.alcoholRecord?.ongoing)?.alcoholRecord, [logs]);

  const greeting = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 5) return '夜深了';
      if (hour < 12) return '早上好';
      if (hour < 18) return '下午好';
      return '晚上好';
  }, []);

  const handleDeleteRequest = (date: string) => { setLogToDelete(date); setIsDeleteModalOpen(true); };
  const handleConfirmDelete = async () => { 
      if (logToDelete) { await deleteLog(logToDelete); showToast('记录已删除', 'success'); }
      setIsDeleteModalOpen(false); 
  };
  
  const handleDateClickForSummary = (date: string) => {
    const log = logs.find(l => l.date === date);
    if (log) {
        if (log.status === 'pending') onEdit(log.date);
        else { setSummaryLog(log); setIsSummaryModalOpen(true); setIsHistoryView(false); }
    } else { onDateClick(date); }
  };

  // 自慰快速结案逻辑
  const handleQuickFinishMb = async () => {
      if (!ongoingMb) return;
      const now = new Date();
      const [h, m] = ongoingMb.startTime!.split(':').map(Number);
      const startDate = new Date(); startDate.setHours(h); startDate.setMinutes(m);
      let duration = Math.round((now.getTime() - startDate.getTime()) / 60000);
      if (duration < 0) duration += 24 * 60;
      const parentLog = logs.find(l => l.masturbation?.some(r => r.id === ongoingMb.id));
      if (parentLog) {
          const updatedMb = parentLog.masturbation?.map(r => r.id === ongoingMb.id ? { ...r, status: 'completed' as const, duration, quickLog: true } : r);
          await addOrUpdateLog({ ...parentLog, masturbation: updatedMb });
          showToast(`已快速结案: ${duration}分钟`, 'success');
      }
      setIsMbActionModalOpen(false);
  };

  // 饮酒买单：直接打开 Modal 补全
  const handleSettleAlcohol = () => {
      if (ongoingAlcohol && onFinishAlcohol) {
          onFinishAlcohol(ongoingAlcohol);
      }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-end px-2">
            <div>
                <h1 className="text-3xl font-black tracking-tight">{greeting}</h1>
                <p className="text-brand-muted text-sm font-medium">今天感觉如何？</p>
            </div>
            <div className="w-10 h-10 bg-brand-card rounded-full shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <User size={20} className="text-brand-muted"/>
            </div>
        </div>

        {(ongoingNap || ongoingExercise || ongoingMb || pendingLog || ongoingAlcohol) && (
            <section className="space-y-3">
                {/* 睡眠横幅 - 还原样式 */}
                {pendingLog && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Bed size={20}/></div>
                            <div><div className="font-bold text-sm">正在睡觉中...</div></div>
                        </div>
                        <button onClick={() => onEdit(pendingLog.date)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-bold shadow-sm">醒了</button>
                    </div>
                )}
                
                {/* 饮酒横幅 - 按新要求：买单去 Modal */}
                {ongoingAlcohol && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Beer size={20}/></div>
                            <div><div className="font-bold text-sm">正在哈啤中...</div><div className="text-xs opacity-80">{ongoingAlcohol.startTime} 开始</div></div>
                        </div>
                        <button onClick={handleSettleAlcohol} className="px-5 py-2 bg-white text-amber-600 rounded-full text-xs font-bold shadow-sm">买单</button>
                    </div>
                )}

                {/* 自慰横幅 - 还原样式与操作 */}
                {ongoingMb && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Hand size={20}/></div>
                            <div><div className="font-bold text-sm">正在施法中...</div></div>
                        </div>
                        <button onClick={() => setIsMbActionModalOpen(true)} className="px-5 py-2 bg-white text-purple-600 rounded-full text-xs font-bold shadow-sm">完成</button>
                    </div>
                )}

                {/* 午休横幅 - 还原样式 */}
                {ongoingNap && (
                    <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><CloudSun size={20}/></div>
                            <div><div className="font-bold text-sm">正在午休中...</div></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => cancelOngoingNap()} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Trash2 size={16}/></button>
                            <button onClick={() => onFinishNap && onFinishNap(ongoingNap)} className="px-5 py-2 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm">醒了</button>
                        </div>
                    </div>
                )}
            </section>
        )}

        <CalendarHeatmap logs={logs} onDateClick={handleDateClickForSummary}>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white dark:bg-slate-900 rounded-card p-6 shadow-soft border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Moon size={16} /> 睡眠</h3>
                    <div className="text-2xl font-black">{latestLog?.sleep?.startTime ? calculateSleepDuration(latestLog.sleep.startTime, latestLog.sleep.endTime) || '记录中' : '未记录'}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-card p-6 shadow-soft border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Activity size={16} /> 活力</h3>
                    <div className="text-2xl font-black">{latestLog?.morning?.hardness || '—'}<span className="text-sm font-bold text-brand-muted ml-1">级</span></div>
                </div>
            </div>
        </CalendarHeatmap>
      </div>
      
      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="记录详情">
        {summaryLog && (
            <div className="space-y-4 pb-4">
                <GlobalTimeline log={summaryLog} />
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} className="px-6 py-2 bg-brand-accent text-white rounded-full font-bold">编辑详情</button>
                </div>
            </div>
        )}
      </Modal>

      {/* 还原自慰操作弹窗 */}
      <Modal isOpen={isMbActionModalOpen} onClose={() => setIsMbActionModalOpen(false)} title="施法结束">
          <div className="space-y-3 pb-2">
              <button onClick={handleQuickFinishMb} className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 p-4 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-full"><FastForward size={20} /></div><div><h4 className="font-bold">快速结案</h4><p className="text-xs text-slate-500">仅记录时间</p></div></div><ArrowRight size={18}/></button>
              <button onClick={() => { if(ongoingMb && onFinishMasturbation) onFinishMasturbation(ongoingMb); setIsMbActionModalOpen(false); }} className="w-full bg-slate-50 dark:bg-slate-800 border p-4 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-slate-200 rounded-full"><Edit3 size={20} /></div><div><h4 className="font-bold">补全详情</h4><p className="text-xs text-slate-500">记录素材、感受</p></div></div><ArrowRight size={18}/></button>
          </div>
      </Modal>
    </>
  );
};

export default Dashboard;
