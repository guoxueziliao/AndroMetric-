import React, { lazy, Suspense, useMemo, useState } from 'react';
import type { AlcoholRecord, ExerciseRecord, MasturbationRecordDetails, NapRecord } from '../../domain';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../shared/lib';
import FAB from './FAB';
import { createMasturbationStartRecord } from './model/createMasturbationStartRecord';
import {
  selectOngoingAlcohol,
  selectOngoingExercise,
  selectOngoingMasturbation,
  selectOngoingNap,
  selectPendingSleepLog
} from './model/selectors';
import type { QuickRecordData, QuickRecordHandlers } from './model/types';

const SexRecordModal = lazy(() => import('../sex-life').then((module) => ({ default: module.SexRecordModal })));
const MasturbationRecordModal = lazy(() => import('../sex-life').then((module) => ({ default: module.MasturbationRecordModal })));
const ExerciseRecordModal = lazy(() => import('../daily-log').then((module) => ({ default: module.ExerciseRecordModal })));
const AlcoholRecordModal = lazy(() => import('../daily-log').then((module) => ({ default: module.AlcoholRecordModal })));
const NapRecordModal = lazy(() => import('../daily-log').then((module) => ({ default: module.NapRecordModal })));

interface QuickRecordControllerProps {
  data: QuickRecordData;
  isEnabled: boolean;
  children: (handlers: QuickRecordHandlers) => React.ReactNode;
}

const modalFallback = (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px]">
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      表单加载中...
    </div>
  </div>
);

const QuickRecordController: React.FC<QuickRecordControllerProps> = ({ data, isEnabled, children }) => {
  const { showToast } = useToast();
  const {
    logs,
    partners,
    userTags,
    addOrUpdateLog,
    addOrUpdateTag,
    deleteTag,
    quickAddSex,
    quickAddMasturbation,
    saveExercise,
    saveAlcoholRecord,
    saveNap,
    toggleAlcohol,
    toggleNap,
    toggleSleepLog
  } = data;

  const [isQuickSexModalOpen, setIsQuickSexModalOpen] = useState(false);
  const [isQuickMbModalOpen, setIsQuickMbModalOpen] = useState(false);
  const [mbToFinish, setMbToFinish] = useState<MasturbationRecordDetails | null>(null);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseToFinish, setExerciseToFinish] = useState<ExerciseRecord | null>(null);

  const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false);
  const [alcToFinish, setAlcToFinish] = useState<AlcoholRecord | null>(null);

  const [isNapModalOpen, setIsNapModalOpen] = useState(false);
  const [napToFinish, setNapToFinish] = useState<NapRecord | null>(null);

  const safeLogs = Array.isArray(logs) ? logs : [];
  const pendingLog = useMemo(() => selectPendingSleepLog(safeLogs), [safeLogs]);
  const ongoingExercise = useMemo(() => selectOngoingExercise(safeLogs), [safeLogs]);
  const ongoingNap = useMemo(() => selectOngoingNap(safeLogs), [safeLogs]);
  const ongoingMb = useMemo(() => selectOngoingMasturbation(safeLogs), [safeLogs]);
  const ongoingAlcohol = useMemo(() => selectOngoingAlcohol(safeLogs), [safeLogs]);

  const wrapAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      showToast(successMsg, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, '操作失败'), 'error');
    }
  };

  const handleStartAlcohol = async () => {
    const ongoing = await toggleAlcohol();
    if (ongoing) {
      setAlcToFinish(ongoing);
      setIsAlcoholModalOpen(true);
    } else {
      showToast('酒局计时开始', 'success');
    }
  };

  const handleNapAction = async () => {
    const ongoing = await toggleNap();
    if (ongoing) {
      setNapToFinish(ongoing);
      setIsNapModalOpen(true);
    } else {
      showToast('午休记录已开始', 'success');
    }
  };

  const handleStartExercise = () => {
    setExerciseToFinish(null);
    setIsExerciseModalOpen(true);
  };

  const handleFinishExercise = (record: ExerciseRecord) => {
    setExerciseToFinish(record);
    setIsExerciseModalOpen(true);
  };

  const handleFinishNap = (record: NapRecord) => {
    setNapToFinish(record);
    setIsNapModalOpen(true);
  };

  const handleFinishAlcohol = (record: AlcoholRecord) => {
    setAlcToFinish(record);
    setIsAlcoholModalOpen(true);
  };

  const handleStartMasturbation = () => {
    if (ongoingMb) {
      handleFinishMasturbation(ongoingMb);
      return;
    }

    const newRecord = createMasturbationStartRecord();
    wrapAction(async () => { await quickAddMasturbation(newRecord); }, '开始施法 (已记录开始时间)');
  };

  const handleFinishMasturbation = (record: MasturbationRecordDetails) => {
    setMbToFinish(record);
    setIsQuickMbModalOpen(true);
  };

  const handleSaveExercise = (record: ExerciseRecord) => {
    wrapAction(async () => {
      await saveExercise({ ...record, ongoing: record.type !== '日常步行' && !exerciseToFinish });
      setIsExerciseModalOpen(false);
      setExerciseToFinish(null);
    }, exerciseToFinish ? '运动已完成' : '运动开始');
  };

  const handleSaveNap = (record: NapRecord) => {
    wrapAction(async () => {
      await saveNap(record);
      setIsNapModalOpen(false);
      setNapToFinish(null);
    }, '午休记录已保存');
  };

  return (
    <>
      {children({
        onFinishExercise: handleFinishExercise,
        onFinishMasturbation: handleFinishMasturbation,
        onFinishNap: handleFinishNap,
        onFinishAlcohol: handleFinishAlcohol
      })}

      {isEnabled && (
        <FAB
          onSleep={() => wrapAction(async () => { await toggleSleepLog(pendingLog); }, pendingLog ? '取消睡眠记录' : '开始记录睡眠')}
          onSex={() => setIsQuickSexModalOpen(true)}
          onMasturbation={handleStartMasturbation}
          onExercise={handleStartExercise}
          onNap={handleNapAction}
          onAlcohol={handleStartAlcohol}
          isSleepPending={!!pendingLog}
          isExerciseOngoing={!!ongoingExercise}
          isNapOngoing={!!ongoingNap}
          isMbOngoing={!!ongoingMb}
          isAlcoholOngoing={!!ongoingAlcohol}
        />
      )}

      {isQuickSexModalOpen && (
        <Suspense fallback={modalFallback}>
          <SexRecordModal
            isOpen={isQuickSexModalOpen}
            onClose={() => setIsQuickSexModalOpen(false)}
            onSave={(record) => wrapAction(async () => {
              await quickAddSex(record);
              setIsQuickSexModalOpen(false);
            }, '性生活记录已添加')}
            dateStr="现在"
            data={{
              logs,
              partners
            }}
          />
        </Suspense>
      )}

      {isQuickMbModalOpen && (
        <Suspense fallback={modalFallback}>
          <MasturbationRecordModal
            isOpen={isQuickMbModalOpen}
            onClose={() => {
              setIsQuickMbModalOpen(false);
              setMbToFinish(null);
            }}
            onSave={(record) => wrapAction(async () => {
              await quickAddMasturbation(record);
              setIsQuickMbModalOpen(false);
              setMbToFinish(null);
            }, '自慰记录已完成')}
            dateStr="现在"
            initialData={mbToFinish || undefined}
            data={{
              logs,
              partners,
              userTags
            }}
            actions={{
              onAddOrUpdateLog: addOrUpdateLog,
              onAddOrUpdateTag: addOrUpdateTag,
              onDeleteTag: deleteTag
            }}
          />
        </Suspense>
      )}

      {isExerciseModalOpen && (
        <Suspense fallback={modalFallback}>
          <ExerciseRecordModal
            isOpen={isExerciseModalOpen}
            onClose={() => {
              setIsExerciseModalOpen(false);
              setExerciseToFinish(null);
            }}
            data={{
              initialData: exerciseToFinish || undefined,
              mode: exerciseToFinish ? 'finish' : 'start'
            }}
            actions={{
              onSave: handleSaveExercise
            }}
          />
        </Suspense>
      )}

      {isAlcoholModalOpen && (
        <Suspense fallback={modalFallback}>
          <AlcoholRecordModal
            isOpen={isAlcoholModalOpen}
            onClose={() => {
              setIsAlcoholModalOpen(false);
              setAlcToFinish(null);
            }}
            data={{
              initialData: alcToFinish || undefined
            }}
            actions={{
              onSave: (record) => wrapAction(async () => { await saveAlcoholRecord(record); }, '饮酒记录已保存')
            }}
          />
        </Suspense>
      )}

      {isNapModalOpen && (
        <Suspense fallback={modalFallback}>
          <NapRecordModal
            isOpen={isNapModalOpen}
            onClose={() => {
              setIsNapModalOpen(false);
              setNapToFinish(null);
            }}
            data={{
              initialData: napToFinish || undefined
            }}
            actions={{
              onSave: handleSaveNap
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default QuickRecordController;
