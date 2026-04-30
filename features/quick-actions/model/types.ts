import type {
  AlcoholRecord,
  ExerciseRecord,
  LogEntry,
  MasturbationRecordDetails,
  NapRecord,
  PartnerProfile,
  SexRecordDetails
} from '../../../domain';

export interface QuickRecordData {
  logs: LogEntry[];
  partners: PartnerProfile[];
  quickAddSex: (record: SexRecordDetails) => Promise<void>;
  quickAddMasturbation: (record: MasturbationRecordDetails) => Promise<void>;
  saveExercise: (record: ExerciseRecord) => Promise<void>;
  saveAlcoholRecord: (record: AlcoholRecord) => Promise<void>;
  saveNap: (record: NapRecord) => Promise<void>;
  toggleAlcohol: () => Promise<AlcoholRecord | null | undefined>;
  toggleNap: () => Promise<NapRecord | null | undefined>;
  toggleSleepLog: (pendingLog?: LogEntry) => Promise<void>;
}

export interface QuickRecordHandlers {
  onFinishExercise: (record: ExerciseRecord) => void;
  onFinishMasturbation: (record: MasturbationRecordDetails) => void;
  onFinishNap: (record: NapRecord) => void;
  onFinishAlcohol: (record: AlcoholRecord) => void;
}
