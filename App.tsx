
import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { LogEntry, AppSettings, ExerciseRecord, MasturbationRecordDetails } from './types';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import BottomNav from './components/BottomNav';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import FAB from './components/FAB';
import Modal from './components/Modal';
import SexRecordModal from './components/SexRecordModal';
import MasturbationRecordModal from './components/MasturbationRecordModal';
import ExerciseRecordModal from './components/ExerciseSelectorModal';
import AlcoholRecordModal from './components/AlcoholRecordModal'; 
import VersionHistoryModal from './components/VersionHistoryModal';
import Welcome from './components/Welcome';
import { useLogs } from './hooks/useLogs';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { DataContext } from './contexts/DataContext';
import { pluginManager } from './services/PluginManager';
import { AlcoholAnalysisPlugin } from './plugins/CoreAnalysis';
import { StorageService } from './services/StorageService';

// Lazy Load Heavy Views
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

const LoadingFallback = () => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-brand-muted">
        <Loader2 size={32} className="animate-spin mb-2 text-brand-accent"/>
        <p className="text-sm">功能加载中...</p>
    </div>
);

const AppContent: React.FC<{ data: any }> = ({ data }) => {
  const { logs, partners, quickAddSex, quickAddMasturbation, saveExercise, saveAlcoholRecord } = data;
  const { showToast } = useToast();
  
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [view, setView] = useState<View>('dashboard');
  const [activeMainView, setActiveMainView] = useState<MainView>('calendar');
  const [editingLogDate, setEditingLogDate] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isConfirmBackModalOpen, setIsConfirmBackModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  
  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // Quick Record Modals
  const [isQuickSexModalOpen, setIsQuickSexModalOpen] = useState(false);
  const [isQuickMbModalOpen, setIsQuickMbModalOpen] = useState(false); // Used for editing or manual add
  const [mbToFinish, setMbToFinish] = useState<MasturbationRecordDetails | null>(null);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false); 
  
  // State for finishing ongoing exercise
  const [exerciseToFinish, setExerciseToFinish] = useState<ExerciseRecord | null>(null);

  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    try { return window.localStorage.getItem('hasSeenWelcomeScreen') === 'true'; } catch { return false; }
  });

  const safeLogs = logs || [];
  const pendingLog = useMemo(() => safeLogs.find((log: LogEntry) => log.status === 'pending'), [safeLogs]);
  const editingLog = useMemo(() => editingLogDate ? safeLogs.find((log: LogEntry) => log.date === editingLogDate) || null : null, [safeLogs, editingLogDate]);
  const ongoingExercise = useMemo(() => safeLogs.flatMap((l: LogEntry) => l.exercise || []).find((e: ExerciseRecord) => e.ongoing), [safeLogs]);
  const ongoingNap = useMemo(() => safeLogs.flatMap((l: LogEntry) => l.sleep?.naps || []).find((n: any) => n.ongoing), [safeLogs]);
  const ongoingMb = useMemo(() => safeLogs.flatMap((l: LogEntry) => l.masturbation || []).find((m: MasturbationRecordDetails) => m.status === 'inProgress'), [safeLogs]);

  // --- Effects ---
  useEffect(() => {
    // Register Core Plugins
    pluginManager.register(AlcoholAnalysisPlugin);
    pluginManager.initAll();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Scheduled Health Check (Monthly)
    const checkDataHealth = async () => {
        const lastCheck = localStorage.getItem('last_health_check');
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        
        if (!lastCheck || (now - parseInt(lastCheck)) > thirtyDays) {
            console.log('[System] Running scheduled health check...');
            try {
                const report = await StorageService.runHealthCheck();
                localStorage.setItem('last_health_check', now.toString());
                if (report.issues.length > 0) {
                    showToast(`自动检查发现 ${report.issues.length} 个数据异常，请前往设置查看`, 'info');
                }
            } catch (e) {
                console.error('[System] Health check failed', e);
            }
        }
    };
    // Delay check slightly to not block startup
    setTimeout(checkDataHealth, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Version Check Effect
  useEffect(() => {
      if (settings.version !== APP_VERSION) {
          console.log(`[App] Version mismatch. Updating from ${settings.version} to ${APP_VERSION}`);
          setSettings(prev => ({ ...prev, version: APP_VERSION }));
          // Show changelog on update
          setIsVersionHistoryOpen(true);
          showToast(`已更新至 v${APP_VERSION}`, 'info');
      }
  }, [settings.version, setSettings, showToast]);

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
  
  // Wrapper for quick actions to handle errors via Toast
  const wrapAction = async (action: () => Promise<void>, successMsg: string) => {
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

  const handleGetStarted = () => {
    window.localStorage.setItem('hasSeenWelcomeScreen', 'true');
    setHasSeenWelcome(true);
  };
  
  // Exercise Logic
  const handleStartExercise = () => {
    setExerciseToFinish(null); 
    setIsExerciseModalOpen(true); 
  };

  const handleFinishExercise = (record: ExerciseRecord) => {
      setExerciseToFinish(record);
      setIsExerciseModalOpen(true);
  };

  const onSaveExercise = (record: ExerciseRecord) => {
      const isFinishing = !!exerciseToFinish;
      const isInstantRecord = record.type === '日常步行';
      
      wrapAction(async () => {
          if (isFinishing) {
              await saveExercise({ ...record, ongoing: false });
          } else {
              await saveExercise({ ...record, ongoing: !isInstantRecord });
          }
          setIsExerciseModalOpen(false);
          setExerciseToFinish(null);
      }, isFinishing ? '运动已完成' : isInstantRecord ? '步数已记录' : '运动开始');
  };

  // Masturbation Logic
  const handleStartMasturbation = () => {
      // FIX: Check if already ongoing to prevent duplicates
      if (ongoingMb) {
          handleFinishMasturbation(ongoingMb);
          return;
      }

      // Create new record with status inProgress
      const newRecord: MasturbationRecordDetails = {
          id: Date.now().toString(),
          startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          duration: 0,
          status: 'inProgress',
          // Defaults
          tools: ['手'], materials: [], props: [], assets: { sources: [], platforms: [], categories: [], target: '', actors: [] },
          materialsList: [], edging: 'none', edgingCount: 0, lubricant: '', useCondom: false,
          ejaculation: true, orgasmIntensity: 3, mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: ''
      };
      
      wrapAction(async () => {
          await quickAddMasturbation(newRecord);
      }, '开始施法 (已记录开始时间)');
  };

  const handleFinishMasturbation = (record: MasturbationRecordDetails) => {
      setMbToFinish(record);
      setIsQuickMbModalOpen(true);
  };

  if (!hasSeenWelcome) return <Welcome onGetStarted={handleGetStarted} />;

  return (
    <div className="min-h-screen bg-brand-primary dark:bg-slate-950 text-brand-text dark:text-slate-200 font-sans transition-colors duration-300">
      
      <div className="container mx-auto max-w-2xl p-4 pb-28">
        
        {view === 'dashboard' && (
          <main className="animate-in fade-in">
            {activeMainView === 'calendar' && (
                <Dashboard 
                    onEdit={handleEdit} 
                    onDateClick={handleEdit} 
                    onNavigateToBackup={() => setActiveMainView('my')}
                    onFinishExercise={handleFinishExercise}
                    onFinishMasturbation={handleFinishMasturbation}
                />
            )}
            
            <Suspense fallback={<LoadingFallback />}>
                {activeMainView === 'stats' && <StatsView isDarkMode={isDarkMode} />}
                {activeMainView === 'sexlife' && <SexLifeView />}
                {activeMainView === 'my' && (
                    <MyView 
                        settings={settings} 
                        onUpdateSettings={setSettings} 
                        installPrompt={installPrompt}
                        onShowVersionHistory={() => setIsVersionHistoryOpen(true)}
                        onNavigateToLog={(date) => {
                            setActiveMainView('calendar'); // Just in case, reset nav state
                            handleEdit(date);
                        }}
                    />
                )}
            </Suspense>
          </main>
        )}

        {view === 'form' && (
          <main className="animate-in slide-in-from-right">
            <div className="flex items-center mb-6">
              <button onClick={handleBackToDashboard} className="mr-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">{editingLogDate ? '编辑记录' : '新记录'}</h2>
            </div>
            <LogForm 
              onSave={handleSaveLog} 
              existingLog={editingLog} 
              logDate={editingLogDate} 
              onDirtyStateChange={setIsFormDirty}
              logs={safeLogs}
              partners={partners}
            />
          </main>
        )}

        {view === 'dashboard' && (
          <>
            <FAB 
                onSleep={() => wrapAction(async () => await data.toggleSleepLog(pendingLog), pendingLog ? '睡眠记录已取消' : '开始记录睡眠')} 
                onSex={() => setIsQuickSexModalOpen(true)}
                onMasturbation={handleStartMasturbation}
                onExercise={handleStartExercise}
                onNap={() => wrapAction(async () => await data.toggleNap(), '午休状态更新')}
                onAlcohol={() => setIsAlcoholModalOpen(true)} 
                isSleepPending={!!pendingLog} 
                isExerciseOngoing={!!ongoingExercise}
                isNapOngoing={!!ongoingNap}
                isMbOngoing={!!ongoingMb}
            />
            <BottomNav activeView={activeMainView} onViewChange={setActiveMainView} />
          </>
        )}

        <Modal isOpen={isConfirmBackModalOpen} onClose={() => setIsConfirmBackModalOpen(false)} title="未保存的更改" footer={
            <><button onClick={() => setIsConfirmBackModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded">继续编辑</button>
            <button onClick={confirmLeaveForm} className="px-4 py-2 bg-brand-danger text-white rounded">放弃更改</button></>
        }>
            <p>您有未保存的更改。确定要离开吗？</p>
        </Modal>

        {/* Global Modals */}
        <VersionHistoryModal isOpen={isVersionHistoryOpen} onClose={() => setIsVersionHistoryOpen(false)} />

        {/* Quick Record Modals */}
        <SexRecordModal 
            isOpen={isQuickSexModalOpen} 
            onClose={() => setIsQuickSexModalOpen(false)} 
            onSave={(record) => { wrapAction(async () => { await quickAddSex(record); setIsQuickSexModalOpen(false); }, '性生活记录已添加'); }}
            dateStr="现在"
        />
        <MasturbationRecordModal 
            isOpen={isQuickMbModalOpen} 
            onClose={() => { setIsQuickMbModalOpen(false); setMbToFinish(null); }} 
            onSave={(record) => { wrapAction(async () => { await quickAddMasturbation(record); setIsQuickMbModalOpen(false); setMbToFinish(null); }, '自慰记录已完成'); }}
            dateStr="现在"
            initialData={mbToFinish || undefined}
        />
        <ExerciseRecordModal
            isOpen={isExerciseModalOpen}
            onClose={() => { setIsExerciseModalOpen(false); setExerciseToFinish(null); }}
            onSave={onSaveExercise}
            initialData={exerciseToFinish || undefined}
            mode={exerciseToFinish ? 'finish' : 'start'}
        />
        <AlcoholRecordModal
            isOpen={isAlcoholModalOpen}
            onClose={() => setIsAlcoholModalOpen(false)}
            onSave={(r) => wrapAction(async () => await saveAlcoholRecord(r), '饮酒记录已保存')}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
    // Top level data fetcher
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
