import { createContext, useContext } from 'react';
import type { LogEntry } from '../types';

export interface LogQueryContextValue {
  logs: LogEntry[];
  isInitializing: boolean;
}

export const LogQueryContext = createContext<LogQueryContextValue | undefined>(undefined);

export const useLogQuery = (): LogQueryContextValue => {
  const ctx = useContext(LogQueryContext);
  if (!ctx) {
    throw new Error('useLogQuery must be used within a LogQueryContext.Provider');
  }
  return ctx;
};
