
import React, { createContext, useContext } from 'react';
import { LogEntry, PartnerProfile, SexRecordDetails, MasturbationRecordDetails, ExerciseRecord, NapRecord, AlcoholRecord } from '../types';

interface DataContextType {
    logs: LogEntry[];
    partners: PartnerProfile[];
    // Added missing isInitializing property to match useLogs return value
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
    toggleNap: () => Promise<void>;
    toggleSleepLog: (pendingLog?: LogEntry) => Promise<void>;
    /**
     * Corrected toggleAlcohol signature.
     * It returns Promise<boolean> to indicate if a session was started, and accepts no parameters.
     */
    toggleAlcohol: () => Promise<boolean>;
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