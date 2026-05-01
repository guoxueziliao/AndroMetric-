import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { AppSettings, LogEntry, Snapshot } from '../../../domain';
import { StorageService, db } from '../../../core/storage';
import { useToast } from '../../../contexts/ToastContext';
import { getErrorMessage } from '../../../shared/lib';
import type { DataHealthReport } from '../../../utils/dataHealthCheck';

interface UseProfileMaintenanceParams {
  settings: AppSettings;
  logs: LogEntry[];
  onUpdateSettings: (newSettings: AppSettings) => void;
}

interface LocalFileSystemWritableFileStream {
  write: (data: BlobPart) => Promise<void>;
  close: () => Promise<void>;
}

interface LocalFileSystemFileHandle {
  createWritable: () => Promise<LocalFileSystemWritableFileStream>;
}

interface LocalFileSystemDirectoryHandle {
  getFileHandle: (name: string, options: { create: boolean }) => Promise<LocalFileSystemFileHandle>;
}

type WindowWithFileSystemAccess = Window &
  typeof globalThis & {
    showDirectoryPicker?: (options: {
      id: string;
      mode: 'read' | 'readwrite';
      startIn: 'documents';
    }) => Promise<LocalFileSystemDirectoryHandle>;
    opera?: string;
  };

type NavigatorWithVendor = Navigator & {
  vendor?: string;
};

const getIsMobileDevice = () => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;

  const nav = navigator as NavigatorWithVendor;
  const fileSystemWindow = window as WindowWithFileSystemAccess;
  const userAgent = nav.userAgent || nav.vendor || fileSystemWindow.opera || '';
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return isTouch || isMobileUA;
};

const createTimestamp = () => {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}_${now.toTimeString().slice(0, 8).replace(/:/g, '-')}`;
};

const isAbortError = (error: unknown) => (
  typeof error === 'object'
  && error !== null
  && 'name' in error
  && (error as { name?: unknown }).name === 'AbortError'
);

export const useProfileMaintenance = ({
  settings,
  logs,
  onUpdateSettings
}: UseProfileMaintenanceParams) => {
  const { showToast } = useToast();
  const snapshots = (useLiveQuery(StorageService.snapshots.queries.all) as Snapshot[]) || [];
  const dbMeta = useLiveQuery(async () => {
    const dataVersion = await db.meta.get('dataVersion');
    const dataFixVersion = await db.meta.get('dataFixVersion');

    return {
      dataVersion: dataVersion?.value || 0,
      dataFixVersion: dataFixVersion?.value || 0
    };
  }) || { dataVersion: 0, dataFixVersion: 0 };

  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [snapshotFeedback, setSnapshotFeedback] = useState('');
  const [healthReport, setHealthReport] = useState<DataHealthReport | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isMobile, setIsMobile] = useState(getIsMobileDevice);

  useEffect(() => {
    const checkMobile = () => setIsMobile(getIsMobileDevice());

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const canUseFileSystem = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const fileSystemWindow = window as WindowWithFileSystemAccess;
    return !!fileSystemWindow.showDirectoryPicker && !isMobile;
  }, [isMobile]);

  const runHealthCheck = useCallback(async () => {
    const report = await StorageService.runHealthCheck();
    setHealthReport(report);

    if (report.issues.length === 0) {
      showToast(`数据完整，健康评分 ${report.score}`, 'success');
    } else {
      showToast(`发现 ${report.issues.length} 个潜在问题，评分 ${report.score}`, 'error');
    }

    return report;
  }, [showToast]);

  const handleRepairData = useCallback(async () => {
    if (!confirm('系统将自动创建当前数据的备份快照，随后尝试修复数据结构错误。\n\n确定要开始修复吗？')) return;

    setIsRepairing(true);
    try {
      showToast('正在创建安全备份...', 'info');
      await StorageService.snapshots.create(`系统自动备份 - v${settings.version} 修复前`);
      const count = await StorageService.repairData();
      await db.meta.put({ key: 'dataFixVersion', value: 1 });

      if (count > 0) {
        showToast(`修复成功: 已修正 ${count} 条记录`, 'success');
      } else {
        showToast('扫描完成: 未发现需修复的数据', 'success');
      }

      await runHealthCheck();
    } catch (error) {
      showToast(`修复流程中断: ${getErrorMessage(error, '未知错误')}`, 'error');
    } finally {
      setIsRepairing(false);
    }
  }, [runHealthCheck, settings.version, showToast]);

  const exportData = useCallback(async (exportType: 'export' | 'backup') => {
    if (logs.length === 0) {
      showToast('没有数据可导出', 'error');
      return;
    }

    const timestamp = createTimestamp();
    const filename = exportType === 'backup'
      ? `硬度日记-应用内备份-${timestamp}.json`
      : `硬度日记-数据导出-${logs[0]?.date || 'data'}.json`;

    try {
      const jsonStr = await StorageService.createSnapshot();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(exportType === 'backup' ? '备份文件已生成' : '导出成功', 'success');
    } catch (error) {
      showToast(`导出失败: ${getErrorMessage(error, '未知错误')}`, 'error');
    }
  }, [logs, showToast]);

  const handleClearAllData = useCallback(async () => {
    try {
      localStorage.removeItem('appSettings');
      localStorage.removeItem('userName');
      await StorageService.clearAllData();
      alert('数据已清除，应用将刷新。');
      window.location.reload();
    } catch {
      showToast('清除失败', 'error');
    }
  }, [showToast]);

  const handleExportAndClear = useCallback(async () => {
    await exportData('backup');
    setTimeout(() => {
      handleClearAllData();
    }, 500);
  }, [exportData, handleClearAllData]);

  const handleExportClick = useCallback(() => {
    exportData('export');
    onUpdateSettings({ ...settings, lastExportAt: Date.now() });
  }, [exportData, onUpdateSettings, settings]);

  const handleFileSystemBackup = useCallback(async () => {
    const fileSystemWindow = window as WindowWithFileSystemAccess;

    if (isMobile) {
      alert('手机浏览器对本地文件系统支持有限，请使用"导出为通用 JSON"功能。');
      return;
    }

    if (!fileSystemWindow.showDirectoryPicker) {
      alert('浏览器不支持文件系统访问');
      return;
    }

    try {
      const timestamp = createTimestamp();
      const filename = `硬度日记-本地备份-${timestamp}.json`;
      const content = await StorageService.createSnapshot();
      const dirHandle = await fileSystemWindow.showDirectoryPicker({
        id: 'hardness-diary-backup',
        mode: 'readwrite',
        startIn: 'documents'
      });
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();

      await writable.write(content);
      await writable.close();
      onUpdateSettings({ ...settings, lastExportAt: Date.now() });
      alert(`✅ 备份成功！\n文件已保存至: ${filename}`);
    } catch (error) {
      if (!isAbortError(error)) {
        const message = getErrorMessage(error, '未知错误');
        console.error('FileSystem Backup Error:', error);
        alert(`备份失败: ${message}\n\n建议使用下方的 "导出为通用 JSON" 功能。`);
      }
    }
  }, [isMobile, onUpdateSettings, settings]);

  const handleCreateSnapshot = useCallback(async () => {
    try {
      await StorageService.snapshots.create('手动备份');
      setSnapshotFeedback('快照已创建');
      setTimeout(() => setSnapshotFeedback(''), 2000);
    } catch (error) {
      showToast(`创建失败: ${getErrorMessage(error, '未知错误')}`, 'error');
    }
  }, [showToast]);

  const handleRestoreSnapshot = useCallback(async (id: number) => {
    if (!confirm('还原将覆盖当前所有数据。确定要回滚到此版本吗？')) return;

    try {
      await StorageService.snapshots.restore(id);
      showToast('回滚成功', 'success');
    } catch (error) {
      showToast(`回滚失败: ${getErrorMessage(error, '未知错误')}`, 'error');
    }
  }, [showToast]);

  const handleDeleteSnapshot = useCallback(async (id: number) => {
    if (confirm('删除此还原点？')) {
      await StorageService.snapshots.delete(id);
    }
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('importing');
    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const text = loadEvent.target?.result;
      if (typeof text !== 'string') return;

      try {
        await StorageService.restoreSnapshot(text, 'merge');
        setImportStatus('success');
        showToast('导入成功', 'success');
        setTimeout(() => setImportStatus('idle'), 2000);
      } catch (error) {
        setImportStatus('error');
        showToast(getErrorMessage(error, '导入失败'), 'error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [showToast]);

  return {
    snapshots,
    dbMeta,
    healthReport,
    isRepairing,
    importStatus,
    snapshotFeedback,
    canUseFileSystem,
    onRunHealthCheck: runHealthCheck,
    onRepairData: handleRepairData,
    onExportClick: handleExportClick,
    onFileSystemBackup: handleFileSystemBackup,
    onCreateSnapshot: handleCreateSnapshot,
    onRestoreSnapshot: handleRestoreSnapshot,
    onDeleteSnapshot: handleDeleteSnapshot,
    onFileChange: handleFileChange,
    onClearAllData: handleClearAllData,
    onExportAndClear: handleExportAndClear
  };
};
