import type { CycleEvent, LogEntry, PartnerProfile, PregnancyEvent, Snapshot, TagEntry } from '../../../domain';

export type ExportFormat = 'json' | 'csv' | 'markdown';
export type ExportDimension = 'logs' | 'partners' | 'tags' | 'cycleEvents' | 'pregnancyEvents' | 'snapshots';

export type ExportDimensions = Record<ExportDimension, boolean>;

export interface ExportOptions {
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  tagFilter?: string[];
  dimensions: ExportDimensions;
}

export interface ExportDataset {
  logs: LogEntry[];
  partners: PartnerProfile[];
  tags: TagEntry[];
  cycleEvents: CycleEvent[];
  pregnancyEvents: PregnancyEvent[];
  snapshots: Snapshot[];
}

export interface ExportCounts {
  logs: number;
  partners: number;
  tags: number;
  cycleEvents: number;
  pregnancyEvents: number;
  snapshots: number;
}

export interface ExportTagOption {
  name: string;
  count: number;
}

export const DEFAULT_EXPORT_DIMENSIONS: ExportDimensions = {
  logs: true,
  partners: true,
  tags: true,
  cycleEvents: true,
  pregnancyEvents: true,
  snapshots: true
};

export const createDefaultExportOptions = (format: ExportFormat = 'json'): ExportOptions => ({
  format,
  startDate: '',
  endDate: '',
  dimensions: { ...DEFAULT_EXPORT_DIMENSIONS }
});

export const EXPORT_DIMENSION_LABELS: Record<ExportDimension, string> = {
  logs: '日志',
  partners: '伴侣',
  tags: '标签',
  cycleEvents: '周期事件',
  pregnancyEvents: '怀孕事件',
  snapshots: '内部快照'
};

const isDateInRange = (date: string, startDate?: string, endDate?: string) => {
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
};

const matchesTagFilter = (log: LogEntry, tagFilter?: string[]) => (
  !tagFilter || tagFilter.length === 0 || log.tags.some((tag) => tagFilter.includes(tag))
);

const getSnapshotDate = (snapshot: Snapshot) => {
  const date = new Date(snapshot.timestamp);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

export const applyExportOptionsToDataset = (
  dataset: ExportDataset,
  options: ExportOptions
): ExportDataset => {
  const { startDate, endDate, dimensions } = options;

  return {
    logs: dimensions.logs
      ? dataset.logs.filter((log) => isDateInRange(log.date, startDate, endDate) && matchesTagFilter(log, options.tagFilter))
      : [],
    partners: dimensions.partners ? dataset.partners : [],
    tags: dimensions.tags ? dataset.tags : [],
    cycleEvents: dimensions.cycleEvents
      ? dataset.cycleEvents.filter((event) => isDateInRange(event.date, startDate, endDate))
      : [],
    pregnancyEvents: dimensions.pregnancyEvents
      ? dataset.pregnancyEvents.filter((event) => isDateInRange(event.date, startDate, endDate))
      : [],
    snapshots: dimensions.snapshots
      ? dataset.snapshots.filter((snapshot) => {
        const snapshotDate = getSnapshotDate(snapshot);
        return snapshotDate ? isDateInRange(snapshotDate, startDate, endDate) : true;
      })
      : []
  };
};

export const getExportCounts = (dataset: ExportDataset): ExportCounts => ({
  logs: dataset.logs.length,
  partners: dataset.partners.length,
  tags: dataset.tags.length,
  cycleEvents: dataset.cycleEvents.length,
  pregnancyEvents: dataset.pregnancyEvents.length,
  snapshots: dataset.snapshots.length
});

export const hasAnyExportData = (dataset: ExportDataset) => (
  Object.values(getExportCounts(dataset)).some((count) => count > 0)
);

export const hasSelectedExportDimension = (options: ExportOptions) => (
  Object.values(options.dimensions).some(Boolean)
);

export const getExportTagOptions = (dataset: ExportDataset): ExportTagOption[] => {
  const counts = new Map<string, number>();

  dataset.tags.forEach((tag) => {
    counts.set(tag.name, counts.get(tag.name) || 0);
  });
  dataset.logs.forEach((log) => {
    log.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
};
