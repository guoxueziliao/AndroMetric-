import { useState, useEffect, useCallback, useMemo } from 'react';

type ThemeColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  color: ThemeColor;
  mode: ThemeMode;
  isGradient: boolean;
}

const STORAGE_KEY = 'hardnessDiary_theme';

const defaultTheme: ThemeState = {
  color: 'blue',
  mode: 'system',
  isGradient: false
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeState>(defaultTheme);
  const [isSystemDark, setIsSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setThemeState({
          color: parsed.color || 'blue',
          mode: parsed.mode || 'system',
          isGradient: parsed.isGradient || false
        });
      }
    } catch {
      // ignore parse errors
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSystemDark(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-orange', 'theme-pink');
    root.classList.remove('dark');
    root.classList.remove('gradient-bg');
    
    // Add current theme color
    root.classList.add(`theme-${theme.color}`);
    
    // Handle dark mode
    const shouldBeDark = theme.mode === 'dark' || (theme.mode === 'system' && isSystemDark);
    if (shouldBeDark) {
      root.classList.add('dark');
    }
    
    // Handle gradient
    if (theme.isGradient) {
      root.classList.add('gradient-bg');
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme, isSystemDark, mounted]);

  const setThemeColor = useCallback((color: ThemeColor) => {
    setThemeState(prev => ({ ...prev, color }));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeState(prev => ({ ...prev, mode }));
  }, []);

  const toggleGradient = useCallback(() => {
    setThemeState(prev => ({ ...prev, isGradient: !prev.isGradient }));
  }, []);

  const isDark = useMemo(() => {
    return theme.mode === 'dark' || (theme.mode === 'system' && isSystemDark);
  }, [theme.mode, isSystemDark]);

  const themeColors = useMemo(() => ({
    blue: { name: '蓝色', class: 'bg-blue-500', hex: '#3B82F6' },
    purple: { name: '紫色', class: 'bg-purple-500', hex: '#8B5CF6' },
    green: { name: '绿色', class: 'bg-green-500', hex: '#22C55E' },
    orange: { name: '橙色', class: 'bg-orange-500', hex: '#F97316' },
    pink: { name: '粉色', class: 'bg-pink-500', hex: '#EC4899' }
  }), []);

  return {
    theme,
    themeColor: theme.color,
    themeMode: theme.mode,
    isGradient: theme.isGradient,
    isDark,
    themeColors,
    setThemeColor,
    setThemeMode,
    toggleGradient,
    mounted
  };
}

export default useTheme;
