import { useMemo, useCallback } from 'react';
import { LogEntry, HardnessLevel, SleepAttire, SleepTemperature, MorningWoodRetention } from '../types';
import {
  analyzeUserPatterns,
  SmartField,
  SmartDefaultResult,
  getSmartDefaultsForDate
} from '../utils/smartDefaults';

export interface UseSmartDefaultsReturn {
  getSmartDefault: <T>(field: SmartField, dateStr: string) => SmartDefaultResult<T>;
  getSmartDefaultsForDate: (dateStr: string) => Record<SmartField, SmartDefaultResult<unknown>>;
  hasEnoughData: boolean;
}

export function useSmartDefaults(logs: LogEntry[]): UseSmartDefaultsReturn {
  const hasEnoughData = useMemo(() => {
    if (!logs || logs.length === 0) return false;
    return logs.length >= 3;
  }, [logs]);

  const getSmartDefault = useCallback(<T,>(field: SmartField, dateStr: string): SmartDefaultResult<T> => {
    const dayOfWeek = getDayOfWeek(dateStr);
    return analyzeUserPatterns(logs, field, dayOfWeek) as SmartDefaultResult<T>;
  }, [logs]);

  const getSmartDefaultsForDateCallback = useCallback((dateStr: string): Record<SmartField, SmartDefaultResult<unknown>> => {
    return getSmartDefaultsForDate(logs, dateStr);
  }, [logs]);

  return {
    getSmartDefault,
    getSmartDefaultsForDate: getSmartDefaultsForDateCallback,
    hasEnoughData
  };
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type DayOfWeek = typeof DAYS[number];

function getDayOfWeek(dateStr: string): DayOfWeek {
  const date = new Date(dateStr);
  return DAYS[date.getDay()];
}
