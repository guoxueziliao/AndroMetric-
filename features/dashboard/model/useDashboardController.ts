import { useCallback, useMemo, useState } from 'react';
import type { AlcoholRecord, ExerciseRecord, LogEntry, MasturbationRecordDetails, NapRecord } from '../../../domain';
import { hydrateLog } from '../../../core/storage';
import { useToast } from '../../../contexts/ToastContext';

export type SummaryTab = 'diary' | 'track' | 'source';
export type OngoingTaskType = 'sleep' | 'nap' | 'mb' | 'exercise' | 'alcohol';

export interface DashboardActions {
  onEdit: (date: string) => void;
  onDeleteLog: (date: string) => Promise<void>;
  onToggleSleepLog: (pendingLog?: LogEntry) => Promise<void>;
  onCancelOngoingNap: () => Promise<void>;
  onCancelAlcoholRecord: () => Promise<void>;
  onCancelOngoingExercise: () => Promise<void>;
  onCancelOngoingMasturbation: () => Promise<void>;
  onFinishExercise?: (record: ExerciseRecord) => void;
  onFinishMasturbation?: (record: MasturbationRecordDetails) => void;
  onFinishNap?: (record: NapRecord) => void;
  onFinishAlcohol?: (record: AlcoholRecord) => void;
}

interface UseDashboardControllerParams {
  logs: LogEntry[];
  actions: DashboardActions;
}

export const useDashboardController = ({
  logs,
  actions
}: UseDashboardControllerParams) => {
  const {
    onEdit,
    onDeleteLog,
    onToggleSleepLog,
    onCancelOngoingNap,
    onCancelAlcoholRecord,
    onCancelOngoingExercise,
    onCancelOngoingMasturbation
  } = actions;

  const { showToast } = useToast();

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<LogEntry | null>(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState<SummaryTab>('diary');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);
  const [taskToCancel, setTaskToCancel] = useState<OngoingTaskType | null>(null);

  const pendingLog = useMemo(() => logs.find(log => log.status === 'pending'), [logs]);
  const ongoingExercise = useMemo(() => logs.flatMap(l => l.exercise || []).find(e => e.ongoing), [logs]);
  const ongoingNap = useMemo(() => logs.flatMap(l => l.sleep?.naps || []).find(n => n.ongoing), [logs]);
  const ongoingMb = useMemo(() => logs.flatMap(l => l.masturbation || []).find(m => m.status === 'inProgress'), [logs]);
  const ongoingAlcohol = useMemo(() => logs.flatMap(l => l.alcoholRecords || []).find(r => r.ongoing), [logs]);

  const handleDateClickForSummary = useCallback((date: string) => {
    const log = logs.find(l => l.date === date);
    if (log) {
      if (log.status === 'pending') {
        onEdit(log.date);
        return;
      }

      setSummaryLog(log);
      setActiveSummaryTab('diary');
      setIsSummaryModalOpen(true);
      return;
    }

    setSummaryLog(hydrateLog({ date }));
    setActiveSummaryTab('diary');
    setIsSummaryModalOpen(true);
  }, [logs, onEdit]);

  const handleNavigateDate = useCallback((direction: number) => {
    if (!summaryLog) return;

    const current = new Date(`${summaryLog.date}T12:00:00`);
    current.setDate(current.getDate() + direction);
    const targetDateStr = current.toISOString().split('T')[0];
    const existing = logs.find(l => l.date === targetDateStr);

    setSummaryLog(existing || hydrateLog({ date: targetDateStr }));
  }, [logs, summaryLog]);

  const handleDeleteRecord = useCallback((date: string) => {
    setDateToDelete(date);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!dateToDelete) return;

    await onDeleteLog(dateToDelete);
    setIsSummaryModalOpen(false);
    showToast('记录已成功删除', 'success');
  }, [dateToDelete, onDeleteLog, showToast]);

  const confirmCancel = useCallback(async () => {
    if (!taskToCancel) return;

    try {
      switch (taskToCancel) {
        case 'sleep':
          await onToggleSleepLog(pendingLog || undefined);
          break;
        case 'nap':
          await onCancelOngoingNap();
          break;
        case 'mb':
          await onCancelOngoingMasturbation();
          break;
        case 'exercise':
          await onCancelOngoingExercise();
          break;
        case 'alcohol':
          await onCancelAlcoholRecord();
          break;
      }

      showToast('记录已取消', 'info');
    } catch {
      showToast('取消失败', 'error');
    } finally {
      setTaskToCancel(null);
    }
  }, [
    taskToCancel,
    onToggleSleepLog,
    onCancelOngoingNap,
    onCancelOngoingMasturbation,
    onCancelOngoingExercise,
    onCancelAlcoholRecord,
    pendingLog,
    showToast
  ]);

  return {
    isSummaryModalOpen,
    setIsSummaryModalOpen,
    summaryLog,
    activeSummaryTab,
    setActiveSummaryTab,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    dateToDelete,
    taskToCancel,
    setTaskToCancel,
    pendingLog,
    ongoingExercise,
    ongoingNap,
    ongoingMb,
    ongoingAlcohol,
    onDateClickForSummary: handleDateClickForSummary,
    onNavigateDate: handleNavigateDate,
    onDeleteRecord: handleDeleteRecord,
    onConfirmDelete: confirmDelete,
    onRequestCancel: setTaskToCancel,
    onConfirmCancel: confirmCancel
  };
};
