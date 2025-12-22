
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, NapRecord, AlcoholRecord } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Zap, Activity, Hand, Clock, Dumbbell, Beer, Edit3, Trash2, Bed, User, Sofa, X, Pill, Banana, Check } from 'lucide-react';
import Modal from './Modal';
import SafeDeleteModal from './SafeDeleteModal';
import { formatTime, analyzeSleep, LABELS } from '../utils/helpers';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import SupplementCycleBar from './SupplementCycleBar';

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
  const { logs, deleteLog, cancelOngoingNap, toggleSleepLog, cancelAlcoholRecord, cancelOngoingExercise, cancelOngoingMasturbation, supplements } = useData();
  const { showToast } = useToast();

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);

  const pendingLog = useMemo(() => logs.find(log => log.status === 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);
  const ongoingAlcohol = useMemo(() => logs.find(l => l.alcoholRecords?.some(r => r.ongoing))?.alcoholRecords?.find(r => r.ongoing), [logs]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const greeting = useMemo(() => { const h = new Date().getHours(); return h < 5 ? '夜深了' : h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好'; }, []);

  const handleCancelTask = async (type: string) => {
    if (!confirm('确定要取消并丢弃当前记录吗？')) return;
    try {
        switch(type) {
            case 'sleep': await toggleSleepLog(pendingLog || undefined); break;
            case 'nap': await cancelOngoingNap(); break;
            case 'mb': await cancelOngoingMasturbation(); break;
            case 'exercise': await cancelOngoingExercise(); break;
            case 'alcohol': await cancelAlcoholRecord(); break;
        }
        showToast('记录已取消', 'info');
    } catch (e) { showToast('取消失败', 'error'); }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-end px-2">
            <div><h1 className="text-3xl font-black dark:text-slate-100 tracking-tight">{greeting}</h1><p className="text-brand-muted text-sm font-medium">今天感觉如何？</p></div>
            <div className="w-10 h-10 bg-brand-card dark:bg-slate-900 rounded-full shadow-sm flex items-center justify-center border border-slate-100 dark:border-white/5"><User size={20} className="text-brand-muted"/></div>
        </div>

        {/* 正在进行的任务横幅 - 严格按照截图还原祖母绿样式 */}
        <section className="space-y-3 px-1">
            {pendingLog && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-full shadow-lg text-white flex justify-between items-center transition-all animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 pl-2"><Bed size={20} className="animate-pulse"/><div className="font-bold text-sm">正在睡觉中...</div></div>
                    <button onClick={() => onEdit(pendingLog.date)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-black shadow-sm active:scale-95">醒了</button>
                </div>
            )}
            {ongoingAlcohol && (
                <div className="bg-emerald-500 p-4 rounded-full shadow-lg text-white flex justify-between items-center transition-all animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 pl-2"><div className="p-1 bg-white/20 rounded-full"><Check size={16}/></div><div className="font-bold text-sm">酒局计时开始</div></div>
                    <div className="flex items-center gap-3 pr-2">
                        <button onClick={() => onFinishAlcohol?.(ongoingAlcohol)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-black shadow-sm active:scale-95">完成</button>
                        <button onClick={() => handleCancelTask('alcohol')} className="p-1 opacity-60 hover:opacity-100"><X size={20}/></button>
                    </div>
                </div>
            )}
            {ongoingExercise && (
                <div className="bg-emerald-500 p-4 rounded-full shadow-lg text-white flex justify-between items-center transition-all animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 pl-2"><div className="p-1 bg-white/20 rounded-full"><Check size={16}/></div><div className="font-bold text-sm">运动开始</div></div>
                    <div className="flex items-center gap-3 pr-2">
                        <button onClick={() => onFinishExercise?.(ongoingExercise)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-black shadow-sm active:scale-95">完成</button>
                        <button onClick={() => handleCancelTask('exercise')} className="p-1 opacity-60 hover:opacity-100"><X size={20}/></button>
                    </div>
                </div>
            )}
            {ongoingMb && (
                <div className="bg-emerald-500 p-4 rounded-full shadow-lg text-white flex justify-between items-center transition-all animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 pl-2"><div className="p-1 bg-white/20 rounded-full"><Check size={16}/></div><div className="font-bold text-sm">开始施法 (已记录开始时间)</div></div>
                    <div className="flex items-center gap-3 pr-2">
                        <button onClick={() => onFinishMasturbation?.(ongoingMb)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-black shadow-sm active:scale-95">完成</button>
                        <button onClick={() => handleCancelTask('mb')} className="p-1 opacity-60 hover:opacity-100"><X size={20}/></button>
                    </div>
                </div>
            )}
            {ongoingNap && (
                <div className="bg-orange-500 p-4 rounded-full shadow-lg text-white flex justify-between items-center transition-all animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 pl-2"><Sofa size={20} className="animate-pulse"/><div className="font-bold text-sm">午休计时中</div></div>
                    <div className="flex items-center gap-3 pr-2">
                        <button onClick={() => onFinishNap?.(ongoingNap)} className="px-5 py-2 bg-white text-orange-600 rounded-full text-xs font-black active:scale-95">醒了</button>
                        <button onClick={() => handleCancelTask('nap')} className="p-1 opacity-60 hover:opacity-100"><X size={20}/></button>
                    </div>
                </div>
            )}
        </section>

        <CalendarHeatmap logs={logs} onDateClick={(d) => { const log = logs.find(l=>l.date===d); if(log) { setSummaryLog(log); setIsSummaryModalOpen(true); } else onDateClick(d); }}>
            <SupplementCycleBar supplements={supplements} currentDate={todayStr} />
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-soft flex flex-col h-56 transition-colors overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                        <Moon size={18} className="text-blue-500" />
                        <span className="text-sm font-bold">7日睡眠流</span>
                        <span className="ml-auto text-[10px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-full">正在休息</span>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
                         {/* 睡眠图表逻辑... */}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-soft flex flex-col justify-between h-56 transition-colors">
                    <div className="flex items-center gap-2">
                        <Activity size={18} className="text-orange-500" />
                        <span className="text-sm font-bold">活跃</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between text-xs font-bold text-slate-400"><span>运动</span><span className="text-slate-800 dark:text-slate-100">0次</span></div>
                        <div className="flex justify-between text-xs font-bold text-slate-400"><span>自慰</span><span className="text-slate-800 dark:text-slate-100">0次</span></div>
                    </div>
                    <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <Zap size={10} className="text-amber-500" /> 今日能量状态正常
                    </div>
                </div>
            </div>
        </CalendarHeatmap>
      </div>

      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="日记详情" footer={<button onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog!.date); }} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black">编辑详情</button>}>
        {summaryLog && <div className="space-y-6">
            <h2 className="text-2xl font-black">{summaryLog.date}</h2>
            {/* 详情内容... */}
        </div>}
      </Modal>
    </>
  );
};

export default Dashboard;
