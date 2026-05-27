import React from 'react';
import { Modal } from '../../../shared/ui';
import type { ImportConflictResolution, ImportPreview, ImportStrategy } from '../model/importPreview';
import { LATEST_VERSION } from '../../../core/storage';

interface ImportPreviewModalProps {
  preview: ImportPreview | null;
  status: 'idle' | 'importing' | 'preview' | 'success' | 'error';
  strategy: ImportStrategy;
  conflictResolution: ImportConflictResolution;
  onClose: () => void;
  onConfirm: () => void;
  onChangeStrategy: (strategy: ImportStrategy) => void;
  onChangeConflictResolution: (resolution: ImportConflictResolution) => void;
}

const formatImportDate = (value?: string) => {
  if (!value) return '未知';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;
  return new Date(time).toLocaleString('zh-CN');
};

const getVersionNotice = (preview: ImportPreview) => {
  if (preview.versionStatus === 'older' && typeof preview.dataVersion === 'number') {
    return {
      className: 'bg-state-info-bg text-state-info-text border-state-info-text/20',
      text: `将自动从 v${preview.dataVersion} 迁移到 v${LATEST_VERSION}`
    };
  }

  if (preview.versionStatus === 'newer') {
    return {
      className: 'bg-state-danger-bg text-state-danger-text border-state-danger-text/20',
      text: '此文件来自更新版本的应用，请升级后再试'
    };
  }

  return null;
};

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  preview,
  status,
  strategy,
  conflictResolution,
  onClose,
  onConfirm,
  onChangeStrategy,
  onChangeConflictResolution
}) => {
  const rows = preview ? [
    ['日志', preview.counts.logs],
    ['伴侣', preview.counts.partners],
    ['标签', preview.counts.tags],
    ['周期事件', preview.counts.cycleEvents],
    ['怀孕事件', preview.counts.pregnancyEvents],
    ['内部快照', preview.counts.snapshots]
  ] as const : [];
  const versionNotice = preview ? getVersionNotice(preview) : null;
  const canConfirm = !!preview && preview.versionStatus !== 'newer' && status !== 'importing';
  const conflicts = strategy === 'merge' ? preview?.conflicts ?? [] : [];

  return (
    <Modal
      isOpen={!!preview}
      onClose={onClose}
      title="导入预览"
      footer={
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surface-muted text-text-secondary text-sm font-bold">取消</button>
          <button onClick={onConfirm} disabled={!canConfirm} className="flex-1 py-3 rounded-xl bg-accent text-text-on-accent text-sm font-bold disabled:opacity-50">
            {status === 'importing' ? '导入中...' : '确认导入'}
          </button>
        </div>
      }
    >
      {preview && (
        <div className="space-y-4 py-2">
          <div className="rounded-2xl bg-surface-muted border border-surface-border p-4 space-y-2 text-xs text-text-muted">
            <div className="flex justify-between"><span>文件类型</span><span className="font-bold text-text-primary">{preview.encrypted ? '加密备份' : '普通 JSON'}</span></div>
            <div className="flex justify-between"><span>导出时间</span><span className="font-bold text-text-primary">{formatImportDate(preview.exportDate)}</span></div>
            <div className="flex justify-between"><span>导出自</span><span className="font-bold text-text-primary">{preview.appVersion ? `v${preview.appVersion}` : '未知版本'}</span></div>
            <div className="flex justify-between"><span>数据版本</span><span className="font-bold text-text-primary">{preview.dataVersion ?? '未知'}</span></div>
          </div>

          {versionNotice && <div className={`rounded-2xl border p-3 text-xs font-bold ${versionNotice.className}`}>{versionNotice.text}</div>}

          <div className="grid grid-cols-2 gap-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-surface-card border border-surface-border p-3 text-center">
                <div className="text-[10px] font-bold text-text-muted">{label}</div>
                <div className="text-lg font-black text-text-primary">{value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-surface-muted border border-surface-border p-3 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-text-muted">
              <span>包含设置</span>
              <span className={preview.includesSettings ? 'text-state-success-text' : 'text-text-muted'}>{preview.includesSettings ? '是' : '否'}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-text-muted">
              <span>包含用户名</span>
              <span className={preview.includesUserName ? 'text-state-success-text' : 'text-text-muted'}>{preview.includesUserName ? '是' : '否'}</span>
            </div>
            <label className="block text-xs font-bold text-text-muted">
              导入策略
              <select
                value={strategy}
                onChange={(e) => onChangeStrategy(e.target.value as ImportStrategy)}
                className="mt-2 w-full rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm font-bold text-text-primary outline-none"
              >
                <option value="merge">合并：保留现有数据，覆盖同 ID/同日期记录</option>
                <option value="overwrite">覆盖：清空当前数据后导入</option>
              </select>
            </label>
          </div>

          {conflicts.length > 0 && (
            <details open className="rounded-2xl bg-state-warning-bg border border-state-warning-text/20 p-3 space-y-3">
              <summary className="cursor-pointer text-xs font-black text-state-warning-text">
                冲突字段（{conflicts.length} 处）
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeConflictResolution('keep-current')}
                  className={`rounded-xl px-3 py-2 text-xs font-black border ${conflictResolution === 'keep-current'
                    ? 'bg-state-warning-text border-state-warning-text text-text-on-accent'
                    : 'bg-surface-card border-state-warning-text/20 text-state-warning-text'}`}
                >
                  全部保留当前
                </button>
                <button
                  type="button"
                  onClick={() => onChangeConflictResolution('use-import')}
                  className={`rounded-xl px-3 py-2 text-xs font-black border ${conflictResolution === 'use-import'
                    ? 'bg-state-warning-text border-state-warning-text text-text-on-accent'
                    : 'bg-surface-card border-state-warning-text/20 text-state-warning-text'}`}
                >
                  全部使用导入
                </button>
              </div>
              <div className="mt-3 max-h-44 overflow-y-auto space-y-2">
                {conflicts.slice(0, 20).map((conflict, index) => (
                  <div key={`${conflict.date}-${String(conflict.field)}-${index}`} className="rounded-xl bg-surface-card/80 border border-state-warning-text/20 p-2 text-[11px] leading-relaxed">
                    <div className="font-black text-state-warning-text">{conflict.date} {String(conflict.field)}</div>
                    <div className="mt-1 text-text-secondary">当前={conflict.currentValue}</div>
                    <div className="text-text-secondary">导入={conflict.incomingValue}</div>
                  </div>
                ))}
                {conflicts.length > 20 && (
                  <div className="text-[11px] font-bold text-state-warning-text">另有 {conflicts.length - 20} 处冲突未展开显示</div>
                )}
              </div>
            </details>
          )}

          <p className="text-xs leading-relaxed text-text-muted">确认后会先创建一个“导入前自动快照”，再执行导入。</p>
        </div>
      )}
    </Modal>
  );
};

export default ImportPreviewModal;
