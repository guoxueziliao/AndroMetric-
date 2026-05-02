
import React, { createContext, useContext } from 'react';
import { CycleEvent, LogEntry, PartnerProfile, SexRecordDetails, MasturbationRecordDetails, ExerciseRecord, NapRecord, AlcoholRecord, PregnancyEvent, TagEntry, TagType } from '../types';

interface DataContextType {
    logs: LogEntry[];
    partners: PartnerProfile[];
    cycleEvents: CycleEvent[];
    pregnancyEvents: PregnancyEvent[];
    userTags: TagEntry[]; // 新增：用户自定义标签
    isInitializing: boolean;
    addOrUpdateLog: (log: LogEntry) => Promise<void>;
    deleteLog: (date: string) => Promise<void>;
    addOrUpdatePartner: (partner: PartnerProfile) => Promise<void>;
    deletePartner: (id: string) => Promise<void>;
    saveCycleEvent: (event: CycleEvent) => Promise<void>;
    deleteCycleEvent: (id: string) => Promise<void>;
    savePregnancyEvent: (event: PregnancyEvent) => Promise<void>;
    deletePregnancyEvent: (id: string) => Promise<void>;
    addOrUpdateTag: (tag: TagEntry) => Promise<void>; // 新增
    deleteTag: (name: string, category: TagType) => Promise<void>; // 新增
    quickAddSex: (record: SexRecordDetails) => Promise<void>;
    quickAddMasturbation: (record: MasturbationRecordDetails) => Promise<void>;
    saveExercise: (record: ExerciseRecord) => Promise<void>;
    saveNap: (record: NapRecord) => Promise<void>;
    saveAlcoholRecord: (record: AlcoholRecord) => Promise<void>;
    toggleAlcohol: () => Promise<AlcoholRecord | null | undefined>;
    cancelAlcoholRecord: () => Promise<void>;
    toggleNap: () => Promise<NapRecord | null | undefined>;
    cancelOngoingNap: () => Promise<void>;
    cancelOngoingExercise: () => Promise<void>;
    cancelOngoingMasturbation: () => Promise<void>;
    toggleSleepLog: (pendingLog?: LogEntry) => Promise<void>;
    importLogs: (
        importedLogs: LogEntry[],
        importedPartners?: PartnerProfile[],
        importedCycleEvents?: CycleEvent[],
        importedPregnancyEvents?: PregnancyEvent[]
    ) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
