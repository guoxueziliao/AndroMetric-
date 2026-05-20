import { PHYSIOLOGICAL_DAY_CUTOFF_HOUR, SLEEP_RECORD_NEXT_DAY_HOUR } from '../../domain';

/**
 * 生理日规则的时间→日期映射。
 *
 * - 活动归属:凌晨 03:00 之前发生的活动归属前一日(详见 docs/architecture.md 域规则)。
 * - 睡眠归属:12:00 之后开始的睡眠记录归属次日(早 5 点睡和晚 23 点睡是同一晚)。
 */

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getActivityTargetDate = (now: Date = new Date()): string => {
  const target = new Date(now);
  if (target.getHours() < PHYSIOLOGICAL_DAY_CUTOFF_HOUR) {
    target.setDate(target.getDate() - 1);
  }
  return formatDate(target);
};

export const getSleepTargetDate = (now: Date = new Date()): string => {
  const target = new Date(now);
  if (target.getHours() >= SLEEP_RECORD_NEXT_DAY_HOUR) {
    target.setDate(target.getDate() + 1);
  }
  return formatDate(target);
};
