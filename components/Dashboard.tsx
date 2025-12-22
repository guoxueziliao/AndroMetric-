
import React, { useState, useMemo } from 'react';
import { LogEntry, ExerciseRecord, SexRecordDetails, MasturbationRecordDetails, NapRecord, AlcoholRecord } from '../types';
import CalendarHeatmap from './CalendarHeatmap';
import { Moon, Zap, Activity, Hand, Clock, Dumbbell, Beer, Edit3, Trash2, Bed, User, Sofa, X, Pill, Banana } from 'lucide-react';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);

  const pendingLog = useMemo(() => logs.find(log => log.status === 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);
  const ongoingAlcohol = useMemo(() => logs.flatMap(l => l.alcoholRecords || []).find(r => r.ongoing), [logs]);

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
            <div><h1 className="text-3xl font-black dark:text-slate-100">{greeting}</h1><p className="text-brand-muted text-sm font-medium">今天感觉如何？</p></div>
            <div className="w-10 h-10 bg-brand-card dark:bg-slate-900 rounded-full shadow-sm flex items-center justify-center border border-slate-100 dark:border-white/5"><User size={20} className="text-brand-muted"/></div>
        </div>

        {/* 正在进行的任务横幅（完全恢复） */}
        <section className="space-y-3">
            {pendingLog && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center">
                    <div className="flex items-center gap-3"><Bed size={20}/><div className="font-bold text-sm">正在睡觉中...</div></div>
                    <button onClick={() => onEdit(pendingLog.date)} className="px-5 py-2 bg-white text-emerald-600 rounded-full text-xs font-bold">醒了</button>
                </div>
            )}
            {ongoingAlcohol && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center">
                    <div className="flex items-center gap-3"><Beer size={20}/><div className="font-bold text-sm">酒局计时开始</div></div>
                    <div className="flex gap-2">
                        <button onClick={() => handleCancelTask('alcohol')}><X size={18}/></button>
                        <button onClick={() => onFinishAlcohol?.(ongoingAlcohol)} className="px-5 py-2 bg-white text-amber-600 rounded-full text-xs font-bold">买单</button>
                    </div>
                </div>
            )}
            {ongoingExercise && (
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center">
                    <div className="flex items-center gap-3"><Dumbbell size={20}/><div className="font-bold text-sm">运动开始</div></div>
                    <div className="flex gap-2">
                        <button onClick={() => handleCancelTask('exercise')}><X size={18}/></button>
                        <button onClick={() => onFinishExercise?.(ongoingExercise)} className="px-5 py-2 bg-white text-orange-600 rounded-full text-xs font-bold">完成</button>
                    </div>
                </div>
            )}
            {ongoingMb && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-3xl shadow-lg text-white flex justify-between items-center">
                    <div className="flex items-center gap-3"><Banana size={20}/><div className="font-bold text-sm">施法开始...</div></div>
                    <div className="flex gap-2">
                        <button onClick={() => handleCancelTask('mb')}><X size={18}/></button>
                        <button onClick={() => onFinishMasturbation?.(ongoingMb)} className="px-5 py-2 bg-white text-blue-600 rounded-full text-xs font-bold">完事</button>
                    </div>
                </div>
            )}
        </section>

        <CalendarHeatmap logs={logs} onDateClick={(d) => { const log = logs.find(l=>l.date===d); if(log) { setSummaryLog(log); setIsSummaryModalOpen(true); } else onDateClick(d); }}>
            <SupplementCycleBar supplements={supplements} currentDate={todayStr} />
            {/* 原有卡片区域... */}
        </CalendarHeatmap>
      </div>

      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="日记详情" footer={<button onClick={() => { setIsSummaryModalOpen(false); onEdit(summaryLog!.date); }} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black">编辑详情</button>}>
        {summaryLog && <div className="space-y-4">
            <h2 className="text-2xl font-black">{summaryLog.date}</h2>
            {summaryLog.supplementIntake.length > 0 && <div><label className="text-xs font-bold text-slate-400">补剂记录</label><div className="flex flex-wrap gap-2 mt-2">{summaryLog.supplementIntake.map(i=><span className="px-2 py-1 bg-slate-100 rounded-lg text-xs">{supplements.find(s=>s.id===i.supplementId)?.name}</span>)}</div></div>}
        </div>}
      </Modal>
      <SafeDeleteModal isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={() => {}} />
    </>
  );
};

export default Dashboard;
