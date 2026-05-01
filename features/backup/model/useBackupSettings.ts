import { useCallback, useEffect, useState } from 'react';
import type { LogEntry } from '../../../domain';
import { StorageService, backupService, type BackupMetadata } from '../../../core/storage';

interface UseBackupSettingsParams {
  logs?: LogEntry[];
}

export const useBackupSettings = ({ logs }: UseBackupSettingsParams) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [metadata, setMetadata] = useState<BackupMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadMetadata = useCallback(async () => {
    const meta = await backupService.getMetadata();
    setMetadata(meta);
  }, []);

  const showSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  useEffect(() => {
    setIsEnabled(backupService.isAutoBackupEnabled());
    setIsReady(backupService.isReady());
    loadMetadata();
  }, [loadMetadata]);

  const handleToggleAutoBackup = useCallback(async (enabled: boolean) => {
    setError(null);
    setSuccessMessage(null);

    if (enabled && !isReady) {
      setIsLoading(true);
      const success = await backupService.setupBackupDirectory();
      setIsLoading(false);

      if (!success) {
        setError('无法获取目录访问权限。请选择一个文件夹用于存储备份。');
        return;
      }

      setIsReady(true);
    }

    backupService.setAutoBackupEnabled(enabled);
    setIsEnabled(enabled);
    showSuccessMessage(enabled ? '自动备份已启用' : '自动备份已禁用');
    await loadMetadata();
  }, [isReady, loadMetadata, showSuccessMessage]);

  const handleChangeDirectory = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const success = await backupService.setupBackupDirectory();
    setIsLoading(false);

    if (success) {
      setIsReady(true);
      showSuccessMessage('备份目录已更新');
      await loadMetadata();
    } else {
      setError('目录更改失败');
    }
  }, [loadMetadata, showSuccessMessage]);

  const handleManualBackup = useCallback(async () => {
    if (!logs) {
      setError('没有可备份的数据');
      return;
    }

    setError(null);
    setIsLoading(true);

    const partners = await StorageService.partners.queries.all();
    const tags = await StorageService.tags.getAll();
    const success = await backupService.manualBackup(logs, partners, tags);

    setIsLoading(false);

    if (success) {
      showSuccessMessage('手动备份成功！');
      await loadMetadata();
    } else {
      setError('备份失败，请检查目录权限');
    }
  }, [loadMetadata, logs, showSuccessMessage]);

  return {
    isEnabled,
    isReady,
    metadata,
    isLoading,
    error,
    successMessage,
    onToggleAutoBackup: handleToggleAutoBackup,
    onChangeDirectory: handleChangeDirectory,
    onManualBackup: handleManualBackup
  };
};
