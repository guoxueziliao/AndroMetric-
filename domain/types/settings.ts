export interface AppLockSettings {
    enabled: boolean;
    pinHash?: string;
    pinSalt?: string;
    autoLockMinutes: number;
    webAuthnCredentialId?: string;
}

export interface AppSettings {
    version: string;
    theme: 'system' | 'light' | 'dark';
    privacyMode: boolean;
    enableNotifications: boolean;
    notificationTime: { morning: string; evening: string };
    hiddenFields: string[];
    lastExportAt?: number;
    appLock?: AppLockSettings;
}

export interface BackupState {
    lastBackupAt?: number;
    isAutoBackupEnabled: boolean;
}
