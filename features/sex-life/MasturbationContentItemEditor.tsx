import React, { Suspense, lazy } from 'react';
import { AlertTriangle, ChevronLeft, Plus, Search, Settings, User } from 'lucide-react';
import type { ContentItem, LogEntry, TagEntry, TagType } from '../../domain';
import { Modal } from '../../shared/ui';
import { XP_DIMENSIONS_LIST } from '../../shared/lib';
import { CONTENT_TYPES, PLATFORMS } from './model/masturbationModalData';

const TagManager = lazy(() => import('../tags').then((module) => ({ default: module.TagManager })));

interface MasturbationContentItemEditorProps {
  editingItem: ContentItem | null;
  setEditingItem: (item: ContentItem | null) => void;
  onClose: () => void;
  onSave: () => void;
  tagSearch: string;
  setTagSearch: (value: string) => void;
  activeTagTab: string;
  setActiveTagTab: (value: string) => void;
  displayTags: string[];
  toggleXpTag: (tag: string) => void;
  onQuickCreateTag: () => void;
  isTagManagerOpen: boolean;
  setIsTagManagerOpen: (value: boolean) => void;
  logs: LogEntry[];
  userTags: TagEntry[];
  onAddOrUpdateLog: (log: LogEntry) => Promise<void>;
  onAddOrUpdateTag: (tag: TagEntry) => Promise<void>;
  onDeleteTag: (name: string, category: TagType) => Promise<void>;
}

const MasturbationContentItemEditor: React.FC<MasturbationContentItemEditorProps> = ({
  editingItem,
  setEditingItem,
  onClose,
  onSave,
  tagSearch,
  setTagSearch,
  activeTagTab,
  setActiveTagTab,
  displayTags,
  toggleXpTag,
  onQuickCreateTag,
  isTagManagerOpen,
  setIsTagManagerOpen,
  logs,
  userTags,
  onAddOrUpdateLog,
  onAddOrUpdateTag,
  onDeleteTag
}) => {
  return (
    <Modal isOpen={!!editingItem} onClose={onClose} title="编辑素材详情">
      {editingItem && (
        <div className="flex flex-col h-[75vh] -mx-4 -mt-4 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="flex-none p-4 border-b border-slate-100 dark:border-slate-800">
            <button onClick={onClose} className="flex items-center gap-1 text-slate-400 hover:text-brand-accent text-sm font-bold mb-4">
              <ChevronLeft size={18} /> 返回
            </button>
            <div className="space-y-2">
              {!editingItem.type && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-xs font-black text-amber-700 dark:text-amber-400">未选择素材类型</div>
                      <div className="text-[10px] text-amber-600/70 dark:text-amber-400/50">分类统计失效</div>
                    </div>
                  </div>
                  <button className="text-[10px] font-black text-amber-700 border border-amber-200 px-2 py-1 rounded bg-white">去选择</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">素材类型 (必选)</label>
              <div className="grid grid-cols-4 gap-2">
                {CONTENT_TYPES.map(t => (
                  <button key={t} onClick={() => setEditingItem({ ...editingItem, type: t })} className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${editingItem.type === t ? 'bg-brand-accent text-white border-brand-accent shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {!['回忆', '幻想'].includes(editingItem.type || '') && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">来源平台</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setEditingItem({ ...editingItem, platform: p })} className={`py-2 rounded-xl text-[11px] font-bold transition-all border ${editingItem.platform === p ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-slate-800' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">标题 / 编号</label>
                <div className="relative group">
                  <div className="absolute left-3 top-3.5 text-slate-300 font-bold">#</div>
                  <input value={editingItem.title || ''} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="输入标题、编号或链接..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-8 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">主演 / 角色</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-3.5 text-slate-300" />
                  <input value={editingItem.actors?.join(' ') || ''} onChange={e => setEditingItem({ ...editingItem, actors: e.target.value.split(/\s+/) })} placeholder="多个演员用空格分隔..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-9 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all" />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">XP 标签 ({editingItem.xpTags?.length || 0})</label>
                <button onClick={() => setIsTagManagerOpen(true)} className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-brand-accent rounded-lg flex items-center gap-1 text-[10px] font-black"><Settings size={12} /> 管理</button>
              </div>

              <div className="mb-4">
                <div className="relative group">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-accent transition-colors" />
                  <input
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    placeholder="搜索或输入新标签..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                  />
                  {tagSearch.trim() && !displayTags.includes(tagSearch.trim()) && activeTagTab !== '常用' && (
                    <button
                      onClick={onQuickCreateTag}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-accent text-white rounded-xl shadow-sm animate-in fade-in zoom-in duration-200"
                      title="作为新标签创建"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 mb-4 border-b border-slate-100 dark:border-slate-800">
                {['常用', ...XP_DIMENSIONS_LIST].map(tab => (
                  <button key={tab} onClick={() => { setActiveTagTab(tab); setTagSearch(''); }} className={`pb-2 px-1 text-xs font-black transition-all relative whitespace-nowrap ${activeTagTab === tab ? 'text-brand-accent' : 'text-slate-400'}`}>
                    {tab}
                    {activeTagTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-full"></div>}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                {displayTags.length > 0 ? (
                  displayTags.map(tag => {
                    const isSel = editingItem.xpTags?.includes(tag);
                    return (
                      <button key={tag} onClick={() => toggleXpTag(tag)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isSel ? 'bg-blue-500 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                        {tag.replace(/^#/, '')}
                      </button>
                    );
                  })
                ) : (
                  <div className="w-full text-center py-6 text-slate-400 text-xs italic">
                    {tagSearch ? '未找到匹配标签' : '该维度暂无标签，请先创建'}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-none p-5 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onSave}
              className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[1.5rem] font-black text-sm shadow-xl active:scale-[0.98] transition-all"
            >
              保存素材信息
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <TagManager
          isOpen={isTagManagerOpen}
          onClose={() => setIsTagManagerOpen(false)}
          data={{ logs, userTags }}
          actions={{ onAddOrUpdateLog, onAddOrUpdateTag, onDeleteTag }}
        />
      </Suspense>
    </Modal>
  );
};

export default MasturbationContentItemEditor;
