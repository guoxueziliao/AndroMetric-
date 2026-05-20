import { useCallback, useEffect, useState } from 'react';
import type { LogEntry } from '../../../domain';
import { StorageService, backupService, type BackupMetadata } from '../../../core/storage';

interface BackupFileSummary {
  name: string;
  date: Date;
  size: number;
}

interface UseBackupSettingsParams {
  logs?: LogEntry[];
}

export const useBackupSettings = ({ logs }: UseBackupSettingsParams) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [needsReauthorization, setNeedsReauthorization] = useState(false);
  const [metadata, setMetadata] = useState<BackupMetadata | null>(null);
  const [backupFiles, setBackupFiles] = useState<BackupFileSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadMetadata = useCallback(async () => {
    const meta = await backupService.getMetadata();
    const files = await backupService.listBackups();
    setMetadata(meta);
    setBackupFiles(files.slice(0, 5));
  }, []);

  const refreshStatus = useCallback(() => {
    const status = backupService.getStatus();
    setIsReady(status.isReady);
    setNeedsReauthorization(status.needsReauthorization);
  }, []);

  const showSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wait for any in-progress handle restore from app bootstrap before
      // reading status — otherwise we'd flash "no directory" briefly.
      await backupService.initialize();
      if (cancelled) return;
      setIsEnabled(backupService.isAutoBackupEnabled());
      refreshStatus();
      loadMetadata();
    })();
    return () => { cancelled = true; };
  }, [loadMetadata, refreshStatus]);

  const handleToggleAutoBackup = useCallback(async (enabled: boolean) => {
    setError(null);
    setSuccessMessage(null);

    if (enabled && !backupService.isReady()) {
      setIsLoading(true);
      const success = await backupService.setupBackupDirectory();
      setIsLoading(false);
      refreshStatus();

      if (!success) {
        setError('无法获取目录访问权限。请选择一个文件夹用于存储备份。');
        return;
      }
    }

    backupService.setAutoBackupEnabled(enabled);
    setIsEnabled(enabled);
    showSuccessMessage(enabled ? '自动备份已启用' : '自动备份已禁用');
    await loadMetadata();
  }, [loadMetadata, refreshStatus, showSuccessMessage]);

  const handleChangeDirectory = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const success = await backupService.setupBackupDirectory();
    setIsLoading(false);
    refreshStatus();

    if (success) {
      showSuccessMessage('备份目录已更新');
      await loadMetadata();
    } else {
      setError('目录更改失败');
    }
  }, [loadMetadata, refreshStatus, showSuccessMessage]);

  const handleReauthorize = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const success = await backupService.reauthorize();
    setIsLoading(false);
    refreshStatus();

    if (success) {
      showSuccessMessage('授权已恢复');
      await loadMetadata();
    } else {
      setError('重新授权失败，请改为重新选择文件夹');
    }
  }, [loadMetadata, refreshStatus, showSuccessMessage]);

  const handleManualBackup = useCallback(async () => {
    if (!logs) {
      setError('没有可备份的数据');
      return;
    }

    setError(null);
    setIsLoading(true);

    const partners = await StorageService.partners.queries.all();
    const tags = await StorageService.tags.getAll();
    const cycleEvents = await StorageService.cycleEvents.queries.all();
    const pregnancyEvents = await StorageService.pregnancyEvents.queries.all();
    const success = await backupService.manualBackup(logs, partners, tags, cycleEvents, pregnancyEvents);

    setIsLoading(false);
    refreshStatus();

    if (success) {
      showSuccessMessage('手动备份成功！');
      await loadMetadata();
    } else {
      setError('备份失败，请检查目录权限');
    }
  }, [loadMetadata, logs, refreshStatus, showSuccessMessage]);

  const handleRestoreBackup = useCallback(async (filename: string) => {
    if (!confirm('恢复此备份前会先创建当前数据的安全快照，然后覆盖当前数据。确定继续吗？')) return;

    setError(null);
    setIsLoading(true);
    try {
      const rawText = await backupService.readBackup(filename);
      if (!rawText) {
        setError('无法读取备份文件');
        return;
      }

      await StorageService.snapshots.create(`文件系统恢复前自动快照 - ${new Date().toLocaleString('zh-CN')}`);
      await StorageService.restoreSnapshot(rawText, 'overwrite');
      showSuccessMessage('备份恢复成功');
      await loadMetadata();
    } catch {
      setError('恢复失败，请确认备份文件未损坏');
    } finally {
      setIsLoading(false);
      refreshStatus();
    }
  }, [loadMetadata, refreshStatus, showSuccessMessage]);

  return {
    isEnabled,
    isReady,
    needsReauthorization,
    metadata,
    backupFiles,
    isLoading,
    error,
    successMessage,
    onToggleAutoBackup: handleToggleAutoBackup,
    onChangeDirectory: handleChangeDirectory,
    onReauthorize: handleReauthorize,
    onManualBackup: handleManualBackup,
    onRestoreBackup: handleRestoreBackup
  };
};
