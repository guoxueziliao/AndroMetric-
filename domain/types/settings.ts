export interface AppSettings {
    version: string;
    theme: 'system' | 'light' | 'dark';
    privacyMode: boolean;
    enableNotifications: boolean;
    notificationTime: { morning: string; evening: string };
    hiddenFields: string[];
    lastExportAt?: number;
}

export interface BackupState {
    lastBackupAt?: number;
    isAutoBackupEnabled: boolean;
}
