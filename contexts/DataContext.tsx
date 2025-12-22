
import React, { createContext, useContext } from 'react';
import { LogEntry, PartnerProfile, SexRecordDetails, MasturbationRecordDetails, ExerciseRecord, NapRecord, AlcoholRecord, TagEntry, TagType } from '../types';

interface DataContextType {
    logs: LogEntry[];
    partners: PartnerProfile[];
    userTags: TagEntry[]; // 新增：用户自定义标签
    isInitializing: boolean;
    addOrUpdateLog: (log: LogEntry) => Promise<void>;
    deleteLog: (date: string) => Promise<void>;
    addOrUpdatePartner: (partner: PartnerProfile) => Promise<void>;
    deletePartner: (id: string) => Promise<void>;
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
    importLogs: (importedLogs: LogEntry[], importedPartners?: PartnerProfile[]) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
