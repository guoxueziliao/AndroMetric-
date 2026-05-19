import type { ChangeRecord, DataQualitySource, LogEntry, SexRecordDetails } from '../../../../domain';
import { StorageService } from '../../../../core/storage';
import { hydrateLog } from '../../../../utils/hydrateLog';

export type SaveLog = (log: LogEntry, source?: DataQualitySource) => Promise<void>;

/**
 * 快速记录一次性生活。归属到当前活动日(凌晨 03:00 前算前一日)。
 * 业务规则:追加到现有日志,或为目标日期创建一条新日志骨架。
 */
export const quickAddSex = async (
  record: SexRecordDetails,
  targetDate: string,
  saveLog: SaveLog
): Promise<void> => {
  const existingLog = await StorageService.logs.get(targetDate);
  if (existingLog) {
    const historyEntry: ChangeRecord = {
      timestamp: Date.now(),
      summary: '快速记录: 性生活',
      details: [{ field: '性生活次数', oldValue: String(existingLog.sex?.length || 0), newValue: String((existingLog.sex?.length || 0) + 1), category: 'sex' }],
      type: 'quick'
    };
    await saveLog({
      ...existingLog,
      sex: [...(existingLog.sex || []), record],
      changeHistory: [...(existingLog.changeHistory || []), historyEntry]
    }, 'quick');
  } else {
    const historyEntry: ChangeRecord = {
      timestamp: Date.now(),
      summary: '快速记录: 性生活',
      details: [{ field: '性生活次数', oldValue: '0', newValue: '1', category: 'sex' }],
      type: 'quick'
    };
    const skeleton = hydrateLog({ date: targetDate });
    const newLog: LogEntry = {
      ...skeleton,
      status: 'completed',
      sex: [record],
      changeHistory: [historyEntry]
    };
    await saveLog(newLog, 'quick');
  }
};
