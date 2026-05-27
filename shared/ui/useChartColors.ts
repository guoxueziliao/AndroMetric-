import { useEffect, useState } from 'react';

export type EffectiveThemeMode = 'light' | 'dark';

export interface ChartColors {
  grid: string;
  text: string;
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
}

const FALLBACK_COLORS: ChartColors = {
  grid: '#334155',
  text: '#94a3b8',
  primary: '#60a5fa',
  secondary: '#34d399',
  tertiary: '#a78bfa',
  quaternary: '#f472b6'
};

const cssRgbToHex = (value: string, fallback: string) => {
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return fallback;
  return `#${parts.map((part) => Math.max(0, Math.min(255, part)).toString(16).padStart(2, '0')).join('')}`;
};

const readChartColors = (): ChartColors => {
  if (typeof window === 'undefined') return FALLBACK_COLORS;

  const styles = window.getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => cssRgbToHex(styles.getPropertyValue(name), fallback);

  return {
    grid: read('--surface-border', FALLBACK_COLORS.grid),
    text: read('--text-muted', FALLBACK_COLORS.text),
    primary: read('--chart-primary', FALLBACK_COLORS.primary),
    secondary: read('--chart-secondary', FALLBACK_COLORS.secondary),
    tertiary: read('--chart-tertiary', FALLBACK_COLORS.tertiary),
    quaternary: read('--chart-quaternary', FALLBACK_COLORS.quaternary)
  };
};

export const useChartColors = () => {
  const [colors, setColors] = useState<ChartColors>(() => readChartColors());

  useEffect(() => {
    const refresh = () => setColors(readChartColors());
    refresh();

    const handleThemeChange = () => refresh();
    window.addEventListener('app-theme-change', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('app-theme-change', handleThemeChange as EventListener);
    };
  }, []);

  return colors;
};

export const getEffectiveThemeFromEvent = (event: Event): EffectiveThemeMode | null => {
  if (!(event instanceof CustomEvent)) return null;
  return event.detail?.effectiveMode === 'dark' || event.detail?.effectiveMode === 'light'
    ? event.detail.effectiveMode
    : null;
};
