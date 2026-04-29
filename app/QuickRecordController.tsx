import React, { useMemo, useState } from 'react';
import { AlcoholRecord, ExerciseRecord, LogEntry, MasturbationRecordDetails, NapRecord } from '../types';
import { useToast } from '../contexts/ToastContext';
import { FAB, AlcoholRecordModal, ExerciseRecordModal, NapRecordModal } from '../features/quick-actions';
import { MasturbationRecordModal, SexRecordModal } from '../features/sex-life';
import { getErrorMessage } from '../shared/lib';
import type { AppData } from './AppProviders';

interface QuickRecordHandlers {
  onFinishExercise: (record: ExerciseRecord) => void;
  onFinishMasturbation: (record: MasturbationRecordDetails) => void;
  onFinishNap: (record: NapRecord) => void;
  onFinishAlcohol: (record: AlcoholRecord) => void;
}

interface QuickRecordControllerProps {
  data: AppData;
  isEnabled: boolean;
  children: (handlers: QuickRecordHandlers) => React.ReactNode;
}

const QuickRecordController: React.FC<QuickRecordControllerProps> = ({ data, isEnabled, children }) => {
  const { showToast } = useToast();
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
  const pendingLog = useMemo(() => safeLogs.find((log: LogEntry) => log.status === 'pending'), [safeLogs]);
  const ongoingExercise = useMemo(() => safeLogs.flatMap((log: LogEntry) => (Array.isArray(log.exercise) ? log.exercise : [])).find((record: ExerciseRecord) => record.ongoing), [safeLogs]);
  const ongoingNap = useMemo(() => safeLogs.flatMap((log: LogEntry) => (log.sleep && Array.isArray(log.sleep.naps) ? log.sleep.naps : [])).find((record: NapRecord) => record.ongoing), [safeLogs]);
  const ongoingMb = useMemo(() => safeLogs.flatMap((log: LogEntry) => (Array.isArray(log.masturbation) ? log.masturbation : [])).find((record: MasturbationRecordDetails) => record.status === 'inProgress'), [safeLogs]);
  const ongoingAlcohol = useMemo(() => safeLogs.find((log: LogEntry) => Array.isArray(log.alcoholRecords) && log.alcoholRecords.some(record => record.ongoing))?.alcoholRecords?.find((record: AlcoholRecord) => record.ongoing), [safeLogs]);

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

    const newRecord: MasturbationRecordDetails = {
      id: Date.now().toString(),
      startTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      duration: 0,
      status: 'inProgress',
      tools: ['手'],
      contentItems: [],
      materials: [],
      props: [],
      assets: { sources: [], platforms: [], categories: [], target: '', actors: [] },
      materialsList: [],
      edging: 'none',
      edgingCount: 0,
      lubricant: '无润滑',
      useCondom: false,
      ejaculation: true,
      orgasmIntensity: 3,
      mood: 'neutral',
      stressLevel: 3,
      energyLevel: 3,
      interrupted: false,
      interruptionReasons: [],
      notes: ''
    };

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

      <SexRecordModal
        isOpen={isQuickSexModalOpen}
        onClose={() => setIsQuickSexModalOpen(false)}
        onSave={(record) => wrapAction(async () => {
          await quickAddSex(record);
          setIsQuickSexModalOpen(false);
        }, '性生活记录已添加')}
        dateStr="现在"
        logs={logs}
        partners={partners}
      />

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
        logs={logs}
        partners={partners}
      />

      <ExerciseRecordModal
        isOpen={isExerciseModalOpen}
        onClose={() => {
          setIsExerciseModalOpen(false);
          setExerciseToFinish(null);
        }}
        onSave={handleSaveExercise}
        initialData={exerciseToFinish || undefined}
        mode={exerciseToFinish ? 'finish' : 'start'}
      />

      <AlcoholRecordModal
        isOpen={isAlcoholModalOpen}
        onClose={() => {
          setIsAlcoholModalOpen(false);
          setAlcToFinish(null);
        }}
        initialData={alcToFinish || undefined}
        onSave={(record) => wrapAction(async () => { await saveAlcoholRecord(record); }, '饮酒记录已保存')}
      />

      <NapRecordModal
        isOpen={isNapModalOpen}
        onClose={() => {
          setIsNapModalOpen(false);
          setNapToFinish(null);
        }}
        onSave={handleSaveNap}
        initialData={napToFinish || undefined}
      />
    </>
  );
};

export default QuickRecordController;
