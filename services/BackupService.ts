import { CycleEvent, LogEntry, PregnancyEvent, type ExportSnapshot, type PartnerProfile, type TagEntry, type PornUseEvent, type MasturbationEvent, type SexEvent } from '../types';
import { APP_VERSION } from '../app/appConfig';
import { LATEST_VERSION } from '../core/storage/migration';
import { fileSystemService, FileSystemService } from './FileSystemService';
import { Logger } from './LoggerService';
import {
  loadBackupDirectoryHandle,
  saveBackupDirectoryHandle,
  clearBackupDirectoryHandle
} from '../core/storage/backupHandleStorage';

export interface BackupMetadata {
  lastBackupAt: number | null;
  backupCount: number;
  lastBackupSize: number;
  directoryName: string | null;
}

export interface BackupStatus {
  isReady: boolean;
  needsReauthorization: boolean;
  directoryName: string | null;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  lastBackupAt?: number;
}

const BACKUP_SETTINGS_KEY = 'hardnessDiary_backupSettings';

export class BackupService {
  private fileSystem: FileSystemService;
  private settings: BackupSettings;
  private initPromise: Promise<void> | null = null;
  private needsReauthorization = false;

  constructor(fileSystem: FileSystemService = fileSystemService) {
    this.fileSystem = fileSystem;
    this.settings = this.loadSettings();
  }

  private loadSettings(): BackupSettings {
    try {
      const saved = localStorage.getItem(BACKUP_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BackupSettings> & { directoryHandle?: unknown };
        // Older versions persisted a (always-undefined) directoryHandle here; ignore that field.
        return {
          autoBackupEnabled: Boolean(parsed.autoBackupEnabled),
          lastBackupAt: parsed.lastBackupAt
        };
      }
    } catch (e) {
      Logger.error('BackupService:LoadSettingsFailed', e);
    }
    return { autoBackupEnabled: false, lastBackupAt: undefined };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      Logger.error('BackupService:SaveSettingsFailed', e);
    }
  }

  /**
   * Restore previously-saved directory handle from IndexedDB and check whether
   * its permission still holds. Safe to call multiple times — work is cached
   * by initPromise. Bootstrap and UI both call this; second call is a no-op.
   */
  initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doInitialize();
    }
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      const handle = await loadBackupDirectoryHandle();
      if (!handle) return;

      const status = await this.fileSystem.restoreFromHandle(handle);
      if (status === 'granted') {
        Logger.info('BackupService:RestoredSilently');
      } else {
        this.needsReauthorization = true;
        Logger.info('BackupService:NeedsReauthorization', { status });
      }
    } catch (err) {
      Logger.error('BackupService:InitializeFailed', err);
    }
  }

  async setupBackupDirectory(): Promise<boolean> {
    const success = await this.fileSystem.requestPermission();
    if (success) {
      const handle = this.fileSystem.getDirectoryHandle();
      if (handle) {
        await saveBackupDirectoryHandle(handle);
      }
      this.needsReauthorization = false;
      Logger.info('BackupService:DirectorySetupComplete');
    }
    return success;
  }

  /**
   * Re-grant permission against a previously-saved handle. Must be called from
   * a user gesture (button click), since it uses requestPermission().
   */
  async reauthorize(): Promise<boolean> {
    const handle = await loadBackupDirectoryHandle();
    if (!handle) {
      this.needsReauthorization = false;
      return false;
    }

    const success = await this.fileSystem.reinitializeFromHandle(handle);
    if (success) {
      this.needsReauthorization = false;
      Logger.info('BackupService:Reauthorized');
    } else {
      Logger.warn('BackupService:ReauthorizationFailed');
    }
    return success;
  }

  /**
   * Forget the saved handle entirely. Used when the user changes directories
   * or the stored handle is no longer valid.
   */
  async forgetDirectory(): Promise<void> {
    await clearBackupDirectoryHandle();
    this.needsReauthorization = false;
  }

  private async writeBackup(
    logs: LogEntry[],
    partners?: PartnerProfile[],
    tags?: TagEntry[],
    cycleEvents?: CycleEvent[],
    pregnancyEvents?: PregnancyEvent[],
    pornUseEvents?: PornUseEvent[],
    masturbationEvents?: MasturbationEvent[],
    sexEvents?: SexEvent[]
  ): Promise<boolean> {
    if (!this.fileSystem.isReady()) {
      Logger.warn('BackupService:BackupSkipped', { reason: 'File system not ready' });
      return false;
    }

    try {
      const filename = this.generateBackupFilename();
      const data = this.prepareBackupData(logs, partners, tags, cycleEvents, pregnancyEvents, pornUseEvents, masturbationEvents, sexEvents);

      const success = await this.fileSystem.writeBackupFile(data, filename);
      if (success) {
        this.settings.lastBackupAt = Date.now();
        this.saveSettings();

        this.fileSystem.cleanupOldBackups().catch(err => {
          Logger.warn('BackupService:CleanupFailed', err);
        });

        Logger.info('BackupService:BackupComplete', { filename });
      }
      return success;
    } catch (err) {
      Logger.error('BackupService:BackupFailed', err);
      return false;
    }
  }

  async autoBackup(
    logs: LogEntry[],
    partners?: PartnerProfile[],
    tags?: TagEntry[],
    cycleEvents?: CycleEvent[],
    pregnancyEvents?: PregnancyEvent[],
    pornUseEvents?: PornUseEvent[],
    masturbationEvents?: MasturbationEvent[],
    sexEvents?: SexEvent[]
  ): Promise<boolean> {
    if (!this.settings.autoBackupEnabled) {
      return false;
    }

    return this.writeBackup(logs, partners, tags, cycleEvents, pregnancyEvents, pornUseEvents, masturbationEvents, sexEvents);
  }

  async manualBackup(
    logs: LogEntry[],
    partners?: PartnerProfile[],
    tags?: TagEntry[],
    cycleEvents?: CycleEvent[],
    pregnancyEvents?: PregnancyEvent[],
    pornUseEvents?: PornUseEvent[],
    masturbationEvents?: MasturbationEvent[],
    sexEvents?: SexEvent[]
  ): Promise<boolean> {
    if (!this.fileSystem.isReady()) {
      const setupSuccess = await this.setupBackupDirectory();
      if (!setupSuccess) {
        return false;
      }
    }

    return this.writeBackup(logs, partners, tags, cycleEvents, pregnancyEvents, pornUseEvents, masturbationEvents, sexEvents);
  }

  generateBackupFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    return `hardness-diary-backup-${timestamp}.json`;
  }

  private prepareBackupData(
    logs: LogEntry[],
    partners?: PartnerProfile[],
    tags?: TagEntry[],
    cycleEvents?: CycleEvent[],
    pregnancyEvents?: PregnancyEvent[],
    pornUseEvents?: PornUseEvent[],
    masturbationEvents?: MasturbationEvent[],
    sexEvents?: SexEvent[]
  ): ExportSnapshot {
    return {
      appName: '硬度日记',
      appVersion: APP_VERSION,
      dataVersion: LATEST_VERSION,
      exportDate: new Date().toISOString(),
      settings: null,
      userName: null,
      data: {
        version: LATEST_VERSION,
        logs,
        partners: partners || [],
        tags: tags || [],
        cycleEvents: cycleEvents || [],
        pregnancyEvents: pregnancyEvents || [],
        pornUseEvents: pornUseEvents || [],
        masturbationEvents: masturbationEvents || [],
        sexEvents: sexEvents || []
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

  /**
   * Whether a directory handle is stored but its permission has lapsed. The
   * UI should show a single-click "重新授权" affordance when this is true.
   */
  getNeedsReauthorization(): boolean {
    return this.needsReauthorization;
  }

  getStatus(): BackupStatus {
    return {
      isReady: this.fileSystem.isReady(),
      needsReauthorization: this.needsReauthorization,
      directoryName: this.fileSystem.getDirectoryName()
    };
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

  async readBackup(filename: string): Promise<string | null> {
    if (!this.fileSystem.isReady()) {
      return null;
    }

    return this.fileSystem.readBackupFile(filename);
  }
}

export const backupService = new BackupService();
