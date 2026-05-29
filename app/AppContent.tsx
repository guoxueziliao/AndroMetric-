import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Welcome from './Welcome';
import { PWAInstallPrompt } from '../features/pwa';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../shared/ui';
import type { AppData } from './AppProviders';
import { defaultSettings } from './appConfig';
import InitializationScreen from './InitializationScreen';
import LockScreen from './LockScreen';
import MainViewRouter from './MainViewRouter';
import SidebarNav from './SidebarNav';
import { useAppBootstrap } from './useAppBootstrap';
import { useLogEditor } from './useLogEditor';
import { useQuickRecordData } from './useQuickRecordData';
import { useThemeMode } from './useThemeMode';
import { useWelcomeScreen } from './useWelcomeScreen';
import type { MainView } from './viewTypes';
import type { QuickRecordHandlers } from '../features/quick-actions';
import { useAutoBackup } from '../features/backup/model/useAutoBackup';
import { useStorageQuotaMonitor } from '../features/backup/model/useStorageQuotaMonitor';

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
  useStorageQuotaMonitor();

  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings);
  useAutoBackup({
    isInitializing,
    logsCount: logs.length,
    backupSchedule: settings.backupSchedule
  });

  const { isDarkMode } = useThemeMode(settings.theme);
  const { isBlurred } = useAppBootstrap();
  const { hasSeenWelcome, markWelcomeSeen } = useWelcomeScreen();
  const quickRecordData = useQuickRecordData(data);

  const appLock = settings.appLock;
  const lockEnabled = !!(appLock?.enabled && appLock.pinHash && appLock.pinSalt);
  const [unlocked, setUnlocked] = useState(!lockEnabled);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lockEnabled && !unlocked) setUnlocked(true);
  }, [lockEnabled, unlocked]);

  useEffect(() => {
    if (!lockEnabled) return;
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current !== null) {
        const elapsedMin = (Date.now() - hiddenAtRef.current) / 60000;
        hiddenAtRef.current = null;
        const threshold = appLock?.autoLockMinutes ?? 5;
        if (threshold > 0 && elapsedMin >= threshold) {
          setUnlocked(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [lockEnabled, appLock?.autoLockMinutes]);

  const [activeMainView, setActiveMainView] = useState<MainView>('calendar');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('sidebarCollapsed', false);

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
    onUpdateSettings: setSettings
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
      <>
        {view === 'dashboard' && (
          <SidebarNav
            activeItem={activeMainView}
            onNavigate={setActiveMainView}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
        )}
        <div className={`container mx-auto max-w-lg p-4 pb-32 transition-[padding] duration-300 ${view === 'dashboard' ? (isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-[260px]') : ''}`}>
          <MainViewRouter
            view={view}
            activeMainView={activeMainView}
            isDarkMode={isDarkMode}
            data={mainViewData}
            actions={mainViewActions}
          />

          <Modal isOpen={isConfirmBackModalOpen} onClose={() => setIsConfirmBackModalOpen(false)} title="未保存的更改" footer={<div className="flex gap-3 w-full"><button onClick={() => setIsConfirmBackModalOpen(false)} className="flex-1 py-3 bg-surface-muted text-text-secondary rounded-xl">继续编辑</button><button onClick={confirmLeaveForm} className="flex-1 py-3 bg-state-danger-bg text-state-danger-text rounded-xl font-bold">放弃</button></div>}>
              <p>您有未保存的更改。确定要离开吗？</p>
          </Modal>

          <PWAInstallPrompt />
        </div>
      </>
    );
  };

  if (isInitializing) return <InitializationScreen />;

  if (!hasSeenWelcome) return <Welcome onGetStarted={markWelcomeSeen} />;

  if (lockEnabled && !unlocked && appLock) {
    return <LockScreen appLock={appLock} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className={`min-h-screen bg-surface-base text-text-secondary font-sans transition-all duration-slow safe-area-top safe-area-bottom safe-area-left safe-area-right ${isBlurred ? 'blur-md saturate-50 opacity-60' : ''}`}>
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
