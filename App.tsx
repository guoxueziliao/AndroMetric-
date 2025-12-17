
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
  
  // --- Theme Logic ---
  const isCurrentlyDark = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [settings.theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isCurrentlyDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isCurrentlyDark]);
  
  // Modals Visibility
  const [isSexModalOpen, setIsSexModalOpen] = useState(false);
  const [isMbModalOpen, setIsMbModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false);
  const [isNapModalOpen, setIsNapModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Cancellation Context
  const [cancelTarget, setCancelTarget] = useState<{ type: 'alcohol' | 'mb' | 'exercise' | 'sleep' | 'nap' | 'sex', id?: string, date?: string } | null>(null);

  // Ongoing Data Finders (With Date context)
  const ongoingAlcoholInfo = useMemo(() => {
    const log = logs.find((l: LogEntry) => l.alcoholRecord?.ongoing);
    return log ? { log, record: log.alcoholRecord! } : null;
  }, [logs]);

  const ongoingMbInfo = useMemo(() => {
    const log = logs.find((l: LogEntry) => l.masturbation?.some(m => m.status === 'inProgress'));
    return log ? { log, record: log.masturbation!.find(m => m.status === 'inProgress')! } : null;
  }, [logs]);

  const ongoingExerciseInfo = useMemo(() => {
    const log = logs.find((l: LogEntry) => l.exercise?.some(e => e.ongoing));
    return log ? { log, record: log.exercise!.find(e => e.ongoing)! } : null;
  }, [logs]);

  const ongoingSleepInfo = useMemo(() => {
    const log = logs.find((l: LogEntry) => l.sleep?.startTime && !l.sleep?.endTime);
    return log ? { log } : null;
  }, [logs]);

  const ongoingNapInfo = useMemo(() => {
    const log = logs.find((l: LogEntry) => l.sleep?.naps?.some(n => n.ongoing));
    return log ? { log, record: log.sleep!.naps.find(n => n.ongoing)! } : null;
  }, [logs]);

  const ongoingSexInfo = useMemo(() => {
    const log = logs.find((l: LogEntry) => l.sex?.some(s => s.ongoing));
    return log ? { log, record: log.sex!.find(s => s.ongoing)! } : null;
  }, [logs]);

  // Handlers
  const handleAlcoholAction = async () => { if (ongoingAlcoholInfo) setIsAlcoholModalOpen(true); else { const ok = await toggleAlcohol(); if (ok) showToast('已开始饮酒计时', 'info'); } };
  const handleMbAction = async () => { if (ongoingMbInfo) setIsMbModalOpen(true); else { await quickAddMasturbation({ id: Date.now().toString(), status: 'inProgress', startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), tools: ['手'], contentItems: [] }); showToast('已开始自慰计时', 'info'); } };
  const handleExerciseAction = async () => { setIsExerciseModalOpen(true); };
  const handleSleepAction = async () => { const targetDate = await toggleSleepLog(); if (ongoingSleepInfo) { setEditingLogDate(targetDate); setView('form'); showToast('早安，补全记录', 'success'); } else { showToast('晚安', 'info'); } };
  const handleNapAction = async () => { if (ongoingNapInfo) setIsNapModalOpen(true); else { await toggleNap(); showToast('开始午休计时', 'info'); } };
  const handleSexAction = async () => { if (ongoingSexInfo) setIsSexModalOpen(true); else { const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); await quickAddSex({ id: Date.now().toString(), startTime: nowStr, ongoing: true, interactions: [], indicators: { lingerie: false, orgasm: true, partnerOrgasm: true, squirting: false, toys: false }, ejaculation: true, ejaculationLocation: '', semenSwallowed: false, postSexActivity: [], partnerScore: 0, mood: 'happy' }); showToast('已开始性爱计时', 'info'); } };

  const triggerCancel = (type: any, id?: string, date?: string) => { setCancelTarget({ type, id, date }); setIsCancelModalOpen(true); };

  const confirmCancel = async (reason: string) => {
      if (!cancelTarget) return;
      const { type, id, date } = cancelTarget;
      try {
          if (type === 'sleep' && ongoingSleepInfo) { await addOrUpdateLog({ ...ongoingSleepInfo.log, sleep: null, status: 'completed' }); } 
          else if (type === 'nap' && ongoingNapInfo) { await addOrUpdateLog({ ...ongoingNapInfo.log, sleep: { ...ongoingNapInfo.log.sleep!, naps: ongoingNapInfo.log.sleep!.naps.filter(n => n.id !== ongoingNapInfo.record.id) } }); }
          else if (type === 'mb' && ongoingMbInfo) { await quickAddMasturbation(ongoingMbInfo.record, ongoingMbInfo.log.date, true, reason); } 
          else if (type === 'alcohol' && ongoingAlcoholInfo) { await addOrUpdateLog({ ...ongoingAlcoholInfo.log, alcoholRecord: null, alcohol: 'none' }); } 
          else if (type === 'exercise' && ongoingExerciseInfo) { await addOrUpdateLog({ ...ongoingExerciseInfo.log, exercise: ongoingExerciseInfo.log.exercise!.filter(e => e.id !== ongoingExerciseInfo.record.id) }); } 
          else if (type === 'sex' && ongoingSexInfo) { await quickAddSex(ongoingSexInfo.record, ongoingSexInfo.log.date, true); }
          showToast(`已移除 (${reason})`, 'info');
      } catch (e: any) { showToast(e.message, 'error'); } finally { setIsCancelModalOpen(false); setCancelTarget(null); }
  };

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-brand-accent" size={32}/></div>;

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 text-brand-text dark:text-slate-200 flex flex-col">
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
        <div className="container mx-auto max-w-lg p-4 pb-32">
          {view === 'dashboard' ? (
            <main>
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
                  {activeMainView === 'stats' && <StatsView isDarkMode={isCurrentlyDark} />}
                  {activeMainView === 'sexlife' && <SexLifeView />}
                  {activeMainView === 'my' && <MyView settings={settings} onUpdateSettings={setSettings} installPrompt={null} onShowVersionHistory={() => setIsVersionHistoryOpen(true)} onNavigateToLog={d => { setEditingLogDate(d); setView('form'); }} />}
              </Suspense>
            </main>
          ) : (
            <main>
              <button onClick={() => setView('dashboard')} className="mb-4 flex items-center text-slate-400 font-bold hover:text-brand-accent transition-colors"><ArrowLeft size={20} className="mr-2"/>返回仪表盘</button>
              <LogForm onSave={async l => { await addOrUpdateLog(l); setView('dashboard'); }} existingLog={editingLogDate ? logs.find((l: LogEntry) => l.date === editingLogDate) || null : null} logDate={editingLogDate} onDirtyStateChange={() => {}} logs={logs} partners={partners} />
            </main>
          )}
        </div>
      </div>

      {view === 'dashboard' && (
        <>
          <FAB 
              onSleep={handleSleepAction} onSex={handleSexAction} onMasturbation={handleMbAction} onExercise={handleExerciseAction} onNap={handleNapAction} onAlcohol={handleAlcoholAction}
              isSleepPending={!!ongoingSleepInfo} isAlcoholOngoing={!!ongoingAlcoholInfo} isMbOngoing={!!ongoingMbInfo} isExerciseOngoing={!!ongoingExerciseInfo} isNapOngoing={!!ongoingNapInfo} isSexOngoing={!!ongoingSexInfo}
          />
          <BottomNav activeView={activeMainView} onViewChange={setActiveMainView} />
        </>
      )}

      <SexRecordModal isOpen={isSexModalOpen} onClose={() => setIsSexModalOpen(false)} onSave={async r => { await quickAddSex({...r, ongoing: false}, ongoingSexInfo?.log.date); setIsSexModalOpen(false); showToast('性爱记录已添加', 'success'); }} dateStr={new Date().toISOString()} partners={partners} logs={logs} initialData={ongoingSexInfo?.record} />
      <MasturbationRecordModal isOpen={isMbModalOpen} onClose={() => setIsMbModalOpen(false)} onSave={async r => { await quickAddMasturbation({...r, status: 'completed'}, ongoingMbInfo?.log.date); setIsMbModalOpen(false); showToast('记录已更新', 'success'); }} initialData={ongoingMbInfo?.record} dateStr={new Date().toISOString()} logs={logs} partners={partners} />
      <ExerciseRecordModal isOpen={isExerciseModalOpen} onClose={() => setIsExerciseModalOpen(false)} onSave={async r => { await saveExercise({...r, ongoing: false}, ongoingExerciseInfo?.log.date); setIsExerciseModalOpen(false); showToast('运动记录已同步', 'success'); }} initialData={ongoingExerciseInfo?.record} mode={ongoingExerciseInfo ? 'finish' : 'start'} />
      <AlcoholRecordModal isOpen={isAlcoholModalOpen} onClose={() => setIsAlcoholModalOpen(false)} onSave={async r => { await saveAlcoholRecord({...r, ongoing: false}, ongoingAlcoholInfo?.log.date); setIsAlcoholModalOpen(false); showToast('饮酒详情已更新', 'success'); }} initialData={ongoingAlcoholInfo?.record} />
      <NapRecordModal isOpen={isNapModalOpen} onClose={() => setIsNapModalOpen(false)} onSave={async r => { await saveNap({...r, ongoing: false}, ongoingNapInfo?.log.date); setIsNapModalOpen(false); showToast('午休已记录', 'success'); }} initialData={ongoingNapInfo?.record} />
      <CancelReasonModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={confirmCancel} title="取消当前计时" />
      <VersionHistoryModal isOpen={isVersionHistoryOpen} onClose={() => setIsVersionHistoryOpen(false)} />
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
