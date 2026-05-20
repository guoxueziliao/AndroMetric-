import { describe, expect, it } from 'vitest';
import { PHYSIOLOGICAL_DAY_CUTOFF_HOUR, SLEEP_RECORD_NEXT_DAY_HOUR } from '../domain';
import { getActivityTargetDate, getSleepTargetDate } from '../shared/lib';

describe('physiological day target dates', () => {
  it('assigns activities before cutoff to the previous calendar date', () => {
    expect(PHYSIOLOGICAL_DAY_CUTOFF_HOUR).toBe(3);
    expect(getActivityTargetDate(new Date('2026-05-20T02:59:00'))).toBe('2026-05-19');
    expect(getActivityTargetDate(new Date('2026-05-20T03:00:00'))).toBe('2026-05-20');
  });

  it('assigns sleep starts after noon to the next sleep date', () => {
    expect(SLEEP_RECORD_NEXT_DAY_HOUR).toBe(12);
    expect(getSleepTargetDate(new Date('2026-05-20T11:59:00'))).toBe('2026-05-20');
    expect(getSleepTargetDate(new Date('2026-05-20T12:00:00'))).toBe('2026-05-21');
  });
});
