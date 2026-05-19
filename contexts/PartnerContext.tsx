import { createContext, useContext } from 'react';
import type { PartnerProfile } from '../types';

export interface PartnerContextValue {
  partners: PartnerProfile[];
  addOrUpdatePartner: (partner: PartnerProfile) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
}

export const PartnerContext = createContext<PartnerContextValue | undefined>(undefined);

export const usePartners = (): PartnerContextValue => {
  const ctx = useContext(PartnerContext);
  if (!ctx) {
    throw new Error('usePartners must be used within a PartnerContext.Provider');
  }
  return ctx;
};
