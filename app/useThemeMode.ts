import { useEffect, useState } from 'react';
import type { AppSettings } from '../types';

export type EffectiveThemeMode = 'light' | 'dark';

export interface ThemeModeState {
  isDarkMode: boolean;
  effectiveMode: EffectiveThemeMode;
}

export const useThemeMode = (theme: AppSettings['theme']) => {
  const [effectiveMode, setEffectiveMode] = useState<EffectiveThemeMode>('light');

  useEffect(() => {
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const nextMode = isDark ? 'dark' : 'light';
      setEffectiveMode(nextMode);
      document.documentElement.classList.toggle('dark', isDark);
      window.dispatchEvent(new CustomEvent<ThemeModeState>('app-theme-change', {
        detail: { isDarkMode: isDark, effectiveMode: nextMode }
      }));
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  return {
    isDarkMode: effectiveMode === 'dark',
    effectiveMode
  };
};
