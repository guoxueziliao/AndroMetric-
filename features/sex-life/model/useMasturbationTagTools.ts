import { useCallback, useMemo } from 'react';
import type { LogEntry, TagEntry } from '../../../domain';
import { useToast } from '../../../contexts/ToastContext';
import { validateTag } from '../../../shared/lib';

interface UseMasturbationTagToolsParams {
  logs: LogEntry[];
  onAddOrUpdateTag: (tag: TagEntry) => Promise<void>;
}

export const useMasturbationTagTools = ({
  logs,
  onAddOrUpdateTag
}: UseMasturbationTagToolsParams) => {
  const { showToast } = useToast();

  const tagUsageMap = useMemo(() => {
    const counts: Record<string, number> = {};

    logs.forEach(log => {
      log.masturbation?.forEach(record => {
        record.contentItems?.forEach(item => {
          item.xpTags?.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
          });
        });
        record.assets?.categories?.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });
    });

    return counts;
  }, [logs]);

  const createXpTag = useCallback(async (tagName: string, dimension: string) => {
    const result = validateTag(tagName, 'xp');
    if (result.level === 'P0') {
      showToast(`禁止创建: ${result.message}`, 'error');
      return false;
    }

    await onAddOrUpdateTag({
      name: tagName,
      category: 'xp',
      dimension,
      createdAt: Date.now()
    });

    return true;
  }, [onAddOrUpdateTag, showToast]);

  return {
    tagUsageMap,
    createXpTag
  };
};
