
import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { LogEntry, AppSettings, ExerciseRecord, MasturbationRecordDetails, AlcoholRecord } from './types';
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
  const { logs, partners, quickAddSex, quickAddMasturbation, saveExercise, saveAlcoholRecord, toggleAlcohol, isInitializing } = data;
  const { showToast } = useToast();
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings);
  const [activeMainView, setActiveMainView] = useState<MainView>('calendar');
  const [view, setView] = useState<View>('dashboard');
  const [editingLogDate, setEditingLogDate] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isConfirmBackModalOpen, setIsConfirmBackModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false);

  const ongoingAlcohol = useMemo(() => logs.find((l: LogEntry) => l.alcoholRecord?.ongoing), [logs]);

  const handleStartAlcohol = async () => {
      if (ongoingAlcohol) {
          setIsAlcoholModalOpen(true);
      } else {
          const started = await toggleAlcohol();
          if (started) showToast('已开始饮酒计时...', 'info');
      }
  };

  const handleCancelAlcohol = async () => {
      if (!ongoingAlcohol) return;
      if (confirm('确定取消本次饮酒记录吗？(误触删除)')) {
          try {
              await data.addOrUpdateLog({
                  ...ongoingAlcohol,
                  alcoholRecord: null,
                  alcohol: 'none'
              });
              showToast('已移除饮酒计时', 'info');
          } catch (e: any) {
              showToast(e.message, 'error');
          }
      }
  };

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center">加载中...</div>;

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
                onCancelAlcohol={handleCancelAlcohol}
              />
            )}
            <Suspense fallback={<div>Loading...</div>}>
                {activeMainView === 'stats' && <StatsView isDarkMode={false} />}
                {activeMainView === 'sexlife' && <SexLifeView />}
                {activeMainView === 'my' && <MyView settings={settings} onUpdateSettings={setSettings} installPrompt={null} onShowVersionHistory={() => setIsVersionHistoryOpen(true)} onNavigateToLog={d => { setEditingLogDate(d); setView('form'); }} />}
            </Suspense>
          </main>
        )}

        {view === 'form' && (
          <main>
            <button onClick={() => setView('dashboard')} className="mb-4 flex items-center text-slate-400 font-bold"><ArrowLeft size={20} className="mr-2"/>返回</button>
            <LogForm onSave={async l => { await data.addOrUpdateLog(l); setView('dashboard'); }} existingLog={editingLogDate ? logs.find((l: LogEntry) => l.date === editingLogDate) || null : null} logDate={editingLogDate} onDirtyStateChange={setIsFormDirty} logs={logs} partners={partners} />
          </main>
        )}

        {view === 'dashboard' && (
          <>
            <FAB 
                onSleep={() => {}} 
                onSex={() => {}} 
                onMasturbation={() => {}} 
                onExercise={() => {}} 
                onNap={() => {}} 
                onAlcohol={handleStartAlcohol}
                isSleepPending={false} 
                isAlcoholOngoing={!!ongoingAlcohol}
            />
            <BottomNav activeView={activeMainView} onViewChange={setActiveMainView} />
          </>
        )}

        <AlcoholRecordModal
            isOpen={isAlcoholModalOpen}
            onClose={() => setIsAlcoholModalOpen(false)}
            onSave={async r => { await saveAlcoholRecord(r); setIsAlcoholModalOpen(false); showToast('记录已更新', 'success'); }}
            initialData={ongoingAlcohol?.alcoholRecord || undefined}
        />
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
