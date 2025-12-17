
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, MasturbationRecordDetails, NapRecord, SexRecordDetails } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Hand, CloudSun, Heart, StopCircle, X, Dumbbell, User, Clock, Route, Edit3, Trash2, Activity, Zap, SunMedium, FileText, Fingerprint, Beer, BedDouble } from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import { formatTime, calculateSleepDuration, analyzeSleep, LABELS, getTodayDateString } from '../utils/helpers';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { LogHistory } from './LogHistory';
import { GlobalTimeline } from './GlobalTimeline';

interface DashboardProps {
  onEdit: (date: string) => void;
  onDateClick: (date: string) => void;
  onNavigateToBackup: () => void;
  onFinishExercise?: (record: ExerciseRecord) => void;
  onCancelExercise?: () => void;
  onFinishMasturbation?: (record: MasturbationRecordDetails) => void;
  onCancelMasturbation?: () => void;
  onEditAlcohol?: () => void;
  onCancelAlcohol?: () => void;
  onWakeUp?: () => void;
  onCancelSleep?: () => void;
  onFinishNap?: (nap: NapRecord) => void;
  onCancelNap?: (id: string) => void;
  onFinishSex?: (record: SexRecordDetails) => void;
  onCancelSex?: () => void;
}

const DailyReportCard: React.FC<{ log: LogEntry }> = ({ log }) => {
    const Row = ({ label, children, isLast = false }: { label: string, children: React.ReactNode, isLast?: boolean }) => (
        <div className={`flex items-start py-3 ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
            <span className="w-20 shrink-0 text-xs font-bold text-slate-400 pt-0.5">{label}</span>
            <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">{children}</div>
        </div>
    );
    const Tag = ({ text, type = 'gray' }: { text: string, type?: 'gray' | 'yellow' | 'red' | 'green' | 'blue' | 'purple' }) => {
        const styles = { gray: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' };
        return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${styles[type]}`}>{text}</span>;
    };
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <Row label="晨勃情况">
                {log.morning?.wokeWithErection ? (<div><div className="flex items-center flex-wrap gap-2"><span>硬度: {LABELS.hardness[log.morning.hardness || 3]}</span><span className="text-slate-300">|</span><span>维持: {LABELS.retention[log.morning.retention || 'normal']}</span></div>{log.morning.wokenByErection && <div className="mt-1"><Tag text="被晨勃弄醒" type="yellow"/></div>}</div>) : (<span className="text-slate-400 italic">无晨勃记录</span>)}
            </Row>
            <Row label="睡眠周期">
                {log.sleep?.startTime ? (<div><div className="flex items-center gap-1 font-mono">{formatTime(log.sleep.startTime)} - {formatTime(log.sleep.endTime) || '???'} {log.sleep.endTime && <span className="text-slate-400 text-xs ml-1">({calculateSleepDuration(log.sleep.startTime, log.sleep.endTime)})</span>}</div><div className="mt-1 flex flex-wrap gap-2">{analyzeSleep(log.sleep.startTime, log.sleep.endTime)?.isLate && <Tag text="熬夜" type="yellow"/>}{analyzeSleep(log.sleep.startTime, log.sleep.endTime)?.isInsufficient && <Tag text="睡眠不足" type="red"/>}{log.sleep.hasDream && <Tag text={`梦: ${log.sleep.dreamTypes?.join(',') || '有'}`} type="purple"/>}</div></div>) : (<span className="text-slate-400 italic">未记录</span>)}
                {log.sleep?.naps && log.sleep.naps.length > 0 && (<div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800"><div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center"><CloudSun size={10} className="mr-1"/> 午休 / 小憩</div><div className="space-y-2">{log.sleep.naps.map((nap, i) => (<div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-xs"><div className="flex justify-between items-center mb-1"><span className="font-mono font-bold text-brand-text dark:text-slate-200">{nap.startTime} <span className="text-slate-300 px-1">-</span> {nap.endTime || '进行中'}</span><span className="font-bold text-amber-600 dark:text-amber-400">{nap.duration}m</span></div></div>))}</div></div>)}
            </Row>
            <Row label="身心环境"><div className="space-y-1">天气: {LABELS.weather[log.weather || 'sunny']} | 地点: {LABELS.location[log.location || 'home']}</div></Row>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onCancelExercise, onFinishMasturbation, onCancelMasturbation, onEditAlcohol, onCancelAlcohol, onWakeUp, onCancelSleep, onFinishNap, onCancelNap, onFinishSex, onCancelSex }) => {
  const { logs, deleteLog } = useData();
  const { showToast } = useToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'diary' | 'track' | 'trace'>('diary');
  
  // 6路并发横幅状态监测 (核心修复点)
  const ongoingAlcohol = useMemo(() => logs.find(l => l.alcoholRecord?.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingSleep = useMemo(() => logs.find(l => l.sleep?.startTime && !l.sleep?.endTime), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingSex = useMemo(() => logs.flatMap(l => l.sex || []).find(s => s.ongoing), [logs]);

  const todayStr = getTodayDateString();
  const greeting = useMemo(() => { const hour = new Date().getHours(); if (hour < 5) return '夜深了'; if (hour < 12) return '早上好'; if (hour < 18) return '下午好'; return '晚上好'; }, []);

  // 统计逻辑修正：确保包含进行中的项，不让显示为 0
  const activityStats = useMemo(() => {
      const totalMb = logs.reduce((acc, l) => acc + (l.masturbation?.length || 0), 0);
      const totalSex = logs.reduce((acc, l) => acc + (l.sex?.length || 0), 0);
      return { totalMb, totalSex };
  }, [logs]);

  const handleDateClickForSummary = (date: string) => { const log = logs.find(l => l.date === date); if (log) { if (log.status === 'pending' && date !== todayStr) { onEdit(log.date); } else { setSummaryLog(log); setActiveSummaryTab('diary'); setIsSummaryModalOpen(true); } } else { onDateClick(date); } };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-brand-text dark:text-slate-100 flex items-center">{greeting} <span className="text-2xl ml-2">👋</span></h1>
          <p className="text-sm text-brand-muted font-medium mt-1">今天也要保持好状态</p>
        </div>
        <button onClick={onNavigateToBackup} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-105 transition-transform"><User size={24} className="text-brand-accent"/></button>
      </div>

      {/* --- 全能横幅系统 (6路) --- */}
      <div className="flex flex-col gap-3">
          {ongoingSleep && (
              <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={onWakeUp}>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse"><BedDouble size={20}/></div>
                      <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">正在睡觉</div>
                          <div className="text-lg font-black truncate">记录中... <span className="ml-1 font-mono text-sm opacity-60">{formatTime(ongoingSleep.sleep?.startTime || '')} 睡下</span></div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onCancelSleep?.(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); onWakeUp?.(); }} className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center shrink-0"><SunMedium size={16} className="mr-1.5"/>醒了</button>
                  </div>
              </div>
          )}

          {ongoingSex && (
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-pink-500/30 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onFinishSex?.(ongoingSex)}>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse"><Heart size={20} fill="currentColor"/></div>
                      <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">正在进行</div>
                          <div className="text-lg font-black truncate">性爱中... <span className="ml-2 font-mono text-sm opacity-80">{ongoingSex.startTime} 开始</span></div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onCancelSex?.(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80"><X size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); onFinishSex?.(ongoingSex); }} className="bg-white text-pink-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center shrink-0"><StopCircle size={16} className="mr-1.5"/>完成</button>
                  </div>
              </div>
          )}

          {ongoingNap && (
              <div className="bg-amber-600 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/30 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onFinishNap?.(ongoingNap)}>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse"><CloudSun size={20}/></div>
                      <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">正在午休</div>
                          <div className="text-lg font-black truncate">计时中... <span className="ml-1 font-mono text-sm opacity-60">{ongoingNap.startTime} 开始</span></div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onCancelNap?.(ongoingNap.id); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); onFinishNap?.(ongoingNap); }} className="bg-white text-amber-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center shrink-0"><StopCircle size={16} className="mr-1.5"/>结束</button>
                  </div>
              </div>
          )}

          {ongoingAlcohol && (
              <div className="bg-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/30 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={onEditAlcohol}>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse"><Beer size={20} fill="currentColor"/></div>
                      <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">正在进行</div>
                          <div className="text-lg font-black truncate">饮酒中... <span className="ml-2 font-mono text-sm opacity-80">{ongoingAlcohol.alcoholRecord?.startTime} 开始</span></div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onCancelAlcohol?.(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80"><X size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); onEditAlcohol?.(); }} className="bg-white text-amber-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center shrink-0"><StopCircle size={16} className="mr-1.5"/>完成</button>
                  </div>
              </div>
          )}

          {ongoingMb && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/30 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onFinishMasturbation?.(ongoingMb)}>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse"><Hand size={20} fill="currentColor"/></div>
                      <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">正在进行</div>
                          <div className="text-lg font-black truncate">自慰中... <span className="ml-2 font-mono text-sm opacity-80">{ongoingMb.startTime} 开始</span></div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onCancelMasturbation?.(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80"><X size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); onFinishMasturbation?.(ongoingMb); }} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center shrink-0"><StopCircle size={16} className="mr-1.5"/>详情</button>
                  </div>
              </div>
          )}

          {ongoingExercise && (
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/30 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onFinishExercise?.(ongoingExercise)}>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse"><Dumbbell size={20}/></div>
                      <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">正在进行</div>
                          <div className="text-lg font-black truncate">{ongoingExercise.type} <span className="ml-2 font-mono text-sm opacity-80">{ongoingExercise.startTime} 开始</span></div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onCancelExercise?.(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80"><X size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); onFinishExercise?.(ongoingExercise); }} className="bg-white text-orange-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center shrink-0"><StopCircle size={16} className="mr-1.5"/>完成</button>
                  </div>
              </div>
          )}
      </div>

      {/* 主日历卡片 - 确保包含今日正在计时的记录 */}
      <div className="bg-brand-card dark:bg-slate-900 rounded-3xl p-4 shadow-soft border border-slate-100 dark:border-slate-800 mb-6">
        <CalendarHeatmap logs={logs.filter(l => l.status === 'completed' || l.date === todayStr)} onDateClick={handleDateClickForSummary} />
      </div>

      {/* 核心统计卡片 - 实时更新数字 */}
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 h-28 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div><span className="text-xs font-bold text-slate-500 block mb-1">自慰次数</span><div className="text-2xl font-black text-purple-400">{activityStats.totalMb}<span className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-0.5">次</span></div></div>
                  <Hand size={16} className="text-purple-500 opacity-50"/>
              </div>
              <div className="text-[10px] text-slate-400 font-medium italic opacity-70">累计包含计时项</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 h-28 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div><span className="text-xs font-bold text-slate-500 block mb-1">性爱次数</span><div className="text-2xl font-black text-pink-400">{activityStats.totalSex}<span className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-0.5">次</span></div></div>
                  <Heart size={16} className="text-pink-500 opacity-50"/>
              </div>
              <div className="text-[10px] text-slate-400 font-medium italic opacity-70">累计包含计时项</div>
          </div>
      </div>

      <Modal isOpen={isSummaryModalOpen} onClose={() => { setIsSummaryModalOpen(false); setSummaryLog(null); }} title="" footer={null}>
          {summaryLog && (
              <div className="pb-6">
                  <div className="flex justify-between items-end mb-6 px-1"><div><h2 className="text-3xl font-black text-brand-text dark:text-slate-100 tracking-tighter">{new Date(summaryLog.date).getMonth() + 1}月{new Date(summaryLog.date).getDate()}日</h2><p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(summaryLog.date).toLocaleDateString('zh-CN', { weekday: 'long' })}</p></div></div>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                      <button onClick={() => setActiveSummaryTab('diary')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${activeSummaryTab === 'diary' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}>日记</button>
                      <button onClick={() => setActiveSummaryTab('track')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${activeSummaryTab === 'track' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}>轨迹</button>
                      <button onClick={() => setActiveSummaryTab('trace')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${activeSummaryTab === 'trace' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}>溯源</button>
                  </div>
                  {activeSummaryTab === 'diary' && (<div className="space-y-6 animate-in fade-in slide-in-from-left-4"><DailyReportCard log={summaryLog} /><button onClick={() => { onEdit(summaryLog.date); setIsSummaryModalOpen(false); }} className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl flex items-center justify-center shadow-lg"><Edit3 size={18} className="mr-2"/> 编辑详情</button></div>)}
                  {activeSummaryTab === 'track' && (<div className="animate-in fade-in slide-in-from-right-4"><GlobalTimeline log={summaryLog} /></div>)}
                  {activeSummaryTab === 'trace' && (<div className="animate-in fade-in slide-in-from-right-4"><LogHistory log={summaryLog} /></div>)}
              </div>
          )}
      </Modal>

      <SafeDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={async () => { if (logToDelete) { await deleteLog(logToDelete); showToast('记录已删除', 'success'); setIsDeleteModalOpen(false); } }} />
    </div>
  );
};

export default Dashboard;
