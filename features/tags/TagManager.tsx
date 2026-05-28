import React, { useRef } from 'react';
import { Tag as TagIcon, Edit2, Trash2, X, Check, Activity, ShieldAlert, Stethoscope, Plus, Search, User, Zap, Sparkles, Shirt, Heart } from 'lucide-react';
import { Modal } from '../../shared/ui';
import TagHealthCheck from './TagHealthCheck';
import {
    useTagManagerController,
    type TagManagerActions,
    type TagManagerData,
    type TagManagerTab
} from './model/useTagManagerController';

interface XpDimension {
    id: string;
    icon: React.ElementType;
    color: string;
    bg: string;
}

const XP_DIMENSIONS: XpDimension[] = [
    { id: '角色', icon: User, color: 'text-accent-vivid', bg: 'bg-surface-muted' },
    { id: '身体', icon: Activity, color: 'text-state-success-text', bg: 'bg-state-success-bg' },
    { id: '装扮', icon: Shirt, color: 'text-chart-tertiary', bg: 'bg-surface-muted' },
    { id: '玩法', icon: Zap, color: 'text-state-warning-text', bg: 'bg-state-warning-bg' },
    { id: '剧情', icon: Heart, color: 'text-state-danger-text', bg: 'bg-state-danger-bg' },
    { id: '风格', icon: Sparkles, color: 'text-chart-quaternary', bg: 'bg-surface-muted' },
];

const SYSTEM_EVENTS = ['加班', '吵架', '出差', '聚会', '家庭烦心事', '生病'];
const SYSTEM_SYMPTOMS = ['头痛', '喉咙痛', '胃不适', '肌肉酸痛', '腹泻', '发烧', '鼻塞', '乏力', '咳嗽'];

interface TagManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTag?: (tag: string) => void;
    initialSearch?: string;
    defaultTab?: TagManagerTab;
    data: TagManagerData;
    actions: TagManagerActions;
}

const TagManager: React.FC<TagManagerProps> = ({
    isOpen,
    onClose,
    onSelectTag,
    initialSearch = '',
    defaultTab = 'xp',
    data,
    actions
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const {
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
        onCreate,
        onRename,
        onDelete,
        onStartEditingTag,
        onNavigateToTag
    } = useTagManagerController({
        isOpen,
        initialSearch,
        defaultTab,
        data,
        actions,
        onSelectTag,
        onClose
    });

    const renderTagItem = (tag: string, count: number) => (
        <div key={tag} className="flex items-center justify-between p-3 bg-surface-card border border-surface-border rounded-xl group hover:border-accent/50 transition-colors">
            {editingTag === tag ? (
                <div className="flex-1 flex items-center gap-2">
                    <input autoFocus className="flex-1 bg-surface-muted border border-accent rounded px-2 py-1 text-sm outline-none" value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onRename()}/>
                    <button onClick={onRename} className="p-1.5 bg-state-success-text text-text-on-accent rounded"><Check size={14}/></button>
                    <button onClick={() => setEditingTag(null)} className="p-1.5 bg-surface-muted text-text-muted rounded"><X size={14}/></button>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => onSelectTag?.(tag)}>
                        <span className={`font-bold text-sm ${count === 0 ? 'text-text-muted' : 'text-text-primary'}`}>{tag.replace(/^#/, '')}</span>
                        {count > 0 && <span className="text-[10px] bg-surface-muted px-1.5 py-0.5 rounded-full text-text-muted">{count}次</span>}
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => onStartEditingTag(tag)} aria-label="重命名标签" className="p-2 hover:bg-state-info-bg text-text-muted hover:text-state-info-text rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"><Edit2 size={14}/></button>
                        <button onClick={() => onDelete(tag)} aria-label="删除标签" className="p-2 hover:bg-state-danger-bg text-text-muted hover:text-state-danger-text rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"><Trash2 size={14}/></button>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={onSelectTag ? "选择或创建标签" : "标签管理"}>
            <div className="flex h-[min(75dvh,640px)] flex-col -mt-2">
                <div className="flex bg-surface-muted p-1 rounded-xl mb-3 border border-surface-border shrink-0">
                    <button onClick={() => setActiveTab('xp')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'xp' ? 'bg-surface-card shadow-sm text-accent' : 'text-text-muted'}`}><TagIcon size={14} /> 题材</button>
                    <button onClick={() => setActiveTab('event')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'event' ? 'bg-surface-card shadow-sm text-accent' : 'text-text-muted'}`}><Activity size={14} /> 事件</button>
                    <button onClick={() => setActiveTab('symptom')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'symptom' ? 'bg-surface-card shadow-sm text-accent' : 'text-text-muted'}`}><ShieldAlert size={14} /> 症状</button>
                    <button onClick={() => setActiveTab('health_check')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'health_check' ? 'bg-surface-card shadow-sm text-accent' : 'text-text-muted'}`}><Stethoscope size={14} /> 体检</button>
                </div>

                {activeTab !== 'health_check' && (
                    <div className="mb-3 shrink-0">
                        {isCreating ? (
                            <div className="bg-state-info-bg p-5 rounded-3xl border border-state-info-text/20 animate-in fade-in shadow-lg">
                                {activeTab === 'xp' && (
                                    <div className="mb-5">
                                        <label className="text-[11px] font-black text-state-info-text uppercase tracking-widest mb-3 block flex items-center gap-2">1. 选择归属维度</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {XP_DIMENSIONS.map(dim => {
                                                const DimIcon = dim.icon;
                                                return (
                                                    <button key={dim.id} onClick={() => setSelectedXpDim(dim.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${selectedXpDim === dim.id ? 'border-accent bg-surface-card shadow-sm' : 'border-transparent bg-surface-muted opacity-60'}`}>
                                                        <DimIcon size={12} className={dim.color}/>
                                                        <span className="text-[10px] font-black text-text-secondary">{dim.id}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="text-[11px] font-black text-state-info-text uppercase tracking-widest block mb-2">{activeTab === 'xp' ? '2. 输入标签名称' : '输入标签名称'}</label>
                                    <input autoFocus className="w-full bg-surface-card border-2 border-state-info-text/20 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-accent" value={createInput} onChange={e => setCreateInput(e.target.value)} placeholder="在此输入标签..." onKeyDown={e => e.key === 'Enter' && onCreate()}/>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-surface-muted text-text-muted font-black text-xs rounded-xl">取消</button>
                                    <button onClick={onCreate} disabled={!createInput.trim() || (activeTab === 'xp' && !selectedXpDim)} className="flex-[2] py-3 bg-accent disabled:opacity-50 text-text-on-accent rounded-xl font-black text-xs">确认创建</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                    <input className="w-full bg-surface-muted border border-surface-border rounded-2xl py-3 pl-11 pr-4 text-sm font-bold outline-none" placeholder="搜索标签..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                </div>
                                <button onClick={() => setIsCreating(true)} className="px-4 bg-surface-card border border-surface-border text-accent rounded-2xl shadow-sm"><Plus size={24}/></button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10" ref={scrollContainerRef}>
                    {activeTab === 'health_check' ? (
                        <TagHealthCheck logs={logs} onNavigateToTag={onNavigateToTag} />
                    ) : activeTab === 'xp' ? (
                        <div className="space-y-8 pb-10">
                            {XP_DIMENSIONS.map(dim => {
                                const DimIcon = dim.icon;
                                const allInDim = (userTags.filter(t => t.dimension === dim.id && t.category === 'xp').map(t => t.name) as string[])
                                    .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .sort((a,b) => (tagsUsageMap[b]||0) - (tagsUsageMap[a]||0));

                                if (allInDim.length === 0 && searchTerm) return null;
                                return (
                                    <div key={dim.id} className="space-y-3" id={`dim-section-${dim.id}`}>
                                        <div className="flex items-center justify-between sticky top-0 bg-surface-card/80 backdrop-blur-md z-10 py-2 border-b border-surface-border" id={`dim-header-${dim.id}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${dim.bg} ${dim.color}`}><DimIcon size={14}/></div>
                                                <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">{dim.id}</h4>
                                            </div>
                                            <span className="text-[10px] font-black text-text-muted bg-surface-muted px-2 py-0.5 rounded-full">{allInDim.length}</span>
                                        </div>
                                        <div className="grid gap-2">
                                            {allInDim.map(tag => renderTagItem(tag, tagsUsageMap[tag] || 0))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid gap-2 pb-10">
                            {((activeTab === 'event' ? [...SYSTEM_EVENTS, ...userTags.filter(t => t.category === 'event').map(t => t.name)] : [...SYSTEM_SYMPTOMS, ...userTags.filter(t => t.category === 'symptom').map(t => t.name)]) as string[])
                                .filter((val, index, self) => self.indexOf(val) === index)
                                .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(tag => renderTagItem(tag, tagsUsageMap[tag] || 0))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default TagManager;
