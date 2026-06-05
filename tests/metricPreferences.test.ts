import { describe, expect, it } from 'vitest';
import {
  getMetricPreferenceLevel,
  isMetricMuted,
  setMetricPreferenceLevel,
  sortByMetricPreference,
  type MetricPreferenceMap
} from '../domain';

describe('metric preferences', () => {
  it('defaults unknown and unconfigured metrics to normal', () => {
    expect(getMetricPreferenceLevel(undefined, 'sleep')).toBe('normal');
    expect(getMetricPreferenceLevel({}, 'not-a-metric')).toBe('normal');
  });

  it('stores only non-normal levels', () => {
    const focused = setMetricPreferenceLevel(undefined, 'sleep', 'focus');
    expect(focused).toEqual({ sleep: 'focus' });

    const normal = setMetricPreferenceLevel(focused, 'sleep', 'normal');
    expect(normal).toEqual({});
  });

  it('sorts focus first, normal next, muted last while preserving order inside a level', () => {
    const preferences: MetricPreferenceMap = {
      exercise: 'focus',
      alcohol: 'muted',
      sleep: 'focus'
    };

    const sorted = sortByMetricPreference(
      ['hardness', 'sleep', 'stress', 'exercise', 'alcohol'],
      (id) => id,
      preferences
    );

    expect(sorted).toEqual(['sleep', 'exercise', 'hardness', 'stress', 'alcohol']);
  });

  it('detects muted metrics without treating unknown ids as hidden data', () => {
    const preferences: MetricPreferenceMap = { porn: 'muted' };
    expect(isMetricMuted(preferences, 'porn')).toBe(true);
    expect(isMetricMuted(preferences, 'unknown')).toBe(false);
  });
});
