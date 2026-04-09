
import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { LogEntry, AppSettings, ExerciseRecord, MasturbationRecordDetails, NapRecord, AlcoholRecord } from './types';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import BottomNav from './components/BottomNav';
import { ArrowLeft, Loader2, Database } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import FAB from './components/FAB';
import Modal from './components/Modal';
import SexRecordModal from './components/SexRecordModal';
import MasturbationRecordModal from './components/MasturbationRecordModal';
import ExerciseRecordModal from './components/ExerciseSelectorModal';
import AlcoholRecordModal from './components/AlcoholRecordModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import NapRecordModal from './components/NapRecordModal';
import Welcome from './components/Welcome';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useLogs } from './hooks/useLogs';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { DataContext } from './contexts/DataContext';
import { pluginManager } from './services/PluginManager';
import { AlcoholAnalysisPlugin } from './plugins/CoreAnalysis';
import { StorageService } from './services/StorageService';
import { registerServiceWorker } from './hooks/usePWA';

// Lazy Load Heavy Views
const MyView = lazy(() => import('./components/MyView'));
const StatsView = lazy(() => import('./components/StatsView'));
const SexLifeView = lazy(() => import('./components/SexLifeView'));

type View = 'dashboard' | 'form';
type MainView = 'calendar' | 'stats' | 'sexlife' | 'my';

const APP_VERSION = '0.0.6'; // Unified version to 0.0.6

const defaultSettings: AppSettings = {
  version: APP_VERSION,
  theme: 'system',
  privacyMode: false,
  enableNotifications: false,
  notificationTime: { morning: '08:00', evening: '23:00' },
  hiddenFields: []
};

const LoadingFallback = () => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-brand-muted">
        <Loader2 size={32} className="animate-spin mb-2 text-brand-accent"/>
        <p className="text-sm font-medium">功能加载中...</p>
    </div>
);

const AppContent: React.FC<{ data: any }> = ({ data }) => {
  const { logs, partners, quickAddSex, quickAddMasturbation, saveExercise, saveAlcoholRecord, saveNap, isInitializing, toggleAlcohol, toggleNap } = data;
  const { showToast } = useToast();
  
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [view, setView] = useState<View>('dashboard');
  const [activeMainView, setActiveMainView] = useState<MainView>('calendar');
  const [editingLogDate, setEditingLogDate] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isConfirmBackModalOpen, setIsConfirmBackModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  
  // PWA Install Prompt State

  
  // Quick Record Modals
  const [isQuickSexModalOpen, setIsQuickSexModalOpen] = useState(false);
  const [isQuickMbModalOpen, setIsQuickMbModalOpen] = useState(false); 
  const [mbToFinish, setMbToFinish] = useState<MasturbationRecordDetails | null>(null);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false); 
  const [alcToFinish, setAlcToFinish] = useState<AlcoholRecord | null>(null);

  const [isNapModalOpen, setIsNapModalOpen] = useState(false);
  const [napToFinish, setNapToFinish] = useState<NapRecord | null>(null);
  
  const [exerciseToFinish, setExerciseToFinish] = useState<ExerciseRecord | null>(null);

  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    try { return window.localStorage.getItem('hasSeenWelcomeScreen') === 'true'; } catch { return false; }
  });

  const safeLogs = Array.isArray(logs) ? logs : [];
  const pendingLog = useMemo(() => safeLogs.find((log: LogEntry) => log.status === 'pending'), [safeLogs]);
  const ongoingExercise = useMemo(() => safeLogs.flatMap((l: LogEntry) => (Array.isArray(l.exercise) ? l.exercise : [])).find((e: ExerciseRecord) => e.ongoing), [safeLogs]);
  const ongoingNap = useMemo(() => safeLogs.flatMap((l: LogEntry) => (l.sleep && Array.isArray(l.sleep.naps) ? l.sleep.naps : [])).find((n: any) => n.ongoing), [safeLogs]);
  const ongoingMb = useMemo(() => safeLogs.flatMap((l: LogEntry) => (Array.isArray(l.masturbation) ? l.masturbation : [])).find((m: MasturbationRecordDetails) => m.status === 'inProgress'), [safeLogs]);
  /* Fix: Use alcoholRecords array to check for ongoing sessions instead of the non-existent alcoholRecord property */
  const ongoingAlcohol = useMemo(() => safeLogs.find((l: LogEntry) => Array.isArray(l.alcoholRecords) && l.alcoholRecords.some(r => r.ongoing))?.alcoholRecords?.find((r: AlcoholRecord) => r.ongoing), [safeLogs]);

  const editingLog = useMemo(() => editingLogDate ? safeLogs.find((log: LogEntry) => log.date === editingLogDate) || null : null, [safeLogs, editingLogDate]);

  // --- Effects ---
  useEffect(() => {
    pluginManager.register(AlcoholAnalysisPlugin);
    pluginManager.initAll();

    const handleVisibilityChange = () => { setIsBlurred(document.hidden); };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    registerServiceWorker();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (settings.theme === 'system') applyTheme(); };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // --- Handlers ---
  const wrapAction = async (action: () => Promise<any>, successMsg: string) => {
      try {
          await action();
          showToast(successMsg, 'success');
      } catch (e: any) {
          showToast(e.message || '操作失败', 'error');
      }
  };

  const handleEdit = useCallback((date: string) => {
    setEditingLogDate(date);
    setView('form');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    if (isFormDirty) setIsConfirmBackModalOpen(true);
    else {
      setView('dashboard');
      setEditingLogDate(null);
      setIsFormDirty(false);
    }
  }, [isFormDirty]);
  
  const confirmLeaveForm = () => {
    setView('dashboard');
    setEditingLogDate(null);
    setIsFormDirty(false);
    setIsConfirmBackModalOpen(false);
  };

  const handleSaveLog = useCallback(async (log: LogEntry) => {
    try {
        await data.addOrUpdateLog(log);
        showToast('日记已保存', 'success');
        setIsFormDirty(false);
        setView('dashboard');
        setEditingLogDate(null);
    } catch (e: any) {
        showToast(e.message || '保存失败', 'error');
    }
  }, [data, showToast]);

  const handleStartAlcohol = async () => {
      const ongoing = await toggleAlcohol();
      if (ongoing) {
          // If already ongoing, open modal to finish
          setAlcToFinish(ongoing);
          setIsAlcoholModalOpen(true);
      } else {
          showToast('酒局计时开始', 'success');
      }
  };

  const handleFinishAlcohol = (record: AlcoholRecord) => {
      setAlcToFinish(record);
      setIsAlcoholModalOpen(true);
  };

  const handleNapAction = async () => {
      const ongoing = await toggleNap();
      if (ongoing) {
          // If already ongoing, open modal to finish
          setNapToFinish(ongoing);
          setIsNapModalOpen(true);
      } else {
          showToast('午休记录已开始', 'success');
      }
  };

  // Exercise Logic
  const handleStartExercise = () => { setExerciseToFinish(null); setIsExerciseModalOpen(true); };
  const handleFinishExercise = (record: ExerciseRecord) => { setExerciseToFinish(record); setIsExerciseModalOpen(true); };

  const onSaveExercise = (record: ExerciseRecord) => {
      wrapAction(async () => {
          await saveExercise({ ...record, ongoing: record.type !== '日常步行' && !exerciseToFinish });
          setIsExerciseModalOpen(false);
          setExerciseToFinish(null);
      }, exerciseToFinish ? '运动已完成' : '运动开始');
  };

  const handleFinishNap = (record: NapRecord) => { setNapToFinish(record); setIsNapModalOpen(true); };
  const handleSaveNapFlow = (record: NapRecord) => { wrapAction(async () => { await saveNap(record); setIsNapModalOpen(false); setNapToFinish(null); }, '午休记录已保存'); };

  const handleStartMasturbation = () => {
      if (ongoingMb) { handleFinishMasturbation(ongoingMb); return; }
      const newRecord: MasturbationRecordDetails = {
          id: Date.now().toString(),
          startTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
          duration: 0, status: 'inProgress', tools: ['手'], contentItems: [],
          materials: [], props: [], assets: { sources: [], platforms: [], categories: [], target: '', actors: [] },
          materialsList: [], edging: 'none', edgingCount: 0, lubricant: '无润滑', useCondom: false,
          ejaculation: true, orgasmIntensity: 3, mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: ''
      };
      wrapAction(async () => { await quickAddMasturbation(newRecord); }, '开始施法 (已记录开始时间)');
  };

  const handleFinishMasturbation = (record: MasturbationRecordDetails) => { setMbToFinish(record); setIsQuickMbModalOpen(true); };

  if (isInitializing) {
      return (
          <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-brand-accent animate-spin"></div>
                  <Database className="absolute inset-0 m-auto text-brand-accent" size={32} />
              </div>
              <h2 className="text-xl font-bold text-brand-text dark:text-slate-200 mb-2">正在升级数据库</h2>
          </div>
      );
  }

  if (!hasSeenWelcome) return <Welcome onGetStarted={() => { window.localStorage.setItem('hasSeenWelcomeScreen', 'true'); setHasSeenWelcome(true); }} />;

  return (
    <div className={`min-h-screen bg-brand-bg dark:bg-slate-950 text-brand-text dark:text-slate-200 font-sans transition-all duration-500 ${isBlurred ? 'blur-md grayscale opacity-50' : ''}`}>
      <div className="container mx-auto max-w-lg p-4 pb-32">
        {view === 'dashboard' && (
          <main className="animate-in fade-in duration-300">
            {activeMainView === 'calendar' && (
                <Dashboard 
                    onEdit={handleEdit} 
                    onDateClick={handleEdit} 
                    onNavigateToBackup={() => setActiveMainView('my')}
                    onFinishExercise={handleFinishExercise}
                    onFinishMasturbation={handleFinishMasturbation}
                    onFinishNap={handleFinishNap}
                    onFinishAlcohol={handleFinishAlcohol}
                />
            )}
            <Suspense fallback={<LoadingFallback />}>
                {activeMainView === 'stats' && <StatsView isDarkMode={isDarkMode} />}
                {activeMainView === 'sexlife' && <SexLifeView />}
                {activeMainView === 'my' && <MyView settings={settings} onUpdateSettings={setSettings} onShowVersionHistory={() => setIsVersionHistoryOpen(true)} onNavigateToLog={handleEdit} />}
            </Suspense>
          </main>
        )}

        {view === 'form' && (
          <main className="animate-in slide-in-from-right duration-300">
            <div className="flex items-center mb-6 pt-2">
              <button onClick={handleBackToDashboard} className="mr-4 p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-black tracking-tight">{editingLogDate ? '编辑记录' : '新记录'}</h2>
            </div>
            <LogForm onSave={handleSaveLog} existingLog={editingLog} logDate={editingLogDate} onDirtyStateChange={setIsFormDirty} logs={safeLogs} partners={partners} />
          </main>
        )}

        {view === 'dashboard' && (
          <>
            <FAB 
                onSleep={() => wrapAction(async () => await data.toggleSleepLog(pendingLog), pendingLog ? '取消睡眠记录' : '开始记录睡眠')} 
                onSex={() => setIsQuickSexModalOpen(true)}
                onMasturbation={handleStartMasturbation}
                onExercise={handleStartExercise}
                onNap={handleNapAction}
                onAlcohol={handleStartAlcohol} 
                isSleepPending={!!pendingLog} 
                isExerciseOngoing={!!ongoingExercise}
                isNapOngoing={!!ongoingNap}
                isMbOngoing={!!ongoingMb}
                isAlcoholOngoing={!!ongoingAlcohol}
            />
            <BottomNav activeView={activeMainView} onViewChange={setActiveMainView} />
          </>
        )}

        <Modal isOpen={isConfirmBackModalOpen} onClose={() => setIsConfirmBackModalOpen(false)} title="未保存的更改" footer={<div className="flex gap-3 w-full"><button onClick={() => setIsConfirmBackModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl">继续编辑</button><button onClick={confirmLeaveForm} className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-bold">放弃</button></div>}>
            <p>您有未保存的更改。确定要离开吗？</p>
        </Modal>

        <VersionHistoryModal isOpen={isVersionHistoryOpen} onClose={() => setIsVersionHistoryOpen(false)} />

        <SexRecordModal isOpen={isQuickSexModalOpen} onClose={() => setIsQuickSexModalOpen(false)} onSave={(record) => wrapAction(async () => { await quickAddSex(record); setIsQuickSexModalOpen(false); }, '性生活记录已添加')} dateStr="现在" logs={logs} partners={partners} />
        <MasturbationRecordModal isOpen={isQuickMbModalOpen} onClose={() => { setIsQuickMbModalOpen(false); setMbToFinish(null); }} onSave={(record) => wrapAction(async () => { await quickAddMasturbation(record); setIsQuickMbModalOpen(false); setMbToFinish(null); }, '自慰记录已完成')} dateStr="现在" initialData={mbToFinish || undefined} logs={logs} partners={partners} />
        <ExerciseRecordModal isOpen={isExerciseModalOpen} onClose={() => { setIsExerciseModalOpen(false); setExerciseToFinish(null); }} onSave={onSaveExercise} initialData={exerciseToFinish || undefined} mode={exerciseToFinish ? 'finish' : 'start'} />
        <AlcoholRecordModal isOpen={isAlcoholModalOpen} onClose={() => { setIsAlcoholModalOpen(false); setAlcToFinish(null); }} initialData={alcToFinish || undefined} onSave={(r) => wrapAction(async () => await saveAlcoholRecord(r), '饮酒记录已保存')} />
      <NapRecordModal isOpen={isNapModalOpen} onClose={() => { setIsNapModalOpen(false); setNapToFinish(null); }} onSave={handleSaveNapFlow} initialData={napToFinish || undefined} />

      <PWAInstallPrompt />
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
