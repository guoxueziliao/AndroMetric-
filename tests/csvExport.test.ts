import { describe, expect, it } from 'vitest';
import type { LogEntry, Snapshot } from '../domain';
import { buildCsvExportFiles, buildCsvExportFilesFromDataset } from '../features/profile/model/csvExport';
import type { ExportDataset } from '../features/profile/model/exportOptions';

const createBaseLog = (date: string): LogEntry => ({
  date,
  status: 'completed',
  updatedAt: new Date(`${date}T12:00:00`).getTime(),
  morning: {
    id: `morning-${date}`,
    timestamp: new Date(`${date}T07:00:00`).getTime(),
    wokeWithErection: true,
    hardness: 4,
    retention: 'normal',
    wokenByErection: false
  },
  sleep: {
    id: `sleep-${date}`,
    startTime: `${date}T23:00:00.000Z`,
    endTime: `${date}T07:00:00.000Z`,
    quality: 5,
    attire: 'light',
    naturalAwakening: true,
    nocturnalEmission: false,
    withPartner: false,
    preSleepState: 'calm',
    naps: [],
    hasDream: false,
    dreamTypes: [],
    environment: {
      location: 'home',
      temperature: 'comfortable'
    }
  },
  location: 'home',
  weather: 'sunny',
  mood: 'happy',
  stressLevel: 2,
  alcoholRecords: [],
  caffeineRecord: {
    totalCount: 2,
    items: []
  },
  tags: [],
  notes: 'needs, csv "escape"',
  exercise: [],
  sex: [],
  masturbation: [],
  changeHistory: []
});

const createSnapshot = (): Snapshot => ({
  id: 9,
  timestamp: new Date('2026-05-20T10:00:00.000Z').getTime(),
  dataVersion: 46,
  appVersion: '0.1.2',
  description: 'manual snapshot',
  kind: 'manual',
  settings: null,
  userName: null,
  data: {
    version: 46,
    logs: [createBaseLog('2026-05-20')],
    partners: [],
    tags: [],
    cycleEvents: [],
    pregnancyEvents: []
  }
});

describe('buildCsvExportFiles', () => {
  it('creates the expected logs CSV bundle files', () => {
    const files = buildCsvExportFiles([createBaseLog('2026-05-20')]);

    expect(files.map((file) => file.name)).toEqual([
      'days.csv',
      'sex.csv',
      'masturbation.csv',
      'exercise.csv',
      'alcohol.csv'
    ]);
  });

  it('adds meta.json when export metadata is provided', () => {
    const files = buildCsvExportFiles([createBaseLog('2026-05-20')], {
      appVersion: '0.1.2',
      dataVersion: 46,
      exportedAt: '2026-05-22T00:00:00.000Z'
    });

    const meta = files[0];
    expect(meta.name).toBe('meta.json');
    expect(meta.addBom).toBe(false);
    expect(JSON.parse(meta.content)).toEqual({
      appVersion: '0.1.2',
      dataVersion: 46,
      exportedAt: '2026-05-22T00:00:00.000Z'
    });
  });

  it('exports daily summaries with escaped CSV values', () => {
    const daysCsv = buildCsvExportFiles([createBaseLog('2026-05-20')]).find((file) => file.name === 'days.csv')?.content;

    expect(daysCsv).toContain('date,status,morning_woke_with_erection');
    expect(daysCsv).toContain('2026-05-20,completed,true,4,normal');
    expect(daysCsv).toContain('2,happy,2,home,sunny,');
  });

  it('flattens event arrays into dedicated CSV files', () => {
    const log = createBaseLog('2026-05-20');
    log.sex = [{
      id: 'sex-1',
      startTime: '21:00',
      duration: 30,
      partner: 'partner-a',
      location: 'home',
      protection: 'condom',
      indicators: {
        lingerie: false,
        orgasm: true,
        partnerOrgasm: false,
        squirting: false,
        toys: true
      },
      ejaculation: true,
      mood: 'excited',
      interactions: [{
        id: 'interaction-1',
        partner: 'partner-a',
        location: 'bedroom',
        costumes: ['shirt'],
        toys: ['toy-a'],
        chain: [{ id: 'act-1', type: 'act', name: 'kiss' }]
      }]
    }];
    log.masturbation = [{
      id: 'mb-1',
      startTime: '23:00',
      duration: 12,
      status: 'completed',
      tools: ['tool-a'],
      contentItems: [{ id: 'content-1', type: 'video', platform: 'site', xpTags: ['tag-a'] }],
      edging: 'single',
      edgingCount: 1,
      lubricant: 'water',
      useCondom: false,
      ejaculation: true,
      orgasmIntensity: 4,
      satisfactionLevel: 5,
      mood: 'neutral',
      stressLevel: 2,
      energyLevel: 3,
      interrupted: false,
      interruptionReasons: [],
      notes: 'ok'
    }];
    log.exercise = [{
      id: 'exercise-1',
      type: 'run',
      startTime: '08:00',
      duration: 40,
      intensity: 'medium',
      bodyParts: ['legs'],
      steps: 5000,
      feeling: 'great'
    }];
    log.alcoholRecords = [{
      id: 'alcohol-1',
      totalGrams: 12,
      durationMinutes: 60,
      isLate: false,
      items: [{ key: 'beer', name: 'beer', volume: 330, abv: 5, count: 1, pureAlcohol: 12 }],
      drunkLevel: 'tipsy',
      time: '20:00',
      ongoing: false
    }];

    const files = buildCsvExportFiles([log]);

    expect(files.find((file) => file.name === 'sex.csv')?.content).toContain('2026-05-20,sex-1,21:00,30,partner-a,home,condom,,true,false,true');
    expect(files.find((file) => file.name === 'masturbation.csv')?.content).toContain('2026-05-20,mb-1,23:00,12,completed,tool-a,video,site,tag-a');
    expect(files.find((file) => file.name === 'exercise.csv')?.content).toContain('2026-05-20,exercise-1,run,08:00,40,medium,legs,5000,great');
    expect(files.find((file) => file.name === 'alcohol.csv')?.content).toContain('2026-05-20,alcohol-1,20:00,,60,false,tipsy,,false,beer,beer,330,5,1,12,12');
  });

  it('builds selected dataset CSV files only for enabled dimensions', () => {
    const dataset: ExportDataset = {
      logs: [createBaseLog('2026-05-20')],
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
      cycleEvents: [{ id: 'cycle-1', partnerId: 'partner-1', date: '2026-05-20', kind: 'period_start', source: 'manual' }],
      pregnancyEvents: [],
      snapshots: [createSnapshot()]
    };

    const files = buildCsvExportFilesFromDataset(dataset, {
      logs: false,
      partners: true,
      tags: false,
      cycleEvents: true,
      pregnancyEvents: false,
      snapshots: true
    }, {
      appVersion: '0.1.2',
      dataVersion: 46,
      exportedAt: '2026-05-22T00:00:00.000Z'
    });

    expect(files.map((file) => file.name)).toEqual([
      'meta.json',
      'partners.csv',
      'cycle_events.csv',
      'snapshots.csv'
    ]);
    expect(files.find((file) => file.name === 'snapshots.csv')?.content).toContain('manual snapshot,manual,46,0.1.2,1,0,0,0,0');
  });
});
