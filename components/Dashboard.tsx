
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Zap, Activity, Hand, HeartPulse, Clock, Dumbbell, Footprints, Timer, CloudSun, Swords, TrendingUp, Beer, Film, ChevronLeft, ChevronRight, MapPin, Target, Play, ShieldAlert, Edit3, Trash2, FastForward, Coffee, Bed, ArrowRight, User, List, Route, Thermometer, Smile, AlertTriangle, Wind } from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import { formatTime, calculateSleepDuration, analyzeSleep, generateLogSummary, LABELS } from '../utils/helpers';
import { getPrediction } from '../utils/alcoholHelpers';
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

// --- Rich Daily Report Card Component (Inspired by User Screenshot) ---
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
            {/* 1. Morning Wood */}
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

            {/* 2. Sleep */}
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
                        <div className="text-xs text-slate-500 mt-1">
                            评分: {log.sleep.quality}星 | 睡衣: {LABELS.attire[log.sleep.attire || 'light']}
                            {log.sleep.environment && ` | ${log.sleep.environment.temperature === 'comfortable' ? '适温' : log.sleep.environment.temperature === 'hot' ? '偏热' : '偏冷'}`}
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-400 italic">未记录睡眠</span>
                )}
            </Row>

            {/* 3. Environment */}
            <Row label="身心环境">
                <div className="space-y-1">
                    <div>
                        天气: {LABELS.weather[log.weather || 'sunny']} | 地点: {LABELS.location[log.location || 'home']}
                    </div>
                    <div>
                        心情: {LABELS.mood[log.mood || 'neutral']} | 压力: {LABELS.stress[log.stressLevel || 2]}
                    </div>
                </div>
            </Row>

            {/* 4. Lifestyle */}
            <Row label="生活习惯">
                <div className="space-y-1">
                    <div className="flex items-center">
                        <span className="w-12 text-slate-400 text-xs">饮酒:</span>
                        {log.alcoholRecord && log.alcoholRecord.totalGrams > 0 ? (
                            <span>{log.alcoholRecord.totalGrams}g <span className="text-xs text-slate-400">({LABELS.drunkLevel[log.alcoholRecord.drunkLevel || 'none']})</span></span>
                        ) : <span>无</span>}
                    </div>
                    <div className="flex items-center">
                        <span className="w-12 text-slate-400 text-xs">看片:</span>
                        <span>{LABELS.porn[log.pornConsumption || 'none']}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-12 text-slate-400 text-xs">咖啡因:</span>
                        {log.caffeineRecord && log.caffeineRecord.totalCount > 0 ? (
                            <span className="flex items-center"><Tag text="有摄入" type="purple"/> {log.caffeineRecord.totalCount}杯</span>
                        ) : <span>无</span>}
                    </div>
                    <div className="flex items-center">
                        <span className="w-12 text-slate-400 text-xs">运动:</span>
                        {log.exercise && log.exercise.length > 0 ? (
                            <span>{log.exercise.map(e => e.type).join(', ')}</span>
                        ) : <span>无</span>}
                    </div>
                </div>
            </Row>

            {/* 5. Sex Life */}
            <Row label="性生活">
                {log.sex && log.sex.length > 0 ? (
                    <div className="space-y-2">
                        {log.sex.map((s, i) => (
                            <div key={i} className="text-xs bg-pink-50 dark:bg-pink-900/10 p-2 rounded-lg border border-pink-100 dark:border-pink-900/30">
                                <div className="font-bold text-pink-700 dark:text-pink-300 mb-1 flex justify-between">
                                    <span>{formatTime(s.startTime)} 与 {s.interactions?.[0]?.partner || s.partner || '伴侣'}</span>
                                    <span>{s.duration}分</span>
                                </div>
                                <div className="text-pink-600/80 dark:text-pink-400/80 leading-tight">
                                    {s.ejaculation ? `[射精: ${s.ejaculationLocation || '未知'}]` : '[未射精]'}
                                    {s.interactions?.[0]?.chain?.length ? ` ${s.interactions[0].chain.map(a => a.name).join(' -> ')}` : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <span className="text-slate-400">无</span>}
            </Row>

            {/* 6. Masturbation */}
            <Row label={`自慰 (${log.masturbation?.length || 0})`}>
                {log.masturbation && log.masturbation.length > 0 ? (
                    <div className="space-y-2">
                        {log.masturbation.map((m, i) => (
                            <div key={i} className="text-xs bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <div className="font-bold text-blue-700 dark:text-blue-300 mb-1 flex justify-between">
                                    <span>{i + 1}. {formatTime(m.startTime)} {m.tools?.join(',') || '手'}</span>
                                    <span>{m.duration}分</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {m.volumeForceLevel && <span className="px-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-[2px]">[射精Lv.{m.volumeForceLevel}]</span>}
                                    {m.contentItems?.map((c, ci) => (
                                        <span key={ci} className="px-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2px] text-slate-500">
                                            {c.xpTags.length > 0 ? `[${c.xpTags[0]}]` : '[素材]'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <span className="text-slate-400">无</span>}
            </Row>

            {/* 7. Health */}
            <Row label="健康状况">
                {log.health?.isSick ? (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="font-bold text-red-600 dark:text-red-400">身体不适</span>
                        <span className="text-xs text-slate-500">({LABELS.discomfortLevel[log.health.discomfortLevel || 'mild']})</span>
                        {log.health.symptoms?.length > 0 && <Tag text={log.health.symptoms.join(',')} type="red"/>}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">身体健康</span>
                    </div>
                )}
            </Row>

            {/* 8. Notes */}
            <Row label="备注信息" isLast>
                {log.dailyEvents && log.dailyEvents.length > 0 && (
                    <div className="mb-1"><span className="font-bold text-slate-500">事件:</span> {log.dailyEvents.join(' + ')}</div>
                )}
                {log.notes ? <span>{log.notes}</span> : <span className="text-slate-300 italic">无额外备注</span>}
            </Row>
        </div>
    );
};

const SleepWidget = ({ log }: { log?: LogEntry | null }) => {
    const sleep = log?.sleep;
    const duration = calculateSleepDuration(sleep?.startTime, sleep?.endTime);
    // Parse duration to hours for progress bar
    let durationHours = 0;
    if (duration) {
        const match = duration.match(/(\d+)小时/);
        if (match) durationHours = parseInt(match[1]);
    }
    const hasData = !!(sleep?.startTime && sleep?.endTime);
    const analysis = analyzeSleep(sleep?.startTime, sleep?.endTime);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-card p-5 shadow-card border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-soft transition-all duration-300">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-500">
                        <Moon size={18} fill="currentColor"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">睡眠</h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                            {hasData ? `${formatTime(sleep?.startTime)} - ${formatTime(sleep?.endTime)}` : '未记录'}
                        </p>
                    </div>
                </div>
                {hasData && (
                    <div className="text-right">
                        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                            {durationHours}<span className="text-xs font-bold text-slate-400 ml-0.5">h</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Visual Graph Area - Mini Bars */}
            <div className="h-12 flex items-end gap-1 mb-2 px-1">
                {[30, 50, 40, 70, 45, 90, 60, 40, 20].map((h, i) => (
                    <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-sm relative overflow-hidden">
                        <div 
                            className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ${hasData ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'}`} 
                            style={{ height: hasData ? `${h}%` : '0%' }}
                        ></div>
                    </div>
                ))}
            </div>
            
            {/* Status Tags */}
            <div className="flex gap-2 mt-2">
                {analysis?.isLate && <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">熬夜</span>}
                {sleep?.quality && sleep.quality >= 4 && <span className="text-[9px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100">安睡</span>}
            </div>
        </div>
    );
};

const ActivityWidget = ({ log }: { log?: LogEntry | null }) => {
    const hasWorkout = log?.exercise && log.exercise.length > 0;
    const sexCount = log?.sex?.length || 0;
    const mbCount = log?.masturbation?.length || 0;
    const totalRelease = sexCount + mbCount;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-card p-5 shadow-card border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-soft transition-all duration-300">
             <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-500">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">活力</h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                            {totalRelease > 0 ? `今日释放 ${totalRelease} 次` : '今日未释放'}
                        </p>
                    </div>
                </div>
             </div>

             <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Dumbbell size={14} className="text-orange-500"/>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">运动</span>
                    </div>
                    <div className={`text-xs font-bold ${hasWorkout ? 'text-green-500' : 'text-slate-300'}`}>
                        {hasWorkout ? `${log?.exercise?.length}组` : '未完成'}
                    </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <HeartPulse size={14} className="text-pink-500"/>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">性/手</span>
                    </div>
                    <div className={`text-xs font-bold ${totalRelease > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                        {totalRelease > 0 ? `${sexCount} / ${mbCount}` : '无'}
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
  
  // Summary Modal State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [isHistoryView, setIsHistoryView] = useState(false);
  
  // Tabbed View State inside Summary
  const [activeSummaryTab, setActiveSummaryTab] = useState<'overview' | 'timeline'>('overview');
  
  // Masturbation Action Modal
  const [isMbActionModalOpen, setIsMbActionModalOpen] = useState(false);

  const completedLogs = useMemo(() => logs.filter(log => log.status !== 'pending'), [logs]);
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
        {/* New Glass Header */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-4 bg-brand-bg/80 dark:bg-slate-950/80 backdrop-blur-md flex justify-between items-center transition-all">
            <div>
                <h1 className="text-2xl font-black text-brand-text dark:text-slate-100 tracking-tight flex items-center gap-2">
                    {greeting}
                    <span className="text-2xl animate-pulse">👋</span>
                </h1>
                <p className="text-brand-muted dark:text-slate-400 text-xs font-medium mt-0.5">今天也要保持好状态</p>
            </div>
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
                <User size={18} className="text-brand-muted"/>
            </div>
        </div>

        {/* Ongoing Tasks (Floating Cards) */}
        {(ongoingNap || ongoingExercise || ongoingMb || pendingLog) && (
            <section className="space-y-3 animate-in slide-in-from-top-2">
                {pendingLog && !ongoingExercise && !ongoingNap && !ongoingMb && (
                    <div onClick={() => onEdit(pendingLog.date)} className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 p-4 rounded-3xl border border-orange-100 dark:border-orange-900/30 flex items-center justify-between cursor-pointer active:scale-95 transition-transform shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-200">
                                <Bed size={18}/>
                            </div>
                            <div>
                                <h4 className="font-bold text-orange-900 dark:text-orange-100 text-sm">补全昨日记录</h4>
                                <p className="text-[10px] text-orange-700 dark:text-orange-300 opacity-80">睡眠数据待填写</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full text-orange-400 shadow-sm"><ArrowRight size={16}/></div>
                    </div>
                )}
                
                {ongoingNap && (
                    <div className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900 p-4 rounded-3xl shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600"><CloudSun size={20}/></div>
                            <div>
                                <div className="font-bold text-sm text-slate-700 dark:text-slate-200">午休中...</div>
                                <div className="text-[10px] text-slate-400 font-mono">{ongoingNap.startTime} 开始</div>
                            </div>
                        </div>
                        <button onClick={handleToggleNap} className="px-4 py-2 bg-purple-600 text-white rounded-full text-xs font-bold shadow-md hover:bg-purple-700 transition-colors">醒了</button>
                    </div>
                )}

                {ongoingMb && onFinishMasturbation && (
                    <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900 p-4 rounded-3xl shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600"><Hand size={20}/></div>
                            <div>
                                <div className="font-bold text-sm text-slate-700 dark:text-slate-200">施法中...</div>
                                <div className="text-[10px] text-slate-400 font-mono">{ongoingMb.startTime} 开始</div>
                            </div>
                        </div>
                        <button onClick={() => setIsMbActionModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold shadow-md hover:bg-blue-700 transition-colors">结束</button>
                    </div>
                )}
            </section>
        )}

        {/* Calendar with Widgets */}
        <CalendarHeatmap logs={logs} onDateClick={handleDateClickForSummary}>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <SleepWidget log={latestLog} />
                <ActivityWidget log={latestLog} />
            </div>
        </CalendarHeatmap>
      </div>
      
      {/* Detail Modal */}
      <Modal isOpen={isSummaryModalOpen} onClose={() => { setIsSummaryModalOpen(false); setIsHistoryView(false); }} title={isHistoryView ? "修改历史" : "记录详情"}>
        {summaryLog && (
            <div className="space-y-4 pb-4 h-full flex flex-col">
                {!isHistoryView && (
                    <div className="flex items-center justify-between mb-2 shrink-0">
                        <div>
                            <h3 className="font-black text-2xl text-brand-text dark:text-slate-200 tracking-tight">{new Date(summaryLog.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</h3>
                            <p className="text-xs text-brand-muted uppercase font-bold tracking-wider">{new Date(summaryLog.date).toLocaleDateString('zh-CN', { weekday: 'long' })}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsHistoryView(true)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-brand-accent transition-colors"><Clock size={18}/></button>
                            <button onClick={() => { setIsSummaryModalOpen(false); handleDeleteRequest(summaryLog.date); }} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500 hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>
                        </div>
                    </div>
                )}
                
                {isHistoryView ? <LogHistory log={summaryLog} /> : (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Tab Switcher */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 shrink-0">
                            <button 
                                onClick={() => setActiveSummaryTab('overview')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                                    activeSummaryTab === 'overview' 
                                    ? 'bg-white dark:bg-slate-700 text-brand-accent shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <List size={14}/> 概览
                            </button>
                            <button 
                                onClick={() => setActiveSummaryTab('timeline')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                                    activeSummaryTab === 'timeline' 
                                    ? 'bg-white dark:bg-slate-700 text-brand-accent shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Route size={14}/> 时间轴
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {activeSummaryTab === 'overview' ? (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                    <DailyReportCard log={summaryLog} />
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                                    <GlobalTimeline log={summaryLog} />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
                            <button onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                                <Edit3 size={16} /> 编辑详情
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </Modal>

      {/* SafeDeleteModal moved OUTSIDE of Summary Modal to prevent auto-closing issue */}
      <SafeDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} message="确认要删除这一整天的记录吗？"/>

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
