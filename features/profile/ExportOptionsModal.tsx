import React from 'react';
import { FileJson, FileSpreadsheet, FileText, type LucideIcon } from 'lucide-react';
import { Modal } from '../../shared/ui';
import type { ExportCounts, ExportDimension, ExportFormat, ExportOptions, ExportTagOption } from './model/exportOptions';
import { EXPORT_DIMENSION_LABELS, hasSelectedExportDimension } from './model/exportOptions';

const EXPORT_DIMENSIONS: ExportDimension[] = [
  'logs',
  'partners',
  'tags',
  'cycleEvents',
  'pregnancyEvents',
  'snapshots'
];

const FORMAT_OPTIONS: Array<{ id: ExportFormat; label: string; icon: LucideIcon }> = [
  { id: 'json', label: 'JSON', icon: FileJson },
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { id: 'markdown', label: 'Markdown', icon: FileText }
];

interface ExportOptionsModalProps {
  isOpen: boolean;
  options: ExportOptions;
  sourceCounts: ExportCounts;
  filteredCounts: ExportCounts;
  tagOptions: ExportTagOption[];
  isExporting: boolean;
  encrypted: boolean;
  onChange: (options: ExportOptions) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const hasDataForFormat = (options: ExportOptions, counts: ExportCounts) => {
  if (options.format === 'markdown') return options.dimensions.logs && counts.logs > 0;
  return Object.values(counts).some((count) => count > 0);
};

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  options,
  sourceCounts,
  filteredCounts,
  tagOptions,
  isExporting,
  encrypted,
  onChange,
  onClose,
  onConfirm
}) => {
  const canConfirm = hasSelectedExportDimension(options) && hasDataForFormat(options, filteredCounts) && !isExporting;

  const updateDimension = (dimension: ExportDimension, checked: boolean) => {
    onChange({
      ...options,
      dimensions: {
        ...options.dimensions,
        [dimension]: checked
      }
    });
  };
  const toggleTag = (tagName: string, checked: boolean) => {
    const current = options.tagFilter || [];
    const nextTags = checked
      ? Array.from(new Set([...current, tagName]))
      : current.filter((tag) => tag !== tagName);

    onChange({
      ...options,
      tagFilter: nextTags
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={encrypted ? '加密导出选项' : '导出选项'}
      footer={
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surface-muted text-text-secondary text-sm font-bold">
            取消
          </button>
          <button onClick={onConfirm} disabled={!canConfirm} className="flex-1 py-3 rounded-xl bg-accent text-text-on-accent text-sm font-bold disabled:opacity-50">
            {isExporting ? '导出中...' : '确认导出'}
          </button>
        </div>
      }
    >
      <div className="space-y-5 py-2">
        <section>
          <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-text-muted">格式</h3>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-muted p-1">
            {FORMAT_OPTIONS.map((format) => {
              const Icon = format.icon;
              const active = options.format === format.id;
              const disabled = encrypted && format.id !== 'json';
              return (
                <button
                  key={format.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...options, format: format.id })}
                  className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? 'bg-surface-card text-accent shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon size={18} className="mb-1" />
                  {format.label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-text-muted">日期区间</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-text-muted">
              开始
              <input
                type="date"
                value={options.startDate || ''}
                onChange={(event) => onChange({ ...options, startDate: event.target.value })}
                className="mt-2 min-h-[44px] w-full rounded-xl border border-surface-border bg-surface-card px-3 text-sm font-bold text-text-primary outline-none"
              />
            </label>
            <label className="block text-xs font-bold text-text-muted">
              结束
              <input
                type="date"
                value={options.endDate || ''}
                onChange={(event) => onChange({ ...options, endDate: event.target.value })}
                className="mt-2 min-h-[44px] w-full rounded-xl border border-surface-border bg-surface-card px-3 text-sm font-bold text-text-primary outline-none"
              />
            </label>
          </div>
        </section>

        {tagOptions.length > 0 && (
          <section>
            <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-text-muted">按标签筛选</h3>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-surface-border bg-surface-card p-2">
              {tagOptions.map((tag) => (
                <label key={tag.name} className="flex cursor-pointer items-center justify-between rounded-xl px-2 py-2 hover:bg-surface-muted">
                  <span>
                    <span className="block text-sm font-black text-text-primary">{tag.name}</span>
                    <span className="block text-[11px] font-bold text-text-muted">{tag.count > 0 ? `${tag.count} 条日志` : '未在日志中使用'}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={(options.tagFilter || []).includes(tag.name)}
                    onChange={(event) => toggleTag(tag.name, event.target.checked)}
                    className="h-5 w-5 rounded border-surface-border text-accent focus:ring-accent"
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-text-muted">数据维度</h3>
          <div className="space-y-2">
            {EXPORT_DIMENSIONS.map((dimension) => (
              <label
                key={dimension}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-surface-border bg-surface-card p-3"
              >
                <div>
                  <div className="text-sm font-black text-text-primary">{EXPORT_DIMENSION_LABELS[dimension]}</div>
                  <div className="text-[11px] font-bold text-text-muted">
                    {filteredCounts[dimension]} / {sourceCounts[dimension]}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.dimensions[dimension]}
                  onChange={(event) => updateDimension(dimension, event.target.checked)}
                  className="h-5 w-5 rounded border-surface-border text-accent focus:ring-accent"
                />
              </label>
            ))}
          </div>
        </section>

        {!canConfirm && (
          <p className="rounded-2xl bg-state-warning-bg p-3 text-xs font-bold leading-relaxed text-state-warning-text">
            当前选择没有可导出的内容。
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ExportOptionsModal;
