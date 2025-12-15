
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LogEntry, HardnessLevel, MorningWoodRetention, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, HistoryCategory, AppSettings } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Signal, SignalHigh, SignalMedium, SignalLow, SignalZero, Moon, ShieldAlert, BedDouble, Zap, Leaf, Activity, Hand, HeartPulse, Bed, Hourglass, BatteryMedium, Battery, AlertTriangle, ArrowLeft, ArrowRight, X, Clock, CloudDrizzle, History, Dumbbell, Footprints, Timer, CloudSun, Swords, TrendingUp, TrendingDown, Beer, Film, BrainCircuit, ChevronLeft, ChevronRight, MapPin, User, Shirt, Droplets, Target, Sparkles, Play, Thermometer, Pill, GitCommit, Edit3, PlusCircle, Trash2, RefreshCcw, Check, FileText, FastForward } from 'lucide-react';
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

// --- Maps ---
const hardnessStyles: { [key in HardnessLevel | number]: { Icon: React.ElementType; color: string; label: string } } = {
    1: { Icon: SignalZero, color: 'text-red-500', label: '1级 (软)' },
    2: { Icon: SignalLow, color: 'text-orange-500', label: '2级 (较软)' },
    3: { Icon: SignalMedium, color: 'text-blue-500 dark:text-blue-400', label: '3级 (标准)' },
    4: { Icon: SignalHigh, color: 'text-blue-600 dark:text-blue-300', label: '4级 (硬)' },
    5: { Icon: Signal, color: 'text-indigo-600 dark:text-indigo-300', label: '5级 (最硬)' },
};

const retentionMap: Record<MorningWoodRetention, { label: string; Icon: React.ElementType; color: string }> = {
    instant: { label: '瞬间消失', Icon: Zap, color: 'text-red-500' },
    brief: { label: '快速消退', Icon: Hourglass, color: 'text-orange-500' },
    normal: { label: '正常消退', Icon: BatteryMedium, color: 'text-blue-500 dark:text-blue-400' },
    extended: { label: '持续坚挺', Icon: Battery, color: 'text-indigo-500 dark:text-indigo-400' },
};

const attireMap: Record<string, string> = { naked: '裸睡', light: '内衣', pajamas: '睡衣', other: '其他' };

// --- Logic ---
const calculateCombatPower = (log: LogEntry): number => {
    let score = 60;
    const morning = log.morning;
    if (morning?.wokeWithErection && morning.hardness) score += (morning.hardness - 3) * 10; else score -= 10;
    
    const sleepAnalysis = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
    if (sleepAnalysis) {
        if (sleepAnalysis.durationHours >= 7 && !sleepAnalysis.isLate) score += 10;
        else if (sleepAnalysis.isInsufficient) score -= 10;
        else if (sleepAnalysis.isLate) score -= 5;
    }
    if (log.exercise && log.exercise.length > 0) score += 10;
    if (log.stressLevel) score += (3 - log.stressLevel) * 5;
    if (log.alcohol && log.alcohol !== 'none') score -= 10;
    return Math.max(0, Math.min(100, score));
};

const getPowerLevel = (score: number) => {
    if (score >= 90) return { label: '战神', color: 'text-red-500 dark:text-red-400' };
    if (score >= 80) return { label: '猛男', color: 'text-orange-500 dark:text-orange-400' };
    if (score >= 60) return { label: '战士', color: 'text-blue-500 dark:text-blue-400' };
    return { label: '弱鸡', color: 'text-slate-400' };
};

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onFinishMasturbation }) => {
  const { logs, deleteLog, toggleNap, addOrUpdateLog } = useData();
  const { showToast } = useToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [showBackupAlert, setShowBackupAlert] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [isTrendWarningOpen, setIsTrendWarningOpen] = useState(false);
  
  // Masturbation Action Modal
  const [isMbActionModalOpen, setIsMbActionModalOpen] = useState(false);

  // Swipe State
  const touchStart = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const minSwipeDistance = 80;

  const completedLogs = useMemo(() => logs.filter(log => log.status !== 'pending'), [logs]);
  const sortedHistoryLogs = useMemo(() => [...completedLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [completedLogs]);
  const latestLog = useMemo(() => logs.length > 0 ? logs[0] : null, [logs]);
  const pendingLog = useMemo(() => logs.find(log => log.status === 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);

  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { title: '早上好！', text: '请完成您今天的记录。', btn: '完成记录' };
    if (hour < 18) return { title: '下午好', text: '您可以先记录一部分信息，明早再完成。', btn: '编辑草稿' };
    return { title: '晚上好', text: '已记录入睡时间。您可以补充今日详情。', btn: '编辑草稿' };
  }, []);

  const alcoholPrediction = useMemo(() => {
      if (latestLog && latestLog.alcoholRecord && latestLog.alcoholRecord.totalGrams > 0) {
          return getPrediction(latestLog.alcoholRecord.totalGrams);
      }
      return null;
  }, [latestLog]);

  const prediction = useMemo(() => {
      if (!latestLog) return null;
      let score = 3; 
      const factors = [];
      if (latestLog.alcohol && latestLog.alcohol !== 'none') { score -= 0.5; factors.push('饮酒'); }
      if (latestLog.stressLevel && latestLog.stressLevel >= 4) { score -= 0.5; factors.push('高压'); }
      if (latestLog.exercise && latestLog.exercise.length > 0) { score += 0.5; factors.push('运动'); }
      return { level: Math.max(1, Math.min(5, Math.round(score))), factors };
  }, [latestLog]);

  useEffect(() => {
    if (isSummaryModalOpen && summaryLog) {
        const freshLog = logs.find(l => l.date === summaryLog.date);
        if (freshLog && freshLog !== summaryLog) {
            setSummaryLog(freshLog);
        }
    }
  }, [logs, isSummaryModalOpen, summaryLog]);

  useEffect(() => {
    const checkBackup = () => {
        if (logs.length < 3) return; // Only show if user has significant data
        
        try {
            const settingsStr = localStorage.getItem('appSettings');
            if (!settingsStr) {
                // If no settings exist, they definitely haven't backed up
                setShowBackupAlert(true); 
                return; 
            }
            
            const settings: AppSettings = JSON.parse(settingsStr);
            // Check last export time (File Export is the only true "Backup" for local-first apps)
            const lastExport = settings.lastExportAt || 0;
            
            // Show alert if never exported or exported more than 7 days ago
            if (lastExport === 0 || (Date.now() - lastExport) / (1000 * 3600 * 24) > 7) {
                setShowBackupAlert(true);
            } else {
                setShowBackupAlert(false);
            }
        } catch { 
            // On error (e.g. malformed JSON), safe default is to show alert
            setShowBackupAlert(true); 
        }
    };
    checkBackup();

    const checkTrendWarning = () => {
        if (sortedHistoryLogs.length < 20) return;
        const lastDate = new Date(sortedHistoryLogs[0].date);
        if ((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24) > 3) return;

        const recentWindow = sortedHistoryLogs.slice(0, 14);
        const baselineLogs = sortedHistoryLogs.slice(14);
        const baselineSum = baselineLogs.reduce((acc, l) => acc + (l.morning?.hardness || 0), 0);
        const baselineCount = baselineLogs.filter(l => l.morning?.hardness).length;
        if (baselineCount === 0) return;
        const baselineAvg = baselineSum / baselineCount;
        const threshold = baselineAvg - 0.8;
        const isConsistentlyLow = recentWindow.every(l => (l.morning?.hardness || 0) < threshold);

        if (isConsistentlyLow) {
            const lastDismissed = localStorage.getItem('HD_trend_warning_dismissed_date');
            const todayStr = new Date().toDateString();
            if (lastDismissed !== todayStr) setIsTrendWarningOpen(true);
        }
    };
    checkTrendWarning();
  }, [logs.length, sortedHistoryLogs]);

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

  // Swipe & Navigation Logic
  const currentLogIndex = useMemo(() => summaryLog ? sortedHistoryLogs.findIndex(l => l.date === summaryLog.date) : -1, [summaryLog, sortedHistoryLogs]);
  const hasNewerLog = currentLogIndex > 0; 
  const hasOlderLog = currentLogIndex !== -1 && currentLogIndex < sortedHistoryLogs.length - 1;

  const switchLog = (direction: 'newer' | 'older') => {
      if (currentLogIndex === -1) return;
      setIsAnimating(true);
      const screenWidth = window.innerWidth;
      setSwipeOffset(direction === 'newer' ? -screenWidth : screenWidth);

      setTimeout(() => {
          if (direction === 'newer' && hasNewerLog) setSummaryLog(sortedHistoryLogs[currentLogIndex - 1]);
          else if (direction === 'older' && hasOlderLog) setSummaryLog(sortedHistoryLogs[currentLogIndex + 1]);
          
          setIsAnimating(false);
          setIsHistoryView(false);
          setSwipeOffset(direction === 'newer' ? screenWidth : -screenWidth);
          requestAnimationFrame(() => requestAnimationFrame(() => { setIsAnimating(true); setSwipeOffset(0); }));
      }, 300);
  };

  const onTouchStart = (e: React.TouchEvent) => { setIsAnimating(false); touchStart.current = e.targetTouches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => { if (touchStart.current === null) return; setSwipeOffset(e.targetTouches[0].clientX - touchStart.current); };
  const onTouchEnd = () => {
      if (touchStart.current === null) return;
      if (swipeOffset < -minSwipeDistance && hasNewerLog) switchLog('newer');
      else if (swipeOffset > minSwipeDistance && hasOlderLog) switchLog('older');
      else { setIsAnimating(true); setSwipeOffset(0); }
      touchStart.current = null;
  };

  const sleepValue = useMemo(() => {
      if (!latestLog) return { val: '0', unit: 'h' };
      const durationStr = calculateSleepDuration(latestLog.sleep?.startTime, latestLog.sleep?.endTime);
      if (!durationStr) return { val: '0', unit: 'h' };
      const match = durationStr.match(/(\d+)小时/);
      return { val: match ? match[1] : '0', unit: durationStr.replace(/小时|分钟/g, m => m === '小时' ? 'h ' : 'm') };
  }, [latestLog]);

  const exerciseValue = useMemo(() => {
    if (!latestLog?.exercise || latestLog.exercise.length === 0) return { val: '0', unit: 'min' };
    const totalDuration = latestLog.exercise.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    return { val: totalDuration.toString(), unit: 'min' };
  }, [latestLog]);

  const renderSexDetail = (sex: SexRecordDetails) => (
      <div key={sex.id} className="bg-white/80 dark:bg-black/20 p-4 rounded-2xl text-sm backdrop-blur-sm border border-transparent dark:border-white/5 space-y-3">
          <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-brand-text dark:text-slate-200 flex items-center font-bold">
                  <Clock size={12} className="mr-1"/>{sex.startTime}
                  <span className="ml-2 opacity-60 font-normal">{sex.duration}分</span>
              </span>
              <div className="flex gap-2">
                  {sex.ejaculation && <span className="text-[10px] font-bold text-pink-600 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded">射精</span>}
                  {sex.protection && <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{sex.protection}</span>}
              </div>
          </div>
          
          {/* Timeline of interactions */}
          {sex.interactions && sex.interactions.length > 0 && (
              <div className="space-y-3 relative pl-3 border-l border-pink-200 dark:border-pink-800/30 ml-1">
                  {sex.interactions.map((inter, idx) => (
                      <div key={idx} className="relative">
                          <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-pink-300"></div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-brand-text dark:text-slate-200">{inter.partner || '未知伴侣'}</span>
                              {inter.location && <span className="text-[10px] text-slate-400 flex items-center"><MapPin size={8} className="mr-0.5"/>{inter.location}</span>}
                          </div>
                          {inter.chain && inter.chain.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                  {inter.chain.map((act, ai) => (
                                      <React.Fragment key={ai}>
                                          {ai > 0 && <ArrowRight size={8} className="text-slate-300"/>}
                                          <span className={`text-[10px] px-1.5 rounded ${act.type === 'act' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
                                              {act.name}
                                          </span>
                                      </React.Fragment>
                                  ))}
                              </div>
                          )}
                          {(inter.costumes?.length > 0 || inter.toys?.length > 0) && (
                              <div className="flex gap-2 mt-1">
                                  {inter.costumes?.map(c => <span key={c} className="text-[9px] text-indigo-500 border border-indigo-100 px-1 rounded bg-white dark:bg-transparent">{c}</span>)}
                                  {inter.toys?.map(t => <span key={t} className="text-[9px] text-orange-500 border border-orange-100 px-1 rounded bg-white dark:bg-transparent">{t}</span>)}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}
          
          {/* Indicators */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-pink-200 dark:border-pink-800/30">
              {sex.indicators.orgasm && <span className="text-[10px] flex items-center text-red-500"><Zap size={10} className="mr-1"/>我高潮</span>}
              {sex.indicators.partnerOrgasm && <span className="text-[10px] flex items-center text-pink-500"><Sparkles size={10} className="mr-1"/>伴侣高潮</span>}
              {sex.indicators.squirting && <span className="text-[10px] flex items-center text-blue-500"><Droplets size={10} className="mr-1"/>潮吹</span>}
              {sex.indicators.lingerie && <span className="text-[10px] flex items-center text-purple-500"><Shirt size={10} className="mr-1"/>情趣内衣</span>}
          </div>
      </div>
  );

  const renderMasturbationDetail = (mb: MasturbationRecordDetails) => (
      <div key={mb.id} className="bg-white/80 dark:bg-black/20 p-4 rounded-2xl text-sm backdrop-blur-sm border border-transparent dark:border-white/5 space-y-2">
          <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-brand-text dark:text-slate-200 flex items-center font-bold">
                  <Clock size={12} className="mr-1"/>{mb.startTime}
                  <span className="ml-2 opacity-60 font-normal">{mb.duration}分</span>
              </span>
              <span className="text-[10px] text-brand-muted">{mb.tools?.join(', ')}</span>
          </div>
          
          {/* Location / Scene */}
          {mb.location && (
              <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400">
                  <MapPin size={10} className="mr-1 text-slate-400"/>
                  {mb.location}
              </div>
          )}
          
          {/* Assets & Tags */}
          {mb.assets && (
              <div className="space-y-1">
                  {mb.assets.target && <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center"><Target size={10} className="mr-1"/>对象: {mb.assets.target}</div>}
                  {mb.assets.categories && mb.assets.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                          {mb.assets.categories.map(c => <span key={c} className="text-[9px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded">{c}</span>)}
                      </div>
                  )}
                  {mb.materialsList && mb.materialsList.length > 0 && (
                      <div className="mt-2 text-[10px] space-y-1 bg-white/50 dark:bg-black/20 p-2 rounded">
                          {mb.materialsList.map((m, i) => (
                              <div key={i} className="flex items-center gap-1">
                                  <Play size={8} className="text-slate-400"/>
                                  <span className="font-medium truncate">{m.label || '未命名'}</span>
                                  {m.actors.length > 0 && <span className="text-slate-500">- {m.actors.join(', ')}</span>}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}
          
          {/* Edging */}
          {mb.edging && mb.edging !== 'none' && (
              <div className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded w-fit">
                  <Activity size={10} className="mr-1"/>
                  边缘控制: {mb.edging === 'once' ? '1次' : `${mb.edgingCount || '多'}次`}
              </div>
          )}

          {/* Interrupted */}
          {mb.interrupted && (
              <div className="flex items-start gap-1 mt-1 text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 p-1.5 rounded-lg border border-orange-100 dark:border-orange-800">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                  <div>
                      <span className="font-bold">被打断: </span>
                      {mb.interruptionReasons && mb.interruptionReasons.length > 0 ? mb.interruptionReasons.join(', ') : '未知原因'}
                  </div>
              </div>
          )}
      </div>
  );

  const renderLogSummaryContent = (log: LogEntry) => {
    const sleepAnalysis = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
    const combatPower = calculateCombatPower(log);
    const powerLevel = getPowerLevel(combatPower);
    const morning = log.morning || { wokeWithErection: false };
    
    return (
    <div className="space-y-4 text-brand-text dark:text-slate-300 px-1 max-h-[65vh] overflow-y-auto pb-8 custom-scrollbar">
        {/* Combat Power Card */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-3xl shadow-md border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-center relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Swords size={12}/> 今日战斗力</span>
                    <span className="text-3xl font-black mt-1 italic tracking-tight flex items-baseline gap-2">
                        {combatPower}
                        <span className={`text-sm ${powerLevel.color}`}>{powerLevel.label}</span>
                    </span>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-t-brand-accent border-r-brand-accent border-b-transparent border-l-transparent rotate-45"></div>
                    <Zap size={24} className={powerLevel.color} fill="currentColor"/>
                </div>
            </div>
        </div>

        {/* Morning State */}
        <div className="bg-gradient-to-br from-palette-ice/50 to-white dark:from-slate-800 dark:to-slate-900 p-5 rounded-3xl border border-palette-ice/20 dark:border-slate-700 shadow-sm">
            {morning.wokeWithErection && morning.hardness ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {React.createElement(hardnessStyles[morning.hardness].Icon, { size: 48, className: hardnessStyles[morning.hardness].color })}
                            <div>
                                <p className="font-bold text-lg text-brand-accent dark:text-blue-400">有晨勃</p>
                                <p className="font-medium text-brand-text dark:text-slate-300 opacity-70">{hardnessStyles[morning.hardness].label}</p>
                            </div>
                        </div>
                        {morning.wokenByErection && <span className="bg-palette-pink dark:bg-pink-900/30 text-brand-text dark:text-pink-300 px-2 py-1 rounded-full text-xs font-bold border border-pink-200 dark:border-pink-800">被弄醒</span>}
                    </div>
                    {morning.retention && (
                        <div className="flex items-center bg-white/60 dark:bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-transparent dark:border-white/5">
                            {React.createElement(retentionMap[morning.retention]?.Icon || Zap, { size: 20, className: `${retentionMap[morning.retention]?.color} mr-2` })}
                            <div className="flex flex-col">
                                <span className="text-xs text-brand-muted dark:text-slate-400">维持能力</span>
                                <span className="font-medium text-sm text-brand-text dark:text-slate-200">{retentionMap[morning.retention]?.label}</span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center space-x-3">
                    <Moon size={48} className="text-slate-400" />
                    <div>
                        <p className="font-bold text-lg text-slate-600 dark:text-slate-400">无晨勃</p>
                        <p className="text-sm text-brand-muted">平淡的一天</p>
                    </div>
                </div>
            )}
        </div>

        {/* Sleep */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-brand-muted dark:text-slate-400 flex items-center"><BedDouble size={16} className="mr-1"/> 睡眠</h4>
                <div className="flex gap-1">
                    {sleepAnalysis?.isLate && <span className="flex items-center text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold"><Clock size={10} className="mr-1"/> 熬夜</span>}
                    {sleepAnalysis?.isInsufficient && <span className="flex items-center text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full font-bold"><AlertTriangle size={10} className="mr-1"/> 不足</span>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-brand-primary dark:bg-slate-800 p-3 rounded-2xl">
                    <p className="text-xs text-brand-muted dark:text-slate-400 mb-1">时间</p>
                    <p className="font-mono font-bold text-brand-text dark:text-slate-200">
                        {(!log.sleep?.startTime && !log.sleep?.endTime) ? <span className="text-slate-400 font-normal">未记录时间</span> : <>{formatTime(log.sleep?.startTime)} <span className="text-slate-300">→</span> {formatTime(log.sleep?.endTime)}</>}
                    </p>
                </div>
                <div className="bg-brand-primary dark:bg-slate-800 p-3 rounded-2xl">
                    <p className="text-xs text-brand-muted dark:text-slate-400 mb-1">总时长</p>
                    <p className="font-bold text-brand-text dark:text-slate-200">{calculateSleepDuration(log.sleep?.startTime, log.sleep?.endTime) || '未记录'}</p>
                </div>
            </div>
            {/* Sleep Tags */}
            <div className="flex gap-2 mt-3 flex-wrap">
                {log.sleep?.naturalAwakening && <span className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded border border-green-100 dark:border-green-900 flex items-center"><Leaf size={10} className="mr-1"/>自然醒</span>}
                {log.sleep?.nocturnalEmission && <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-900 flex items-center"><CloudDrizzle size={10} className="mr-1"/>梦遗</span>}
                {log.sleep?.attire && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 flex items-center"><Shirt size={10} className="mr-1"/>{attireMap[log.sleep.attire] || log.sleep.attire}</span>}
            </div>
            
            {log.sleep?.naps && log.sleep.naps.length > 0 && (
                 <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                     <div className="flex flex-wrap gap-2">
                         {log.sleep.naps.map((n, i) => (
                             <div key={i} className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-900 flex items-center">
                                 <CloudSun size={12} className="mr-1.5"/>
                                 {n.ongoing ? <span className="animate-pulse font-bold text-orange-500">进行中... ({n.startTime})</span> : <span>{n.startTime} - {n.endTime || '?'} ({n.duration}m)</span>}
                             </div>
                         ))}
                     </div>
                 </div>
            )}
        </div>

        {/* Health (If Sick) */}
        {log.health?.isSick && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-3xl">
                <div className="flex items-center mb-1">
                    <ShieldAlert size={18} className="text-red-600 dark:text-red-400 mr-2"/>
                    <span className="font-bold text-red-800 dark:text-red-200">身体不适</span>
                </div>
                <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-white/50 dark:bg-black/20 px-2 py-1 rounded text-red-700 dark:text-red-300">
                        {log.health.illnessType === 'cold' ? '感冒' : log.health.illnessType === 'fever' ? '发烧' : log.health.illnessType === 'headache' ? '头痛' : '其他'}
                    </span>
                    {log.health.medicationTaken && (
                        <span className="text-xs bg-white/50 dark:bg-black/20 px-2 py-1 rounded text-red-700 dark:text-red-300 flex items-center">
                            <Pill size={10} className="mr-1"/>已服药
                        </span>
                    )}
                </div>
            </div>
        )}

        {/* Lifestyle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
            <h4 className="text-sm font-bold text-brand-muted dark:text-slate-400 mb-3 flex items-center"><Activity size={16} className="mr-1"/> 生活方式</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-3 rounded-2xl border flex items-center ${log.alcoholRecord?.totalGrams ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200' : 'bg-brand-primary dark:bg-slate-800 border-transparent opacity-70 text-brand-text dark:text-slate-200'}`}>
                    <Beer size={16} className="mr-2"/> {log.alcoholRecord?.totalGrams ? `${log.alcoholRecord.totalGrams}g 酒精` : '未饮酒'}
                </div>
                <div className={`p-3 rounded-2xl border flex items-center ${log.pornConsumption && log.pornConsumption !== 'none' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-800 dark:text-purple-200' : 'bg-brand-primary dark:bg-slate-800 border-transparent opacity-70 text-brand-text dark:text-slate-200'}`}>
                    <Film size={16} className="mr-2"/> {log.pornConsumption === 'none' ? '未看片' : '有看片'}
                </div>
                <div className={`col-span-2 p-3 rounded-2xl border ${log.exercise && log.exercise.length > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-800 dark:text-green-200' : 'bg-brand-primary dark:bg-slate-800 border-transparent opacity-70 text-brand-text dark:text-slate-200'}`}>
                    <div className="flex items-center mb-1">
                        <Activity size={16} className="mr-2"/> <span className="font-bold">{log.exercise && log.exercise.length > 0 ? '运动记录' : '无运动'}</span>
                    </div>
                    {log.exercise && log.exercise.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-6">
                            {log.exercise.map((ex, i) => (
                                <span key={i} className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center">
                                    {ex.ongoing ? <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span> : null}
                                    {ex.steps ? `${ex.type} (${ex.steps}步)` : `${ex.type} ${ex.duration}m`}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-2xl border flex items-center col-span-2 ${(log.stressLevel || 0) > 3 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-800 dark:text-red-200' : 'bg-brand-primary dark:bg-slate-800 border-transparent opacity-70 text-brand-text dark:text-slate-200'}`}>
                    <BrainCircuit size={16} className="mr-2"/> 压力: {log.stressLevel}
                </div>
            </div>
        </div>

        {/* Sex Life & Masturbation */}
        {log.sex && log.sex.length > 0 && (
            <div className="bg-palette-pink dark:bg-pink-900/30 p-4 rounded-3xl shadow-sm border border-transparent dark:border-pink-800/30">
                <h4 className="text-sm font-bold text-brand-text dark:text-pink-100 mb-3 flex items-center"><HeartPulse size={16} className="mr-1"/> 性生活 ({log.sex.length}次)</h4>
                <div className="space-y-2">
                    {log.sex.map((record) => renderSexDetail(record))}
                </div>
            </div>
        )}
        
        {log.masturbation && log.masturbation.length > 0 && (
            <div className="bg-palette-ice dark:bg-blue-900/20 p-4 rounded-3xl shadow-sm border border-transparent dark:border-blue-800/30">
                <h4 className="text-sm font-bold text-brand-text dark:text-blue-100 mb-3 flex items-center"><Hand size={16} className="mr-1"/> 自慰 ({log.masturbation.length}次)</h4>
                <div className="space-y-2">
                    {log.masturbation.map((record) => renderMasturbationDetail(record))}
                </div>
            </div>
        )}
        
        {(log.notes || (log.tags && log.tags.length > 0)) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl space-y-2">
                {log.tags && <div className="flex flex-wrap gap-1">{log.tags.map(tag => <span key={tag} className="text-xs bg-brand-primary dark:bg-slate-800 px-2 py-1 rounded-full dark:text-slate-300 border border-slate-200 dark:border-slate-700">#{tag}</span>)}</div>}
                {log.notes && <p className="text-sm text-brand-text dark:text-slate-300 italic">"{log.notes}"</p>}
            </div>
        )}
    </div>
  )};

  return (
    <>
      {showBackupAlert && (
          <div className="mb-6 bg-palette-yellow/20 dark:bg-orange-900/20 border border-palette-yellow/50 dark:border-orange-800/50 rounded-2xl p-4 flex justify-between animate-fade-in">
            <div className="flex space-x-3">
                <AlertTriangle className="text-orange-500 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-bold text-brand-text dark:text-orange-200">数据安全提醒</p>
                    <button onClick={onNavigateToBackup} className="mt-2 text-xs font-semibold text-white bg-orange-500 px-3 py-1.5 rounded-full shadow-sm">去备份</button>
                </div>
            </div>
            <button onClick={() => setShowBackupAlert(false)} className="text-orange-400 p-1"><X size={16} /></button>
          </div>
      )}

      {alcoholPrediction && (
          <section className="mb-4">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 rounded-3xl shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                          <Beer size={20} className="text-yellow-200"/>
                          <span className="font-bold">酒量预测模型</span>
                      </div>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">样本: {alcoholPrediction.samples}</span>
                  </div>
                  <div className="flex justify-between items-end">
                      <div className="text-xs opacity-90">预计明早: <span className="font-bold text-lg text-yellow-100">{alcoholPrediction.predicted}</span> <span className="ml-1 text-red-200">↓{alcoholPrediction.drop}级</span></div>
                  </div>
              </div>
          </section>
      )}

      {ongoingNap && (
          <section className="mb-4">
              <div className="bg-orange-500 dark:bg-orange-600 p-4 rounded-3xl shadow-lg flex items-center justify-between text-white animate-pulse">
                  <div className="flex items-center">
                      <div className="p-2 bg-white/20 rounded-full mr-3"><CloudSun size={24}/></div>
                      <div>
                          <p className="font-bold text-sm">正在午休 zZZ...</p>
                          <p className="text-xs opacity-90 mt-0.5 font-mono">开始于 {ongoingNap.startTime}</p>
                      </div>
                  </div>
                  <button onClick={handleToggleNap} className="px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-full shadow-sm">起床/结束</button>
              </div>
          </section>
      )}

      {ongoingExercise && onFinishExercise && (
          <section className="mb-4">
              <div className="bg-orange-500 dark:bg-orange-600 p-4 rounded-3xl shadow-lg flex items-center justify-between text-white animate-pulse">
                  <div className="flex items-center">
                      <div className="p-2 bg-white/20 rounded-full mr-3"><Timer size={24}/></div>
                      <div>
                          <p className="font-bold text-sm">正在运动: {ongoingExercise.type}</p>
                          <p className="text-xs opacity-90 mt-0.5 font-mono">开始于 {ongoingExercise.startTime}</p>
                      </div>
                  </div>
                  <button onClick={() => onFinishExercise(ongoingExercise)} className="px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-full shadow-sm">结束运动</button>
              </div>
          </section>
      )}

      {ongoingMb && onFinishMasturbation && (
          <section className="mb-4">
              <div className="bg-blue-500 dark:bg-blue-600 p-4 rounded-3xl shadow-lg flex items-center justify-between text-white animate-pulse">
                  <div className="flex items-center">
                      <div className="p-2 bg-white/20 rounded-full mr-3"><Hand size={24}/></div>
                      <div>
                          <p className="font-bold text-sm">正在施法中...</p>
                          <p className="text-xs opacity-90 mt-0.5 font-mono">开始于 {ongoingMb.startTime}</p>
                      </div>
                  </div>
                  <button onClick={() => setIsMbActionModalOpen(true)} className="px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-full shadow-sm">结束/记录</button>
              </div>
          </section>
      )}

      {pendingLog && !ongoingExercise && !ongoingNap && !ongoingMb && (
        <section className="mb-4">
            <div className="bg-palette-yellow/30 dark:bg-yellow-900/20 border-l-4 border-palette-yellow dark:border-yellow-600 p-4 rounded-r-3xl shadow-sm">
                <div className="flex items-center mb-3">
                    <div className="py-1"><Bed size={24} className="text-orange-600 dark:text-yellow-400"/></div>
                    <div className="ml-4">
                        <p className="text-lg font-bold text-brand-text dark:text-yellow-200">{greetingData.title}</p>
                        <p className="text-sm text-brand-text/80 dark:text-yellow-100/80 mt-1">{greetingData.text}</p>
                    </div>
                </div>
                {prediction && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 mb-3 text-xs flex items-center justify-between border border-white/20">
                        <div className="flex items-center gap-2 text-brand-text dark:text-slate-300">
                            <TrendingUp size={14} className="text-blue-500"/>
                            <span>明日预测: <span className="font-bold text-blue-600 dark:text-blue-400">{prediction.level}级</span></span>
                        </div>
                    </div>
                )}
                <div className="flex justify-end">
                    <button onClick={() => onEdit(pendingLog.date)} className="px-4 py-2 bg-brand-text dark:bg-slate-800 text-white text-xs font-bold rounded-full shadow-lg border border-transparent dark:border-slate-700">{greetingData.btn}</button>
                </div>
            </div>
        </section>
      )}

      <div className="space-y-6">
        <section>
          <CalendarHeatmap logs={logs} onDateClick={handleDateClickForSummary}>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between min-h-[9rem] relative overflow-hidden">
                     <div className="flex justify-between items-start z-10">
                        <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500"><Moon size={20} /></div>
                        <span className="text-xs font-bold text-slate-400">近7天睡眠</span>
                     </div>
                     <div className="z-10 mt-2">
                        <span className="text-2xl font-black text-brand-text dark:text-slate-200">{sleepValue.val}</span>
                        <span className="text-xs text-slate-400 ml-1 font-medium">{sleepValue.unit}</span>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between min-h-[9rem] relative overflow-hidden">
                     <div className="flex justify-between items-start z-10">
                        <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-500"><Dumbbell size={20} /></div>
                        <span className="text-xs font-bold text-slate-400">运动</span>
                     </div>
                     <div className="z-10 mt-2">
                        <span className="text-2xl font-black text-brand-text dark:text-slate-200">{exerciseValue.val}</span>
                        <span className="text-xs text-slate-400 ml-1 font-medium">{exerciseValue.unit}</span>
                     </div>
                  </div>
              </div>
          </CalendarHeatmap>
        </section>
      </div>
      
      <Modal isOpen={isSummaryModalOpen} onClose={() => { setIsSummaryModalOpen(false); setSwipeOffset(0); setIsHistoryView(false); }} title={isHistoryView ? "修改历史" : "记录详情"}>
        {summaryLog && (
            <div className="relative min-h-[300px] select-none overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                {!isHistoryView && (
                    <div className="flex items-center justify-between mb-4 pb-2">
                        <button onClick={() => switchLog('older')} disabled={!hasOlderLog} className={`p-2 rounded-full ${hasOlderLog ? 'text-brand-accent bg-blue-50 dark:bg-slate-800' : 'text-gray-200 dark:text-slate-800'}`}><ChevronLeft size={24} /></button>
                        <div className="text-center">
                            <h3 className="font-black text-2xl text-brand-text dark:text-slate-200">{new Date(summaryLog.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</h3>
                        </div>
                        <button onClick={() => switchLog('newer')} disabled={!hasNewerLog} className={`p-2 rounded-full ${hasNewerLog ? 'text-brand-accent bg-blue-50 dark:bg-slate-800' : 'text-gray-200 dark:text-slate-800'}`}><ChevronRight size={24} /></button>
                    </div>
                )}
                
                {isHistoryView ? <LogHistory log={summaryLog} /> : renderLogSummaryContent(summaryLog)}
                
                {!isHistoryView && (
                    <div className="flex justify-between w-full gap-3 mt-4">
                        <button onClick={() => { setIsSummaryModalOpen(false); handleDeleteRequest(summaryLog.date); }} className="px-4 py-2 rounded-2xl bg-brand-primary dark:bg-slate-700 text-brand-danger font-medium">删除</button>
                        <div className="flex gap-2">
                            <button onClick={() => setIsHistoryView(true)} className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-accent hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors" title="查看修改历史"><History size={20}/></button>
                            <button onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} className="px-6 py-2 rounded-2xl bg-brand-accent text-white font-bold shadow-lg shadow-blue-500/30">编辑详情</button>
                        </div>
                    </div>
                )}
                {isHistoryView && (
                     <button onClick={() => setIsHistoryView(false)} className="w-full py-3 mt-4 bg-slate-100 dark:bg-slate-800 text-brand-text dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">返回详情</button>
                )}
            </div>
        )}
        <SafeDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} message="确认要删除这一整天的记录吗？"/>
      </Modal>

      <Modal isOpen={isTrendWarningOpen} onClose={() => { setIsTrendWarningOpen(false); localStorage.setItem('HD_trend_warning_dismissed_date', new Date().toDateString()); }} title="📉 健康趋势预警">
        <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-bold text-red-700 dark:text-red-300 text-lg mb-2">硬度持续下滑</p>
                <p className="text-sm text-brand-text dark:text-slate-300 leading-relaxed">监测到您的晨勃硬度已连续 14 天低于平均水平 0.8 级以上。</p>
            </div>
            <button onClick={() => { setIsTrendWarningOpen(false); localStorage.setItem('HD_trend_warning_dismissed_date', new Date().toDateString()); }} className="w-full py-3 bg-brand-accent text-white font-bold rounded-xl shadow-lg mt-2">收到</button>
        </div>
      </Modal>
      
      {/* Masturbation Action Modal */}
      <Modal isOpen={isMbActionModalOpen} onClose={() => setIsMbActionModalOpen(false)} title="施法结束">
          <div className="space-y-3 pb-2">
              <p className="text-sm text-center text-slate-500 mb-4">辛苦了！请选择如何记录本次施法。</p>
              
              <button onClick={handleQuickFinishMb} className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex items-center justify-between group hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
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
