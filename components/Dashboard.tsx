
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, MasturbationRecordDetails, NapRecord, SexRecordDetails } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Hand, CloudSun, Heart, StopCircle, X, Dumbbell, User, Clock, Edit3, Trash2, Activity, Zap, SunMedium, Beer, BedDouble, History as HistoryIcon, ChevronRight, HeartPulse, Flame } from 'lucide-react';
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

const SleepBarChart = ({ logs }: { logs: LogEntry[] }) => {
    const last7Days = useMemo(() => {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const log = logs.find(l => l.date === dateStr);
            let hours = 0;
            if (log?.sleep?.startTime && log?.sleep?.endTime) {
                const s = new Date(log.sleep.startTime).getTime();
                const e = new Date(log.sleep.endTime).getTime();
                hours = Math.max(0, (e - s) / (1000 * 60 * 60));
            }
            result.push({ hours, isToday: i === 0 });
        }
        return result;
    }, [logs]);

    return (
        <div className="flex items-end gap-1.5 h-12 mt-2 px-1">
            {last7Days.map((d, i) => (
                <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm transition-all duration-500 ${d.isToday ? 'bg-amber-400' : 'bg-brand-accent/30 dark:bg-brand-accent/50'}`}
                    style={{ height: `${Math.max(10, Math.min(100, (d.hours / 10) * 100))}%` }}
                />
            ))}
        </div>
    );
};

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

const Banner = ({ type, title, subtitle, color, icon: Icon, onMain, onCancel }: any) => (
    <div className={`rounded-2xl p-4 text-white shadow-lg flex items-center justify-between animate-in slide-in-from-top-2 fade-in ${color}`}>
        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={onMain}>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse"><Icon size={20}/></div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{type}</div>
                <div className="text-lg font-black truncate">{title} <span className="ml-1 font-mono text-sm opacity-70">{subtitle}</span></div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onCancel?.(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X size={16}/></button>
            <button onClick={(e) => { e.stopPropagation(); onMain?.(); }} className="bg-white/90 px-4 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center shrink-0 text-slate-800 hover:bg-white transition-colors">详情</button>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onEdit, onDateClick, onNavigateToBackup, onFinishExercise, onCancelExercise, onFinishMasturbation, onCancelMasturbation, onEditAlcohol, onCancelAlcohol, onWakeUp, onCancelSleep, onFinishNap, onCancelNap, onFinishSex, onCancelSex }) => {
  const { logs, deleteLog } = useData();
  const { showToast } = useToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'diary' | 'track' | 'trace'>('diary');
  
  const todayStr = getTodayDateString();
  const todayLog = useMemo(() => logs.find(l => l.date === todayStr), [logs, todayStr]);

  // 6路并发横幅状态
  const ongoingAlcohol = useMemo(() => logs.find(l => l.alcoholRecord?.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingSleep = useMemo(() => logs.find(l => l.sleep?.startTime && !l.sleep?.endTime), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingSex = useMemo(() => logs.flatMap(l => l.sex || []).find(s => s.ongoing), [logs]);

  const greeting = useMemo(() => { const hour = new Date().getHours(); if (hour < 5) return '夜深了'; if (hour < 12) return '早上好'; if (hour < 18) return '下午好'; return '晚上好'; }, []);

  const stats = useMemo(() => {
      const validLogs = logs.filter(l => l.status === 'completed' && l.morning);
      const totalMb = logs.reduce((acc, l) => acc + (l.masturbation?.length || 0), 0);
      const totalSex = logs.reduce((acc, l) => acc + (l.sex?.length || 0), 0);
      
      const avgHardness = validLogs.length > 0 
        ? (validLogs.reduce((acc, l) => acc + (l.morning?.hardness || 0), 0) / validLogs.length).toFixed(1)
        : '0.0';
        
      const mwRate = validLogs.length > 0
        ? Math.round((validLogs.filter(l => l.morning?.wokeWithErection).length / validLogs.length) * 100)
        : 0;

      const todayExercise = todayLog?.exercise?.length || 0;
      const todaySexual = (todayLog?.sex?.length || 0) + (todayLog?.masturbation?.length || 0);
      
      let sleepDisplay = '--';
      if (todayLog?.sleep?.startTime && todayLog?.sleep?.endTime) {
          const s = new Date(todayLog.sleep.startTime).getTime();
          const e = new Date(todayLog.sleep.endTime).getTime();
          sleepDisplay = ((e - s) / (1000 * 60 * 60)).toFixed(1);
      }

      return { totalMb, totalSex, avgHardness, mwRate, todayExercise, todaySexual, sleepDisplay };
  }, [logs, todayLog]);

  const handleDateClickForSummary = (date: string) => { const log = logs.find(l => l.date === date); if (log) { if (log.status === 'pending' && date !== todayStr) { onEdit(log.date); } else { setSummaryLog(log); setActiveSummaryTab('diary'); setIsSummaryModalOpen(true); } } else { onDateClick(date); } };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-brand-text dark:text-slate-100 flex items-center">{greeting} <span className="text-2xl ml-2">👋</span></h1>
          <p className="text-sm text-brand-muted font-medium mt-1">今天也要保持好状态</p>
        </div>
        <button onClick={onNavigateToBackup} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-105 transition-transform"><User size={24} className="text-brand-accent"/></button>
      </div>

      {/* 6路横幅恢复 */}
      <div className="flex flex-col gap-3">
          {ongoingSleep && <Banner type="正在睡觉" title="记录中..." subtitle={`${formatTime(ongoingSleep.sleep?.startTime || '')} 睡下`} color="bg-indigo-600 shadow-indigo-500/30" icon={BedDouble} onMain={onWakeUp} onCancel={onCancelSleep}/>}
          {ongoingNap && <Banner type="正在午休" title="梦境生长中..." subtitle={`${ongoingNap.startTime} 开始`} color="bg-orange-500 shadow-orange-500/30" icon={CloudSun} onMain={() => onFinishNap?.(ongoingNap)} onCancel={() => onCancelNap?.(ongoingNap.id)}/>}
          {ongoingSex && <Banner type="性爱进行中" title="热汗淋漓..." subtitle={`${ongoingSex.startTime} 开始`} color="bg-pink-500 shadow-pink-500/30" icon={Heart} onMain={() => onFinishSex?.(ongoingSex)} onCancel={onCancelSex}/>}
          {ongoingMb && <Banner type="正在施法" title="专注中..." subtitle={`${ongoingMb.startTime} 开始`} color="bg-blue-500 shadow-blue-500/30" icon={Hand} onMain={onFinishMasturbation} onCancel={onCancelMasturbation}/>}
          {ongoingExercise && <Banner type="正在运动" title={ongoingExercise.type} subtitle={`${ongoingExercise.startTime} 开始`} color="bg-emerald-600 shadow-emerald-500/30" icon={Dumbbell} onMain={onFinishExercise} onCancel={onCancelExercise}/>}
          {ongoingAlcohol && <Banner type="开怀畅饮" title="酒精摄入中..." subtitle={`${ongoingAlcohol.alcoholRecord?.startTime} 开始`} color="bg-amber-600 shadow-amber-500/30" icon={Beer} onMain={onEditAlcohol} onCancel={onCancelAlcohol}/>}
      </div>

      <div className="bg-brand-card dark:bg-slate-900 rounded-3xl p-4 shadow-soft border border-slate-100 dark:border-slate-800 mb-6">
        <CalendarHeatmap logs={logs.filter(l => l.status === 'completed' || l.date === todayStr)} onDateClick={handleDateClickForSummary} />
      </div>

      {/* 卡片配色适配 */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 dark:bg-slate-900/50 p-5 rounded-[2.5rem] shadow-lg h-44 flex flex-col justify-between overflow-hidden relative text-white transition-colors">
              <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Moon size={18} fill="currentColor" /></div>
                      <span className="text-sm font-bold">睡眠</span>
                  </div>
                  <div className="text-xl font-black text-white/40 font-mono">{stats.sleepDisplay}</div>
              </div>
              <div className="z-10"><span className="text-[10px] font-bold text-white/30 block mb-1">{stats.sleepDisplay !== '--' ? '今日睡眠时长' : '未记录时间'}</span><SleepBarChart logs={logs} /></div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-900/50 p-5 rounded-[2.5rem] shadow-lg h-44 flex flex-col justify-between text-white transition-colors">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400"><HeartPulse size={18} /></div>
              <div><h4 className="text-lg font-black mb-2">活力</h4>
                  <div className="space-y-1.5">
                      <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-orange-400 flex items-center gap-1"><Dumbbell size={10}/> 运动</span><span className="text-[10px] font-black text-white/60">{stats.todayExercise > 0 ? '已完成' : '未完成'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-pink-400 flex items-center gap-1"><Heart size={10} fill="currentColor"/> 性/手</span><span className="text-[10px] font-black text-white/60">{stats.todaySexual > 0 ? `${stats.todaySexual}次` : '无'}</span></div>
                  </div>
              </div>
              <div className="text-[10px] font-bold text-white/20 text-right">今日释放</div>
          </div>

          {[
              { label: '平均硬度', val: stats.avgHardness, icon: Zap, color: 'text-brand-accent', sub: '- 稳定' },
              { label: '晨勃率', val: `${stats.mwRate}%`, icon: SunMedium, color: 'text-blue-500', sub: '出现概率' },
              { label: '自慰次数', val: `${stats.totalMb}次`, icon: Hand, color: 'text-purple-500', sub: '本月释放' },
              { label: '性爱次数', val: `${stats.totalSex}次`, icon: Heart, color: 'text-pink-500', sub: 'High Quality' }
          ].map((c, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 h-44 flex flex-col justify-between">
                  <div className="flex justify-between items-start"><div className="text-xs font-bold text-slate-400">{c.label}</div><c.icon size={18} className={`${c.color} opacity-30`}/></div>
                  <div><div className={`text-4xl font-black tracking-tighter ${c.color}`}>{c.val}</div><div className="text-[10px] text-slate-400 font-bold mt-1">{c.sub}</div></div>
              </div>
          ))}
      </div>

      <Modal isOpen={isSummaryModalOpen} onClose={() => { setIsSummaryModalOpen(false); setSummaryLog(null); }} title="" footer={null}>
          {summaryLog && (
              <div className="pb-6">
                  <div className="flex justify-between items-start mb-6 px-1">
                      <div><h2 className="text-3xl font-black text-brand-text dark:text-slate-100 tracking-tighter">{new Date(summaryLog.date).getMonth() + 1}月{new Date(summaryLog.date).getDate()}日</h2><p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(summaryLog.date).toLocaleDateString('zh-CN', { weekday: 'long' })}</p></div>
                      <div className="flex gap-2">
                          <button onClick={() => setActiveSummaryTab('trace')} className={`p-2.5 rounded-2xl border transition-all ${activeSummaryTab === 'trace' ? 'bg-brand-accent text-white border-brand-accent shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:text-brand-accent'}`}><HistoryIcon size={18}/></button>
                          <button onClick={() => { setLogToDelete(summaryLog.date); setIsDeleteModalOpen(true); }} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                      </div>
                  </div>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
                      <button onClick={() => setActiveSummaryTab('diary')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center ${activeSummaryTab === 'diary' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}>日记</button>
                      <button onClick={() => setActiveSummaryTab('track')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center ${activeSummaryTab === 'track' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}>轨迹</button>
                      <button onClick={() => setActiveSummaryTab('trace')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center ${activeSummaryTab === 'trace' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-accent' : 'text-slate-400'}`}>溯源</button>
                  </div>
                  {activeSummaryTab === 'diary' && (<div className="space-y-6 animate-in fade-in slide-in-from-left-4"><DailyReportCard log={summaryLog} /><button onClick={() => { onEdit(summaryLog.date); setIsSummaryModalOpen(false); }} className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-3xl flex items-center justify-center shadow-lg"><Edit3 size={18} className="mr-2"/> 编辑详情</button></div>)}
                  {activeSummaryTab === 'track' && (<div className="animate-in fade-in slide-in-from-right-4"><GlobalTimeline log={summaryLog} /></div>)}
                  {activeSummaryTab === 'trace' && (<div className="animate-in fade-in slide-in-from-right-4"><LogHistory log={summaryLog} /></div>)}
              </div>
          )}
      </Modal>

      <SafeDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={async () => { if (logToDelete) { await deleteLog(logToDelete); showToast('记录已删除', 'success'); setIsDeleteModalOpen(false); setIsSummaryModalOpen(false); } }} />
    </div>
  );
};

export default Dashboard;
