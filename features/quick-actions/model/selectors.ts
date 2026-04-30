import type { AlcoholRecord, ExerciseRecord, LogEntry, MasturbationRecordDetails, NapRecord } from '../../../domain';

export const selectPendingSleepLog = (logs: LogEntry[]) => (
  logs.find((log) => log.status === 'pending')
);

export const selectOngoingExercise = (logs: LogEntry[]) => (
  logs
    .flatMap((log) => (Array.isArray(log.exercise) ? log.exercise : []))
    .find((record: ExerciseRecord) => record.ongoing)
);

export const selectOngoingNap = (logs: LogEntry[]) => (
  logs
    .flatMap((log) => (log.sleep && Array.isArray(log.sleep.naps) ? log.sleep.naps : []))
    .find((record: NapRecord) => record.ongoing)
);

export const selectOngoingMasturbation = (logs: LogEntry[]) => (
  logs
    .flatMap((log) => (Array.isArray(log.masturbation) ? log.masturbation : []))
    .find((record: MasturbationRecordDetails) => record.status === 'inProgress')
);

export const selectOngoingAlcohol = (logs: LogEntry[]) => (
  logs
    .find((log) => Array.isArray(log.alcoholRecords) && log.alcoholRecords.some((record) => record.ongoing))
    ?.alcoholRecords
    ?.find((record: AlcoholRecord) => record.ongoing)
);
