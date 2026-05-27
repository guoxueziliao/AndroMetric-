export interface AppLockSettings {
    enabled: boolean;
    pinHash?: string;
    pinSalt?: string;
    autoLockMinutes: number;
    webAuthnCredentialId?: string;
}

export type AutoSafetySnapshotLimit = 3 | 7 | 15 | 30;
export type AutoBackupIntervalHours = 6 | 12 | 24 | 48;
export type AutoSafetySnapshotSizeLimitMB = 5 | 20 | 50 | 100;

export type BackupRetentionSettings =
    | { mode: 'count'; autoSafetyMaxCount: AutoSafetySnapshotLimit }
    | { mode: 'size'; autoSafetyMaxMB: AutoSafetySnapshotSizeLimitMB };

export interface BackupScheduleSettings {
    enabled: boolean;
    intervalHours: AutoBackupIntervalHours;
}

export interface AppSettings {
    theme: 'system' | 'light' | 'dark';
    privacyMode: boolean;
    enableNotifications: boolean;
    notificationTime: { morning: string; evening: string };
    hiddenFields: string[];
    lastExportAt?: number;
    appLock?: AppLockSettings;
    backupRetention?: BackupRetentionSettings;
    backupSchedule?: BackupScheduleSettings;
}

export interface BackupState {
    lastBackupAt?: number;
    isAutoBackupEnabled: boolean;
}
