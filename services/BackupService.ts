import { LogEntry, Snapshot } from '../types';
import { fileSystemService, FileSystemService } from './FileSystemService';
import { Logger } from './LoggerService';

export interface BackupMetadata {
  lastBackupAt: number | null;
  backupCount: number;
  lastBackupSize: number;
  directoryName: string | null;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  directoryHandle?: FileSystemDirectoryHandle;
  lastBackupAt?: number;
}

const BACKUP_SETTINGS_KEY = 'hardnessDiary_backupSettings';

export class BackupService {
  private fileSystem: FileSystemService;
  private settings: BackupSettings;

  constructor(fileSystem: FileSystemService = fileSystemService) {
    this.fileSystem = fileSystem;
    this.settings = this.loadSettings();
    this.initializeFromSavedHandle();
  }

  private loadSettings(): BackupSettings {
    try {
      const saved = localStorage.getItem(BACKUP_SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      Logger.error('BackupService:LoadSettingsFailed', e);
    }
    return { autoBackupEnabled: false, lastBackupAt: undefined };
  }

  private saveSettings(): void {
    try {
      const settingsToSave = {
        ...this.settings,
        directoryHandle: undefined
      };
      localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(settingsToSave));
    } catch (e) {
      Logger.error('BackupService:SaveSettingsFailed', e);
    }
  }

  private async initializeFromSavedHandle(): Promise<void> {
    if (this.settings.directoryHandle) {
      const success = await this.fileSystem.reinitializeFromHandle(this.settings.directoryHandle);
      if (success) {
        Logger.info('BackupService:ReinitializedFromSavedHandle');
      }
    }
  }

  async setupBackupDirectory(): Promise<boolean> {
    const success = await this.fileSystem.requestPermission();
    if (success) {
      this.settings.directoryHandle = this.fileSystem.getDirectoryHandle() || undefined;
      this.saveSettings();
      Logger.info('BackupService:DirectorySetupComplete');
    }
    return success;
  }

  async autoBackup(logs: LogEntry[], partners?: unknown[], tags?: unknown[]): Promise<boolean> {
    if (!this.settings.autoBackupEnabled) {
      return false;
    }

    if (!this.fileSystem.isReady()) {
      Logger.warn('BackupService:AutoBackupSkipped', { reason: 'File system not ready' });
      return false;
    }

    try {
      const filename = this.generateBackupFilename();
      const data = this.prepareBackupData(logs, partners, tags);

      const success = await this.fileSystem.writeBackupFile(data, filename);
      if (success) {
        this.settings.lastBackupAt = Date.now();
        this.saveSettings();

        this.fileSystem.cleanupOldBackups().catch(err => {
          Logger.warn('BackupService:CleanupFailed', err);
        });

        Logger.info('BackupService:AutoBackupComplete', { filename });
      }
      return success;
    } catch (err) {
      Logger.error('BackupService:AutoBackupFailed', err);
      return false;
    }
  }

  async manualBackup(logs: LogEntry[], partners?: unknown[], tags?: unknown[]): Promise<boolean> {
    if (!this.fileSystem.isReady()) {
      const setupSuccess = await this.setupBackupDirectory();
      if (!setupSuccess) {
        return false;
      }
    }

    return this.autoBackup(logs, partners, tags);
  }

  generateBackupFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    return `hardness-diary-backup-${timestamp}.json`;
  }

  private prepareBackupData(logs: LogEntry[], partners?: unknown[], tags?: unknown[]): unknown {
    return {
      appName: '硬度日记',
      appVersion: '0.0.7',
      exportDate: new Date().toISOString(),
      data: {
        logs,
        partners: partners || [],
        tags: tags || []
      }
    };
  }

  async getMetadata(): Promise<BackupMetadata> {
    if (!this.fileSystem.isReady()) {
      return {
        lastBackupAt: this.settings.lastBackupAt || null,
        backupCount: 0,
        lastBackupSize: 0,
        directoryName: null
      };
    }

    const files = await this.fileSystem.listBackupFiles();
    const latestFile = files[0];

    return {
      lastBackupAt: this.settings.lastBackupAt || (latestFile?.lastModified ?? null),
      backupCount: files.length,
      lastBackupSize: latestFile?.size || 0,
      directoryName: this.fileSystem.getDirectoryName()
    };
  }

  setAutoBackupEnabled(enabled: boolean): void {
    this.settings.autoBackupEnabled = enabled;
    this.saveSettings();
    Logger.info('BackupService:AutoBackupToggled', { enabled });
  }

  isAutoBackupEnabled(): boolean {
    return this.settings.autoBackupEnabled;
  }

  isReady(): boolean {
    return this.fileSystem.isReady();
  }

  async listBackups(): Promise<{ name: string; date: Date; size: number }[]> {
    if (!this.fileSystem.isReady()) {
      return [];
    }

    const files = await this.fileSystem.listBackupFiles();
    return files.map(f => ({
      name: f.name,
      date: new Date(f.lastModified),
      size: f.size
    }));
  }
}

export const backupService = new BackupService();
