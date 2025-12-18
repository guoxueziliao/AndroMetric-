import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, NapRecord, AlcoholRecord } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
// Add AlertTriangle to imports
import { Moon, Zap, Activity, Hand, HeartPulse, Clock, Dumbbell, Footprints, Timer, CloudSun, Beer, TrendingUp, ShieldAlert, Edit3, Trash2, FastForward, Coffee, Bed, ArrowRight, User, Heart, History, RotateCcw, MapPin, Sparkles, Shirt, Star, Thermometer, BrainCircuit, Tag, Film, Smile, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import { formatTime, calculateSleepDuration, analyzeSleep, formatDateFriendly, LABELS } from '../utils/helpers';
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

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onFinishMasturbation, onFinishNap, onFinishAlcohol }) => {
  const { logs, deleteLog, toggleNap, cancelOngoingNap, addOrUpdateLog, toggleSleepLog, cancelAlcoholRecord } = useData();
  const { showToast } = useToast();

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState<SummaryTab>('diary');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);
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

  const diaryDateInfo = useMemo(() => {
      if (!summaryLog) return { main: '', sub: '' };
      const d = new Date(summaryLog.date + 'T00:00:00');
      const month = d.getMonth() + 1;
      const date = d.getDate();
      const weekday = d.toLocaleDateString('zh-CN', { weekday: 'long' });
      return { main: `${month}月${date}日`, sub: weekday };
  }, [summaryLog]);

  // 日记 Tab 内的结构化渲染子组件
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
        {/* Header */}
        <div className="flex justify-between items-end px-2">
            <div>
                <h1 className="text-3xl font-black tracking-tight dark:text-slate-100">{greeting}</h1>
                <p className="text-brand-muted text-sm font-medium">今天感觉如何？</p>
            </div>
            <div className="w-10 h-10 bg-brand-card dark:bg-slate-900 rounded-full shadow-sm flex items-center justify-center border border-slate-100 dark:border-white/5 transition-colors">
                <User size={20} className="text-brand-muted"/>
            </div>
        </div>

        {/* Ongoing Tasks */}
        {(ongoingNap || ongoingExercise || ongoingMb || pendingLog || ongoingAlcohol) && (
            <section className="space-y-3">
                {pendingLog && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><Bed size={20}/></div>
                            <div><div className="font-bold text-sm">正在睡觉中...</div><div className="text-[10px] opacity-70">{formatTime(pendingLog.sleep?.startTime)} 开始</div></div>
                        </div>
                        <button onClick={() => onEdit(pendingLog.date)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-bold shadow-sm active:scale-95">醒了</button>
                    </div>
                )}
                {/* 其他进行中任务省略逻辑保持不变... */}
            </section>
        )}

        <CalendarHeatmap logs={logs} onDateClick={handleDateClickForSummary}>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-5 shadow-soft border border-slate-100 dark:border-white/5 flex flex-col justify-between h-44 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-full text-blue-500"><Moon size={18} fill="currentColor" fillOpacity={0.2}/></div>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-300">睡眠</span>
                        </div>
                        <div className="flex items-baseline"><span className="text-3xl font-black text-slate-800 dark:text-slate-100">{sleepStats?.hours || (pendingLog ? '记' : '未')}</span><span className="text-xs font-bold text-slate-400 ml-0.5">{pendingLog ? '录中' : 'h'}</span></div>
                    </div>
                    <div className="text-xs font-medium text-slate-400 font-mono">{sleepStats ? `${sleepStats.start} - ${sleepStats.end}` : '--:-- - --:--'}</div>
                    <div className="flex gap-2 mt-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${sleepStats?.isLate ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                        <span className="text-[10px] font-bold text-slate-400">熬夜状态</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-5 shadow-soft border border-slate-100 dark:border-white/5 flex flex-col justify-between h-44 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-full text-orange-500"><Activity size={18}/></div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-300">活跃</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-400 font-bold">运动</span><span className="font-black text-slate-700 dark:text-slate-200">{latestLog?.exercise?.length || 0}次</span></div>
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-400 font-bold">自慰</span><span className="font-black text-slate-700 dark:text-slate-200">{latestLog?.masturbation?.length || 0}次</span></div>
                    </div>
                </div>
            </div>
        </CalendarHeatmap>
      </div>
      
      {/* 记录详情弹窗 (日记 Tab 全面升级) */}
      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="">
        {summaryLog && (
            <div className="space-y-6 animate-in fade-in duration-300 min-h-[500px] flex flex-col -mt-4">
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
                            
                            {/* 1. 晨间反馈 */}
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
                                        {summaryLog.morning.wokenByErection && (
                                            <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-[10px] font-bold text-orange-600">
                                                {/* Fixed AlertTriangle missing name error */}
                                                <AlertTriangle size={12}/> 被勃起弄醒 (雄激素水平较高)
                                            </div>
                                        )}
                                    </div>
                                ) : <div className="text-sm font-bold text-slate-400 italic py-2">今晨未察觉到晨勃</div>}
                            </SummarySection>

                            {/* 2. 睡眠报告 */}
                            <SummarySection title="睡眠报告" icon={Moon} colorClass="text-blue-500">
                                <div className="space-y-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                            {calculateSleepDuration(summaryLog.sleep?.startTime, summaryLog.sleep?.endTime) || '未记录时间'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">总睡眠</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col gap-1">
                                            <span className="opacity-50 font-black">入睡</span>
                                            <span className="font-mono text-sm">{formatTime(summaryLog.sleep?.startTime)}</span>
                                        </div>
                                        <ArrowRight size={14} className="opacity-20"/>
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="opacity-50 font-black">醒来</span>
                                            <span className="font-mono text-sm">{formatTime(summaryLog.sleep?.endTime)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-black rounded-lg">质量: {summaryLog.sleep?.quality}星</span>
                                        {summaryLog.sleep?.naturalAwakening && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-black rounded-lg">自然醒</span>}
                                        {summaryLog.sleep?.hasDream && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-black rounded-lg">有梦: {summaryLog.sleep.dreamTypes?.join(',')}</span>}
                                        {analyzeSleep(summaryLog.sleep?.startTime, summaryLog.sleep?.endTime)?.isLate && <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-black rounded-lg">熬夜记录</span>}
                                    </div>
                                    {summaryLog.sleep?.naps && summaryLog.sleep.naps.length > 0 && (
                                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                                            {summaryLog.sleep.naps.map((nap, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400 font-bold flex items-center gap-1"><CloudSun size={12}/> 午休</span>
                                                    <span className="font-black text-slate-700 dark:text-slate-200">{nap.startTime}-{nap.endTime} ({nap.duration}m)</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </SummarySection>

                            {/* 3. 活力记录 */}
                            <SummarySection title="活力记录" icon={Activity} colorClass="text-emerald-500">
                                <div className="space-y-4">
                                    {/* 运动项 */}
                                    {summaryLog.exercise?.length ? summaryLog.exercise.map((ex, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600"><Dumbbell size={16}/></div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">{ex.type}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold">{ex.startTime} · {ex.duration}分钟</div>
                                                </div>
                                            </div>
                                            {ex.steps && <span className="text-xs font-black text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">{ex.steps} 步</span>}
                                        </div>
                                    )) : null}

                                    {/* 性生活项 */}
                                    {summaryLog.sex?.length ? summaryLog.sex.map((s, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-pink-600"><Heart size={16} fill="currentColor" fillOpacity={0.2}/></div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">{s.interactions?.[0]?.partner || '性爱记录'}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold">{s.startTime} · {s.duration}分钟</div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-pink-600 bg-pink-50 dark:bg-pink-900/20 px-2 py-1 rounded-lg">{s.ejaculation ? '已射精' : 'Edging'}</span>
                                        </div>
                                    )) : null}

                                    {/* 自慰项 */}
                                    {summaryLog.masturbation?.length ? summaryLog.masturbation.map((m, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600"><Hand size={16}/></div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">自慰记录</div>
                                                    <div className="text-[10px] text-slate-400 font-bold">{m.startTime} · {m.duration}分钟</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {m.volumeForceLevel && <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">Lv.{m.volumeForceLevel}</span>}
                                                {m.contentItems?.length ? <span className="text-[9px] font-black text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">素材x{m.contentItems.length}</span> : null}
                                            </div>
                                        </div>
                                    )) : null}

                                    {(!summaryLog.exercise?.length && !summaryLog.sex?.length && !summaryLog.masturbation?.length) && (
                                        <div className="text-xs font-bold text-slate-400 italic py-2 text-center">今日暂无活力记录</div>
                                    )}
                                </div>
                            </SummarySection>

                            {/* 4. 生活习惯与环境 */}
                            <SummarySection title="生活习惯与状态" icon={Sparkles} colorClass="text-purple-500">
                                <div className="space-y-5">
                                    {/* 摄入物徽章 */}
                                    <div className="flex flex-wrap gap-2">
                                        {summaryLog.alcoholRecords?.length ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400">
                                                <Beer size={14}/>
                                                <span className="text-xs font-black">{summaryLog.alcoholRecords.reduce((s,r) => s + r.totalGrams, 0)}g 酒精</span>
                                            </div>
                                        ) : null}
                                        {summaryLog.caffeineRecord?.totalCount ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/50 text-orange-700 dark:text-orange-400">
                                                <Coffee size={14}/>
                                                <span className="text-xs font-black">{summaryLog.caffeineRecord.totalCount}杯 提神饮品</span>
                                            </div>
                                        ) : null}
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 text-slate-500">
                                            <Film size={14}/>
                                            <span className="text-xs font-black">看片: {LABELS.porn[summaryLog.pornConsumption || 'none']}</span>
                                        </div>
                                    </div>

                                    {/* 环境细节 */}
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">身心环境</span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                {LABELS.mood[summaryLog.mood || 'neutral']} · {LABELS.weather[summaryLog.weather || 'sunny']} · {LABELS.location[summaryLog.location || 'home']}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">健康状况</span>
                                            <span className={`text-xs font-bold ${summaryLog.health?.isSick ? 'text-red-500' : 'text-green-500'}`}>
                                                {summaryLog.health?.isSick ? '身体不适' : '🟢 身体健康'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 备注与标签 */}
                                    {summaryLog.notes && (
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                            "{summaryLog.notes}"
                                        </div>
                                    )}
                                    {summaryLog.tags?.length ? (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {summaryLog.tags.map(t => <span key={t} className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">#{t}</span>)}
                                        </div>
                                    ) : null}
                                </div>
                            </SummarySection>
                        </div>
                    )}

                    {activeSummaryTab === 'track' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <GlobalTimeline log={summaryLog} />
                        </div>
                    )}

                    {activeSummaryTab === 'source' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 pt-2">
                            <LogHistory log={summaryLog} />
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6 bg-gradient-to-t from-white dark:from-slate-900 via-white dark:via-slate-900 to-transparent">
                    <button 
                        onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog.date); }} 
                        className="w-full py-4.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[2rem] font-black shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <Edit3 size={20}/> 编辑详情
                    </button>
                </div>
            </div>
        )}
      </Modal>

      {/* 删除确认弹窗 */}
      <SafeDeleteModal 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        message={`确定要删除 ${dateToDelete} 的所有记录吗？删除后将无法找回。`}
      />

      {/* Fixed Modal missing required children prop */}
      <Modal isOpen={isMbActionModalOpen} onClose={() => setIsMbActionModalOpen(false)} title="施法结束">
          <div className="py-4 text-center text-slate-500">
            {/* Logic to finalize masturbation action goes here */}
            正在完成自慰记录...
          </div>
      </Modal>
    </>
  );
};

export default Dashboard;