import type { ChangeRecord, ExerciseRecord, LogEntry } from '../../../../domain';
import { StorageService } from '../../../../core/storage';
import { hydrateLog } from '../../../../utils/hydrateLog';
import type { SaveLog } from './sex';

export const saveExercise = async (
  record: ExerciseRecord,
  targetDate: string,
  saveLog: SaveLog
): Promise<void> => {
  const existingLog = await StorageService.logs.get(targetDate);
  const actionType = record.ongoing ? '开始运动' : '记录运动';

  if (existingLog) {
    const newExercises = existingLog.exercise ? [...existingLog.exercise] : [];
    const exIdx = newExercises.findIndex(e => e.id === record.id);
    const details = [] as ChangeRecord['details'];
    if (exIdx > -1) {
      newExercises[exIdx] = record;
      details!.push({ field: '运动更新', oldValue: '...', newValue: `${record.type} (${record.duration}m)`, category: 'exercise' });
    } else {
      newExercises.push(record);
      details!.push({ field: '运动次数', oldValue: String(existingLog.exercise?.length || 0), newValue: String((existingLog.exercise?.length || 0) + 1), category: 'exercise' });
    }
    const historyEntry: ChangeRecord = {
      timestamp: Date.now(),
      summary: `${actionType}: ${record.type}`,
      details,
      type: 'quick'
    };
    await saveLog({
      ...existingLog,
      exercise: newExercises,
      changeHistory: [...(existingLog.changeHistory || []), historyEntry]
    }, 'quick');
  } else {
    const historyEntry: ChangeRecord = {
      timestamp: Date.now(),
      summary: `${actionType}: ${record.type}`,
      details: [{ field: '运动次数', oldValue: '0', newValue: '1', category: 'exercise' }],
      type: 'quick'
    };
    const skeleton = hydrateLog({ date: targetDate });
    const newLog: LogEntry = {
      ...skeleton,
      status: 'completed',
      exercise: [record],
      changeHistory: [historyEntry]
    };
    await saveLog(newLog, 'quick');
  }
};

export const cancelOngoingExercise = async (saveLog: SaveLog): Promise<void> => {
  const allLogs = await StorageService.logs.getAll();
  const logToUpdate = allLogs.find(l => l.exercise?.some(e => e.ongoing));
  if (logToUpdate) {
    const nextExercises = logToUpdate.exercise.filter(e => !e.ongoing);
    await saveLog({ ...logToUpdate, exercise: nextExercises }, 'quick');
  }
};
