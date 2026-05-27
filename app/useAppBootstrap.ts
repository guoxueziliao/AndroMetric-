import { useEffect, useState } from 'react';
import { AlcoholAnalysisPlugin } from '../plugins/CoreAnalysis';
import { pluginManager } from '../services/PluginManager';
import { backupService } from '../services/BackupService';

export const useAppBootstrap = () => {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    pluginManager.register(AlcoholAnalysisPlugin);
    pluginManager.initAll();

    // Restore previously-saved backup directory handle without prompting.
    // If permission has lapsed, the backup UI will surface a re-grant button.
    backupService.initialize();

    const handleVisibilityChange = () => {
      setIsBlurred(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isBlurred };
};
