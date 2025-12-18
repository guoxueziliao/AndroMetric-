
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, NapRecord, AlcoholRecord } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Zap, Activity, Hand, HeartPulse, Clock, Dumbbell, Footprints, Timer, CloudSun, Beer, TrendingUp, ShieldAlert, Edit3, Trash2, FastForward, Coffee, Bed, ArrowRight, User, Heart } from 'lucide-react';
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
  const { logs, deleteLog, toggleNap, cancelOngoingNap, addOrUpdateLog, toggleSleepLog, cancelAlcoholRecord } = useData();
  const { showToast } = useToast();

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  
  // 自慰操作弹窗
  const [isMbActionModalOpen, setIsMbActionModalOpen] = useState(false);

  // 状态提取
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

  const handleDateClickForSummary = (date: string) => {
    const log = logs.find(l => l.date === date);
    if (log) {
        if (log.status === 'pending') onEdit(log.date);
        else { setSummaryLog(log); setIsSummaryModalOpen(true); }
    } else { onDateClick(date); }
  };

  // --- 取消/删除逻辑 ---
  const handleCancelSleep = async () => {
      if (!pendingLog) return;
      if (confirm('确定要取消本次睡眠记录吗？')) {
          await deleteLog(pendingLog.date);
          showToast('睡眠记录已取消', 'info');
      }
  };

  const handleCancelExercise = async () => {
      if (!ongoingExercise) return;
      if (confirm('确定要取消本次运动计时吗？')) {
          const parentLog = logs.find(l => l.exercise?.some(e => e.id === ongoingExercise.id));
          if (parentLog) {
              await addOrUpdateLog({ ...parentLog, exercise: parentLog.exercise?.filter(e => e.id !== ongoingExercise.id) });
              showToast('运动已取消', 'info');
          }
      }
  };

  const handleCancelMb = async () => {
      if (!ongoingMb) return;
      if (confirm('确定要取消本次施法计时吗？')) {
          const parentLog = logs.find(l => l.masturbation?.some(m => m.id === ongoingMb.id));
          if (parentLog) {
              await addOrUpdateLog({ ...parentLog, masturbation: parentLog.masturbation?.filter(m => m.id !== ongoingMb.id) });
              showToast('施法已取消', 'info');
          }
      }
  };

  const handleCancelAlcohol = async () => {
      if (confirm('确定要放弃本次酒局计时吗？')) {
          await cancelAlcoholRecord();
          showToast('已放弃记录', 'info');
      }
  };

  // --- 完成/保存逻辑 ---
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

  // 渲染睡眠状态卡片数据
  const sleepStats = useMemo(() => {
    if (!latestLog?.sleep?.startTime || !latestLog?.sleep?.endTime) return null;
    const analysis = analyzeSleep(latestLog.sleep.startTime, latestLog.sleep.endTime);
    const durationStr = calculateSleepDuration(latestLog.sleep.startTime, latestLog.sleep.endTime) || '';
    const hours = durationStr.split('小时')[0].trim();
    return {
        hours,
        start: formatTime(latestLog.sleep.startTime),
        end: formatTime(latestLog.sleep.endTime),
        isLate: analysis?.isLate,
        isGood: (latestLog.sleep.quality || 0) >= 4
    };
  }, [latestLog]);

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
            <section className="space-y-3">
                {pendingLog && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Bed size={20}/></div>
                            <div>
                                <div className="font-bold text-sm">正在睡觉中...</div>
                                <div className="text-[10px] opacity-70">{formatTime(pendingLog.sleep?.startTime)} 开始</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCancelSleep} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Trash2 size={16}/></button>
                            <button onClick={() => onEdit(pendingLog.date)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-bold shadow-sm active:scale-95">醒了</button>
                        </div>
                    </div>
                )}
                {ongoingExercise && (
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-700 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Dumbbell size={20}/></div>
                            <div><div className="font-bold text-sm">正在{ongoingExercise.type}...</div><div className="text-[10px] opacity-70">{ongoingExercise.startTime} 开始</div></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCancelExercise} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Trash2 size={16}/></button>
                            <button onClick={() => onFinishExercise && onFinishExercise(ongoingExercise)} className="px-5 py-2 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm active:scale-95">结束</button>
                        </div>
                    </div>
                )}
                {ongoingAlcohol && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Beer size={20}/></div>
                            <div><div className="font-bold text-sm">正在哈啤中...</div><div className="text-[10px] opacity-70">{ongoingAlcohol.startTime} 开始</div></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCancelAlcohol} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Trash2 size={16}/></button>
                            <button onClick={() => onFinishAlcohol && onFinishAlcohol(ongoingAlcohol)} className="px-5 py-2 bg-white text-amber-600 rounded-full text-xs font-bold shadow-sm active:scale-95">买单</button>
                        </div>
                    </div>
                )}
                {ongoingMb && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Hand size={20}/></div>
                            <div><div className="font-bold text-sm">正在施法中...</div><div className="text-[10px] opacity-70">{ongoingMb.startTime} 开始</div></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCancelMb} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Trash2 size={16}/></button>
                            <button onClick={() => setIsMbActionModalOpen(true)} className="px-5 py-2 bg-white text-purple-600 rounded-full text-xs font-bold shadow-sm active:scale-95">完成</button>
                        </div>
                    </div>
                )}
                {ongoingNap && (
                    <div className="bg-gradient-to-r from-orange-400 to-amber-500 dark:from-orange-500 dark:to-amber-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><CloudSun size={20}/></div>
                            <div><div className="font-bold text-sm">正在午休中...</div><div className="text-[10px] opacity-70">{ongoingNap.startTime} 开始</div></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => cancelOngoingNap()} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Trash2 size={16}/></button>
                            <button onClick={() => onFinishNap && onFinishNap(ongoingNap)} className="px-5 py-2 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm active:scale-95">醒了</button>
                        </div>
                    </div>
                )}
            </section>
        )}

        <CalendarHeatmap logs={logs} onDateClick={handleDateClickForSummary}>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white dark:bg-slate-900/40 dark:backdrop-blur-md rounded-3xl p-5 shadow-soft dark:shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-between h-40 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-full text-blue-500 dark:text-blue-400"><Moon size={18} fill="currentColor" fillOpacity={0.2}/></div>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-300">睡眠</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{sleepStats?.hours || (pendingLog ? '记' : '未')}</span>
                            <span className="text-xs font-bold text-slate-400 ml-0.5">{pendingLog ? '录中' : 'h'}</span>
                        </div>
                    </div>
                    
                    <div className="text-xs font-medium text-slate-400 font-mono">
                        {sleepStats ? `${sleepStats.start} - ${sleepStats.end}` : '--:-- - --:--'}
                    </div>

                    <div className="flex gap-2 mt-2">
                        <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${sleepStats?.isLate ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                            <span className="text-[10px] font-bold text-slate-400">熬夜</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                            <span className="text-[10px] font-bold text-slate-400">深睡</span>
                        </div>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${sleepStats?.isGood ? 'bg-green-50 dark:bg-green-500/10' : ''}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${sleepStats?.isGood ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                            <span className={`text-[10px] font-bold ${sleepStats?.isGood ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>安睡</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 dark:backdrop-blur-md rounded-3xl p-5 shadow-soft dark:shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-between h-40 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-full text-orange-500 dark:text-orange-400"><Activity size={18}/></div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-300">活力</span>
                    </div>

                    <div className="space-y-2">
                        <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-all">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-orange-500 dark:text-orange-400"><Dumbbell size={14}/></div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">运动</span>
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                {latestLog?.exercise && latestLog.exercise.length > 0 ? '已记录' : '无'}
                            </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-all">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-pink-500 dark:text-pink-400"><Heart size={14} fill="currentColor" fillOpacity={0.2}/></div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">释放</span>
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                {(latestLog?.sex?.length || 0) + (latestLog?.masturbation?.length || 0) > 0 ? '已释放' : '无'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </CalendarHeatmap>
      </div>
      
      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="记录详情">
        {summaryLog && (
            <div className="space-y-4 pb-4">
                <GlobalTimeline log={summaryLog} />
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} className="px-6 py-2 bg-brand-accent text-white rounded-full font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all">编辑详情</button>
                </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={isMbActionModalOpen} onClose={() => setIsMbActionModalOpen(false)} title="施法结束">
          <div className="space-y-3 pb-2">
              <button onClick={handleQuickFinishMb} className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-700"><FastForward size={20} /></div>
                      <div className="text-left"><h4 className="font-bold text-brand-text dark:text-slate-200">快速结案</h4><p className="text-xs text-slate-500 dark:text-slate-400">仅记录时长</p></div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 dark:text-slate-600"/>
              </button>
              <button onClick={() => { if(ongoingMb && onFinishMasturbation) onFinishMasturbation(ongoingMb); setIsMbActionModalOpen(false); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"><Edit3 size={20} /></div>
                      <div className="text-left"><h4 className="font-bold text-brand-text dark:text-slate-200">补全详情</h4><p className="text-xs text-slate-500 dark:text-slate-400">记录素材、体感、评价</p></div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 dark:text-slate-600"/>
              </button>
          </div>
      </Modal>
    </>
  );
};

export default Dashboard;
