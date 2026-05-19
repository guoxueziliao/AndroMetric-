import type { AlcoholConsumption, AlcoholRecord, ChangeRecord, LogEntry } from '../../../../domain';
import { StorageService } from '../../../../core/storage';
import { hydrateLog } from '../../../../utils/hydrateLog';
import type { SaveLog } from './sex';

const totalToLevel = (total: number): AlcoholConsumption => {
  if (total > 50) return 'high';
  if (total > 20) return 'medium';
  if (total > 0) return 'low';
  return 'none';
};

export const saveAlcoholRecord = async (
  record: AlcoholRecord,
  targetDate: string,
  saveLog: SaveLog
): Promise<void> => {
  const existingLog = await StorageService.logs.get(targetDate);
  const summaryText = record.ongoing ? '酒局计时中' : `饮酒记录: ${record.totalGrams}g纯酒精`;

  if (existingLog) {
    const currentRecords = existingLog.alcoholRecords || [];
    const exists = currentRecords.find(r => r.id === record.id);
    const nextRecords = exists ? currentRecords.map(r => (r.id === record.id ? record : r)) : [...currentRecords, record];
    const totalGrams = nextRecords.reduce((s, r) => s + r.totalGrams, 0);
    const historyEntry: ChangeRecord = {
      timestamp: Date.now(),
      summary: summaryText,
      details: [{
        field: '总酒精摄入',
        oldValue: `${existingLog.alcoholRecords?.reduce((s, r) => s + r.totalGrams, 0) || 0}g`,
        newValue: `${totalGrams}g`,
        category: 'lifestyle'
      }],
      type: 'quick'
    };
    await saveLog({
      ...existingLog,
      alcohol: totalToLevel(totalGrams),
      alcoholRecords: nextRecords,
      changeHistory: [...(existingLog.changeHistory || []), historyEntry]
    }, 'quick');
  } else {
    const historyEntry: ChangeRecord = { timestamp: Date.now(), summary: summaryText, details: [], type: 'quick' };
    const skeleton = hydrateLog({ date: targetDate });
    const newLog: LogEntry = {
      ...skeleton,
      status: 'completed',
      alcohol: totalToLevel(record.totalGrams),
      alcoholRecords: [record],
      changeHistory: [historyEntry]
    };
    await saveLog(newLog, 'quick');
  }
};

export const toggleAlcohol = async (
  targetDate: string,
  saveLog: SaveLog
): Promise<AlcoholRecord | null | undefined> => {
  const allLogs = await StorageService.logs.getAll();
  const ongoingLog = allLogs.find(l => l.alcoholRecords?.some(r => r.ongoing));
  if (ongoingLog) {
    return ongoingLog.alcoholRecords.find(r => r.ongoing);
  }

  const nowStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const newRecord: AlcoholRecord = {
    id: Date.now().toString(),
    totalGrams: 0,
    durationMinutes: 0,
    isLate: new Date().getHours() < 5,
    items: [],
    startTime: nowStr,
    time: nowStr,
    ongoing: true
  };
  await saveAlcoholRecord(newRecord, targetDate, saveLog);
  return null;
};

export const cancelAlcoholRecord = async (saveLog: SaveLog): Promise<void> => {
  const allLogs = await StorageService.logs.getAll();
  const ongoingLog = allLogs.find(l => l.alcoholRecords?.some(r => r.ongoing));
  if (ongoingLog) {
    const nextRecords = ongoingLog.alcoholRecords.filter(r => !r.ongoing);
    const total = nextRecords.reduce((s, r) => s + r.totalGrams, 0);
    await saveLog({
      ...ongoingLog,
      alcohol: totalToLevel(total),
      alcoholRecords: nextRecords
    }, 'quick');
  }
};
