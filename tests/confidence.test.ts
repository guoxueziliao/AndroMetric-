import { describe, it, expect } from 'vitest';
import {
  confidenceTier,
  confidenceTierLabel,
  confidenceBadgeLabel,
} from '../shared/lib/confidence';

describe('confidence calibration', () => {
  it('maps engine confidence to the three viewing tiers', () => {
    expect(confidenceTier('none')).toBe('not_yet');
    expect(confidenceTier('low')).toBe('cautious');
    expect(confidenceTier('medium')).toBe('viewable');
    expect(confidenceTier('high')).toBe('viewable');
  });

  it('labels tiers as 可看 / 谨慎看 / 暂不看', () => {
    expect(confidenceTierLabel('none')).toBe('暂不看');
    expect(confidenceTierLabel('low')).toBe('谨慎看');
    expect(confidenceTierLabel('medium')).toBe('可看');
    expect(confidenceTierLabel('high')).toBe('可看');
  });

  it('keeps the none badge empty so low-signal cards stay quiet', () => {
    expect(confidenceBadgeLabel('none')).toBe('');
    expect(confidenceBadgeLabel('low')).toBe('样本有限');
    expect(confidenceBadgeLabel('medium')).toBe('初步可看');
  });

  it('never uses forbidden medicalised words in any label', () => {
    const labels = [
      confidenceTierLabel('none'),
      confidenceTierLabel('low'),
      confidenceTierLabel('medium'),
      confidenceTierLabel('high'),
      confidenceBadgeLabel('low'),
      confidenceBadgeLabel('medium'),
      confidenceBadgeLabel('high'),
    ].join('');
    for (const banned of ['异常', '风险', '病变', '诊断', '导致']) {
      expect(labels).not.toContain(banned);
    }
  });
});
