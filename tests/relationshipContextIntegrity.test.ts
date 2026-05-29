import { describe, it, expect } from 'vitest';
import { checkSnapshotIntegrity } from '../core/storage/snapshotIntegrity';
import { LATEST_VERSION } from '../core/storage/migration';
import type { Snapshot } from '../domain';

const makeSnapshot = (overrides: Partial<Snapshot['data']> = {}): Snapshot => ({
  timestamp: Date.now(),
  dataVersion: LATEST_VERSION,
  appVersion: '0.2.7',
  description: 'test',
  kind: 'manual',
  settings: null,
  userName: null,
  data: {
    version: LATEST_VERSION,
    logs: [],
    partners: [],
    tags: [],
    cycleEvents: [],
    pregnancyEvents: [],
    pornUseEvents: [],
    masturbationEvents: [],
    sexEvents: [],
    trainingGoals: [],
    goalCheckins: [],
    ...overrides,
  },
});

describe('checkSnapshotIntegrity - partner references', () => {
  it('reports orphan partner ids in sex events', () => {
    const snapshot = makeSnapshot({
      partners: [{ id: 'p1', name: 'A', sensitiveSpots: [], stimulationPreferences: [], likedPositions: [], dislikedActs: [], socialTags: [], milestones: {} }],
      sexEvents: [{
        id: 'se1',
        startedAt: '2026-05-20T22:00:00Z',
        targetDate: '2026-05-20',
        createdAt: '2026-05-20T22:00:00Z',
        updatedAt: '2026-05-20T22:00:00Z',
        status: 'completed',
        source: 'manual',
        durationMinutes: 30,
        partnerIds: ['p1', 'p_nonexistent'],
        interactionTypes: ['penetrative'],
        penetration: 'yes',
        hardnessLevel: 4,
        ejaculated: true,
        ejaculationContext: 'inside_condom',
        orgasmIntensity: null,
        satisfaction: 4,
        afterState: [],
        pornInvolved: null,
        linkedPornUseEventIds: [],
        linkedMasturbationEventIds: [],
      }],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const orphanPartner = issues.find((i) => i.kind === 'orphan_partner_ids');
    expect(orphanPartner).toBeTruthy();
    expect(orphanPartner!.severity).toBe('warning');
    expect(orphanPartner!.message).toContain('1');
  });

  it('reports no orphan partner ids when all refs are valid', () => {
    const snapshot = makeSnapshot({
      partners: [{ id: 'p1', name: 'A', sensitiveSpots: [], stimulationPreferences: [], likedPositions: [], dislikedActs: [], socialTags: [], milestones: {} }],
      sexEvents: [{
        id: 'se1',
        startedAt: '2026-05-20T22:00:00Z',
        targetDate: '2026-05-20',
        createdAt: '2026-05-20T22:00:00Z',
        updatedAt: '2026-05-20T22:00:00Z',
        status: 'completed',
        source: 'manual',
        durationMinutes: 30,
        partnerIds: ['p1'],
        interactionTypes: ['penetrative'],
        penetration: 'yes',
        hardnessLevel: 4,
        ejaculated: true,
        ejaculationContext: 'inside_condom',
        orgasmIntensity: null,
        satisfaction: 4,
        afterState: [],
        pornInvolved: null,
        linkedPornUseEventIds: [],
        linkedMasturbationEventIds: [],
      }],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const orphanPartner = issues.find((i) => i.kind === 'orphan_partner_ids');
    expect(orphanPartner).toBeUndefined();
  });

  it('reports legacy partner names when partners exist', () => {
    const snapshot = makeSnapshot({
      partners: [{ id: 'p1', name: 'Alice', sensitiveSpots: [], stimulationPreferences: [], likedPositions: [], dislikedActs: [], socialTags: [], milestones: {} }],
      logs: [{
        date: '2026-05-20',
        status: 'completed',
        updatedAt: Date.now(),
        alcoholRecords: [],
        tags: [],
        exercise: [],
        sex: [{
          id: 's1',
          startTime: '22:00',
          duration: 30,
          partner: 'Bob',
          protection: 'none',
          indicators: { lingerie: false, orgasm: false, partnerOrgasm: false, squirting: false, toys: false },
          ejaculation: false,
          mood: 'neutral' as const,
          interactions: [],
        }],
        masturbation: [],
        changeHistory: [],
      }],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const legacyNames = issues.find((i) => i.kind === 'legacy_partner_names');
    expect(legacyNames).toBeTruthy();
    expect(legacyNames!.severity).toBe('info');
    expect(legacyNames!.message).toContain('旧记录');
  });

  it('skips legacy partner name check when no partners exist', () => {
    const snapshot = makeSnapshot({
      partners: [],
      logs: [{
        date: '2026-05-20',
        status: 'completed',
        updatedAt: Date.now(),
        alcoholRecords: [],
        tags: [],
        exercise: [],
        sex: [{
          id: 's1',
          startTime: '22:00',
          duration: 30,
          partner: 'Bob',
          protection: 'none',
          indicators: { lingerie: false, orgasm: false, partnerOrgasm: false, squirting: false, toys: false },
          ejaculation: false,
          mood: 'neutral' as const,
          interactions: [],
        }],
        masturbation: [],
        changeHistory: [],
      }],
    });
    const issues = checkSnapshotIntegrity(snapshot);
    const legacyNames = issues.find((i) => i.kind === 'legacy_partner_names');
    expect(legacyNames).toBeUndefined();
  });
});

describe('checkSnapshotIntegrity - schema version', () => {
  it('reports newer version as error', () => {
    const snapshot = makeSnapshot();
    snapshot.data.version = LATEST_VERSION + 1;
    const issues = checkSnapshotIntegrity(snapshot);
    const newer = issues.find((i) => i.kind === 'newer_version');
    expect(newer).toBeTruthy();
    expect(newer!.severity).toBe('error');
  });

  it('reports older version as info', () => {
    const snapshot = makeSnapshot();
    snapshot.data.version = 46;
    const issues = checkSnapshotIntegrity(snapshot);
    const older = issues.find((i) => i.kind === 'older_version');
    expect(older).toBeTruthy();
    expect(older!.severity).toBe('info');
  });
});
