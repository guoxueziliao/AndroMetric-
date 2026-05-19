import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { StorageService } from '../services/StorageService';
import {
  CycleEvent,
  LogEntry,
  SexRecordDetails,
  MasturbationRecordDetails,
  PartnerProfile,
  ExerciseRecord,
  NapRecord,
  AlcoholRecord,
  PregnancyEvent,
  TagEntry,
  TagType,
  DataQualitySource
} from '../types';
import { hydrateLog } from '../utils/hydrateLog';
import { db } from '../db';
import { attachMenstrualSummary } from '../features/reproductive/model/p4Derivations';
import { getActivityTargetDate, getSleepTargetDate } from '../shared/lib';
import {
  quickAddSex,
  quickAddMasturbation,
  cancelOngoingMasturbation,
  saveExercise,
  cancelOngoingExercise,
  saveNap,
  toggleNap,
  cancelOngoingNap,
  saveAlcoholRecord,
  toggleAlcohol,
  cancelAlcoholRecord,
  toggleSleepLog
} from '../features/quick-actions/model/useCases';

export function useLogs() {
  const rawLogs = useLiveQuery(StorageService.logs.queries.allDesc) || [];
  const partners = useLiveQuery(StorageService.partners.queries.all) || [];
  const cycleEvents = useLiveQuery(StorageService.cycleEvents.queries.all) || [];
  const pregnancyEvents = useLiveQuery(StorageService.pregnancyEvents.queries.all) || [];
  const logs = useMemo(
    () => rawLogs.map(hydrateLog).map((log) => attachMenstrualSummary(log, partners, cycleEvents)),
    [cycleEvents, partners, rawLogs]
  );
  const userTags = useLiveQuery(() => db.tags.toArray()) || [];
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      await StorageService.init();
      setIsInitializing(false);
    };
    init();
  }, []);

  // ----- Atomic writes (error-wrapped) -----

  const addOrUpdateLog = useCallback(async (log: LogEntry, source: DataQualitySource = 'manual') => {
    try {
      await StorageService.logs.save(log, source);
    } catch (error: any) {
      console.error('Failed to save log:', error);
      throw new Error(error.message || '保存记录失败，请重试');
    }
  }, []);

  const deleteLog = useCallback(async (date: string) => {
    try {
      await StorageService.logs.delete(date);
    } catch (error) {
      console.error('Failed to delete log:', error);
      throw new Error('删除记录失败');
    }
  }, []);

  const addOrUpdateTag = useCallback((tag: TagEntry) => StorageService.tags.add(tag).then(() => undefined), []);
  const deleteTag = useCallback((name: string, category: TagType) => StorageService.tags.delete(name, category).then(() => undefined), []);

  const addOrUpdatePartner = useCallback(async (partner: PartnerProfile) => {
    try {
      await StorageService.partners.save(partner);
    } catch (error) {
      console.error('Failed to save partner:', error);
      throw new Error('保存伴侣档案失败');
    }
  }, []);

  const deletePartner = useCallback(async (id: string) => {
    try {
      await StorageService.partners.delete(id);
    } catch (error) {
      console.error('Failed to delete partner:', error);
      throw new Error('删除伴侣档案失败');
    }
  }, []);

  const saveCycleEvent = useCallback(async (event: CycleEvent) => {
    try {
      await StorageService.cycleEvents.save(event);
    } catch (error) {
      console.error('Failed to save cycle event:', error);
      throw new Error('保存周期事件失败');
    }
  }, []);

  const deleteCycleEvent = useCallback(async (id: string) => {
    try {
      await StorageService.cycleEvents.delete(id);
    } catch (error) {
      console.error('Failed to delete cycle event:', error);
      throw new Error('删除周期事件失败');
    }
  }, []);

  const savePregnancyEvent = useCallback(async (event: PregnancyEvent) => {
    try {
      await StorageService.pregnancyEvents.save(event);
    } catch (error) {
      console.error('Failed to save pregnancy event:', error);
      throw new Error('保存怀孕事件失败');
    }
  }, []);

  const deletePregnancyEvent = useCallback(async (id: string) => {
    try {
      await StorageService.pregnancyEvents.delete(id);
    } catch (error) {
      console.error('Failed to delete pregnancy event:', error);
      throw new Error('删除怀孕事件失败');
    }
  }, []);

  // ----- Quick-action use cases (delegate to features/quick-actions/model/useCases) -----

  const boundQuickAddSex = useCallback(
    (record: SexRecordDetails) => quickAddSex(record, getActivityTargetDate(), addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundQuickAddMasturbation = useCallback(
    (record: MasturbationRecordDetails) => quickAddMasturbation(record, getActivityTargetDate(), addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundCancelOngoingMasturbation = useCallback(
    () => cancelOngoingMasturbation(addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundSaveExercise = useCallback(
    (record: ExerciseRecord) => saveExercise(record, getActivityTargetDate(), addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundCancelOngoingExercise = useCallback(
    () => cancelOngoingExercise(addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundSaveNap = useCallback(
    (record: NapRecord) => saveNap(record, getActivityTargetDate(), addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundToggleNap = useCallback(
    () => toggleNap(getActivityTargetDate(), addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundCancelOngoingNap = useCallback(
    () => cancelOngoingNap(addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundSaveAlcoholRecord = useCallback(
    (record: AlcoholRecord) => saveAlcoholRecord(record, getActivityTargetDate(), addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundToggleAlcohol = useCallback(
    () => toggleAlcohol(getActivityTargetDate(), addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundCancelAlcoholRecord = useCallback(
    () => cancelAlcoholRecord(addOrUpdateLog),
    [addOrUpdateLog]
  );

  const boundToggleSleepLog = useCallback(
    (pendingLog?: LogEntry) => toggleSleepLog(pendingLog, getSleepTargetDate(), addOrUpdateLog, deleteLog),
    [addOrUpdateLog, deleteLog]
  );

  // ----- Bulk import -----

  const importLogs = useCallback(async (
    importedLogs: LogEntry[],
    importedPartners?: PartnerProfile[],
    importedCycleEvents?: CycleEvent[],
    importedPregnancyEvents?: PregnancyEvent[]
  ) => {
    if (importedLogs.length > 0) await StorageService.logs.bulkImport(importedLogs);
    if (importedPartners && importedPartners.length > 0) await StorageService.partners.bulkImport(importedPartners);
    if (importedCycleEvents && importedCycleEvents.length > 0) await StorageService.cycleEvents.bulkImport(importedCycleEvents);
    if (importedPregnancyEvents && importedPregnancyEvents.length > 0) await StorageService.pregnancyEvents.bulkImport(importedPregnancyEvents);
  }, []);

  return {
    logs, partners, cycleEvents, pregnancyEvents, userTags, isInitializing,
    addOrUpdateLog, deleteLog,
    addOrUpdatePartner, deletePartner,
    saveCycleEvent, deleteCycleEvent,
    savePregnancyEvent, deletePregnancyEvent,
    addOrUpdateTag, deleteTag,
    quickAddSex: boundQuickAddSex,
    quickAddMasturbation: boundQuickAddMasturbation,
    cancelOngoingMasturbation: boundCancelOngoingMasturbation,
    saveExercise: boundSaveExercise,
    cancelOngoingExercise: boundCancelOngoingExercise,
    saveNap: boundSaveNap,
    toggleNap: boundToggleNap,
    cancelOngoingNap: boundCancelOngoingNap,
    saveAlcoholRecord: boundSaveAlcoholRecord,
    toggleAlcohol: boundToggleAlcohol,
    cancelAlcoholRecord: boundCancelAlcoholRecord,
    toggleSleepLog: boundToggleSleepLog,
    importLogs
  };
}
