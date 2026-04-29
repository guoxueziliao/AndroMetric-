import React from 'react';
import { DataContext } from '../contexts/DataContext';
import { ToastProvider } from '../contexts/ToastContext';
import { useLogs } from '../hooks/useLogs';

export type AppData = ReturnType<typeof useLogs>;

interface AppProvidersProps {
  children: (data: AppData) => React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const data = useLogs();

  return (
    <ToastProvider>
      <DataContext.Provider value={data}>
        {children(data)}
      </DataContext.Provider>
    </ToastProvider>
  );
};

export default AppProviders;
