import { useEffect, useState } from 'react';
import { AlcoholAnalysisPlugin } from '../plugins/CoreAnalysis';
import { pluginManager } from '../services/PluginManager';
import { registerServiceWorker } from '../hooks/usePWA';

export const useAppBootstrap = () => {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    pluginManager.register(AlcoholAnalysisPlugin);
    pluginManager.initAll();

    const handleVisibilityChange = () => {
      setIsBlurred(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    registerServiceWorker();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isBlurred };
};
