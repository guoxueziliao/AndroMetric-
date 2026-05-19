import React, { useMemo } from 'react';
import { LogQueryContext } from '../contexts/LogQueryContext';
import { PartnerContext } from '../contexts/PartnerContext';
import { ReproductiveContext } from '../contexts/ReproductiveContext';
import { ToastProvider } from '../contexts/ToastContext';
import { useLogs } from '../hooks/useLogs';

export type AppData = ReturnType<typeof useLogs>;

interface AppProvidersProps {
  children: (data: AppData) => React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const data = useLogs();

  const logQueryValue = useMemo(
    () => ({ logs: data.logs, isInitializing: data.isInitializing }),
    [data.logs, data.isInitializing]
  );

  const partnerValue = useMemo(
    () => ({
      partners: data.partners,
      addOrUpdatePartner: data.addOrUpdatePartner,
      deletePartner: data.deletePartner
    }),
    [data.partners, data.addOrUpdatePartner, data.deletePartner]
  );

  const reproductiveValue = useMemo(
    () => ({
      cycleEvents: data.cycleEvents,
      pregnancyEvents: data.pregnancyEvents,
      saveCycleEvent: data.saveCycleEvent,
      deleteCycleEvent: data.deleteCycleEvent,
      savePregnancyEvent: data.savePregnancyEvent,
      deletePregnancyEvent: data.deletePregnancyEvent
    }),
    [
      data.cycleEvents,
      data.pregnancyEvents,
      data.saveCycleEvent,
      data.deleteCycleEvent,
      data.savePregnancyEvent,
      data.deletePregnancyEvent
    ]
  );

  return (
    <ToastProvider>
      <LogQueryContext.Provider value={logQueryValue}>
        <PartnerContext.Provider value={partnerValue}>
          <ReproductiveContext.Provider value={reproductiveValue}>
            {children(data)}
          </ReproductiveContext.Provider>
        </PartnerContext.Provider>
      </LogQueryContext.Provider>
    </ToastProvider>
  );
};

export default AppProviders;
