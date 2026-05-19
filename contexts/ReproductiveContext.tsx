import { createContext, useContext } from 'react';
import type { CycleEvent, PregnancyEvent } from '../types';

export interface ReproductiveContextValue {
  cycleEvents: CycleEvent[];
  pregnancyEvents: PregnancyEvent[];
  saveCycleEvent: (event: CycleEvent) => Promise<void>;
  deleteCycleEvent: (id: string) => Promise<void>;
  savePregnancyEvent: (event: PregnancyEvent) => Promise<void>;
  deletePregnancyEvent: (id: string) => Promise<void>;
}

export const ReproductiveContext = createContext<ReproductiveContextValue | undefined>(undefined);

export const useReproductive = (): ReproductiveContextValue => {
  const ctx = useContext(ReproductiveContext);
  if (!ctx) {
    throw new Error('useReproductive must be used within a ReproductiveContext.Provider');
  }
  return ctx;
};
