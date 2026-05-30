import { describe, it, expect } from 'vitest';
import type { GoalCheckin } from '../domain';
import type { ExperienceCardDraft } from '../features/stats/model/experienceCardService';
import {
  isExperienceCard,
  buildFactSummary,
  buildDefaultLimitations,
  draftToCheckin,
  parseExperienceCard,
  getExperienceCards,
  filterExperienceCards,
} from '../features/stats/model/experienceCardService';

const makeDraft = (overrides: Partial<ExperienceCardDraft> = {}): ExperienceCardDraft => ({
  sourceGoalId: 'tg_obs_1',
  sourceGoalTitle: '观察睡眠',
  contextTypes: ['sleep'],
  dateRange: { startDate: '2026-05-17', endDate: '2026-05-30' },
  title: '睡眠对硬度的影响观察',
  factSummary: '观察睡眠，14 天窗口。记录 10 天，缺失 4 天。',
  userReflection: '感觉睡眠不足时硬度确实偏低，但样本太少不能确定。',
  limitations: ['记录天数较少，经验可能不完整。', '这是个人主观经验，不代表规律。'],
  ...overrides,
});

describe('experienceCardService', () => {
  describe('isExperienceCard', () => {
    it('returns true for experience card note', () => {
      const draft = makeDraft();
      const checkin = draftToCheckin(draft);
      expect(isExperienceCard(checkin)).toBe(true);
    });

    it('returns false for regular checkin', () => {
      const checkin: GoalCheckin = {
        id: 'gc_1',
        goalId: 'tg_1',
        createdAt: new Date().toISOString(),
        targetDate: '2026-05-20',
        status: 'continue',
        note: '普通签到',
      };
      expect(isExperienceCard(checkin)).toBe(false);
    });

    it('returns false for checkin without note', () => {
      const checkin: GoalCheckin = {
        id: 'gc_1',
        goalId: 'tg_1',
        createdAt: new Date().toISOString(),
        targetDate: '2026-05-20',
        status: 'continue',
      };
      expect(isExperienceCard(checkin)).toBe(false);
    });
  });

  describe('buildFactSummary', () => {
    it('builds summary with all data', () => {
      const summary = buildFactSummary('观察睡眠', 14, 10, 4);
      expect(summary).toContain('观察睡眠');
      expect(summary).toContain('14 天');
      expect(summary).toContain('记录 10 天');
      expect(summary).toContain('缺失 4 天');
    });

    it('adds warning for large gaps', () => {
      const summary = buildFactSummary('观察压力', 14, 5, 9);
      expect(summary).toContain('仅供参考');
    });
  });

  describe('buildDefaultLimitations', () => {
    it('includes low count warning', () => {
      const limits = buildDefaultLimitations(2, 14);
      expect(limits.some((l) => l.includes('记录天数较少'))).toBe(true);
    });

    it('always includes subjective disclaimer', () => {
      const limits = buildDefaultLimitations(14, 14);
      expect(limits.some((l) => l.includes('主观经验'))).toBe(true);
    });
  });

  describe('draftToCheckin + parseExperienceCard', () => {
    it('round-trips through checkin note', () => {
      const draft = makeDraft();
      const checkin = draftToCheckin(draft);
      const card = parseExperienceCard(checkin, '观察睡眠');
      expect(card).not.toBeNull();
      expect(card!.title).toBe('睡眠对硬度的影响观察');
      expect(card!.factSummary).toContain('观察睡眠');
      expect(card!.userReflection).toContain('感觉睡眠不足');
      expect(card!.contextTypes).toEqual(['sleep']);
      expect(card!.limitations.length).toBeGreaterThan(0);
    });

    it('returns null for non-experience checkin', () => {
      const checkin: GoalCheckin = {
        id: 'gc_1',
        goalId: 'tg_1',
        createdAt: new Date().toISOString(),
        targetDate: '2026-05-20',
        status: 'continue',
        note: '普通签到',
      };
      expect(parseExperienceCard(checkin, '观察睡眠')).toBeNull();
    });
  });

  describe('getExperienceCards', () => {
    it('filters and sorts experience cards', () => {
      const goals = [{ id: 'tg_1', title: '观察睡眠' }, { id: 'tg_2', title: '观察压力' }];
      const draft1 = makeDraft({ sourceGoalId: 'tg_1' });
      const draft2 = makeDraft({ sourceGoalId: 'tg_2', title: '压力观察经验' });
      const checkins = [
        draftToCheckin(draft1),
        draftToCheckin(draft2),
        { id: 'gc_regular', goalId: 'tg_1', createdAt: new Date().toISOString(), targetDate: '2026-05-20', status: 'continue' as const },
      ];
      const cards = getExperienceCards(goals, checkins);
      expect(cards).toHaveLength(2);
      // Should be sorted by savedAt desc
      expect(cards[0].savedAt >= cards[1].savedAt).toBe(true);
    });
  });

  describe('filterExperienceCards', () => {
    it('filters by context type', () => {
      const draft = makeDraft({ contextTypes: ['sleep', 'stress'] });
      const checkin = draftToCheckin(draft);
      const card = parseExperienceCard(checkin, '观察睡眠')!;
      expect(filterExperienceCards([card], { contextType: 'sleep' })).toHaveLength(1);
      expect(filterExperienceCards([card], { contextType: 'exercise' })).toHaveLength(0);
    });

    it('filters by metric id', () => {
      const draft = makeDraft({ sourceMetricId: 'hardness' });
      const checkin = draftToCheckin(draft);
      const card = parseExperienceCard(checkin, '观察睡眠')!;
      expect(filterExperienceCards([card], { metricId: 'hardness' })).toHaveLength(1);
      expect(filterExperienceCards([card], { metricId: 'sleep' })).toHaveLength(0);
    });
  });
});
