
import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { LogEntry, AppSettings, ExerciseRecord, MasturbationRecordDetails, AlcoholRecord, SexRecordDetails, NapRecord } from './types';
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
import Welcome from './components/Welcome';
import { useLogs } from './hooks/useLogs';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { DataContext } from './contexts/DataContext';
import { pluginManager } from './services/PluginManager';
import { AlcoholAnalysisPlugin } from './plugins/CoreAnalysis';
import { StorageService } from './services/StorageService';

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
  const { logs, partners, quickAddSex, quickAddMasturbation, saveExercise, saveAlcoholRecord, saveNap, toggleAlcohol, toggleNap, toggleSleepLog, isInitializing, addOrUpdateLog, deleteLog } = data;
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
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Derive ongoing activities for FAB and Banners
  const ongoingAlcohol = useMemo(() => logs.find((l: LogEntry) => l.alcoholRecord?.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap((l: LogEntry) => l.masturbation || []).find((m: MasturbationRecordDetails) => m.status === 'inProgress'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap((l: LogEntry) => l.exercise || []).find((e: ExerciseRecord) => e.ongoing), [logs]);
  const ongoingSleep = useMemo(() => logs.find((l: LogEntry) => l.sleep?.startTime && !l.sleep?.endTime), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap((l: LogEntry) => l.sleep?.naps || []).find((n: NapRecord) => n.ongoing), [logs]);

  // FAB Handlers
  const handleStartAlcohol = async () => {
      if (ongoingAlcohol) setIsAlcoholModalOpen(true);
      else {
          const started = await toggleAlcohol();
          if (started) showToast('已开始饮酒计时...', 'info');
      }
  };

  const handleStartMasturbation = async () => {
      if (ongoingMb) setIsMbModalOpen(true);
      else {
          await quickAddMasturbation({ id: Date.now().toString(), status: 'inProgress', startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), tools: ['手'], contentItems: [] });
          showToast('已开始自慰计时...', 'info');
      }
  };

  const handleToggleSleep = async () => {
      await toggleSleepLog();
      showToast(ongoingSleep ? '早安，祝你今天精力充沛' : '晚安，已标记入睡时间', 'info');
  };

  const handleToggleNap = async () => {
      await toggleNap();
      showToast(ongoingNap ? '午休已结束' : '休息一下，已标记午休开始', 'info');
  };

  // Activity Cancel Logic (Unified for Dashboard Banners)
  const handleCancelActivity = async (type: 'alcohol' | 'mb' | 'exercise') => {
      if (!confirm(`确定取消并删除本次${type === 'alcohol' ? '饮酒' : type === 'mb' ? '自慰' : '运动'}记录吗？`)) return;

      try {
          if (type === 'alcohol' && ongoingAlcohol) {
              await addOrUpdateLog({ ...ongoingAlcohol, alcoholRecord: null, alcohol: 'none' });
          } else if (type === 'mb' && ongoingMb) {
              const log = logs.find((l: LogEntry) => l.masturbation?.some(m => m.id === ongoingMb.id));
              if (log) await addOrUpdateLog({ ...log, masturbation: log.masturbation!.filter(m => m.id !== ongoingMb.id) });
          } else if (type === 'exercise' && ongoingExercise) {
              const log = logs.find((l: LogEntry) => l.exercise?.some(e => e.id === ongoingExercise.id));
              if (log) await addOrUpdateLog({ ...log, exercise: log.exercise!.filter(e => e.id !== ongoingExercise.id) });
          }
          showToast('记录已移除', 'info');
      } catch (e: any) {
          showToast(e.message, 'error');
      }
  };

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-brand-accent" size={32}/></div>;

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 text-brand-text dark:text-slate-200">
      <div className="container mx-auto max-w-lg p-4 pb-32">
        {view === 'dashboard' && (
          <main>
            {activeMainView === 'calendar' && (
              <Dashboard 
                onEdit={d => { setEditingLogDate(d); setView('form'); }} 
                onDateClick={d => { setEditingLogDate(d); setView('form'); }} 
                onNavigateToBackup={() => setActiveMainView('my')}
                onEditAlcohol={() => setIsAlcoholModalOpen(true)}
                onCancelAlcohol={() => handleCancelActivity('alcohol')}
                onFinishMasturbation={() => setIsMbModalOpen(true)}
                onCancelMasturbation={() => handleCancelActivity('mb')}
                onFinishExercise={() => setIsExerciseModalOpen(true)}
                onCancelExercise={() => handleCancelActivity('exercise')}
              />
            )}
            <Suspense fallback={<div className="p-10 text-center opacity-50"><Loader2 className="animate-spin mx-auto mb-2"/>加载视图...</div>}>
                {activeMainView === 'stats' && <StatsView isDarkMode={false} />}
                {activeMainView === 'sexlife' && <SexLifeView />}
                {activeMainView === 'my' && <MyView settings={settings} onUpdateSettings={setSettings} installPrompt={null} onShowVersionHistory={() => setIsVersionHistoryOpen(true)} onNavigateToLog={d => { setEditingLogDate(d); setView('form'); }} />}
            </Suspense>
          </main>
        )}

        {view === 'form' && (
          <main>
            <button onClick={() => setView('dashboard')} className="mb-4 flex items-center text-slate-400 font-bold hover:text-brand-accent transition-colors"><ArrowLeft size={20} className="mr-2"/>返回仪表盘</button>
            <LogForm onSave={async l => { await addOrUpdateLog(l); setView('dashboard'); }} existingLog={editingLogDate ? logs.find((l: LogEntry) => l.date === editingLogDate) || null : null} logDate={editingLogDate} onDirtyStateChange={() => {}} logs={logs} partners={partners} />
          </main>
        )}

        {view === 'dashboard' && (
          <>
            <FAB 
                onSleep={handleToggleSleep} 
                onSex={() => setIsSexModalOpen(true)} 
                onMasturbation={handleStartMasturbation} 
                onExercise={() => setIsExerciseModalOpen(true)} 
                onNap={handleToggleNap} 
                onAlcohol={handleStartAlcohol}
                isSleepPending={!!ongoingSleep} 
                isAlcoholOngoing={!!ongoingAlcohol}
                isMbOngoing={!!ongoingMb}
                isExerciseOngoing={!!ongoingExercise}
                isNapOngoing={!!ongoingNap}
            />
            <BottomNav activeView={activeMainView} onViewChange={setActiveMainView} />
          </>
        )}

        {/* --- Unified Modals --- */}
        <SexRecordModal
            isOpen={isSexModalOpen}
            onClose={() => setIsSexModalOpen(false)}
            onSave={async r => { await quickAddSex(r); setIsSexModalOpen(false); showToast('性爱记录已添加', 'success'); }}
            dateStr={new Date().toISOString()}
            partners={partners}
        />
        <MasturbationRecordModal
            isOpen={isMbModalOpen}
            onClose={() => setIsMbModalOpen(false)}
            onSave={async r => { await quickAddMasturbation(r); setIsMbModalOpen(false); showToast('自慰记录已更新', 'success'); }}
            initialData={ongoingMb}
            dateStr={new Date().toISOString()}
            logs={logs}
        />
        <ExerciseRecordModal
            isOpen={isExerciseModalOpen}
            onClose={() => setIsExerciseModalOpen(false)}
            onSave={async r => { await saveExercise(r); setIsExerciseModalOpen(false); showToast('运动已记录', 'success'); }}
            initialData={ongoingExercise}
            mode={ongoingExercise ? 'finish' : 'start'}
        />
        <AlcoholRecordModal
            isOpen={isAlcoholModalOpen}
            onClose={() => setIsAlcoholModalOpen(false)}
            onSave={async r => { await saveAlcoholRecord(r); setIsAlcoholModalOpen(false); showToast('饮酒详情已更新', 'success'); }}
            initialData={ongoingAlcohol?.alcoholRecord || undefined}
        />
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
