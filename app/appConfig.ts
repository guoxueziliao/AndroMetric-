import type { AppSettings } from '../types';

export const APP_VERSION = __APP_VERSION__;

export const defaultSettings: AppSettings = {
  theme: 'dark',
  enableNotifications: false,
  notificationTime: { morning: '08:00', evening: '23:00' },
  hiddenFields: [],
  metricPreferences: {},
  backupRetention: {
    mode: 'count',
    autoSafetyMaxCount: 7
  },
  backupSchedule: {
    enabled: true,
    intervalHours: 24
  },
  appLock: {
    enabled: false,
    autoLockMinutes: 5
  }
};
