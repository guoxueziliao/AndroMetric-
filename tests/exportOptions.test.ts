import { describe, expect, it } from 'vitest';
import type { LogEntry, Snapshot } from '../domain';
import type { ExportDataset } from '../features/profile/model/exportOptions';
import {
  applyExportOptionsToDataset,
  createDefaultExportOptions,
  getExportCounts,
  getExportTagOptions,
  hasAnyExportData,
  hasSelectedExportDimension
} from '../features/profile/model/exportOptions';

const createLog = (date: string): LogEntry => ({
  date,
  status: 'completed',
  updatedAt: new Date(`${date}T12:00:00`).getTime(),
  alcoholRecords: [],
  tags: [],
  exercise: [],
  sex: [],
  masturbation: [],
  changeHistory: []
});

const createSnapshot = (timestamp: string): Snapshot => ({
  id: 1,
  timestamp: new Date(timestamp).getTime(),
  dataVersion: 46,
  appVersion: '0.1.2',
  description: 'snapshot',
  kind: 'manual',
  settings: null,
  userName: null,
  data: {
    version: 46,
    logs: [],
    partners: [],
    tags: [],
    cycleEvents: [],
    pregnancyEvents: []
  }
});

const dataset: ExportDataset = {
  logs: [
    { ...createLog('2026-05-01'), tags: ['travel'] },
    { ...createLog('2026-05-20'), tags: ['gym', 'travel'] }
  ],
  partners: [{
    id: 'partner-1',
    name: 'A',
    sensitiveSpots: [],
    stimulationPreferences: [],
    likedPositions: [],
    dislikedActs: [],
    socialTags: [],
    milestones: {}
  }],
  tags: [{ name: 'gym', category: 'event', createdAt: 1 }],
  cycleEvents: [
    { id: 'cycle-old', partnerId: 'partner-1', date: '2026-05-01', kind: 'period_start', source: 'manual' },
    { id: 'cycle-new', partnerId: 'partner-1', date: '2026-05-20', kind: 'period_end', source: 'manual' }
  ],
  pregnancyEvents: [
    { id: 'pregnancy-new', partnerId: 'partner-1', date: '2026-05-20', kind: 'pregnancy_test', source: 'manual' }
  ],
  snapshots: [
    createSnapshot('2026-05-01T10:00:00.000Z'),
    createSnapshot('2026-05-20T10:00:00.000Z')
  ]
};

describe('applyExportOptionsToDataset', () => {
  it('filters date-bound dimensions by the selected range', () => {
    const options = {
      ...createDefaultExportOptions('json'),
      rangeMode: 'date' as const,
      startDate: '2026-05-10',
      endDate: '2026-05-31'
    };

    const filtered = applyExportOptionsToDataset(dataset, options);

    expect(filtered.logs.map((log) => log.date)).toEqual(['2026-05-20']);
    expect(filtered.cycleEvents.map((event) => event.id)).toEqual(['cycle-new']);
    expect(filtered.pregnancyEvents.map((event) => event.id)).toEqual(['pregnancy-new']);
    expect(filtered.snapshots).toHaveLength(1);
    expect(filtered.partners).toHaveLength(1);
    expect(filtered.tags).toHaveLength(1);
  });

  it('exports all data when rangeMode is all (default)', () => {
    const options = createDefaultExportOptions('json');
    const filtered = applyExportOptionsToDataset(dataset, options);

    expect(filtered.logs).toHaveLength(2);
    expect(filtered.cycleEvents).toHaveLength(2);
    expect(filtered.pregnancyEvents).toHaveLength(1);
    expect(filtered.snapshots).toHaveLength(2);
  });

  it('removes dimensions that are not selected', () => {
    const options = {
      ...createDefaultExportOptions('csv'),
      dimensions: {
        logs: true,
        partners: false,
        tags: false,
        cycleEvents: false,
        pregnancyEvents: false,
        snapshots: false
      }
    };

    const filtered = applyExportOptionsToDataset(dataset, options);

    expect(getExportCounts(filtered)).toEqual({
      logs: 2,
      partners: 0,
      tags: 0,
      cycleEvents: 0,
      pregnancyEvents: 0,
      snapshots: 0,
      pornUseEvents: 0,
      masturbationEvents: 0,
      sexEvents: 0,
      trainingGoals: 0,
      goalCheckins: 0,
    });
    expect(hasAnyExportData(filtered)).toBe(true);
  });

  it('detects empty selections', () => {
    const options = {
      ...createDefaultExportOptions('json'),
      dimensions: {
        logs: false,
        partners: false,
        tags: false,
        cycleEvents: false,
        pregnancyEvents: false,
        snapshots: false
      }
    };

    const filtered = applyExportOptionsToDataset(dataset, options);

    expect(hasSelectedExportDimension(options)).toBe(false);
    expect(hasAnyExportData(filtered)).toBe(false);
  });

  it('filters logs by selected tags with OR semantics', () => {
    const options = {
      ...createDefaultExportOptions('json'),
      tagFilter: ['gym']
    };

    const filtered = applyExportOptionsToDataset(dataset, options);

    expect(filtered.logs.map((log) => log.date)).toEqual(['2026-05-20']);
    expect(filtered.partners).toHaveLength(1);
    expect(filtered.cycleEvents).toHaveLength(2);
  });

  it('does not filter logs when tagFilter is empty', () => {
    const filtered = applyExportOptionsToDataset(dataset, {
      ...createDefaultExportOptions('json'),
      tagFilter: []
    });

    expect(filtered.logs).toHaveLength(2);
  });

  it('builds tag options sorted by usage count', () => {
    expect(getExportTagOptions(dataset)).toEqual([
      { name: 'travel', count: 2 },
      { name: 'gym', count: 1 }
    ]);
  });
});
