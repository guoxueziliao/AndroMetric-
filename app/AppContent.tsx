
import React, { lazy, Suspense, useMemo, useState } from 'react';
import { AppSettings } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Welcome from './Welcome';
import { PWAInstallPrompt } from '../features/pwa';
import { useToast } from '../contexts/ToastContext';
import { VersionHistoryModal } from '../features/backup';
import { Modal } from '../shared/ui';
import type { AppData } from './AppProviders';
import { defaultSettings } from './appConfig';
import InitializationScreen from './InitializationScreen';
import MainViewRouter from './MainViewRouter';
import { useAppBootstrap } from './useAppBootstrap';
import { useLogEditor } from './useLogEditor';
import { useQuickRecordData } from './useQuickRecordData';
import { useThemeMode } from './useThemeMode';
import { useWelcomeScreen } from './useWelcomeScreen';
import type { MainView } from './viewTypes';
import type { QuickRecordHandlers } from '../features/quick-actions';

const QuickRecordController = lazy(() => import('../features/quick-actions').then((module) => ({ default: module.QuickRecordController })));

const emptyQuickRecordHandlers: QuickRecordHandlers = {
  onFinishExercise: () => {},
  onFinishMasturbation: () => {},
  onFinishNap: () => {},
  onFinishAlcohol: () => {}
};

const AppContent: React.FC<{ data: AppData }> = ({ data }) => {
  const {
    logs,
    partners,
    userTags,
    isInitializing,
    addOrUpdateLog,
    addOrUpdatePartner,
    deletePartner,
    addOrUpdateTag,
    deleteTag,
    deleteLog,
    toggleSleepLog,
    cancelOngoingNap,
    cancelAlcoholRecord,
    cancelOngoingExercise,
    cancelOngoingMasturbation
  } = data;
  const { showToast } = useToast();

  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings);
  const isDarkMode = useThemeMode(settings.theme);
  const { isBlurred } = useAppBootstrap();
  const { hasSeenWelcome, markWelcomeSeen } = useWelcomeScreen();
  const quickRecordData = useQuickRecordData(data);

  const [activeMainView, setActiveMainView] = useState<MainView>('calendar');
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const safeLogs = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);
  const {
    view,
    editingLog,
    editingLogDate,
    isConfirmBackModalOpen,
    setIsConfirmBackModalOpen,
    setIsFormDirty,
    handleEdit,
    handleBackToDashboard,
    confirmLeaveForm,
    handleSaveLog
  } = useLogEditor({ data, logs: safeLogs, showToast });

  const mainViewData = useMemo(() => ({
    settings,
    logs: safeLogs,
    partners,
    userTags,
    editingLog,
    editingLogDate
  }), [settings, safeLogs, partners, userTags, editingLog, editingLogDate]);

  const mainViewBaseActions = useMemo(() => ({
    onMainViewChange: setActiveMainView,
    onEdit: handleEdit,
    onAddOrUpdateLog: addOrUpdateLog,
    onAddOrUpdatePartner: addOrUpdatePartner,
    onDeletePartner: deletePartner,
    onAddOrUpdateTag: addOrUpdateTag,
    onDeleteTag: deleteTag,
    onDeleteLog: deleteLog,
    onToggleSleepLog: toggleSleepLog,
    onCancelOngoingNap: cancelOngoingNap,
    onCancelAlcoholRecord: cancelAlcoholRecord,
    onCancelOngoingExercise: cancelOngoingExercise,
    onCancelOngoingMasturbation: cancelOngoingMasturbation,
    onBackToDashboard: handleBackToDashboard,
    onSaveLog: handleSaveLog,
    onDirtyStateChange: setIsFormDirty,
    onUpdateSettings: setSettings,
    onShowVersionHistory: () => setIsVersionHistoryOpen(true)
  }), [
    handleEdit,
    addOrUpdateLog,
    addOrUpdatePartner,
    deletePartner,
    addOrUpdateTag,
    deleteTag,
    deleteLog,
    toggleSleepLog,
    cancelOngoingNap,
    cancelAlcoholRecord,
    cancelOngoingExercise,
    cancelOngoingMasturbation,
    handleBackToDashboard,
    handleSaveLog,
    setIsFormDirty,
    setSettings
  ]);

  const renderAppShell = (quickRecordHandlers: QuickRecordHandlers) => {
    const mainViewActions = {
      ...mainViewBaseActions,
      ...quickRecordHandlers
    };

    return (
      <div className="container mx-auto max-w-lg p-4 pb-32">
        <MainViewRouter
          view={view}
          activeMainView={activeMainView}
          isDarkMode={isDarkMode}
          data={mainViewData}
          actions={mainViewActions}
        />

        <Modal isOpen={isConfirmBackModalOpen} onClose={() => setIsConfirmBackModalOpen(false)} title="未保存的更改" footer={<div className="flex gap-3 w-full"><button onClick={() => setIsConfirmBackModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl">继续编辑</button><button onClick={confirmLeaveForm} className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-bold">放弃</button></div>}>
            <p>您有未保存的更改。确定要离开吗？</p>
        </Modal>

        <VersionHistoryModal isOpen={isVersionHistoryOpen} onClose={() => setIsVersionHistoryOpen(false)} />
        <PWAInstallPrompt />
      </div>
    );
  };

  if (isInitializing) return <InitializationScreen />;

  if (!hasSeenWelcome) return <Welcome onGetStarted={markWelcomeSeen} />;

  return (
    <div className={`min-h-screen bg-brand-bg dark:bg-slate-950 text-brand-text dark:text-slate-200 font-sans transition-all duration-500 safe-area-top safe-area-bottom safe-area-left safe-area-right ${isBlurred ? 'blur-md grayscale opacity-50' : ''}`}>
      {view === 'dashboard' ? (
        <Suspense fallback={renderAppShell(emptyQuickRecordHandlers)}>
          <QuickRecordController data={quickRecordData} isEnabled>
            {(quickRecordHandlers) => renderAppShell(quickRecordHandlers)}
          </QuickRecordController>
        </Suspense>
      ) : (
        renderAppShell(emptyQuickRecordHandlers)
      )}
    </div>
  );
};

export default AppContent;
