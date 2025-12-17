import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { X, Check, Clock, Film, PenLine, Plus, Minus, BatteryCharging, Wind, Sparkles, Hash, Settings, Users, ChevronRight, ArrowLeft, Trash2, Tag, MonitorPlay, Search, AlertTriangle } from 'lucide-react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, ContentItem } from '../types';
import Modal from './Modal';
import { calculateInventory } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import { XP_GROUPS } from '../utils/constants';
import { validateContentItem, ContentNoticeDef } from '../utils/dataHealthCheck';
import { NoticeBadge, NoticeStack, NoticeItem } from './NoticeSystem';

const TagManager = lazy(() => import('./TagManager'));

interface MasturbationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: MasturbationRecordDetails) => void;
  initialData?: MasturbationRecordDetails;
  dateStr: string;
  logs?: LogEntry[];
  partners?: PartnerProfile[];
}

const CONTENT_TYPES = ['视频', '直播', '图片', '小说', '回忆', '幻想', '音频', '漫画'];
const PLATFORMS = ['Telegram', 'ONE', 'Pornhub', 'Twitter', 'Xvideos', 'OnlyFans', 'Jable', 'TikTok', '微信/QQ', '本地硬盘', '91', 'MissAV'];
const TOOL_OPTIONS = ['手', '润滑液', '飞机杯', '名器/倒模', '电动玩具', '前列腺按摩器', '枕头'];
const LUBRICANT_TYPES = ['水溶性', '油性', '硅基', '唾液', '乳液'];
const FORCE_LEVELS = [
    { lvl: 1, label: '滞留/干涩', desc: '几乎没出来，黏在根部' },
    { lvl: 2, label: '流出/易理', desc: '缓缓流出，一张纸轻松搞定' },
    { lvl: 3, label: '喷射/标准', desc: '有明显的喷射节奏' },
    { lvl: 4, label: '汹涌/湿透', desc: '量大浓厚，纸巾完全湿透' },
    { lvl: 5, label: '爆发/穿透', desc: '极强冲力，射穿或喷射极远' },
];
const FATIGUE_OPTIONS = ['精神焕发', '无明显疲劳', '轻微困倦', '身体沉重', '秒睡'];
const POST_MOOD_OPTIONS = ['满足/愉悦', '平静/贤者', '空虚/后悔', '焦虑/负罪', '恶心/厌恶'];

const MasturbationRecordModal: React.FC<MasturbationRecordModalProps> = ({ isOpen, onClose, onSave, initialData, dateStr, logs = [], partners = [] }) => {
    const { showToast } = useToast();
    
    // --- State ---
    const [data, setData] = useState<MasturbationRecordDetails>({
        id: '', startTime: '', duration: 15, status: 'completed', tools: ['手'], contentItems: [],
        materials: [], props: [], assets: { sources: [], platforms: [], categories: [], target: '', actors: [] }, materialsList: [],
        edging: 'none', edgingCount: 0, lubricant: '', useCondom: false, ejaculation: true, orgasmIntensity: 3,
        mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '',
        volumeForceLevel: 3, postMood: '平静/贤者', fatigue: '无明显疲劳'
    });

    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    const [expandedHintId, setExpandedHintId] = useState<string | null>(null);
    const [activeCategoryTab, setActiveCategoryTab] = useState<string>('常用');
    const [categorySearch, setCategorySearch] = useState('');
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

    const inventoryTime = useMemo(() => calculateInventory(logs), [logs]);

    const frequentTags = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            log.masturbation?.forEach(m => {
                m.contentItems?.forEach(c => c.xpTags.forEach(t => counts[t] = (counts[t] || 0) + 1));
                m.assets?.categories?.forEach(c => counts[c] = (counts[c] || 0) + 1);
            });
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 30).map(x => x[0]);
    }, [logs]);

    const activeTags = useMemo(() => {
        if (categorySearch) {
            const allTags = new Set<string>();
            Object.values(XP_GROUPS).forEach(list => list.forEach(t => allTags.add(t)));
            return Array.from(allTags).filter(t => t.toLowerCase().includes(categorySearch.toLowerCase()));
        }
        if (activeCategoryTab === '常用') return frequentTags.length > 0 ? frequentTags : XP_GROUPS['角色'];
        return XP_GROUPS[activeCategoryTab] || [];
    }, [activeCategoryTab, frequentTags, categorySearch]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setData({
                    ...initialData,
                    contentItems: initialData.contentItems || [],
                    volumeForceLevel: initialData.volumeForceLevel || (initialData.ejaculation ? 3 : undefined),
                    postMood: initialData.postMood || '平静/贤者',
                    fatigue: initialData.fatigue || '无明显疲劳',
                    stressLevel: initialData.stressLevel ?? 3,
                    energyLevel: initialData.energyLevel ?? 3,
                    edgingCount: initialData.edgingCount ?? 0
                });
            } else {
                setData({
                    id: Date.now().toString(),
                    startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    duration: 15, status: 'completed', tools: ['手'], contentItems: [],
                    materials: [], props: [], assets: { sources: [], platforms: [], categories: [], target: '', actors: [] }, materialsList: [],
                    edging: 'none', edgingCount: 0, lubricant: '', useCondom: false, ejaculation: true, orgasmIntensity: 3,
                    mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '',
                    volumeForceLevel: 3, postMood: '平静/贤者', fatigue: '无明显疲劳'
                });
            }
            setCategorySearch(''); setActiveCategoryTab('常用'); setEditingItem(null); setExpandedHintId(null);
        }
    }, [initialData, isOpen]);

    const updateData = (field: keyof MasturbationRecordDetails, value: any) => setData(prev => ({ ...prev, [field]: value }));
    const toggleTool = (tool: string) => {
        const current = data.tools || [];
        const next = current.includes(tool) ? current.filter(x => x !== tool) : [...current, tool];
        updateData('tools', next);
    };

    const handleSave = () => {
        const finalData = { ...data };
        if (finalData.edgingCount && finalData.edgingCount > 0) finalData.edging = finalData.edgingCount === 1 ? 'once' : 'multiple';
        else finalData.edging = 'none';
        
        const allTags = new Set<string>();
        const allActors = new Set<string>();
        const allSources = new Set<string>();
        const allPlatforms = new Set<string>();
        finalData.contentItems.forEach(item => {
            if (item.type) allSources.add(item.type);
            if (item.platform) allPlatforms.add(item.platform);
            item.xpTags.forEach(t => allTags.add(t));
            item.actors.forEach(a => allActors.add(a));
        });
        finalData.assets = { categories: Array.from(allTags), actors: Array.from(allActors), sources: Array.from(allSources), platforms: Array.from(allPlatforms), target: '' };
        onSave(finalData);
    };

    const incrementEdging = () => updateData('edgingCount', (data.edgingCount || 0) + 1);
    const decrementEdging = () => updateData('edgingCount', Math.max(0, (data.edgingCount || 0) - 1));

    const handleAddContent = () => setEditingItem({ id: Date.now().toString(), type: undefined, platform: undefined, actors: [], xpTags: [], title: '' });
    const handleEditContent = (item: ContentItem) => setEditingItem({ ...item });
    const handleDeleteContent = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('确定删除此素材记录？')) {
            const newList = data.contentItems.filter(m => m.id !== id);
            updateData('contentItems', newList);
        }
    };

    const handleSaveContentItem = () => {
        if (!editingItem) return;
        if (!editingItem.type) { showToast('未选择内容形式', 'error'); return; }
        
        const newList = [...data.contentItems];
        const idx = newList.findIndex(m => m.id === editingItem.id);
        if (idx >= 0) newList[idx] = editingItem;
        else newList.push(editingItem);
        
        updateData('contentItems', newList);
        setEditingItem(null);
    };

    const updateItemField = (field: keyof ContentItem, value: any) => { if (editingItem) setEditingItem({ ...editingItem, [field]: value }); };
    const toggleItemTag = (tag: string) => {
        if (!editingItem) return;
        const current = editingItem.xpTags || [];
        const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
        setEditingItem({ ...editingItem, xpTags: next });
    };
    const handleSelectTagFromManager = (tag: string) => {
        if (editingItem && !editingItem.xpTags.includes(tag)) setEditingItem({ ...editingItem, xpTags: [...editingItem.xpTags, tag] });
        setIsTagManagerOpen(false);
    };

    const mapDefToNotice = (def: ContentNoticeDef, index: number, onAction?: () => void): NoticeItem => ({
        id: `notice_${index}_${def.ruleId}`,
        level: def.level,
        title: def.title,
        detail: def.detail,
        ruleId: def.ruleId,
        action: def.actionLabel ? {
            label: def.actionLabel,
            intent: def.level === 'error' ? 'primary' : 'ghost',
            onAction: (e) => { 
                e.stopPropagation(); 
                if (onAction) onAction();
            }
        } : undefined
    });

    if (!isOpen) return null;

    if (editingItem) {
        const itemNotices = validateContentItem(editingItem).map((def, i) => mapDefToNotice(def, i));

        return (
            <Modal isOpen={true} onClose={() => setEditingItem(null)} title="编辑素材详情">
                <div className="space-y-6 pb-20">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <button onClick={() => setEditingItem(null)} className="flex items-center hover:text-brand-accent">
                            <ArrowLeft size={16} className="mr-1"/> 返回
                        </button>
                    </div>

                    <NoticeStack items={itemNotices} defaultExpanded={true} />

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">素材类型 (必选)</label>
                            <div className="flex flex-wrap gap-2">
                                {CONTENT_TYPES.map(type => (
                                    <button key={type} onClick={() => updateItemField('type', type)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${editingItem.type === type ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>{type}</button>
                                ))}
                            </div>
                        </div>
                        {(['视频', '直播', '图片', '漫画', '音频', '小说'].includes(editingItem.type || '')) && (
                            <div className="animate-in fade-in slide-in-from-top-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">平台 / 来源</label>
                                <div className="flex flex-wrap gap-2">
                                    {PLATFORMS.map(pf => (
                                        <button key={pf} onClick={() => updateItemField('platform', editingItem.platform === pf ? undefined : pf)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${editingItem.platform === pf ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>{pf}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">标题 / 番号</label>
                            <div className="relative"><span className="absolute left-3 top-3 text-slate-400"><Hash size={16}/></span><input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-brand-accent outline-none font-medium placeholder-slate-400" placeholder="输入标题、番号或链接..." value={editingItem.title || ''} onChange={e => updateItemField('title', e.target.value)}/></div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">主演 / 角色</label>
                            <div className="relative"><span className="absolute left-3 top-3 text-slate-400"><Users size={16}/></span><input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-brand-accent outline-none font-medium placeholder-slate-400" placeholder="多个演员用空格分隔..." value={(editingItem.actors || []).join(' ')} onChange={e => updateItemField('actors', e.target.value.split(/[,，\s]+/).filter(Boolean))}/></div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">XP 标签 ({editingItem.xpTags?.length || 0})</label>
                            <button onClick={() => setIsTagManagerOpen(true)} className="text-[10px] text-brand-accent font-bold flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-100 transition-colors"><Settings size={12} className="mr-1"/> 管理</button>
                        </div>
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                            {['常用', '角色', '身体', '装扮', '玩法', '剧情', '风格'].map(tab => (
                                <button key={tab} onClick={() => { setActiveCategoryTab(tab); setCategorySearch(''); }} className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeCategoryTab === tab ? 'bg-white dark:bg-slate-900 text-brand-accent border-b-2 border-brand-accent' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{tab}</button>
                            ))}
                        </div>
                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-2 text-slate-400" size={12}/>
                            <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-7 pr-2 text-xs focus:border-brand-accent outline-none" placeholder="搜索标签..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)}/>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar content-start p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            {activeTags.map(cat => (
                                <button key={cat} onClick={() => toggleItemTag(cat)} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${editingItem.xpTags?.includes(cat) ? 'bg-brand-accent text-white border-brand-accent shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-accent/50'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-end z-20">
                    <button onClick={handleSaveContentItem} className="w-full py-3 bg-brand-accent text-white font-bold rounded-xl shadow-lg shadow-blue-500/30">确认保存素材</button>
                </div>
                <Suspense fallback={null}><TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} onSelectTag={handleSelectTagFromManager} initialSearch={categorySearch}/></Suspense>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "编辑自慰记录" : "记录施法"} footer={<button onClick={handleSave} className="w-full py-3 bg-brand-accent text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center"><Check size={20} className="mr-2"/> 保存记录</button>}>
            <div className="space-y-6 pb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2"><BatteryCharging size={20} className="text-yellow-300 animate-pulse"/><span className="text-xs font-bold uppercase tracking-wider opacity-90">当前蓄力 (INVENTORY)</span></div>
                    <span className="font-black text-lg tracking-tight">{inventoryTime}</span>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">开始时间</label>
                        <div className="flex items-center justify-between">
                            <input type="time" value={data.startTime} onChange={e => updateData('startTime', e.target.value)} className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-200 outline-none w-full"/>
                        </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">持续时长 (分)</label>
                        <div className="flex items-center justify-between w-full gap-2">
                            <button type="button" onClick={() => updateData('duration', Math.max(1, (data.duration||0)-1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-brand-accent transition-colors"><Minus size={16}/></button>
                            <input type="number" value={data.duration} onChange={e => updateData('duration', parseInt(e.target.value) || 0)} className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-200 outline-none w-full text-center"/>
                            <button type="button" onClick={() => updateData('duration', (data.duration||0)+1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-brand-accent transition-colors"><Plus size={16}/></button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between"><span className="flex items-center"><Film size={14} className="mr-1.5"/> 施法素材</span><span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 rounded-full text-slate-500">{data.contentItems.length}</span></h3>
                    {data.contentItems.length > 0 ? (
                        <div className="space-y-2">
                            {data.contentItems.map((item) => {
                                const noticeDefs = validateContentItem(item);
                                const notices = noticeDefs.map((def, idx) => mapDefToNotice(def, idx, () => handleEditContent(item)));
                                const hasIssues = notices.length > 0;
                                const maxSeverity = notices.some(i => i.level === 'error') ? 'error' : notices.some(i => i.level === 'warn') ? 'warn' : 'info';
                                
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleEditContent(item)} 
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2 cursor-pointer hover:border-brand-accent transition-all group relative active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${!item.type ? 'bg-slate-200 text-slate-500' : (item.type === '幻想' || item.type === '回忆' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}`}>{item.type || '未选择'}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${!item.platform ? 'text-slate-400 bg-slate-100' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>{item.platform || '无来源'}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 shrink-0">
                                                <button 
                                                    onClick={(e) => handleDeleteContent(item.id, e)}
                                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="删除素材"
                                                >
                                                    <Trash2 size={12}/>
                                                </button>

                                                {hasIssues ? (
                                                    <NoticeBadge 
                                                        level={maxSeverity} 
                                                        count={notices.length} 
                                                        expanded={expandedHintId === item.id}
                                                        onToggle={(e) => setExpandedHintId(expandedHintId === item.id ? null : item.id)}
                                                    />
                                                ) : (
                                                    <ChevronRight size={16} className="text-slate-300"/>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="font-bold text-sm text-brand-text dark:text-slate-200 truncate pr-2">
                                            {item.title || <span className="text-slate-400 italic">未填写标题</span>}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.actors.slice(0, 3).map(a => <span key={a} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded flex items-center"><Users size={8} className="mr-1"/> {a}</span>)}
                                            {item.xpTags.slice(0, 5).map(t => <span key={t} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded flex items-center border border-slate-200 dark:border-slate-700"><Tag size={8} className="mr-1"/> {t}</span>)}
                                            {(item.actors.length === 0 && item.xpTags.length === 0) && <span className="text-[10px] text-slate-300 italic">未添加标签/演员</span>}
                                        </div>

                                        {expandedHintId === item.id && (
                                            <div onClick={(e) => e.stopPropagation()} className="pt-2 mt-1 border-t border-slate-50 dark:border-slate-800">
                                                <NoticeStack items={notices} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                            <MonitorPlay size={32} className="mx-auto text-slate-300 mb-2"/><p className="text-xs text-slate-400 mb-2">暂无素材详情</p><p className="text-[10px] text-slate-300">添加具体的视频、演员或标签</p>
                        </div>
                    )}
                    <button onClick={handleAddContent} className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-900 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-xs font-bold flex items-center justify-center gap-1"><Plus size={14}/> 添加素材</button>
                </div>

                <div className="space-y-4">
                    <div><h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">辅助工具 (Tools)</h4><div className="flex flex-wrap gap-2">{TOOL_OPTIONS.map(tool => <button key={tool} onClick={() => toggleTool(tool)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${data.tools?.includes(tool) ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}>{tool}</button>)}</div></div>
                    <div className="flex gap-2"><div className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-700"><div className="w-4 h-4 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-500 font-bold text-[10px]">L</div><select className="bg-transparent w-full text-xs font-bold outline-none text-slate-600 dark:text-slate-300" value={data.lubricant || ''} onChange={e => updateData('lubricant', e.target.value)}><option value="">无润滑</option>{LUBRICANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><button onClick={() => updateData('useCondom', !data.useCondom)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${data.useCondom ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-transparent'}`}><span className="w-3 h-3 rounded-full border border-current"></span> 戴套</button></div>
                    
                    {/* Edging Section */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <BatteryCharging size={16} className="text-purple-500"/>
                            <div>
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">边缘控制 (Edging)</div>
                                <div className="text-[10px] text-slate-400">延时与耐力训练</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={decrementEdging} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 text-slate-500 hover:text-brand-accent shadow-sm"><Minus size={16}/></button>
                            <span className="font-mono font-black text-lg text-brand-text dark:text-slate-200">{data.edgingCount}</span>
                            <button onClick={incrementEdging} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 text-slate-500 hover:text-brand-accent shadow-sm"><Plus size={16}/></button>
                        </div>
                    </div>

                    {/* Completion Info */}
                    {data.ejaculation && (
                        <div className="space-y-3 animate-in fade-in">
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">射精强度 (Volume & Force)</label>
                                <div className="flex justify-between gap-1">
                                    {FORCE_LEVELS.map(l => (
                                        <button 
                                            key={l.lvl} 
                                            onClick={() => updateData('volumeForceLevel', l.lvl)} 
                                            className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${data.volumeForceLevel === l.lvl ? 'bg-white dark:bg-slate-700 shadow-md ring-1 ring-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                                            title={l.desc}
                                        >
                                            <span className={`text-sm font-black ${data.volumeForceLevel === l.lvl ? 'text-blue-500' : 'text-slate-300'}`}>{l.lvl}</span>
                                            <span className="text-[9px] text-slate-500 font-bold scale-90">{l.label.split('/')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center mt-2 text-[10px] text-blue-400 font-medium">
                                    {FORCE_LEVELS.find(l => l.lvl === data.volumeForceLevel)?.desc}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Post Clarity */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">贤者时间 (Post Clarity)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="text-[10px] text-slate-400 mb-1 flex items-center"><Wind size={10} className="mr-1"/> 心理状态</div>
                                <select className="w-full bg-transparent text-xs font-bold outline-none text-slate-600 dark:text-slate-300" value={data.postMood} onChange={e => updateData('postMood', e.target.value)}>
                                    {POST_MOOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="text-[10px] text-slate-400 mb-1 flex items-center"><Sparkles size={10} className="mr-1"/> 身体疲劳</div>
                                <select className="w-full bg-transparent text-xs font-bold outline-none text-slate-600 dark:text-slate-300" value={data.fatigue} onChange={e => updateData('fatigue', e.target.value)}>
                                    {FATIGUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <PenLine size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none focus:border-brand-accent text-brand-text dark:text-slate-200" placeholder="备注..." value={data.notes || ''} onChange={e => updateData('notes', e.target.value)}/>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default MasturbationRecordModal;