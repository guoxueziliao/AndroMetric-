import type { LogEntry } from '../../../../domain';
import { hydrateLog } from '../../../../utils/hydrateLog';
import type { SaveLog } from './sex';

export type DeleteLog = (date: string) => Promise<void>;

/**
 * "去睡觉"按钮的语义:
 * - 已有 pending 的睡眠记录 → 取消(删除该日志)
 * - 没有 → 为下一个生理日创建一条 pending 状态的睡眠骨架(start = 现在)
 */
export const toggleSleepLog = async (
  pendingLog: LogEntry | undefined,
  targetDate: string,
  saveLog: SaveLog,
  deleteLog: DeleteLog
): Promise<void> => {
  if (pendingLog) {
    await deleteLog(pendingLog.date);
    return;
  }
  const skeleton = hydrateLog({ date: targetDate });
  const newLog: LogEntry = {
    ...skeleton,
    status: 'pending',
    sleep: { ...skeleton.sleep!, startTime: new Date().toISOString() },
    updatedAt: Date.now(),
    changeHistory: [{ timestamp: Date.now(), summary: '开始睡觉', type: 'quick' }]
  };
  await saveLog(newLog, 'quick');
};
