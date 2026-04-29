import { useCallback, useMemo, useState } from 'react';
import type { LogEntry } from '../types';
import { getErrorMessage } from '../shared/lib';
import type { AppData } from './AppProviders';
import type { AppView } from './viewTypes';

type ShowToast = (message: string, type: 'success' | 'error' | 'info') => void;

interface UseLogEditorParams {
  data: AppData;
  logs: LogEntry[];
  showToast: ShowToast;
}

export const useLogEditor = ({ data, logs, showToast }: UseLogEditorParams) => {
  const [view, setView] = useState<AppView>('dashboard');
  const [editingLogDate, setEditingLogDate] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isConfirmBackModalOpen, setIsConfirmBackModalOpen] = useState(false);

  const editingLog = useMemo(
    () => (editingLogDate ? logs.find((log) => log.date === editingLogDate) || null : null),
    [logs, editingLogDate]
  );

  const handleEdit = useCallback((date: string) => {
    setEditingLogDate(date);
    setView('form');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    if (isFormDirty) {
      setIsConfirmBackModalOpen(true);
      return;
    }

    setView('dashboard');
    setEditingLogDate(null);
    setIsFormDirty(false);
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
    } catch (error) {
      showToast(getErrorMessage(error, '保存失败'), 'error');
    }
  }, [data, showToast]);

  return {
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
  };
};
