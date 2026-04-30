import React, { lazy, Suspense } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  AlcoholRecord,
  AppSettings,
  ExerciseRecord,
  LogEntry,
  MasturbationRecordDetails,
  NapRecord,
  PartnerProfile,
  TagEntry,
  TagType
} from '../types';
import BottomNav from './BottomNav';
import { Dashboard } from '../features/dashboard';
import { LogForm } from '../features/daily-log';
import type { AppView, MainView } from './viewTypes';

const MyView = lazy(() => import('../features/profile').then((module) => ({ default: module.MyView })));
const StatsView = lazy(() => import('../features/stats').then((module) => ({ default: module.StatsView })));
const SexLifeView = lazy(() => import('../features/sex-life').then((module) => ({ default: module.SexLifeView })));

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-[50vh] text-brand-muted">
    <Loader2 size={32} className="animate-spin mb-2 text-brand-accent" />
    <p className="text-sm font-medium">功能加载中...</p>
  </div>
);

interface MainViewRouterData {
  settings: AppSettings;
  logs: LogEntry[];
  partners: PartnerProfile[];
  userTags: TagEntry[];
  editingLog: LogEntry | null;
  editingLogDate: string | null;
}

interface MainViewRouterActions {
  onMainViewChange: (view: MainView) => void;
  onEdit: (date: string) => void;
  onAddOrUpdateLog: (log: LogEntry) => Promise<void>;
  onAddOrUpdatePartner: (partner: PartnerProfile) => Promise<void>;
  onDeletePartner: (id: string) => Promise<void>;
  onAddOrUpdateTag: (tag: TagEntry) => Promise<void>;
  onDeleteTag: (name: string, category: TagType) => Promise<void>;
  onDeleteLog: (date: string) => Promise<void>;
  onToggleSleepLog: (pendingLog?: LogEntry) => Promise<void>;
  onCancelOngoingNap: () => Promise<void>;
  onCancelAlcoholRecord: () => Promise<void>;
  onCancelOngoingExercise: () => Promise<void>;
  onCancelOngoingMasturbation: () => Promise<void>;
  onBackToDashboard: () => void;
  onSaveLog: (log: LogEntry) => void;
  onDirtyStateChange: (isDirty: boolean) => void;
  onUpdateSettings: (settings: AppSettings | ((current: AppSettings) => AppSettings)) => void;
  onShowVersionHistory: () => void;
  onFinishExercise: (record: ExerciseRecord) => void;
  onFinishMasturbation: (record: MasturbationRecordDetails) => void;
  onFinishNap: (record: NapRecord) => void;
  onFinishAlcohol: (record: AlcoholRecord) => void;
}

interface MainViewRouterProps {
  view: AppView;
  activeMainView: MainView;
  isDarkMode: boolean;
  data: MainViewRouterData;
  actions: MainViewRouterActions;
}

const MainViewRouter: React.FC<MainViewRouterProps> = ({
  view,
  activeMainView,
  isDarkMode,
  data,
  actions
}) => {
  const {
    settings,
    logs,
    partners,
    userTags,
    editingLog,
    editingLogDate
  } = data;

  const {
    onMainViewChange,
    onEdit,
    onAddOrUpdateLog,
    onAddOrUpdatePartner,
    onDeletePartner,
    onAddOrUpdateTag,
    onDeleteTag,
    onDeleteLog,
    onToggleSleepLog,
    onCancelOngoingNap,
    onCancelAlcoholRecord,
    onCancelOngoingExercise,
    onCancelOngoingMasturbation,
    onBackToDashboard,
    onSaveLog,
    onDirtyStateChange,
    onUpdateSettings,
    onShowVersionHistory,
    onFinishExercise,
    onFinishMasturbation,
    onFinishNap,
    onFinishAlcohol
  } = actions;

  return (
    <>
      {view === 'dashboard' && (
        <main className="animate-in fade-in duration-300">
          {activeMainView === 'calendar' && (
            <Dashboard
              logs={logs}
              actions={{
                onEdit,
                onDeleteLog,
                onToggleSleepLog,
                onCancelOngoingNap,
                onCancelAlcoholRecord,
                onCancelOngoingExercise,
                onCancelOngoingMasturbation,
                onFinishExercise,
                onFinishMasturbation,
                onFinishNap,
                onFinishAlcohol
              }}
            />
          )}
          <Suspense fallback={<LoadingFallback />}>
            {activeMainView === 'stats' && <StatsView isDarkMode={isDarkMode} logs={logs} />}
            {activeMainView === 'sexlife' && (
              <SexLifeView
                data={{
                  logs,
                  partners,
                  userTags
                }}
                actions={{
                  onAddOrUpdateLog,
                  onAddOrUpdatePartner,
                  onDeletePartner,
                  onAddOrUpdateTag,
                  onDeleteTag
                }}
              />
            )}
            {activeMainView === 'my' && (
              <MyView
                data={{
                  settings,
                  logs,
                  userTags
                }}
                actions={{
                  onAddOrUpdateLog,
                  onAddOrUpdateTag,
                  onDeleteTag,
                  onUpdateSettings,
                  onShowVersionHistory,
                  onNavigateToLog: onEdit
                }}
              />
            )}
          </Suspense>
        </main>
      )}

      {view === 'form' && (
        <main className="animate-in slide-in-from-right duration-300">
          <div className="flex items-center mb-6 pt-2">
            <button onClick={onBackToDashboard} className="mr-4 p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-black tracking-tight">{editingLogDate ? '编辑记录' : '新记录'}</h2>
          </div>
          <LogForm
            onSave={onSaveLog}
            existingLog={editingLog}
            logDate={editingLogDate}
            onDirtyStateChange={onDirtyStateChange}
            logs={logs}
            partners={partners}
            userTags={userTags}
            onAddOrUpdateLog={onAddOrUpdateLog}
            onAddOrUpdateTag={onAddOrUpdateTag}
            onDeleteTag={onDeleteTag}
          />
        </main>
      )}

      {view === 'dashboard' && <BottomNav activeView={activeMainView} onViewChange={onMainViewChange} />}
    </>
  );
};

export default MainViewRouter;
