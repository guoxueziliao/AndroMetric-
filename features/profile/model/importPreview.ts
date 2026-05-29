import { LATEST_VERSION } from '../../../core/storage/migration';
import { computeLogConflicts, checkAdultEventLinks, normalizeTrainingGoals, normalizeGoalCheckins, type LogImportConflict, type AdultEventLinkIssue, type TrainingImportWarning } from '../../../core/storage/importMerge';
import { checkSnapshotIntegrity, type SnapshotIntegrityIssue } from '../../../core/storage/snapshotIntegrity';
import type { LogEntry, Snapshot } from '../../../domain';
import { isEncryptedSnapshotJson } from '../../../shared/lib';

export type ImportStrategy = 'merge' | 'overwrite';
export type ImportVersionStatus = 'match' | 'older' | 'newer';
export type { ImportConflictResolution, LogImportConflict } from '../../../core/storage/importMerge';

export interface ImportPreview {
  rawText: string;
  encrypted: boolean;
  appVersion?: string;
  exportDate?: string;
  dataVersion?: number;
  versionStatus: ImportVersionStatus;
  includesSettings: boolean;
  includesUserName: boolean;
  counts: {
    logs: number;
    partners: number;
    tags: number;
    cycleEvents: number;
    pregnancyEvents: number;
    snapshots: number;
    pornUseEvents: number;
    masturbationEvents: number;
    sexEvents: number;
    trainingGoals: number;
    goalCheckins: number;
  };
  conflicts: LogImportConflict[];
  eventLinkIssues: AdultEventLinkIssue[];
  trainingWarnings: TrainingImportWarning[];
  integrityIssues: SnapshotIntegrityIssue[];
}

const getArrayLength = (value: unknown): number => Array.isArray(value) ? value.length : 0;

const getVersionStatus = (dataVersion?: number): ImportVersionStatus => {
  if (typeof dataVersion !== 'number') return 'match';
  if (dataVersion < LATEST_VERSION) return 'older';
  if (dataVersion > LATEST_VERSION) return 'newer';
  return 'match';
};

export const buildImportPreview = (rawText: string, encrypted: boolean, currentLogs: LogEntry[] = []): ImportPreview => {
  const parsed = JSON.parse(rawText) as {
    appVersion?: unknown;
    exportDate?: unknown;
    dataVersion?: unknown;
    settings?: unknown;
    userName?: unknown;
    data?: unknown;
  };
  const data = (parsed.data && typeof parsed.data === 'object') ? parsed.data as Record<string, unknown> : parsed as Record<string, unknown>;

  const dataVersion = typeof parsed.dataVersion === 'number'
    ? parsed.dataVersion
    : typeof data.version === 'number' ? data.version : undefined;
  const incomingLogs = Array.isArray(data.logs) ? data.logs as Partial<LogEntry>[] : [];

  const pornUseEvents = Array.isArray(data.pornUseEvents) ? data.pornUseEvents : [];
  const masturbationEvents = Array.isArray(data.masturbationEvents) ? data.masturbationEvents : [];
  const sexEvents = Array.isArray(data.sexEvents) ? data.sexEvents : [];
  const trainingGoals = Array.isArray(data.trainingGoals) ? data.trainingGoals : [];
  const goalCheckins = Array.isArray(data.goalCheckins) ? data.goalCheckins : [];

  // Normalize training data to surface warnings in preview
  const goalNorm = normalizeTrainingGoals(trainingGoals);
  const goalIds = new Set(goalNorm.goals.map((g: { id: string }) => g.id));
  const checkinNorm = normalizeGoalCheckins(goalCheckins, goalIds);
  const trainingWarnings = [...goalNorm.warnings, ...checkinNorm.warnings];

  return {
    rawText,
    encrypted,
    appVersion: typeof parsed.appVersion === 'string' ? parsed.appVersion : undefined,
    exportDate: typeof parsed.exportDate === 'string' ? parsed.exportDate : undefined,
    dataVersion,
    versionStatus: getVersionStatus(dataVersion),
    includesSettings: parsed.settings !== undefined && parsed.settings !== null,
    includesUserName: typeof parsed.userName === 'string' && parsed.userName.length > 0,
    counts: {
      logs: getArrayLength(data.logs),
      partners: getArrayLength(data.partners),
      tags: getArrayLength(data.tags),
      cycleEvents: getArrayLength(data.cycleEvents),
      pregnancyEvents: getArrayLength(data.pregnancyEvents),
      snapshots: getArrayLength(data.snapshots),
      pornUseEvents: pornUseEvents.length,
      masturbationEvents: masturbationEvents.length,
      sexEvents: sexEvents.length,
      trainingGoals: trainingGoals.length,
      goalCheckins: goalCheckins.length,
    },
    conflicts: computeLogConflicts(currentLogs, incomingLogs),
    eventLinkIssues: checkAdultEventLinks({
      pornUseEvents,
      masturbationEvents,
      sexEvents,
    }),
    trainingWarnings,
    integrityIssues: (() => {
      // Run integrity check on parsed data (read-only, no IndexedDB write)
      try {
        const snapshotForCheck: Snapshot = {
          id: 0,
          timestamp: Date.now(),
          dataVersion: dataVersion ?? LATEST_VERSION,
          appVersion: typeof parsed.appVersion === 'string' ? parsed.appVersion : 'unknown',
          description: 'preflight',
          kind: 'manual',
          settings: null,
          userName: null,
          data: data as unknown as Snapshot['data'],
        };
        return checkSnapshotIntegrity(snapshotForCheck);
      } catch {
        return [];
      }
    })(),
  };
};

export const getImportFileKind = (text: string): 'encrypted' | 'plain' => (
  isEncryptedSnapshotJson(text) ? 'encrypted' : 'plain'
);
