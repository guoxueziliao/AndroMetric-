
import React, { createContext, useContext } from 'react';
import { LogEntry, PartnerProfile, SexRecordDetails, MasturbationRecordDetails, ExerciseRecord, NapRecord, AlcoholRecord } from '../types';

interface DataContextType {
    logs: LogEntry[];
    partners: PartnerProfile[];
    addOrUpdateLog: (log: LogEntry) => Promise<void>;
    deleteLog: (date: string) => Promise<void>;
    addOrUpdatePartner: (partner: PartnerProfile) => Promise<void>;
    deletePartner: (id: string) => Promise<void>;
    quickAddSex: (record: SexRecordDetails) => Promise<void>;
    quickAddMasturbation: (record: MasturbationRecordDetails) => Promise<void>;
    saveExercise: (record: ExerciseRecord) => Promise<void>;
    saveNap: (record: NapRecord) => Promise<void>;
    saveAlcoholRecord: (record: AlcoholRecord) => Promise<void>;
    toggleNap: () => Promise<void>;
    toggleSleepLog: (pendingLog?: LogEntry) => Promise<void>;
    toggleAlcohol: (isEditing?: boolean) => Promise<void>;
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
