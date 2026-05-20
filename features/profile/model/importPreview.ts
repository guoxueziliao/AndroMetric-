import { isEncryptedSnapshotJson } from '../../../shared/lib';

export type ImportStrategy = 'merge' | 'overwrite';

export interface ImportPreview {
  rawText: string;
  encrypted: boolean;
  appVersion?: string;
  exportDate?: string;
  dataVersion?: number;
  includesSettings: boolean;
  includesUserName: boolean;
  counts: {
    logs: number;
    partners: number;
    tags: number;
    cycleEvents: number;
    pregnancyEvents: number;
  };
}

const getArrayLength = (value: unknown): number => Array.isArray(value) ? value.length : 0;

export const buildImportPreview = (rawText: string, encrypted: boolean): ImportPreview => {
  const parsed = JSON.parse(rawText) as {
    appVersion?: unknown;
    exportDate?: unknown;
    dataVersion?: unknown;
    settings?: unknown;
    userName?: unknown;
    data?: unknown;
  };
  const data = (parsed.data && typeof parsed.data === 'object') ? parsed.data as Record<string, unknown> : parsed as Record<string, unknown>;

  return {
    rawText,
    encrypted,
    appVersion: typeof parsed.appVersion === 'string' ? parsed.appVersion : undefined,
    exportDate: typeof parsed.exportDate === 'string' ? parsed.exportDate : undefined,
    dataVersion: typeof parsed.dataVersion === 'number'
      ? parsed.dataVersion
      : typeof data.version === 'number' ? data.version : undefined,
    includesSettings: parsed.settings !== undefined && parsed.settings !== null,
    includesUserName: typeof parsed.userName === 'string' && parsed.userName.length > 0,
    counts: {
      logs: getArrayLength(data.logs),
      partners: getArrayLength(data.partners),
      tags: getArrayLength(data.tags),
      cycleEvents: getArrayLength(data.cycleEvents),
      pregnancyEvents: getArrayLength(data.pregnancyEvents)
    }
  };
};

export const getImportFileKind = (text: string): 'encrypted' | 'plain' => (
  isEncryptedSnapshotJson(text) ? 'encrypted' : 'plain'
);
