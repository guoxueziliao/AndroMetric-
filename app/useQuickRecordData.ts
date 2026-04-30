import { useMemo } from 'react';
import type { QuickRecordData } from '../features/quick-actions';
import type { AppData } from './AppProviders';

export const useQuickRecordData = (data: AppData): QuickRecordData => {
  const {
    logs,
    partners,
    quickAddSex,
    quickAddMasturbation,
    saveExercise,
    saveAlcoholRecord,
    saveNap,
    toggleAlcohol,
    toggleNap,
    toggleSleepLog
  } = data;

  return useMemo(() => ({
    logs,
    partners,
    quickAddSex,
    quickAddMasturbation,
    saveExercise,
    saveAlcoholRecord,
    saveNap,
    toggleAlcohol,
    toggleNap,
    toggleSleepLog
  }), [
    logs,
    partners,
    quickAddSex,
    quickAddMasturbation,
    saveExercise,
    saveAlcoholRecord,
    saveNap,
    toggleAlcohol,
    toggleNap,
    toggleSleepLog
  ]);
};
