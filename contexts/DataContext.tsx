
import React, { createContext, useContext } from 'react';
import { LogEntry, PartnerProfile, SexRecordDetails, MasturbationRecordDetails, ExerciseRecord, NapRecord, AlcoholRecord } from '../types';

interface DataContextType {
    logs: LogEntry[];
    partners: PartnerProfile[];
    // Add isInitializing to match useLogs return value
    isInitializing: boolean;
    addOrUpdateLog: (log: LogEntry) => Promise<void>;
    deleteLog: (date: string) => Promise<void>;
    addOrUpdatePartner: (partner: PartnerProfile) => Promise<void>;
    deletePartner: (id: string) => Promise<void>;
    quickAddSex: (record: SexRecordDetails) => Promise<void>;
    quickAddMasturbation: (record: MasturbationRecordDetails) => Promise<void>;
    saveExercise: (record: ExerciseRecord) => Promise<void>;
    saveNap: (record: NapRecord) => Promise<void>;
    saveAlcoholRecord: (record: AlcoholRecord) => Promise<void>;
    /* Added missing alcohol-related methods */
    toggleAlcohol: () => Promise<AlcoholRecord | null | undefined>;
    cancelAlcoholRecord: () => Promise<void>;
    toggleNap: () => Promise<void>;
    // Fix: Added missing cancelOngoingNap property to interface
    cancelOngoingNap: () => Promise<void>;
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
