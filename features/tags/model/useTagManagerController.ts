import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LogEntry, TagEntry, TagType } from '../../../domain';
import { useToast } from '../../../contexts/ToastContext';
import { validateTag } from '../../../shared/lib';

export type TagManagerTab = TagType | 'health_check';

export interface TagManagerData {
  logs: LogEntry[];
  userTags: TagEntry[];
}

export interface TagManagerActions {
  onAddOrUpdateLog: (log: LogEntry) => Promise<void>;
  onAddOrUpdateTag: (tag: TagEntry) => Promise<void>;
  onDeleteTag: (name: string, category: TagType) => Promise<void>;
}

interface UseTagManagerControllerParams {
  isOpen: boolean;
  initialSearch: string;
  defaultTab: TagManagerTab;
  data: TagManagerData;
  actions: TagManagerActions;
  onSelectTag?: (tag: string) => void;
  onClose: () => void;
}

export const useTagManagerController = ({
  isOpen,
  initialSearch,
  defaultTab,
  data,
  actions,
  onSelectTag,
  onClose
}: UseTagManagerControllerParams) => {
  const { logs, userTags } = data;
  const {
    onAddOrUpdateLog,
    onAddOrUpdateTag,
    onDeleteTag
  } = actions;
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TagManagerTab>(defaultTab);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createInput, setCreateInput] = useState('');
  const [selectedXpDim, setSelectedXpDim] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(initialSearch);
      setIsCreating(false);
      setCreateInput('');
      setSelectedXpDim(null);
      setEditingTag(null);
    }
  }, [isOpen, initialSearch]);

  const tagsUsageMap = useMemo(() => {
    const usage: Record<string, number> = {};

    logs.forEach(log => {
      log.masturbation?.forEach(m => {
        const tags = (m.contentItems?.flatMap(ci => ci.xpTags || []) || []) as string[];
        tags.forEach(c => { if (c) usage[c] = (usage[c] || 0) + 1; });
        const legacyTags = (m.assets?.categories || []) as string[];
        legacyTags.forEach(c => { if (c) usage[c] = (usage[c] || 0) + 1; });
      });
      (log.dailyEvents || []).forEach(e => { if (e) usage[e] = (usage[e] || 0) + 1; });
      (log.health?.symptoms || []).forEach(s => { if (s) usage[s] = (usage[s] || 0) + 1; });
    });

    return usage;
  }, [logs]);

  const resetCreateState = useCallback(() => {
    setIsCreating(false);
    setCreateInput('');
    setSelectedXpDim(null);
  }, []);

  const handleCreate = useCallback(async () => {
    const tagStr = createInput.trim();
    if (!tagStr) return;

    const currentType = activeTab === 'health_check' ? 'xp' : activeTab;
    if (activeTab === 'xp' && !selectedXpDim) {
      showToast('请先选择一个维度类别', 'error');
      return;
    }

    const exists = userTags.find(t => t.name.toLowerCase() === tagStr.toLowerCase() && t.category === currentType);
    if (exists) {
      if (onSelectTag) {
        onSelectTag(exists.name);
        onClose();
      } else {
        showToast(`标签 "${exists.name}" 已存在`, 'info');
        resetCreateState();
      }
      return;
    }

    const result = validateTag(tagStr, currentType);
    if (result.level === 'P0') {
      showToast(`禁止创建: ${result.message}`, 'error');
      return;
    }

    await onAddOrUpdateTag({
      name: tagStr,
      category: currentType,
      dimension: activeTab === 'xp' ? selectedXpDim! : undefined,
      createdAt: Date.now()
    });

    if (onSelectTag) {
      onSelectTag(tagStr);
      onClose();
    } else {
      showToast(`已添加标签 "${tagStr}"`, 'success');
      setSearchTerm(tagStr);
      resetCreateState();
    }
  }, [
    activeTab,
    createInput,
    onAddOrUpdateTag,
    onClose,
    onSelectTag,
    resetCreateState,
    selectedXpDim,
    showToast,
    userTags
  ]);

  const handleRename = useCallback(async () => {
    if (!editingTag || !newTagName.trim() || newTagName === editingTag) {
      setEditingTag(null);
      return;
    }

    const currentType = activeTab === 'health_check' ? 'xp' : activeTab;
    const oldName = editingTag;
    const newName = newTagName.trim();
    const oldTag = userTags.find(t => t.name === oldName && t.category === currentType);

    if (oldTag) {
      await onDeleteTag(oldName, currentType);
      await onAddOrUpdateTag({ ...oldTag, name: newName });
    }

    for (const log of logs) {
      let modified = false;
      const newLog = { ...log };

      if (activeTab === 'xp' && newLog.masturbation) {
        newLog.masturbation = newLog.masturbation.map(m => {
          let mMod = false;
          if (m.contentItems) {
            m.contentItems = m.contentItems.map(ci => {
              if (ci.xpTags?.includes(oldName)) {
                ci.xpTags = Array.from(new Set(ci.xpTags.map(t => t === oldName ? newName : t)));
                mMod = true;
              }
              return ci;
            });
          }
          if (m.assets?.categories?.includes(oldName)) {
            m.assets.categories = Array.from(new Set(m.assets.categories.map(c => c === oldName ? newName : c)));
            mMod = true;
          }
          if (mMod) modified = true;
          return m;
        });
      }

      if (modified) await onAddOrUpdateLog(newLog);
    }

    showToast('标签已重命名', 'success');
    setEditingTag(null);
  }, [
    activeTab,
    editingTag,
    logs,
    newTagName,
    onAddOrUpdateLog,
    onAddOrUpdateTag,
    onDeleteTag,
    showToast,
    userTags
  ]);

  const handleDelete = useCallback(async (tag: string) => {
    if (!confirm(`确定删除 "${tag}" 吗？`)) return;

    const currentType = activeTab === 'health_check' ? 'xp' : activeTab;
    await onDeleteTag(tag, currentType);

    for (const log of logs) {
      let modified = false;
      const newLog = { ...log };

      if (activeTab === 'xp' && newLog.masturbation) {
        newLog.masturbation = newLog.masturbation.map(m => {
          let mMod = false;
          if (m.contentItems) {
            m.contentItems = m.contentItems.map(ci => {
              if (ci.xpTags?.includes(tag)) {
                ci.xpTags = ci.xpTags.filter(t => t !== tag);
                mMod = true;
              }
              return ci;
            });
          }
          if (m.assets?.categories?.includes(tag)) {
            m.assets.categories = m.assets.categories.filter(c => c !== tag);
            mMod = true;
          }
          if (mMod) modified = true;
          return m;
        });
      }

      if (modified) await onAddOrUpdateLog(newLog);
    }

    showToast('标签已移除', 'success');
  }, [activeTab, logs, onAddOrUpdateLog, onDeleteTag, showToast]);

  const startEditingTag = useCallback((tag: string) => {
    setEditingTag(tag);
    setNewTagName(tag);
  }, []);

  const handleNavigateToTag = useCallback((tag: string, type: TagType) => {
    setActiveTab(type);
    setSearchTerm(tag);
  }, []);

  return {
    logs,
    userTags,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    editingTag,
    setEditingTag,
    newTagName,
    setNewTagName,
    isCreating,
    setIsCreating,
    createInput,
    setCreateInput,
    selectedXpDim,
    setSelectedXpDim,
    tagsUsageMap,
    onCreate: handleCreate,
    onRename: handleRename,
    onDelete: handleDelete,
    onStartEditingTag: startEditingTag,
    onNavigateToTag: handleNavigateToTag
  };
};
