import { describe, it, expect } from 'vitest';
import { pathToLabel } from '../shared/lib/labels';

describe('pathToLabel', () => {
  it('translates masturbation content item path', () => {
    expect(pathToLabel('masturbation[0].contentItems[1]')).toBe('自慰记录 1 / 素材 2');
  });

  it('translates masturbation content item type path', () => {
    expect(pathToLabel('masturbation[0].contentItems[1].type')).toBe('自慰记录 1 / 素材 2 / 素材类型');
  });

  it('translates masturbation content item platform path', () => {
    expect(pathToLabel('masturbation[0].contentItems[1].platform')).toBe('自慰记录 1 / 素材 2 / 来源平台');
  });

  it('translates sex partner path', () => {
    expect(pathToLabel('sex[0].partner')).toBe('性爱记录 1 / 伴侣');
  });

  it('translates exercise path', () => {
    expect(pathToLabel('exercise')).toBe('运动记录');
  });

  it('translates sleep start time path', () => {
    expect(pathToLabel('sleep.startTime')).toBe('睡眠 / 开始时间');
  });

  it('translates sleep end time path', () => {
    expect(pathToLabel('sleep.endTime')).toBe('睡眠 / 结束时间');
  });

  it('translates morning hardness path', () => {
    expect(pathToLabel('morning.hardness')).toBe('晨间状态 / 硬度');
  });

  it('returns raw path for unknown segments', () => {
    expect(pathToLabel('unknown.field')).toBe('unknown / field');
  });

  it('handles complex multi-segment paths', () => {
    expect(pathToLabel('masturbation[2].contentItems[0].platform')).toBe('自慰记录 3 / 素材 1 / 来源平台');
  });
});
