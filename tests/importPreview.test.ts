import { describe, expect, it } from 'vitest';
import { buildImportPreview, getImportFileKind } from '../features/profile/model/importPreview';
import { LATEST_VERSION } from '../core/storage';

const sampleSnapshot = {
  appName: '硬度日记',
  appVersion: '0.1.1',
  dataVersion: 6,
  exportDate: '2026-05-20T10:00:00.000Z',
  settings: { theme: 'dark' },
  userName: 'tester',
  data: {
    version: 6,
    logs: [{ id: '1', date: '2026-05-19' }, { id: '2', date: '2026-05-20' }],
    partners: [{ id: 'p1' }],
    tags: [{ name: 'gym', category: 'exercise' }],
    cycleEvents: [{ id: 'c1' }],
    pregnancyEvents: [],
    snapshots: [{ id: 1, timestamp: 1 }]
  }
};

describe('buildImportPreview', () => {
  it('reads counts and metadata from a standard snapshot', () => {
    const preview = buildImportPreview(JSON.stringify(sampleSnapshot), false);
    expect(preview.encrypted).toBe(false);
    expect(preview.appVersion).toBe('0.1.1');
    expect(preview.dataVersion).toBe(6);
    expect(preview.exportDate).toBe('2026-05-20T10:00:00.000Z');
    expect(preview.includesSettings).toBe(true);
    expect(preview.includesUserName).toBe(true);
    expect(preview.counts).toEqual({
      logs: 2,
      partners: 1,
      tags: 1,
      cycleEvents: 1,
      pregnancyEvents: 0,
      snapshots: 1,
      pornUseEvents: 0,
      masturbationEvents: 0,
      sexEvents: 0
    });
  });

  it('falls back to data.version and missing fields for legacy payloads', () => {
    const legacy = {
      data: {
        version: 5,
        logs: [{ id: 'a' }]
      }
    };
    const preview = buildImportPreview(JSON.stringify(legacy), false);
    expect(preview.appVersion).toBeUndefined();
    expect(preview.exportDate).toBeUndefined();
    expect(preview.dataVersion).toBe(5);
    expect(preview.includesSettings).toBe(false);
    expect(preview.includesUserName).toBe(false);
    expect(preview.counts.logs).toBe(1);
    expect(preview.counts.partners).toBe(0);
    expect(preview.counts.snapshots).toBe(0);
  });

  it('handles top-level objects without a data wrapper', () => {
    const flat = {
      logs: [{}, {}, {}],
      partners: [{}],
      tags: [],
      cycleEvents: [{}],
      pregnancyEvents: [{}],
      snapshots: [{}, {}]
    };
    const preview = buildImportPreview(JSON.stringify(flat), false);
    expect(preview.counts.logs).toBe(3);
    expect(preview.counts.partners).toBe(1);
    expect(preview.counts.cycleEvents).toBe(1);
    expect(preview.counts.snapshots).toBe(2);
    expect(preview.dataVersion).toBeUndefined();
  });

  it('classifies data versions against the current app data version', () => {
    const createSnapshotWithVersion = (version: number) => JSON.stringify({
      ...sampleSnapshot,
      dataVersion: version,
      data: { ...sampleSnapshot.data, version }
    });

    expect(buildImportPreview(createSnapshotWithVersion(LATEST_VERSION - 1), false).versionStatus).toBe('older');
    expect(buildImportPreview(createSnapshotWithVersion(LATEST_VERSION), false).versionStatus).toBe('match');
    expect(buildImportPreview(createSnapshotWithVersion(LATEST_VERSION + 1), false).versionStatus).toBe('newer');
  });

  it('does not use appVersion for compatibility decisions', () => {
    const preview = buildImportPreview(JSON.stringify({
      ...sampleSnapshot,
      appVersion: '99.0.0',
      dataVersion: LATEST_VERSION,
      data: { ...sampleSnapshot.data, version: LATEST_VERSION }
    }), false);

    expect(preview.appVersion).toBe('99.0.0');
    expect(preview.versionStatus).toBe('match');
  });
});

describe('getImportFileKind', () => {
  it('detects plain JSON', () => {
    expect(getImportFileKind(JSON.stringify(sampleSnapshot))).toBe('plain');
  });

  it('detects encrypted payloads via the HDENC1 magic marker', () => {
    const encryptedShape = JSON.stringify({ magic: 'HDENC1', salt: 's', iv: 'i', data: 'd' });
    expect(getImportFileKind(encryptedShape)).toBe('encrypted');
  });

  it('treats malformed text as plain', () => {
    expect(getImportFileKind('{not json')).toBe('plain');
  });
});
