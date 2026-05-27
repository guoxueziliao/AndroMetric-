import { describe, expect, it } from 'vitest';
import type { LogEntry } from '../domain';
import { buildMarkdownExport } from '../features/profile/model/markdownExport';

const createLog = (date: string): LogEntry => ({
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
    startTime: `${date}T00:00:00.000Z`,
    endTime: `${date}T07:00:00.000Z`,
    quality: 4,
    attire: 'light',
    naturalAwakening: true,
    nocturnalEmission: false,
    withPartner: false,
    preSleepState: 'calm',
    naps: [],
    hasDream: false,
    dreamTypes: [],
    environment: { location: 'home', temperature: 'comfortable' }
  },
  mood: 'happy',
  stressLevel: 2,
  alcoholRecords: [],
  tags: [],
  notes: '状态很好',
  exercise: [{ id: `exercise-${date}`, type: '跑步', startTime: '08:00', duration: 30, intensity: 'medium' }],
  sex: [],
  masturbation: [],
  changeHistory: []
});

describe('buildMarkdownExport', () => {
  it('skips blank logs and renders recent days first', () => {
    const blank: LogEntry = {
      date: '2026-05-21',
      status: 'pending',
      updatedAt: Date.now(),
      alcoholRecords: [],
      tags: [],
      exercise: [],
      sex: [],
      masturbation: [],
      changeHistory: []
    };

    const markdown = buildMarkdownExport([createLog('2026-05-20'), blank, createLog('2026-05-19')]);

    expect(markdown).toContain('## 2026/05/20 周三');
    expect(markdown).toContain('- **晨勃**：硬度 4');
    expect(markdown).toContain('**近 7 日趋势**');
    expect(markdown).toContain('> 备注：状态很好');
    expect(markdown).not.toContain('2026/05/21');
    expect(markdown.indexOf('2026/05/20')).toBeLessThan(markdown.indexOf('2026/05/19'));
  });
});
