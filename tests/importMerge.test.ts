import { describe, expect, it } from 'vitest';
import type { LogEntry } from '../domain';
import { computeLogConflicts, mergeLogEntryForImport } from '../core/storage/importMerge';

const createLog = (overrides: Partial<LogEntry>): LogEntry => ({
  date: '2026-05-22',
  status: 'completed',
  updatedAt: 1,
  alcoholRecords: [],
  tags: [],
  exercise: [],
  sex: [],
  masturbation: [],
  changeHistory: [],
  ...overrides
});

describe('computeLogConflicts', () => {
  it('returns no conflicts when logs are identical or missing locally', () => {
    expect(computeLogConflicts(
      [createLog({ date: '2026-05-22', mood: 'happy' })],
      [
        createLog({ date: '2026-05-22', mood: 'happy' }),
        createLog({ date: '2026-05-23', mood: 'neutral' })
      ]
    )).toEqual([]);
  });

  it('detects a single field conflict', () => {
    const conflicts = computeLogConflicts(
      [createLog({ date: '2026-05-22', mood: 'happy' })],
      [createLog({ date: '2026-05-22', mood: 'neutral' })]
    );

    expect(conflicts).toEqual([{
      date: '2026-05-22',
      field: 'mood',
      currentValue: '"happy"',
      incomingValue: '"neutral"'
    }]);
  });

  it('detects conflicts across multiple logs and fields', () => {
    const conflicts = computeLogConflicts(
      [
        createLog({ date: '2026-05-22', mood: 'happy', notes: 'local' }),
        createLog({ date: '2026-05-23', stressLevel: 2 })
      ],
      [
        createLog({ date: '2026-05-22', mood: 'neutral', notes: 'import' }),
        createLog({ date: '2026-05-23', stressLevel: 4 })
      ]
    );

    expect(conflicts.map((conflict) => `${conflict.date}:${String(conflict.field)}`)).toEqual([
      '2026-05-22:mood',
      '2026-05-22:notes',
      '2026-05-23:stressLevel'
    ]);
  });

  it('treats array fields as whole-field conflicts', () => {
    const conflicts = computeLogConflicts(
      [createLog({
        date: '2026-05-22',
        exercise: [{ id: 'e1', type: 'run', startTime: '07:00', duration: 30, intensity: 'medium' }]
      })],
      [createLog({
        date: '2026-05-22',
        exercise: [{ id: 'e1', type: 'run', startTime: '07:00', duration: 45, intensity: 'medium' }]
      })]
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].field).toBe('exercise');
  });
});

describe('mergeLogEntryForImport', () => {
  it('keeps current values for conflicted fields when requested', () => {
    const current = createLog({ mood: 'happy', notes: 'local', tags: ['local'] });
    const incoming = createLog({ mood: 'neutral', notes: 'import', tags: ['import'] });
    const merged = mergeLogEntryForImport(current, incoming, 'keep-current');

    expect(merged.mood).toBe('happy');
    expect(merged.notes).toBe('local');
    expect(merged.tags).toEqual(['local']);
  });

  it('uses incoming values by default for conflicted fields', () => {
    const current = createLog({ mood: 'happy', notes: 'local' });
    const incoming = createLog({ mood: 'neutral', notes: 'import' });
    const merged = mergeLogEntryForImport(current, incoming, 'use-import');

    expect(merged.mood).toBe('neutral');
    expect(merged.notes).toBe('import');
  });
});
