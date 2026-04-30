import React, { useState, useEffect } from 'react';
import { Folder, Shield, Clock, AlertCircle, CheckCircle, Download } from 'lucide-react';
import type { LogEntry } from '../../domain';
import { StorageService, backupService, type BackupMetadata } from '../../core/storage';

interface BackupSettingsProps {
  logs?: LogEntry[];
}

const BackupSettings: React.FC<BackupSettingsProps> = ({ logs }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [metadata, setMetadata] = useState<BackupMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsEnabled(backupService.isAutoBackupEnabled());
    setIsReady(backupService.isReady());
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    const meta = await backupService.getMetadata();
    setMetadata(meta);
  };

  const handleToggleAutoBackup = async (enabled: boolean) => {
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
    setSuccessMessage(enabled ? '自动备份已启用' : '自动备份已禁用');
    await loadMetadata();

    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleChangeDirectory = async () => {
    setError(null);
    setIsLoading(true);
    const success = await backupService.setupBackupDirectory();
    setIsLoading(false);

    if (success) {
      setIsReady(true);
      setSuccessMessage('备份目录已更新');
      await loadMetadata();
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError('目录更改失败');
    }
  };

  const handleManualBackup = async () => {
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
      setSuccessMessage('手动备份成功！');
      await loadMetadata();
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError('备份失败，请检查目录权限');
    }
  };

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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-soft border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">自动备份</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">自动保存数据到本地文件夹</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">启用自动备份</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => handleToggleAutoBackup(e.target.checked)}
              className="sr-only peer"
              disabled={isLoading}
            />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500 ${isLoading ? 'opacity-50' : ''}`}></div>
          </label>
        </div>

        {isReady && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">备份目录</span>
                <button
                  onClick={handleChangeDirectory}
                  disabled={isLoading}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium"
                >
                  更改
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {metadata?.directoryName || '已选择'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">备份状态</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">上次备份</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                    {formatDate(metadata?.lastBackupAt || null)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">备份文件数</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                    {metadata?.backupCount || 0} 个
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleManualBackup}
              disabled={isLoading || !logs}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              {isLoading ? '处理中...' : '立即备份'}
            </button>
          </div>
        )}

        {!isReady && isEnabled && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">需要选择备份目录</p>
            <button
              onClick={handleChangeDirectory}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              选择文件夹
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            <strong className="text-slate-600 dark:text-slate-400">备份策略：</strong>
            最近 12 周每周保留 1 个备份，12 个月后每月保留 1 个，超过 12 个月的备份将被自动清理。
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;
