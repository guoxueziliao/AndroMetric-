
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, MasturbationRecordDetails, ChangeRecord } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Hand, CloudSun, Heart, StopCircle, X, Dumbbell, User, Clock, List, Route, Edit3, Trash2, Activity, Zap, SunMedium, ArrowRight, BedDouble } from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import CancelReasonModal from './CancelReasonModal';
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
  onFinishMasturbation?: (record: MasturbationRecordDetails) => void;
}

// --- Daily Report Card (Detailed View for Modal) ---
const DailyReportCard: React.FC<{ log: LogEntry }> = ({ log }) => {
    const Row = ({ label, children, isLast = false }: { label: string, children: React.ReactNode, isLast?: boolean }) => (
        <div className={`flex items-start py-3 ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
            <span className="w-20 shrink-0 text-xs font-bold text-slate-400 pt-0.5">{label}</span>
            <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
                {children}
            </div>
        </div>
    );

    const Tag = ({ text, type = 'gray' }: { text: string, type?: 'gray' | 'yellow' | 'red' | 'green' | 'blue' | 'purple' }) => {
        const styles = {
            gray: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
            red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
            green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
            blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
            purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
        };
        return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${styles[type]}`}>{text}</span>;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <Row label="晨勃情况">
                {log.morning?.wokeWithErection ? (
                    <div>
                        <div className="flex items-center flex-wrap gap-2">
                            <span>硬度: {LABELS.hardness[log.morning.hardness || 3]}</span>
                            <span className="text-slate-300">|</span>
                            <span>维持: {LABELS.retention[log.morning.retention || 'normal']}</span>
                        </div>
                        {log.morning.wokenByErection && <div className="mt-1"><Tag text="被晨勃弄醒" type="yellow"/></div>}
                    </div>
                ) : (
                    <span className="text-slate-400 italic">无晨勃记录</span>
                )}
            </Row>

            <Row label="睡眠周期">
                {log.sleep?.startTime ? (
                    <div>
                        <div className="flex items-center gap-1 font-mono">
                            {formatTime(log.sleep.startTime)} - {formatTime(log.sleep.endTime) || '???'} 
                            {log.sleep.endTime && <span className="text-slate-400 text-xs ml-1">({calculateSleepDuration(log.sleep.startTime, log.sleep.endTime)})</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {analyzeSleep(log.sleep.startTime, log.sleep.endTime)?.isLate && <Tag text="熬夜" type="yellow"/>}
                            {analyzeSleep(log.sleep.startTime, log.sleep.endTime)?.isInsufficient && <Tag text="睡眠不足" type="red"/>}
                            {log.sleep.hasDream && <Tag text={`梦: ${log.sleep.dreamTypes?.join(',') || '有'}`} type="purple"/>}
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-400 italic">未记录</span>
                )}
            </Row>

            <Row label="身心环境">
                <div className="space-y-1">
                    <div>天气: {LABELS.weather[log.weather || 'sunny']} | 地点: {LABELS.location[log.location || 'home']}</div>
                    <div>心情: {LABELS.mood[log.mood || 'neutral']} | 压力: {LABELS.stress[log.stressLevel || 2]}</div>
                </div>
            </Row>

            <Row label="生活习惯" isLast>
                <div className="space-y-1">
                    <div className="flex items-center">
                        <span className="w-12 text-slate-400 text-xs">饮酒:</span>
                        {log.alcoholRecord && log.alcoholRecord.totalGrams > 0 ? (
                            <span>{log.alcoholRecord.totalGrams}g</span>
                        ) : <span>无</span>}
                    </div>
                    <div className="flex items-center">
                        <span className="w-12 text-slate-400 text-xs">看片:</span>
                        <span>{LABELS.porn[log.pornConsumption || 'none']}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-12 text-slate-400 text-xs">咖啡因:</span>
                        {log.caffeineRecord && log.caffeineRecord.totalCount > 0 ? (
                            <span className="flex items-center">{log.caffeineRecord.totalCount}杯</span>
                        ) : <span>无</span>}
                    </div>
                </div>
            </Row>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onFinishMasturbation }) => {
  const { logs, deleteLog, toggleNap, addOrUpdateLog } = useData();
  const { showToast } = useToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  
  // Summary Modal State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'overview' | 'timeline'>('overview');
  
  // Activity Cancel State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<'mb' | 'exercise' | null>(null);

  const completedLogs = useMemo(() => logs.filter(log => log.status !== 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);

  // Today's specific log
  const todayStr = getTodayDateString();
  const todayLog = useMemo(() => logs.find(l => l.date === todayStr), [logs, todayStr]);

  // Last 7 Days Sleep Stats for the Chart
  const recentSleepStats = useMemo(() => {
      const stats = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${day}`;
          
          const log = logs.find(l => l.date === dateStr);
          let nightDuration = 0;
          let napDuration = 0;
          let isLate = false;
          let isInsufficient = false;
          
          // Night Sleep
          if (log?.sleep?.startTime && log?.sleep?.endTime) {
              const analysis = analyzeSleep(log.sleep.startTime, log.sleep.endTime);
              if (analysis) {
                  nightDuration = analysis.durationHours;
                  isLate = analysis.isLate;
                  isInsufficient = analysis.isInsufficient;
              }
          }

          // Nap Sleep
          if (log?.sleep?.naps) {
              napDuration = log.sleep.naps.reduce((acc, n) => acc + (n.duration || 0), 0) / 60;
          }

          stats.push({ 
              date: dateStr, 
              nightDuration, 
              napDuration,
              totalDuration: nightDuration + napDuration,
              isLate, 
              isInsufficient,
              isToday: i === 0 
          });
      }
      return stats;
  }, [logs]);

  // Calculate Total Sleep for Today Card
  const todayTotalSleep = useMemo(() => {
      if (!todayLog) return 0;
      let total = 0;
      if (todayLog.sleep?.startTime && todayLog.sleep?.endTime) {
          total += analyzeSleep(todayLog.sleep.startTime, todayLog.sleep.endTime)?.durationHours || 0;
      }
      if (todayLog.sleep?.naps) {
          total += todayLog.sleep.naps.reduce((acc, n) => acc + (n.duration || 0), 0) / 60;
      }
      return total;
  }, [todayLog]);

  // Stats for the monthly dashboard cards
  const currentMonthStats = useMemo(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      const monthLogs = logs.filter(l => {
          const d = new Date(l.date);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });

      // Avg Hardness
      const validHardnessLogs = monthLogs.filter(l => l.morning?.wokeWithErection && l.morning.hardness);
      const totalHardness = validHardnessLogs.reduce((acc, l) => acc + (l.morning?.hardness || 0), 0);
      const avgHardness = validHardnessLogs.length ? (totalHardness / validHardnessLogs.length).toFixed(1) : '-';

      // Morning Wood Rate
      const recordedDays = monthLogs.filter(l => l.status === 'completed').length;
      const woodDays = monthLogs.filter(l => l.morning?.wokeWithErection).length;
      const rate = recordedDays > 0 ? Math.round((woodDays / recordedDays) * 100) : 0;

      return {
          avgHardness,
          rate,
          mbCount: monthLogs.reduce((acc, l) => acc + (l.masturbation?.length || 0), 0),
          sexCount: monthLogs.reduce((acc, l) => acc + (l.sex?.length || 0), 0)
      };
  }, [logs]);

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
        if (log.status === 'pending') {
            onEdit(log.date);
        } else { 
            setSummaryLog(log); 
            setActiveSummaryTab('overview'); 
            setIsSummaryModalOpen(true); 
            setIsHistoryView(false); 
        }
    } else {
        onDateClick(date);
    }
  };

  const handleCancelActivity = (type: 'mb' | 'exercise') => {
      setCancelTarget(type);
      setIsCancelModalOpen(true);
  };

  const confirmCancelActivity = async (reason: string) => {
      if (!cancelTarget) return;
      
      const targetRecord = cancelTarget === 'mb' ? ongoingMb : ongoingExercise;
      if (!targetRecord) return;

      const parentLog = logs.find(l => 
          cancelTarget === 'mb' 
          ? l.masturbation?.some(m => m.id === targetRecord.id)
          : l.exercise?.some(e => e.id === targetRecord.id)
      );

      if (parentLog) {
          // Prepare history entry
          const activityName = cancelTarget === 'mb' ? '自慰' : '运动';
          const historyEntry: ChangeRecord = {
              timestamp: Date.now(),
              summary: `取消${activityName} (${reason})`,
              details: [],
              type: 'manual'
          };

          const updates: Partial<LogEntry> = {
              changeHistory: [...(parentLog.changeHistory || []), historyEntry]
          };

          if (cancelTarget === 'mb') {
              updates.masturbation = parentLog.masturbation?.filter(m => m.id !== targetRecord.id);
          } else {
              updates.exercise = parentLog.exercise?.filter(e => e.id !== targetRecord.id);
          }

          try {
              await addOrUpdateLog({ ...parentLog, ...updates });
              showToast('记录已取消', 'info');
          } catch (e: any) {
              showToast(e.message, 'error');
          }
      }
      setIsCancelModalOpen(false);
      setCancelTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-brand-text dark:text-slate-100 flex items-center">
              {greeting} <span className="text-2xl ml-2">👋</span>
          </h1>
          <p className="text-sm text-brand-muted font-medium mt-1">
            今天也要保持好状态
          </p>
        </div>
        <button 
            onClick={onNavigateToBackup}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-105 transition-transform"
        >
            <User size={24} className="text-brand-accent"/>
        </button>
      </div>

      {/* Ongoing Activity Banner (System Status) */}
      {(ongoingMb || ongoingExercise) && (
          <div className="animate-in slide-in-from-top-2 fade-in">
              {ongoingMb && (
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/30 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                              <Hand size={20} fill="currentColor"/>
                          </div>
                          <div>
                              <div className="text-xs font-bold opacity-80 uppercase tracking-wider">正在进行</div>
                              <div className="text-lg font-black flex items-center">
                                  自慰中... <span className="ml-2 font-mono text-sm opacity-80">{ongoingMb.startTime} 开始</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => handleCancelActivity('mb')} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80" title="取消"><X size={16} strokeWidth={3}/></button>
                          <button onClick={() => onFinishMasturbation && onFinishMasturbation(ongoingMb)} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm flex items-center"><StopCircle size={16} className="mr-1.5"/>完成</button>
                      </div>
                  </div>
              )}
              {ongoingExercise && (
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/30 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                              <Dumbbell size={20} />
                          </div>
                          <div>
                              <div className="text-xs font-bold opacity-80 uppercase tracking-wider">正在进行</div>
                              <div className="text-lg font-black flex items-center">
                                  {ongoingExercise.type} <span className="ml-2 font-mono text-sm opacity-80">{ongoingExercise.startTime} 开始</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => handleCancelActivity('exercise')} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80" title="取消"><X size={16} strokeWidth={3}/></button>
                          <button onClick={() => onFinishExercise && onFinishExercise(ongoingExercise)} className="bg-white text-orange-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors shadow-sm flex items-center"><StopCircle size={16} className="mr-1.5"/>完成</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Main Calendar Card */}
      <div className="bg-brand-card dark:bg-slate-900 rounded-3xl p-4 shadow-soft border border-slate-100 dark:border-slate-800 mb-6">
        <CalendarHeatmap logs={completedLogs} onDateClick={handleDateClickForSummary} />
      </div>

      {/* Today's Status Cards (2-Col Layout) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Sleep Card - Refactored for Total Sleep + Naps, No Click Action */}
          <div 
            className="bg-[#0f172a] dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-800 flex flex-col h-40 relative overflow-hidden"
          >
              {/* Header: Label + Total Time */}
              <div className="flex justify-between items-start z-10 mb-2">
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <Moon size={14} />
                          </div>
                          <span className="text-sm font-bold text-slate-300">睡眠</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium pl-1">
                          {todayLog?.sleep?.startTime && todayLog?.sleep?.endTime 
                              ? `${formatTime(todayLog.sleep.startTime)} - ${formatTime(todayLog.sleep.endTime)}` 
                              : '未记录时间'}
                      </div>
                  </div>
                  <div>
                      {todayTotalSleep > 0 ? (
                          <div className="text-3xl font-black text-white tracking-tight">
                              {todayTotalSleep.toFixed(1)}
                              <span className="text-sm font-bold text-slate-500 ml-1">h</span>
                          </div>
                      ) : (
                          <div className="text-2xl font-black text-slate-700">--</div>
                      )}
                  </div>
              </div>

              {/* Bottom Chart: Stacked Bar (Night + Naps) */}
              <div className="flex-1 flex items-end justify-between gap-1.5 pt-2">
                  {recentSleepStats.map((stat, i) => {
                      const maxScale = 10; // 10 hours is full height
                      const totalHeightPercent = Math.min(100, (stat.totalDuration / maxScale) * 100);
                      
                      // Calculate proportional heights for the stack
                      const nightPercent = stat.totalDuration > 0 ? (stat.nightDuration / stat.totalDuration) * 100 : 0;
                      const napPercent = stat.totalDuration > 0 ? (stat.napDuration / stat.totalDuration) * 100 : 0;

                      // Color Logic for Night Bar
                      let nightColor = 'bg-indigo-500'; // Default: Healthy
                      if (stat.isLate && stat.isInsufficient) {
                          nightColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'; // Late & Short (Worst)
                      } else if (stat.isLate) {
                          nightColor = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]'; // Late (Behavioral issue)
                      } else if (stat.isInsufficient) {
                          nightColor = 'bg-orange-500'; // Short (Outcome issue)
                      }

                      return (
                          <div key={i} className="flex-1 flex flex-col justify-end h-full relative group/bar">
                              {stat.totalDuration > 0 ? (
                                  <div className="w-full flex flex-col justify-end gap-[1px]" style={{ height: `${Math.max(10, totalHeightPercent)}%` }}>
                                      {/* Nap Segment (Top) - Amber/Yellow for Day */}
                                      {stat.napDuration > 0 && (
                                          <div 
                                              className="w-full bg-amber-400 rounded-t-sm rounded-b-[1px] opacity-90"
                                              style={{ height: `${napPercent}%` }} 
                                          />
                                      )}
                                      {/* Night Segment (Bottom) - Dynamic Color */}
                                      <div 
                                          className={`w-full rounded-b-sm ${stat.napDuration > 0 ? 'rounded-t-[1px]' : 'rounded-t-sm'} transition-colors duration-300 ${nightColor}`}
                                          style={{ height: `${nightPercent}%` }}
                                      />
                                  </div>
                              ) : (
                                  /* Empty Placeholder */
                                  <div className="w-full h-1 bg-slate-800/50 rounded-full"></div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Vitality Card */}
          <div className="bg-[#0f172a] dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-800 flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="flex justify-between items-start z-10">
                  <div className="p-2 bg-rose-500/20 rounded-xl text-rose-500">
                      <Activity size={20} />
                  </div>
              </div>
              <div className="z-10 w-full">
                  <div className="flex justify-between items-end mb-2">
                      <h3 className="text-sm font-bold text-slate-400">活力</h3>
                      <span className="text-[10px] text-slate-600">今日释放</span>
                  </div>
                  
                  <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center text-orange-400 font-bold"><Dumbbell size={12} className="mr-1.5"/> 运动</span>
                          <span className="text-slate-300 font-medium">
                              {todayLog?.exercise && todayLog.exercise.length > 0 ? '已完成' : '未完成'}
                          </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center text-pink-400 font-bold"><Heart size={12} className="mr-1.5"/> 性/手</span>
                          <span className="text-slate-300 font-medium">
                              {(todayLog?.sex?.length || 0) + (todayLog?.masturbation?.length || 0) > 0 ? `${(todayLog?.sex?.length || 0) + (todayLog?.masturbation?.length || 0)}次` : '无'}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Monthly Stats Grid (4-Col Layout) */}
      <div className="grid grid-cols-2 gap-3">
          
          {/* Avg Hardness */}
          <div className="bg-[#0f172a] dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-800 h-28 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">平均硬度</span>
                      <div className="text-2xl font-black text-brand-accent">
                          {currentMonthStats.avgHardness}
                      </div>
                  </div>
                  <Zap size={16} className="text-brand-accent opacity-50"/>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">- 稳定</div>
          </div>

          {/* Morning Rate */}
          <div className="bg-[#0f172a] dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-800 h-28 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">晨勃率</span>
                      <div className="text-2xl font-black text-brand-accent">
                          {currentMonthStats.rate}<span className="text-sm font-bold text-slate-600 ml-0.5">%</span>
                      </div>
                  </div>
                  <SunMedium size={16} className="text-brand-accent opacity-50"/>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">出现概率</div>
          </div>

          {/* Masturbation Count */}
          <div className="bg-[#0f172a] dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-800 h-28 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">自慰次数</span>
                      <div className="text-2xl font-black text-purple-400">
                          {currentMonthStats.mbCount}<span className="text-sm font-bold text-slate-600 ml-0.5">次</span>
                      </div>
                  </div>
                  <Hand size={16} className="text-purple-500 opacity-50"/>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">本月释放</div>
          </div>

          {/* Sex Count */}
          <div className="bg-[#0f172a] dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-800 h-28 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">性爱次数</span>
                      <div className="text-2xl font-black text-pink-400">
                          {currentMonthStats.sexCount}<span className="text-sm font-bold text-slate-600 ml-0.5">次</span>
                      </div>
                  </div>
                  <Heart size={16} className="text-pink-500 opacity-50"/>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">High Quality</div>
          </div>
      </div>

      {/* Summary Modal */}
      <Modal isOpen={isSummaryModalOpen} onClose={() => { setIsSummaryModalOpen(false); setSummaryLog(null); }} title="" footer={null}>
          {summaryLog && (
              <div className="pb-6">
                  {/* Header Date */}
                  <div className="flex justify-between items-end mb-6 px-1">
                      <div>
                          <h2 className="text-3xl font-black text-brand-text dark:text-slate-100 tracking-tighter">
                              {new Date(summaryLog.date).getMonth() + 1}月{new Date(summaryLog.date).getDate()}日
                          </h2>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {new Date(summaryLog.date).toLocaleDateString('zh-CN', { weekday: 'long' })}
                          </p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setIsHistoryView(!isHistoryView)} className={`p-2 rounded-full transition-colors ${isHistoryView ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                              <Clock size={20} />
                          </button>
                          <button onClick={() => handleDeleteRequest(summaryLog.date)} className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                              <Trash2 size={20} />
                          </button>
                      </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                      <button 
                        onClick={() => setActiveSummaryTab('overview')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSummaryTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}
                      >
                          <List size={14} className="inline mr-1"/> 概览
                      </button>
                      <button 
                        onClick={() => setActiveSummaryTab('timeline')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSummaryTab === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}
                      >
                          <Route size={14} className="inline mr-1"/> 时间轴
                      </button>
                  </div>

                  {isHistoryView ? (
                      <div className="animate-in fade-in slide-in-from-right-4">
                          <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center"><Clock size={16} className="mr-2"/> 修改历史</h3>
                          <LogHistory log={summaryLog} />
                      </div>
                  ) : activeSummaryTab === 'timeline' ? (
                      <div className="animate-in fade-in slide-in-from-right-4">
                          <GlobalTimeline log={summaryLog} />
                          <div className="mt-8 text-center">
                              <button onClick={() => { onEdit(summaryLog.date); setIsSummaryModalOpen(false); }} className="w-full py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center">
                                  <Edit3 size={16} className="mr-2"/> 编辑时间线
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                          <DailyReportCard log={summaryLog} />
                          
                          <button onClick={() => { onEdit(summaryLog.date); setIsSummaryModalOpen(false); }} className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 dark:shadow-none hover:scale-[1.02] transition-transform">
                              <Edit3 size={18} className="mr-2"/> 编辑详情
                          </button>
                      </div>
                  )}
              </div>
          )}
      </Modal>

      <SafeDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} />
      
      <CancelReasonModal 
          isOpen={isCancelModalOpen} 
          onClose={() => setIsCancelModalOpen(false)} 
          onConfirm={confirmCancelActivity}
          title={cancelTarget === 'mb' ? "取消自慰记录" : "取消运动记录"}
      />
    </div>
  );
};

export default Dashboard;
