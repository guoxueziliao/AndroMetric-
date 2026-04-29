import type { AppSettings } from '../types';

export const APP_VERSION = '0.0.7';

export const defaultSettings: AppSettings = {
  version: APP_VERSION,
  theme: 'system',
  privacyMode: false,
  enableNotifications: false,
  notificationTime: { morning: '08:00', evening: '23:00' },
  hiddenFields: []
};
