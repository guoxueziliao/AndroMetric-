
import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { LogEntry, AppSettings, ExerciseRecord, MasturbationRecordDetails, AlcoholRecord, SexRecordDetails, NapRecord } from './types';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import BottomNav from './components/BottomNav';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import FAB from './components/FAB';
import SexRecordModal from './components/SexRecordModal';
import MasturbationRecordModal from './components/MasturbationRecordModal';
import ExerciseRecordModal from './components/ExerciseSelectorModal'; 
import AlcoholRecordModal from './components/AlcoholRecordModal'; 
import NapRecordModal from './components/NapRecordModal';
import CancelReasonModal from './components/CancelReasonModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import { useLogs } from './hooks/useLogs';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { DataContext } from './contexts/DataContext';

const MyView = lazy(() => import('./components/MyView'));
const StatsView = lazy(() => import('./components/StatsView'));
const SexLifeView = lazy(() => import('./components/SexLifeView'));

type View = 'dashboard' | 'form';
type MainView = 'calendar' | 'stats' | 'sexlife' | 'my';

const APP_VERSION = '0.0.6';

const defaultSettings: AppSettings = {
  version: APP_VERSION,
  theme: 'system',
  privacyMode: false,
  enableNotifications: false,
  notificationTime: { morning: '08:00', evening: '23:00' },
  hiddenFields: []
};

const AppContent: React.FC<{ data: any }> = ({ data }) => {
  const { logs, partners, quickAddSex, quickAddMasturbation, saveExercise, saveAlcoholRecord, saveNap, toggleAlcohol, toggleNap, toggleSleepLog, isInitializing, addOrUpdateLog } = data;
  const { showToast } = useToast();
  
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings);
  const [activeMainView, setActiveMainView] = useState<MainView>('calendar');
  const [view, setView] = useState<View>('dashboard');
  const [editingLogDate, setEditingLogDate] = useState<string | null>(null);
  
  // Modals Visibility
  const [isSexModalOpen, setIsSexModalOpen] = useState(false);
  const [isMbModalOpen, setIsMbModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false);
  const [isNapModalOpen, setIsNapModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Cancellation Context
  const [cancelTarget, setCancelTarget] = useState<{ type: 'alcohol' | 'mb' | 'exercise' | 'sleep' | 'nap' | 'sex', id?: string } | null>(null);

  // Ongoing references (6路全状态)
  const ongoingAlcohol = useMemo(() => logs.find((l: LogEntry) => l.alcoholRecord?.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap((l: LogEntry) => l.masturbation || []).find((m: MasturbationRecordDetails) => m.status === 'inProgress'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap((l: LogEntry) => l.exercise || []).find((e: ExerciseRecord) => e.ongoing), [logs]);
  const ongoingSleep = useMemo(() => logs.find((l: LogEntry) => l.sleep?.startTime && !l.sleep?.endTime), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap((l: LogEntry) => l.sleep?.naps || []).find((n: NapRecord) => n.ongoing), [logs]);
  const ongoingSex = useMemo(() => logs.flatMap((l: LogEntry) => l.sex || []).find((s: SexRecordDetails) => s.ongoing), [logs]);

  // --- Handlers for 6 Actions ---

  const handleAlcoholAction = async () => {
      if (ongoingAlcohol) setIsAlcoholModalOpen(true);
      else {
          const ok = await toggleAlcohol();
          if (ok) showToast('已开始饮酒计时', 'info');
      }
  };

  const handleMbAction = async () => {
      if (ongoingMb) setIsMbModalOpen(true);
      else {
          await quickAddMasturbation({ id: Date.now().toString(), status: 'inProgress', startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), tools: ['手'], contentItems: [] });
          showToast('已开始自慰计时', 'info');
      }
  };

  const handleExerciseAction = async () => {
      setIsExerciseModalOpen(true); 
  };

  const handleSleepAction = async () => {
      const targetDate = await toggleSleepLog();
      // 如果之前是正在睡的状态，现在唤醒了，自动进入表单补全
      if (ongoingSleep) {
          setEditingLogDate(targetDate);
          setView('form');
          showToast('早安，请补全今日睡眠评分', 'success');
      } else {
          showToast('晚安，开始记录睡眠', 'info');
      }
  };

  const handleNapAction = async () => {
      if (ongoingNap) setIsNapModalOpen(true);
      else {
          await toggleNap();
          showToast('开始午休计时', 'info');
      }
  };

  const handleSexAction = async () => {
      if (ongoingSex) {
          setIsSexModalOpen(true);
      } else {
          const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          await quickAddSex({
              id: Date.now().toString(),
              startTime: nowStr,
              ongoing: true,
              interactions: [],
              indicators: { lingerie: false, orgasm: true, partnerOrgasm: true, squirting: false, toys: false },
              ejaculation: true,
              ejaculationLocation: '',
              semenSwallowed: false,
              postSexActivity: [],
              partnerScore: 0,
              mood: 'happy'
          });
          showToast('已开始性爱计时', 'info');
      }
  };

  const triggerCancel = (type: any, id?: string) => { setCancelTarget({ type, id }); setIsCancelModalOpen(true); };

  const confirmCancel = async (reason: string) => {
      if (!cancelTarget) return;
      const { type, id } = cancelTarget;
      try {
          if (type === 'sleep' && ongoingSleep) {
              await addOrUpdateLog({ ...ongoingSleep, sleep: null, status: 'completed' });
          } else if (type === 'nap' && ongoingNap) {
              const log = logs.find((l: LogEntry) => l.sleep?.naps?.some(n => n.id === ongoingNap.id));
              if (log) await addOrUpdateLog({ ...log, sleep: { ...log.sleep!, naps: log.sleep!.naps.filter(n => n.id !== ongoingNap.id) } });
          } else if (type === 'mb' && ongoingMb) {
              await quickAddMasturbation(ongoingMb, true, reason);
          } else if (type === 'alcohol' && ongoingAlcohol) {
              await addOrUpdateLog({ ...ongoingAlcohol, alcoholRecord: null, alcohol: 'none' });
          } else if (type === 'exercise' && ongoingExercise) {
              const log = logs.find((l: LogEntry) => l.exercise?.some(e => e.id === ongoingExercise.id));
              if (log) await addOrUpdateLog({ ...log, exercise: log.exercise!.filter(e => e.id !== ongoingExercise.id) });
          } else if (type === 'sex' && ongoingSex) {
              await quickAddSex(ongoingSex, true);
          }
          showToast(`已移除 (${reason})`, 'info');
      } catch (e: any) {
          showToast(e.message, 'error');
      } finally {
          setIsCancelModalOpen(false);
          setCancelTarget(null);
      }
  };

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-brand-accent" size={32}/></div>;

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 text-brand-text dark:text-slate-200">
      <div className="container mx-auto max-w-lg p-4 pb-40"> {/* 加大 pb 确保导航不被遮挡 */}
        {view === 'dashboard' && (
          <main className="relative z-10">
            {activeMainView === 'calendar' && (
              <Dashboard 
                onEdit={d => { setEditingLogDate(d); setView('form'); }} 
                onDateClick={d => { setEditingLogDate(d); setView('form'); }} 
                onNavigateToBackup={() => setActiveMainView('my')}
                onEditAlcohol={handleAlcoholAction}
                onCancelAlcohol={() => triggerCancel('alcohol')}
                onFinishMasturbation={handleMbAction}
                onCancelMasturbation={() => triggerCancel('mb')}
                onFinishExercise={handleExerciseAction}
                onCancelExercise={() => triggerCancel('exercise')}
                onWakeUp={handleSleepAction}
                onCancelSleep={() => triggerCancel('sleep')}
                onFinishNap={handleNapAction}
                onCancelNap={() => triggerCancel('nap')}
                onFinishSex={handleSexAction}
                onCancelSex={() => triggerCancel('sex')}
              />
            )}
            <Suspense fallback={<div className="p-10 text-center opacity-50"><Loader2 className="animate-spin mx-auto mb-2"/>加载中...</div>}>
                {activeMainView === 'stats' && <StatsView isDarkMode={false} />}
                {activeMainView === 'sexlife' && <SexLifeView />}
                {activeMainView === 'my' && <MyView settings={settings} onUpdateSettings={setSettings} installPrompt={null} onShowVersionHistory={() => setIsVersionHistoryOpen(true)} onNavigateToLog={d => { setEditingLogDate(d); setView('form'); }} />}
            </Suspense>
          </main>
        )}

        {view === 'form' && (
          <main className="relative z-10">
            <button onClick={() => setView('dashboard')} className="mb-4 flex items-center text-slate-400 font-bold hover:text-brand-accent transition-colors"><ArrowLeft size={20} className="mr-2"/>返回仪表盘</button>
            <LogForm onSave={async l => { await addOrUpdateLog(l); setView('dashboard'); }} existingLog={editingLogDate ? logs.find((l: LogEntry) => l.date === editingLogDate) || null : null} logDate={editingLogDate} onDirtyStateChange={() => {}} logs={logs} partners={partners} />
          </main>
        )}

        {/* 导航层确保在最顶层 z-40+ */}
        {view === 'dashboard' && (
          <div className="relative z-[50]">
            <FAB 
                onSleep={handleSleepAction} onSex={handleSexAction} onMasturbation={handleMbAction} onExercise={handleExerciseAction} onNap={handleNapAction} onAlcohol={handleAlcoholAction}
                isSleepPending={!!ongoingSleep} isAlcoholOngoing={!!ongoingAlcohol} isMbOngoing={!!ongoingMb} isExerciseOngoing={!!ongoingExercise} isNapOngoing={!!ongoingNap} isSexOngoing={!!ongoingSex}
            />
            <BottomNav activeView={activeMainView} onViewChange={setActiveMainView} />
          </div>
        )}

        <SexRecordModal isOpen={isSexModalOpen} onClose={() => setIsSexModalOpen(false)} onSave={async r => { await quickAddSex({...r, ongoing: false}); setIsSexModalOpen(false); showToast('性爱记录已添加', 'success'); }} dateStr={new Date().toISOString()} partners={partners} logs={logs} initialData={ongoingSex} />
        <MasturbationRecordModal isOpen={isMbModalOpen} onClose={() => setIsMbModalOpen(false)} onSave={async r => { await quickAddMasturbation({...r, status: 'completed'}); setIsMbModalOpen(false); showToast('记录已更新', 'success'); }} initialData={ongoingMb} dateStr={new Date().toISOString()} logs={logs} partners={partners} />
        <ExerciseRecordModal isOpen={isExerciseModalOpen} onClose={() => setIsExerciseModalOpen(false)} onSave={async r => { await saveExercise({...r, ongoing: r.ongoing ?? false}); setIsExerciseModalOpen(false); showToast('运动记录已同步', 'success'); }} initialData={ongoingExercise} mode={ongoingExercise ? 'finish' : 'start'} />
        <AlcoholRecordModal isOpen={isAlcoholModalOpen} onClose={() => setIsAlcoholModalOpen(false)} onSave={async r => { await saveAlcoholRecord({...r, ongoing: false}); setIsAlcoholModalOpen(false); showToast('饮酒详情已更新', 'success'); }} initialData={ongoingAlcohol?.alcoholRecord || undefined} />
        <NapRecordModal isOpen={isNapModalOpen} onClose={() => setIsNapModalOpen(false)} onSave={async r => { await saveNap({...r, ongoing: false}); setIsNapModalOpen(false); showToast('午休已记录', 'success'); }} initialData={ongoingNap} />
        <CancelReasonModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={confirmCancel} title="取消当前计时" />
        <VersionHistoryModal isOpen={isVersionHistoryOpen} onClose={() => setIsVersionHistoryOpen(false)} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
    const data = useLogs();
    return (
        <ToastProvider>
            <DataContext.Provider value={data}>
                <AppContent data={data} />
            </DataContext.Provider>
        </ToastProvider>
    );
};

export default App;
