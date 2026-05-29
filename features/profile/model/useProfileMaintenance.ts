import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { AppSettings, BackupRetentionSettings, BackupScheduleSettings, CycleEvent, GoalCheckin, LogEntry, MasturbationEvent, PartnerProfile, PregnancyEvent, PornUseEvent, SexEvent, Snapshot, TagEntry, TrainingGoal } from '../../../domain';
import { StorageService, db, backupService, LAST_AUTO_BACKUP_META_KEY, LATEST_VERSION } from '../../../core/storage';
import { useToast } from '../../../contexts/ToastContext';
import { decryptSnapshotJson, encryptSnapshotJson, getErrorMessage } from '../../../shared/lib';
import { APP_VERSION } from '../../../app/appConfig';
import type { ImportConflictResolution, ImportPreview, ImportStrategy } from './importPreview';
import { buildImportPreview, getImportFileKind } from './importPreview';
import { createCsvExportBlobFromDataset } from './csvExport';
import {
  applyExportOptionsToDataset,
  createDefaultExportOptions,
  getExportTagOptions,
  getExportCounts,
  hasAnyExportData,
  type ExportDataset,
  type ExportFormat,
  type ExportOptions
} from './exportOptions';
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

const createDateStamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

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
  const liveSnapshots = useLiveQuery(StorageService.snapshots.queries.all) as Snapshot[] | undefined;
  const livePartners = useLiveQuery(StorageService.partners.queries.all) as PartnerProfile[] | undefined;
  const liveTags = useLiveQuery(StorageService.tags.getAll) as TagEntry[] | undefined;
  const liveCycleEvents = useLiveQuery(StorageService.cycleEvents.queries.all) as CycleEvent[] | undefined;
  const livePregnancyEvents = useLiveQuery(StorageService.pregnancyEvents.queries.all) as PregnancyEvent[] | undefined;
  const livePornUseEvents = useLiveQuery(StorageService.pornUseEvents.queries.all) as PornUseEvent[] | undefined;
  const liveMasturbationEvents = useLiveQuery(StorageService.masturbationEvents.queries.all) as MasturbationEvent[] | undefined;
  const liveSexEvents = useLiveQuery(StorageService.sexEvents.queries.all) as SexEvent[] | undefined;
  const liveTrainingGoals = useLiveQuery(StorageService.trainingGoals.queries.all) as TrainingGoal[] | undefined;
  const liveGoalCheckins = useLiveQuery(StorageService.goalCheckins.queries.all) as GoalCheckin[] | undefined;
  const snapshots = useMemo(() => liveSnapshots || [], [liveSnapshots]);
  const partners = useMemo(() => livePartners || [], [livePartners]);
  const tags = useMemo(() => liveTags || [], [liveTags]);
  const cycleEvents = useMemo(() => liveCycleEvents || [], [liveCycleEvents]);
  const pregnancyEvents = useMemo(() => livePregnancyEvents || [], [livePregnancyEvents]);
  const pornUseEvents = useMemo(() => livePornUseEvents || [], [livePornUseEvents]);
  const masturbationEvents = useMemo(() => liveMasturbationEvents || [], [liveMasturbationEvents]);
  const sexEvents = useMemo(() => liveSexEvents || [], [liveSexEvents]);
  const trainingGoals = useMemo(() => liveTrainingGoals || [], [liveTrainingGoals]);
  const goalCheckins = useMemo(() => liveGoalCheckins || [], [liveGoalCheckins]);
  const dbMeta = useLiveQuery(async () => {
    const dataVersion = await db.meta.get('dataVersion');
    const dataFixVersion = await db.meta.get('dataFixVersion');
    const lastAutoBackupAt = await db.meta.get(LAST_AUTO_BACKUP_META_KEY);

    return {
      dataVersion: dataVersion?.value || 0,
      dataFixVersion: dataFixVersion?.value || 0,
      lastAutoBackupAt: typeof lastAutoBackupAt?.value === 'number' ? lastAutoBackupAt.value : 0
    };
  }) || { dataVersion: 0, dataFixVersion: 0, lastAutoBackupAt: 0 };

  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'preview' | 'success' | 'error'>('idle');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('merge');
  const [importConflictResolution, setImportConflictResolution] = useState<ImportConflictResolution>('use-import');
  const [snapshotFeedback, setSnapshotFeedback] = useState('');
  const [healthReport, setHealthReport] = useState<DataHealthReport | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isMobile, setIsMobile] = useState(getIsMobileDevice);
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(() => createDefaultExportOptions());
  const [isExporting, setIsExporting] = useState(false);
  const [isEncryptedExport, setIsEncryptedExport] = useState(false);
  const backupMetadata = useLiveQuery(() => backupService.getMetadata()) || null;
  const backupStatus = backupService.getStatus();
  const exportDataset = useMemo<ExportDataset>(() => ({
    logs,
    partners,
    tags,
    cycleEvents,
    pregnancyEvents,
    snapshots,
    pornUseEvents,
    masturbationEvents,
    sexEvents,
    trainingGoals,
    goalCheckins
  }), [cycleEvents, logs, partners, pregnancyEvents, snapshots, tags, pornUseEvents, masturbationEvents, sexEvents, trainingGoals, goalCheckins]);
  const filteredExportDataset = useMemo(() => (
    applyExportOptionsToDataset(exportDataset, exportOptions)
  ), [exportDataset, exportOptions]);
  const exportSourceCounts = useMemo(() => getExportCounts(exportDataset), [exportDataset]);
  const exportFilteredCounts = useMemo(() => getExportCounts(filteredExportDataset), [filteredExportDataset]);
  const exportTagOptions = useMemo(() => getExportTagOptions(exportDataset), [exportDataset]);

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
      showToast(`结构 ${report.scores.structure} / 完整度 ${report.scores.completeness} / 分析可用度 ${report.scores.analytics}`, 'success');
      } else {
      showToast(`发现 ${report.issues.length} 个结构问题，完整度 ${report.scores.completeness}`, 'error');
      }

      return report;
  }, [showToast]);

  const handleRepairData = useCallback(async () => {
    if (!confirm('系统将自动创建当前数据的备份快照，随后尝试修复数据结构错误。\n\n确定要开始修复吗？')) return;

    setIsRepairing(true);
    try {
      showToast('正在创建安全备份...', 'info');
      await StorageService.snapshots.create(`系统自动备份 - v${APP_VERSION} 修复前`, 'auto-safety');
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
  }, [runHealthCheck, showToast]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportFullSnapshot = useCallback(async (exportType: 'export' | 'backup', encrypted = false) => {
    if (logs.length === 0) {
      showToast('没有数据可导出', 'error');
      return false;
    }

    const passphrase = encrypted ? window.prompt('请输入导出密码。导入时必须使用同一个密码。') : null;
    if (encrypted && !passphrase) return false;

    const timestamp = createTimestamp();
    const extension = encrypted ? 'hdenc.json' : 'json';
    const filename = exportType === 'backup'
      ? `硬度日记-应用内备份-${timestamp}.${extension}`
      : `硬度日记-数据导出-${logs[0]?.date || 'data'}.${extension}`;

    try {
      const jsonStr = await StorageService.createSnapshot();
      const content = encrypted ? await encryptSnapshotJson(jsonStr, passphrase!) : jsonStr;
      const blob = new Blob([content], { type: 'application/json' });
      downloadBlob(blob, filename);

      showToast(encrypted ? '加密备份文件已生成' : exportType === 'backup' ? '备份文件已生成' : '导出成功', 'success');
      return true;
    } catch (error) {
      showToast(`导出失败: ${getErrorMessage(error, '未知错误')}`, 'error');
      return false;
    }
  }, [downloadBlob, logs, showToast]);

  const openExportOptions = useCallback((format: ExportFormat, encrypted = false) => {
    setIsEncryptedExport(encrypted);
    setExportOptions(createDefaultExportOptions(encrypted ? 'json' : format));
    setIsExportOptionsOpen(true);
  }, []);

  const handleCloseExportOptions = useCallback(() => {
    if (isExporting) return;
    setIsExportOptionsOpen(false);
    setIsEncryptedExport(false);
  }, [isExporting]);

  const handleClearAllData = useCallback(async () => {
    try {
      localStorage.removeItem('appSettings');
      localStorage.removeItem('userName');
      await StorageService.clearAllData();
      showToast('数据已清除,应用即将刷新', 'success');
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      showToast('清除失败', 'error');
    }
  }, [showToast]);

  const handleExportAndClear = useCallback(async () => {
    await exportFullSnapshot('backup');
    setTimeout(() => {
      handleClearAllData();
    }, 500);
  }, [exportFullSnapshot, handleClearAllData]);

  const handleExportClick = useCallback(() => openExportOptions('json'), [openExportOptions]);

  const handleCsvExportClick = useCallback(() => openExportOptions('csv'), [openExportOptions]);

  const handleEncryptedExportClick = useCallback(() => openExportOptions('json', true), [openExportOptions]);

  const handleConfirmExport = useCallback(async () => {
    const dataset = filteredExportDataset;
    if (!hasAnyExportData(dataset)) {
      showToast('当前选择没有可导出的内容', 'error');
      return false;
    }

    const passphrase = isEncryptedExport ? window.prompt('请输入导出密码。导入时必须使用同一个密码。') : null;
    if (isEncryptedExport && !passphrase) return false;

    setIsExporting(true);
    try {
      const timestamp = createDateStamp();
      const tagSuffix = exportOptions.tagFilter && exportOptions.tagFilter.length > 0
        ? `-tags-${exportOptions.tagFilter.length}`
        : '';
      if (exportOptions.format === 'json') {
        const json = await StorageService.createSnapshot();
        const content = isEncryptedExport ? await encryptSnapshotJson(json, passphrase!) : json;
        const extension = isEncryptedExport ? 'hdenc.json' : 'json';
        downloadBlob(new Blob([content], { type: 'application/json' }), `hardness-diary${tagSuffix}-${timestamp}.${extension}`);
        showToast(isEncryptedExport ? '加密导出文件已生成' : 'JSON 导出已生成', 'success');
      } else if (exportOptions.format === 'csv') {
        const blob = createCsvExportBlobFromDataset(dataset, exportOptions.dimensions, {
          appVersion: APP_VERSION,
          dataVersion: LATEST_VERSION,
          exportedAt: new Date().toISOString()
        });
        downloadBlob(blob, `hardness-diary-csv${tagSuffix}-${timestamp}.zip`);
        showToast('CSV 导出包已生成', 'success');
      }

      onUpdateSettings({ ...settings, lastExportAt: Date.now() });
      setIsExportOptionsOpen(false);
      setIsEncryptedExport(false);
      return true;
    } catch (error) {
      showToast(`导出失败: ${getErrorMessage(error, '未知错误')}`, 'error');
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [
    downloadBlob,
    exportOptions,
    filteredExportDataset,
    isEncryptedExport,
    onUpdateSettings,
    settings,
    showToast
  ]);

  const handleFileSystemBackup = useCallback(async () => {
    const fileSystemWindow = window as WindowWithFileSystemAccess;

    if (isMobile) {
      showToast('手机浏览器对本地文件系统支持有限,请使用"导出为通用 JSON"', 'error');
      return;
    }

    if (!fileSystemWindow.showDirectoryPicker) {
      showToast('浏览器不支持文件系统访问', 'error');
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
      showToast(`备份成功: ${filename}`, 'success');
    } catch (error) {
      if (!isAbortError(error)) {
        const message = getErrorMessage(error, '未知错误');
        console.error('FileSystem Backup Error:', error);
        showToast(`备份失败: ${message}`, 'error');
      }
    }
  }, [isMobile, onUpdateSettings, settings, showToast]);

  const handleCreateSnapshot = useCallback(async () => {
    try {
      await StorageService.snapshots.create('手动备份');
      setSnapshotFeedback('快照已创建');
      setTimeout(() => setSnapshotFeedback(''), 2000);
    } catch (error) {
      showToast(`创建失败: ${getErrorMessage(error, '未知错误')}`, 'error');
    }
  }, [showToast]);

  const handleChangeBackupRetention = useCallback(async (backupRetention: BackupRetentionSettings) => {
    onUpdateSettings({
      ...settings,
      backupRetention
    });

    try {
      const prunedCount = await StorageService.snapshots.applyRetention(backupRetention);
      showToast(prunedCount > 0 ? `已清理 ${prunedCount} 个旧自动快照` : '备份保留策略已更新', 'success');
    } catch (error) {
      showToast(`保留策略更新失败: ${getErrorMessage(error, '未知错误')}`, 'error');
    }
  }, [onUpdateSettings, settings, showToast]);

  const handleChangeBackupSchedule = useCallback((backupSchedule: BackupScheduleSettings) => {
    onUpdateSettings({
      ...settings,
      backupSchedule
    });
    showToast(backupSchedule.enabled ? '自动备份偏好已更新' : '已关闭 idle 自动备份', 'success');
  }, [onUpdateSettings, settings, showToast]);

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
        const encrypted = getImportFileKind(text) === 'encrypted';
        const passphrase = encrypted ? window.prompt('请输入备份密码') : null;
        if (encrypted && !passphrase) {
          setImportStatus('idle');
          return;
        }
        const rawText = encrypted ? await decryptSnapshotJson(text, passphrase!) : text;
        const preview = buildImportPreview(rawText, encrypted, logs);
        if (preview.versionStatus === 'newer') showToast('此文件来自更新版本的应用，请升级后再试', 'error');
        setImportPreview(preview);
        setImportStrategy('merge');
        setImportConflictResolution('use-import');
        setImportStatus('preview');
      } catch (error) {
        setImportStatus('error');
        showToast(getErrorMessage(error, '导入预览失败'), 'error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [logs, showToast]);

  const handleCancelImportPreview = useCallback(() => {
    setImportPreview(null);
    setImportStatus('idle');
    setImportStrategy('merge');
    setImportConflictResolution('use-import');
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!importPreview || importPreview.versionStatus === 'newer') return;

    setImportStatus('importing');
    try {
      await StorageService.snapshots.create(`导入前自动快照 - ${new Date().toLocaleString('zh-CN')}`, 'auto-safety');
      await StorageService.restoreSnapshot(importPreview.rawText, importStrategy, importConflictResolution);
      setImportPreview(null);
      setImportStatus('success');
      showToast('导入成功，已创建导入前安全快照', 'success');
      setTimeout(() => setImportStatus('idle'), 2000);
    } catch (error) {
      setImportStatus('error');
      showToast(getErrorMessage(error, '导入失败'), 'error');
      setTimeout(() => setImportStatus('preview'), 3000);
    }
  }, [importConflictResolution, importPreview, importStrategy, showToast]);

  return {
    snapshots,
    dbMeta,
    healthReport,
    isRepairing,
    isExportOptionsOpen,
    exportOptions,
    exportSourceCounts,
    exportFilteredCounts,
    exportTagOptions,
    isExporting,
    isEncryptedExport,
    importStatus,
    importPreview,
    importStrategy,
    importConflictResolution,
    snapshotFeedback,
    canUseFileSystem,
    backupMetadata,
    backupStatus,
    onRunHealthCheck: runHealthCheck,
    onRepairData: handleRepairData,
    onExportClick: handleExportClick,
    onCsvExportClick: handleCsvExportClick,
    onEncryptedExportClick: handleEncryptedExportClick,
    onChangeExportOptions: setExportOptions,
    onCloseExportOptions: handleCloseExportOptions,
    onConfirmExport: handleConfirmExport,
    onFileSystemBackup: handleFileSystemBackup,
    onCreateSnapshot: handleCreateSnapshot,
    onChangeBackupRetention: handleChangeBackupRetention,
    onChangeBackupSchedule: handleChangeBackupSchedule,
    onRestoreSnapshot: handleRestoreSnapshot,
    onDeleteSnapshot: handleDeleteSnapshot,
    onFileChange: handleFileChange,
    onCancelImportPreview: handleCancelImportPreview,
    onConfirmImport: handleConfirmImport,
    onChangeImportStrategy: setImportStrategy,
    onChangeImportConflictResolution: setImportConflictResolution,
    onClearAllData: handleClearAllData,
    onExportAndClear: handleExportAndClear
  };
};
