import { Logger } from './LoggerService';

export interface BackupFile {
  name: string;
  handle: FileSystemFileHandle;
  lastModified: number;
  size: number;
}

export interface RetentionConfig {
  weeklyCount: number;
  monthlyCount: number;
  maxAgeMonths: number;
}

const DEFAULT_RETENTION: RetentionConfig = {
  weeklyCount: 12,
  monthlyCount: 12,
  maxAgeMonths: 12
};

export class FileSystemService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private isInitialized = false;

  async requestPermission(): Promise<boolean> {
    try {
      if (!('showDirectoryPicker' in window)) {
        Logger.warn('FileSystemService:BrowserNotSupported');
        return false;
      }

      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      this.directoryHandle = handle;
      this.isInitialized = true;

      Logger.info('FileSystemService:PermissionGranted', { directory: handle.name });
      return true;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        Logger.info('FileSystemService:UserCancelled');
      } else {
        Logger.error('FileSystemService:PermissionFailed', err);
      }
      return false;
    }
  }

  async reinitializeFromHandle(handle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        return false;
      }
      this.directoryHandle = handle;
      this.isInitialized = true;
      return true;
    } catch (err) {
      Logger.error('FileSystemService:ReinitializeFailed', err);
      return false;
    }
  }

  async writeBackupFile(data: unknown, filename: string): Promise<boolean> {
    if (!this.isInitialized || !this.directoryHandle) {
      Logger.error('FileSystemService:NotInitialized');
      return false;
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();

      const jsonString = JSON.stringify(data, null, 2);
      await writable.write(jsonString);
      await writable.close();

      Logger.info('FileSystemService:BackupWritten', { filename, size: jsonString.length });
      return true;
    } catch (err) {
      Logger.error('FileSystemService:WriteFailed', { filename, error: err });
      return false;
    }
  }

  async readBackupFile(filename: string): Promise<unknown | null> {
    if (!this.isInitialized || !this.directoryHandle) {
      return null;
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (err) {
      Logger.error('FileSystemService:ReadFailed', { filename, error: err });
      return null;
    }
  }

  async listBackupFiles(): Promise<BackupFile[]> {
    if (!this.isInitialized || !this.directoryHandle) {
      return [];
    }

    const files: BackupFile[] = [];

    try {
      for await (const [name, handle] of this.directoryHandle.entries()) {
        if (handle.kind === 'file' && name.startsWith('hardness-diary-backup')) {
          const file = await handle.getFile();
          files.push({
            name,
            handle: handle as FileSystemFileHandle,
            lastModified: file.lastModified,
            size: file.size
          });
        }
      }

      files.sort((a, b) => b.lastModified - a.lastModified);
      return files;
    } catch (err) {
      Logger.error('FileSystemService:ListFailed', err);
      return [];
    }
  }

  async cleanupOldBackups(config: RetentionConfig = DEFAULT_RETENTION): Promise<number> {
    if (!this.isInitialized || !this.directoryHandle) {
      return 0;
    }

    const files = await this.listBackupFiles();
    if (files.length === 0) return 0;

    const now = Date.now();
    const filesToDelete = new Set<string>();

    const weeklyFiles = files.filter(f => {
      const age = now - f.lastModified;
      return age <= 12 * 7 * 24 * 60 * 60 * 1000;
    });
    const weeklyGroups = this.groupByWeek(weeklyFiles);
    for (const [weekKey, weekFiles] of weeklyGroups) {
      weekFiles.slice(1).forEach(f => filesToDelete.add(f.name));
    }

    const monthlyFiles = files.filter(f => {
      const age = now - f.lastModified;
      return age > 12 * 7 * 24 * 60 * 60 * 1000 && age <= 12 * 30 * 24 * 60 * 60 * 1000;
    });
    const monthlyGroups = this.groupByMonth(monthlyFiles);
    for (const [monthKey, monthFiles] of monthlyGroups) {
      monthFiles.slice(1).forEach(f => filesToDelete.add(f.name));
    }

    const oldFiles = files.filter(f => {
      const age = now - f.lastModified;
      return age > 12 * 30 * 24 * 60 * 60 * 1000;
    });
    oldFiles.forEach(f => filesToDelete.add(f.name));

    let deletedCount = 0;
    for (const filename of filesToDelete) {
      try {
        await this.directoryHandle.removeEntry(filename);
        deletedCount++;
      } catch (err) {
        Logger.warn('FileSystemService:DeleteFailed', { filename, error: err });
      }
    }

    if (deletedCount > 0) {
      Logger.info('FileSystemService:CleanupComplete', { deletedCount });
    }

    return deletedCount;
  }

  private groupByWeek(files: BackupFile[]): Map<string, BackupFile[]> {
    const groups = new Map<string, BackupFile[]>();
    for (const file of files) {
      const date = new Date(file.lastModified);
      const weekKey = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
      if (!groups.has(weekKey)) {
        groups.set(weekKey, []);
      }
      groups.get(weekKey)!.push(file);
    }
    return groups;
  }

  private groupByMonth(files: BackupFile[]): Map<string, BackupFile[]> {
    const groups = new Map<string, BackupFile[]>();
    for (const file of files) {
      const date = new Date(file.lastModified);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(file);
    }
    return groups;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  getDirectoryName(): string | null {
    return this.directoryHandle?.name || null;
  }

  isReady(): boolean {
    return this.isInitialized && this.directoryHandle !== null;
  }

  getDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.directoryHandle;
  }
}

export const fileSystemService = new FileSystemService();
