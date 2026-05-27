import React from 'react';
import { Folder, Shield, Clock, AlertCircle, CheckCircle, Download } from 'lucide-react';
import type { LogEntry } from '../../domain';
import { useBackupSettings } from './model/useBackupSettings';
import ImportPreviewModal from '../profile/ui/ImportPreviewModal';

interface BackupSettingsProps {
  logs?: LogEntry[];
}

const BackupSettings: React.FC<BackupSettingsProps> = ({ logs }) => {
  const {
    isEnabled,
    isReady,
    needsReauthorization,
    metadata,
    backupFiles,
    isLoading,
    error,
    successMessage,
    restorePreview,
    restoreStatus,
    restoreStrategy,
    restoreConflictResolution,
    onChangeRestoreStrategy,
    onChangeRestoreConflictResolution,
    onCancelRestorePreview,
    onConfirmRestore,
    onToggleAutoBackup,
    onChangeDirectory,
    onReauthorize,
    onManualBackup,
    onRestoreBackup
  } = useBackupSettings({ logs });

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return '从未';
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="bg-surface-card rounded-2xl p-6 shadow-soft border border-surface-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-state-success-bg rounded-xl">
          <Shield className="w-5 h-5 text-state-success-text" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text-primary">自动备份</h3>
          <p className="text-xs text-text-secondary">自动保存数据到本地文件夹</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-state-danger-bg border border-state-danger-text/20 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-state-danger-text flex-shrink-0 mt-0.5" />
          <p className="text-xs text-state-danger-text">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-state-success-bg border border-state-success-text/20 rounded-xl flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-state-success-text flex-shrink-0 mt-0.5" />
          <p className="text-xs text-state-success-text">{successMessage}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-surface-muted rounded-xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">启用自动备份</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => onToggleAutoBackup(e.target.checked)}
              className="sr-only peer"
              disabled={isLoading}
            />
            <div className={`w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-card after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-card after:border-surface-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent ${isLoading ? 'opacity-50' : ''}`}></div>
          </label>
        </div>

        {isReady && (
          <div className="space-y-3">
            <div className="p-3 bg-surface-muted rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-muted">备份目录</span>
                <button
                  onClick={onChangeDirectory}
                  disabled={isLoading}
                  className="text-xs text-accent hover:text-accent/80 font-medium"
                >
                  更改
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-text-muted" />
                <span className="text-sm font-medium text-text-secondary">
                  {metadata?.directoryName || '已选择'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-surface-muted rounded-xl">
              <span className="text-xs font-medium text-text-muted block mb-2">备份状态</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-muted">上次备份</span>
                  <p className="font-medium text-text-secondary mt-0.5">
                    {formatDate(metadata?.lastBackupAt || null)}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted">备份文件数</span>
                  <p className="font-medium text-text-secondary mt-0.5">
                    {metadata?.backupCount || 0} 个
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onManualBackup}
              disabled={isLoading || !logs}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-surface-border text-text-on-accent rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              {isLoading ? '处理中...' : '立即备份'}
            </button>

            {backupFiles.length > 0 && (
              <div className="p-3 bg-surface-muted rounded-xl space-y-2">
                <span className="text-xs font-medium text-text-muted block">最近备份</span>
                {backupFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between gap-3 rounded-lg bg-surface-card border border-surface-border p-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-text-secondary">{file.name}</p>
                      <p className="text-[10px] text-text-muted">{formatDate(file.date.getTime())} • {formatSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => onRestoreBackup(file.name)}
                      disabled={isLoading}
                      className="shrink-0 rounded-lg bg-state-info-bg px-3 py-2 text-xs font-bold text-state-info-text transition-colors hover:bg-state-info-bg/80 disabled:opacity-50"
                    >
                      恢复
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isReady && needsReauthorization && (
          <div className="p-4 bg-state-warning-bg border border-state-warning-text/20 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-state-warning-text mx-auto mb-2" />
            <p className="text-sm text-state-warning-text mb-1">已记住备份目录，但授权已失效</p>
            <p className="text-xs text-state-warning-text/80 mb-3">浏览器关闭后系统需要重新确认访问权限</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={onReauthorize}
                disabled={isLoading}
                className="px-4 py-2 bg-state-warning-text hover:bg-state-warning-text/90 text-text-on-accent rounded-lg text-sm font-medium transition-colors"
              >
                重新授权
              </button>
              <button
                onClick={onChangeDirectory}
                disabled={isLoading}
                className="px-4 py-2 bg-surface-card border border-surface-border hover:bg-surface-muted text-text-secondary rounded-lg text-sm font-medium transition-colors"
              >
                改选目录
              </button>
            </div>
          </div>
        )}

        {!isReady && !needsReauthorization && isEnabled && (
          <div className="p-4 bg-state-warning-bg border border-state-warning-text/20 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-state-warning-text mx-auto mb-2" />
            <p className="text-sm text-state-warning-text mb-2">需要选择备份目录</p>
            <button
              onClick={onChangeDirectory}
              disabled={isLoading}
              className="px-4 py-2 bg-state-warning-text hover:bg-state-warning-text/90 text-text-on-accent rounded-lg text-sm font-medium transition-colors"
            >
              选择文件夹
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-surface-border">
          <p className="text-xs text-text-muted leading-relaxed">
            <strong className="text-text-secondary">备份策略：</strong>
            最近 12 周每周保留 1 个备份，12 个月后每月保留 1 个，超过 12 个月的备份将被自动清理。
          </p>
        </div>
      </div>
      </div>
      <ImportPreviewModal
        preview={restorePreview}
        status={restoreStatus}
        strategy={restoreStrategy}
        conflictResolution={restoreConflictResolution}
        onClose={onCancelRestorePreview}
        onConfirm={onConfirmRestore}
        onChangeStrategy={onChangeRestoreStrategy}
        onChangeConflictResolution={onChangeRestoreConflictResolution}
      />
    </>
  );
};

export default BackupSettings;
