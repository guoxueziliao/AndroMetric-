import type { ChangeRecord, LogEntry, MasturbationRecordDetails } from '../../../../domain';
import { StorageService } from '../../../../core/storage';
import { hydrateLog } from '../../../../utils/hydrateLog';
import type { SaveLog } from './sex';

export const quickAddMasturbation = async (
  record: MasturbationRecordDetails,
  targetDate: string,
  saveLog: SaveLog
): Promise<void> => {
  const existingLog = await StorageService.logs.get(targetDate);
  const actionType = record.status === 'inProgress' ? '开始自慰' : '快速记录: 自慰';

  if (existingLog) {
    const historyEntry: ChangeRecord = {
      timestamp: Date.now(),
      summary: actionType,
      details: [{ field: '自慰次数', oldValue: String(existingLog.masturbation?.length || 0), newValue: String((existingLog.masturbation?.length || 0) + 1), category: 'masturbation' }],
      type: 'quick'
    };
    const newMbList = [...(existingLog.masturbation || [])];
    const existingIdx = newMbList.findIndex(m => m.id === record.id);
    if (existingIdx > -1) newMbList[existingIdx] = record;
    else newMbList.push(record);
    await saveLog({
      ...existingLog,
      masturbation: newMbList,
      changeHistory: [...(existingLog.changeHistory || []), historyEntry]
    }, 'quick');
  } else {
    const historyEntry: ChangeRecord = {
      timestamp: Date.now(),
      summary: actionType,
      details: [{ field: '自慰次数', oldValue: '0', newValue: '1', category: 'masturbation' }],
      type: 'quick'
    };
    const skeleton = hydrateLog({ date: targetDate });
    const newLog: LogEntry = {
      ...skeleton,
      status: 'completed',
      masturbation: [record],
      changeHistory: [historyEntry]
    };
    await saveLog(newLog, 'quick');
  }
};

export const cancelOngoingMasturbation = async (saveLog: SaveLog): Promise<void> => {
  const allLogs = await StorageService.logs.getAll();
  const logToUpdate = allLogs.find(l => l.masturbation?.some(m => m.status === 'inProgress'));
  if (logToUpdate) {
    const nextMb = logToUpdate.masturbation.filter(m => m.status !== 'inProgress');
    await saveLog({ ...logToUpdate, masturbation: nextMb }, 'quick');
  }
};
