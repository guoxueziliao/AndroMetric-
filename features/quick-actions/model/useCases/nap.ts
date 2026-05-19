import type { ChangeRecord, LogEntry, NapRecord } from '../../../../domain';
import { StorageService } from '../../../../core/storage';
import { hydrateLog } from '../../../../utils/hydrateLog';
import type { SaveLog } from './sex';

export const saveNap = async (
  record: NapRecord,
  targetDate: string,
  saveLog: SaveLog
): Promise<void> => {
  const existingLog = await StorageService.logs.get(targetDate);

  if (existingLog) {
    const newNaps = existingLog.sleep?.naps ? [...existingLog.sleep.naps] : [];
    const napIdx = newNaps.findIndex(n => n.id === record.id);
    if (napIdx > -1) newNaps[napIdx] = record;
    else newNaps.push(record);
    const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '记录午休', details: [], type: 'quick' };
    await saveLog({
      ...existingLog,
      sleep: { ...existingLog.sleep!, naps: newNaps },
      changeHistory: [...(existingLog.changeHistory || []), historyEntry]
    }, 'quick');
  } else {
    const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '记录午休', details: [], type: 'quick' };
    const skeleton = hydrateLog({ date: targetDate });
    const newLog: LogEntry = {
      ...skeleton,
      status: 'completed',
      sleep: { ...skeleton.sleep!, naps: [record] },
      changeHistory: [historyEntry]
    };
    await saveLog(newLog, 'quick');
  }
};

/**
 * 一键切换午休状态:
 * - 已有进行中的午休 → 返回该记录(调用方可继续编辑/完成)
 * - 没有进行中 → 立刻创建一条新的"进行中"午休并返回 null
 */
export const toggleNap = async (
  targetDate: string,
  saveLog: SaveLog
): Promise<NapRecord | null> => {
  const allLogs = await StorageService.logs.getAll();
  const ongoingNapLog = allLogs.find(l => l.sleep?.naps?.some(n => n.ongoing));
  if (ongoingNapLog) {
    const nap = ongoingNapLog.sleep!.naps.find(n => n.ongoing);
    return nap ?? null;
  }

  const now = new Date();
  const nowStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const newNap: NapRecord = {
    id: Date.now().toString(),
    startTime: nowStr,
    ongoing: true,
    duration: 0,
    quality: null
  };
  await saveNap(newNap, targetDate, saveLog);
  return null;
};

export const cancelOngoingNap = async (saveLog: SaveLog): Promise<void> => {
  const allLogs = await StorageService.logs.getAll();
  const ongoingLog = allLogs.find(l => l.sleep?.naps?.some(n => n.ongoing));
  if (ongoingLog) {
    const nextNaps = ongoingLog.sleep!.naps.filter(n => !n.ongoing);
    const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: '取消午休', details: [], type: 'quick' };
    await saveLog({
      ...ongoingLog,
      sleep: { ...ongoingLog.sleep!, naps: nextNaps },
      changeHistory: [...(ongoingLog.changeHistory || []), historyEntry]
    }, 'quick');
  }
};
