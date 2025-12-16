
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { X, Check, Clock, Smile, PenLine, Tag, Smartphone, User, Target, Layers, Plus, Zap, Minus, FilePlus, Bookmark, ShieldCheck, Trash2, ArrowLeft, ArrowRight, MapPin, AlertTriangle, Search, Battery, Droplets, BatteryCharging, Wind, Film, Edit2, Globe, Activity, Thermometer, BrainCircuit, ChevronDown, UserCheck, Shirt, Gamepad2, BookOpen, MonitorPlay, Sparkles, Hash, Settings, Users } from 'lucide-react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, Mood, MasturbationMaterial } from '../types';
import Modal from './Modal';
import { calculateInventory } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import { XP_GROUPS } from '../utils/constants';

// Lazy load to avoid circular dependency issues in some builds
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

// --- CONSTANTS ---

const SOURCES = ['视频', '直播', '图片', '文爱', '回忆', '幻想', '音声', '漫画'];
const PLATFORMS = ['Telegram', 'ONE', 'Pornhub', 'Twitter', 'Xvideos', 'OnlyFans', 'Jable', 'TikTok', '微信/QQ', '本地硬盘', '91', 'MissAV'];

const TOOL_OPTIONS = ['手', '润滑液', '飞机杯', '名器/倒模', '电动玩具', '前列腺按摩器', '枕头'];
const SCENE_OPTIONS = ['书桌/电脑前', '卧室/床上', '浴室/洗澡', '厕所/马桶', '客厅/沙发', '阳台', '车里', '公司/学校', '野外', '站立'];
const INTERRUPTION_OPTIONS = ['🚪 有人敲门', '📞 电话/微信', '🐱 猫/狗捣乱', '🚴‍♂️ 外卖/快递', '👁️ 突然被看到', '🔊 噪音干扰'];

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
        id: '',
        startTime: '',
        duration: 15,
        status: 'completed',
        tools: ['手'],
        materials: [],
        props: [],
        assets: { sources: [], platforms: [], categories: [], target: '', actors: [] },
        materialsList: [],
        edging: 'none',
        edgingCount: 0,
        lubricant: '',
        useCondom: false,
        ejaculation: true,
        orgasmIntensity: 3,
        mood: 'neutral',
        stressLevel: 3,
        energyLevel: 3,
        interrupted: false,
        interruptionReasons: [],
        notes: '',
        volumeForceLevel: 3,
        postMood: '平静/贤者',
        fatigue: '无明显疲劳'
    });

    const [activeCategoryTab, setActiveCategoryTab] = useState<string>('常用');
    const [categorySearch, setCategorySearch] = useState('');
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

    const inventoryTime = useMemo(() => calculateInventory(logs), [logs]);

    // Compute Frequent Tags from logs
    const frequentTags = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            log.masturbation?.forEach(m => {
                m.assets?.categories?.forEach(c => {
                    counts[c] = (counts[c] || 0) + 1;
                });
            });
        });
        // Sort descending
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(x => x[0]);
    }, [logs]);

    const activeTags = useMemo(() => {
        if (categorySearch) {
            // Search across all groups
            const allTags = new Set<string>();
            Object.values(XP_GROUPS).forEach(list => list.forEach(t => allTags.add(t)));
            return Array.from(allTags).filter(t => t.toLowerCase().includes(categorySearch.toLowerCase()));
        }
        if (activeCategoryTab === '常用') {
            return frequentTags.length > 0 ? frequentTags : XP_GROUPS['角色']; // Fallback if no history
        }
        return XP_GROUPS[activeCategoryTab] || [];
    }, [activeCategoryTab, frequentTags, categorySearch]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Ensure Assets object structure is fully populated even if legacy data is missing it
                const baseAssets = (initialData.assets || {}) as any;
                setData({
                    ...initialData,
                    assets: { 
                        sources: baseAssets.sources || [], 
                        platforms: baseAssets.platforms || [], 
                        categories: baseAssets.categories || [], 
                        target: baseAssets.target || '', 
                        actors: baseAssets.actors || [] 
                    },
                    // Ensure materials array exists
                    materials: initialData.materials || [],
                    materialsList: initialData.materialsList || [],
                    // V2 defaults
                    volumeForceLevel: initialData.volumeForceLevel || (initialData.ejaculation ? 3 : undefined),
                    postMood: initialData.postMood || '平静/贤者',
                    fatigue: initialData.fatigue || '无明显疲劳',
                    // Restore state sliders defaults if missing
                    stressLevel: initialData.stressLevel ?? 3,
                    energyLevel: initialData.energyLevel ?? 3,
                    edgingCount: initialData.edgingCount ?? 0
                });
            } else {
                setData({
                    id: Date.now().toString(),
                    startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    duration: 15,
                    status: 'completed',
                    tools: ['手'],
                    materials: [],
                    props: [],
                    assets: { sources: [], platforms: [], categories: [], target: '', actors: [] },
                    materialsList: [],
                    edging: 'none',
                    edgingCount: 0,
                    lubricant: '',
                    useCondom: false,
                    ejaculation: true,
                    orgasmIntensity: 3,
                    mood: 'neutral',
                    stressLevel: 3,
                    energyLevel: 3,
                    interrupted: false,
                    interruptionReasons: [],
                    notes: '',
                    volumeForceLevel: 3,
                    postMood: '平静/贤者',
                    fatigue: '无明显疲劳'
                });
            }
            setCategorySearch('');
            setActiveCategoryTab('常用');
        }
    }, [initialData, isOpen]);

    // --- Handlers ---

    const updateData = (field: keyof MasturbationRecordDetails, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const updateAssets = (field: keyof typeof data.assets, value: any) => {
        setData(prev => ({
            ...prev,
            assets: { ...(prev.assets || {}), [field]: value } as any
        }));
    };

    const toggleAssetItem = (field: 'sources' | 'platforms' | 'categories', item: string) => {
        const current = data.assets?.[field] || [];
        const next = current.includes(item) ? current.filter(x => x !== item) : [...current, item];
        updateAssets(field, next);
    };

    const handleSelectTagFromManager = (tag: string) => {
        toggleAssetItem('categories', tag);
        setIsTagManagerOpen(false);
    };

    const toggleTool = (tool: string) => {
        const current = data.tools || [];
        const next = current.includes(tool) ? current.filter(x => x !== tool) : [...current, tool];
        updateData('tools', next);
    };

    const handleSave = () => {
        // Sync edging status based on count
        const finalData = { ...data };
        if (finalData.edgingCount && finalData.edgingCount > 0) {
            finalData.edging = finalData.edgingCount === 1 ? 'once' : 'multiple';
        } else {
            finalData.edging = 'none';
        }
        onSave(finalData);
    };

    const incrementEdging = () => updateData('edgingCount', (data.edgingCount || 0) + 1);
    const decrementEdging = () => updateData('edgingCount', Math.max(0, (data.edgingCount || 0) - 1));

    // Helper for Material Code
    const handleMaterialChange = (val: string) => {
        // We use the first element of materials array for the code/title
        const newMaterials = [...(data.materials || [])];
        newMaterials[0] = val;
        // Filter out empty strings if needed, but for index 0 we might want to keep it empty if cleared
        updateData('materials', newMaterials);
    };

    // Helper for Actors (split string to array)
    const handleActorsChange = (val: string) => {
        // Just keep the value as is in UI state if we were using a string, 
        // but here we map directly to array. We can allow space separated input.
        // For better UX, we'll store as array but input is text.
        // We actually need to split when saving or interpret properly. 
        // For simplicity, we treat the input as "space separated" visual representation of the array.
        // BUT, a simple approach is: user types string, we split on blur or change.
        // Let's split on space or comma.
        const actors = val.split(/[,，\s]+/).filter(s => s.trim() !== '');
        updateAssets('actors', actors);
    };

    // Safe string representation for actors input
    const actorsInputValue = (data.assets?.actors || []).join(' ');

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={initialData ? "编辑自慰记录" : "记录施法"}
            footer={
                <button onClick={handleSave} className="w-full py-3 bg-brand-accent text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
                    <Check size={20} className="mr-2"/> 保存记录
                </button>
            }
        >
            <div className="space-y-6 pb-4">
                
                {/* 0. Inventory */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                        <BatteryCharging size={20} className="text-yellow-300 animate-pulse"/>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90">当前蓄力 (INVENTORY)</span>
                    </div>
                    <span className="font-black text-lg tracking-tight">{inventoryTime}</span>
                </div>

                {/* 1. Time & Duration */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">开始时间</label>
                        <div className="flex items-center justify-between">
                            <input 
                                type="time" 
                                value={data.startTime} 
                                onChange={e => updateData('startTime', e.target.value)}
                                className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-200 outline-none w-full"
                            />
                            <Clock size={18} className="text-slate-300"/>
                        </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">持续时长 (分)</label>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center w-full">
                                <button type="button" onClick={() => updateData('duration', Math.max(1, (data.duration||0)-5))} className="p-1 rounded-full hover:bg-slate-100 text-slate-400"><Minus size={14}/></button>
                                <input 
                                    type="number" 
                                    value={data.duration} 
                                    onChange={e => updateData('duration', parseInt(e.target.value) || 0)}
                                    className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-200 outline-none w-full text-center"
                                />
                                <button type="button" onClick={() => updateData('duration', (data.duration||0)+5)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400"><Plus size={14}/></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Content (Material & XP) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center"><Film size={14} className="mr-1.5"/> 施法素材 (Content)</h3>
                    
                    {/* Basic Tags */}
                    <div className="space-y-3">
                        {/* Source */}
                        <div className="flex flex-wrap gap-2">
                            {SOURCES.map(src => (
                                <button 
                                    key={src} 
                                    onClick={() => toggleAssetItem('sources', src)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${data.assets?.sources?.includes(src) ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                >
                                    {src}
                                </button>
                            ))}
                        </div>
                        {/* Platform */}
                        {(data.assets?.sources?.includes('视频') || data.assets?.sources?.includes('直播')) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                {PLATFORMS.map(pf => (
                                    <button 
                                        key={pf} 
                                        onClick={() => toggleAssetItem('platforms', pf)}
                                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${data.assets?.platforms?.includes(pf) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                    >
                                        {pf}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* XP Categories (Improved) */}
                    <div className="pt-2">
                        <label className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
                            <span>类型 / 性癖</span>
                            <span className="text-[10px] font-normal">{data.assets?.categories?.length || 0} selected</span>
                        </label>
                        
                        {/* XP Tabs */}
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                            {['常用', '角色', '身体', '装扮', '玩法', '剧情', '风格'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveCategoryTab(tab); setCategorySearch(''); }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
                                        activeCategoryTab === tab 
                                        ? 'bg-white dark:bg-slate-900 text-brand-accent border-b-2 border-brand-accent' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-2 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2 text-slate-400" size={12}/>
                                <input 
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-7 pr-2 text-xs focus:border-brand-accent outline-none"
                                    placeholder="搜索标签..."
                                    value={categorySearch}
                                    onChange={e => setCategorySearch(e.target.value)}
                                />
                            </div>
                            <button onClick={() => setIsTagManagerOpen(true)} className="px-3 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" title="管理或创建标签">
                                <Settings size={14}/>
                            </button>
                        </div>

                        {/* Tags Grid */}
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar content-start p-1">
                            {activeTags.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => toggleAssetItem('categories', cat)}
                                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${
                                        data.assets?.categories?.includes(cat) 
                                        ? 'bg-brand-accent text-white border-brand-accent shadow-sm' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-accent/50'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                            {activeTags.length === 0 && (
                                <div className="w-full text-center py-4">
                                    <p className="text-xs text-slate-400 mb-2">无匹配标签</p>
                                    <button 
                                        onClick={() => setIsTagManagerOpen(true)}
                                        className="text-brand-accent text-xs font-bold hover:underline"
                                    >
                                        前往标签管理创建 "{categorySearch}"
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details (Code & Actors) - New v0.0.6a */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><Users size={12}/> 主演 / 演员</label>
                            <input 
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:border-brand-accent outline-none"
                                placeholder="多位用空格分隔..."
                                value={actorsInputValue}
                                onChange={e => handleActorsChange(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><Hash size={12}/> 番号 / 标识</label>
                            <input 
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:border-brand-accent outline-none font-mono"
                                placeholder="e.g. SSIS-123"
                                value={data.materials?.[0] || ''}
                                onChange={e => handleMaterialChange(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Target/Partner */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-xs font-bold text-slate-400 mb-2 block">施法对象 (Target)</label>
                        {/* Partner Quick Select */}
                        {partners.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                                {partners.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => updateAssets('target', p.name)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${data.assets?.target === p.name ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full ${p.avatarColor || 'bg-slate-400'}`}></div>
                                        <span className="text-[10px] font-bold">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <input 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:border-brand-accent outline-none"
                            placeholder="对象名称 (网黄 / 角色 / 伴侣)..."
                            value={data.assets?.target || ''}
                            onChange={e => updateAssets('target', e.target.value)}
                        />
                    </div>
                </div>

                {/* 3. Action & Tools */}
                <div className="space-y-4">
                    {/* Tools */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">辅助工具 (Tools)</h4>
                        <div className="flex flex-wrap gap-2">
                            {TOOL_OPTIONS.map(tool => (
                                <button
                                    key={tool}
                                    onClick={() => toggleTool(tool)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${data.tools?.includes(tool) ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}
                                >
                                    {tool}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lubricant & Condom */}
                    <div className="flex gap-2">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-700">
                            <Droplets size={16} className="text-blue-400 ml-1"/>
                            <select 
                                className="bg-transparent w-full text-xs font-bold outline-none text-slate-600 dark:text-slate-300"
                                value={data.lubricant || ''}
                                onChange={e => updateData('lubricant', e.target.value)}
                            >
                                <option value="">无润滑</option>
                                {LUBRICANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={() => updateData('useCondom', !data.useCondom)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${data.useCondom ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-transparent'}`}
                        >
                            <ShieldCheck size={14}/> 戴套
                        </button>
                    </div>

                    {/* Edging */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-purple-500"/>
                            <div>
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">边缘控制 (Edging)</div>
                                <div className="text-[10px] text-slate-400">快射时停下</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={decrementEdging} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow flex items-center justify-center text-slate-500"><Minus size={14}/></button>
                            <span className="font-mono font-bold text-lg w-4 text-center">{data.edgingCount || 0}</span>
                            <button onClick={incrementEdging} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow flex items-center justify-center text-purple-500"><Plus size={14}/></button>
                        </div>
                    </div>
                </div>

                {/* 4. Outcome (Orgasm & Ejaculation) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">最终结局</h4>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => updateData('ejaculation', !data.ejaculation)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${data.ejaculation ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-100 text-slate-400 border-transparent'}`}
                            >
                                {data.ejaculation ? '已射精' : '未射精 (寸止)'}
                            </button>
                        </div>
                    </div>

                    {/* V2: Volume & Force */}
                    {data.ejaculation && (
                        <div className="space-y-3 animate-in fade-in pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-blue-600 flex items-center"><Wind size={12} className="mr-1"/> 射精强度 (量/力)</label>
                                <span className="text-xs font-mono font-bold bg-blue-100 text-blue-700 px-1.5 rounded">Lv.{data.volumeForceLevel}</span>
                            </div>
                            <div className="flex justify-between gap-1">
                                {FORCE_LEVELS.map(l => (
                                    <button 
                                        key={l.lvl}
                                        onClick={() => updateData('volumeForceLevel', l.lvl)}
                                        className={`flex-1 h-10 rounded-lg flex flex-col items-center justify-center transition-all border ${data.volumeForceLevel === l.lvl ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-sm' : 'bg-slate-50 border-transparent text-slate-300'}`}
                                        title={l.desc}
                                    >
                                        <div className={`w-2 h-2 rounded-full mb-1 ${data.volumeForceLevel! >= l.lvl ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                        <span className="text-[9px] font-bold scale-90">{l.label.split('/')[0]}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 text-center italic">
                                {FORCE_LEVELS.find(l => l.lvl === data.volumeForceLevel)?.desc}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>愉悦感 ({data.orgasmIntensity})</span>
                            <span>{data.orgasmIntensity! >= 5 ? '🔥 极乐升天' : data.orgasmIntensity! >= 4 ? '😍 很爽' : data.orgasmIntensity! >= 3 ? '🙂 舒服' : '😐 一般'}</span>
                        </div>
                        <input 
                            type="range" min="1" max="5" step="1"
                            value={data.orgasmIntensity || 3}
                            onChange={e => updateData('orgasmIntensity', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>
                </div>

                {/* 5. Post-Clarity (Sage Mode) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center"><Sparkles size={12} className="mr-1"/> 贤者时间 (Sage Mode)</h4>
                    
                    {/* Psychological */}
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 block">心理状态</label>
                        <div className="flex flex-wrap gap-2">
                            {POST_MOOD_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateData('postMood', opt)}
                                    className={`px-2 py-1 rounded text-xs transition-all border ${data.postMood === opt ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Physiological */}
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 block">身体疲劳度</label>
                        <div className="flex flex-wrap gap-2">
                            {FATIGUE_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateData('fatigue', opt)}
                                    className={`px-2 py-1 rounded text-xs transition-all border ${data.fatigue === opt ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. Notes */}
                <div className="relative">
                    <PenLine size={14} className="absolute left-3 top-3 text-slate-400" />
                    <textarea 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none focus:border-brand-accent min-h-[60px]"
                        placeholder="更多备注 / 链接 / 特殊感受..."
                        value={data.notes || ''}
                        onChange={e => updateData('notes', e.target.value)}
                    />
                </div>
            </div>

            {/* Tag Manager Modal (Nested) */}
            <Suspense fallback={null}>
                <TagManager 
                    isOpen={isTagManagerOpen} 
                    onClose={() => setIsTagManagerOpen(false)} 
                    onSelectTag={handleSelectTagFromManager}
                    initialSearch={categorySearch}
                />
            </Suspense>
        </Modal>
    );
};

export default MasturbationRecordModal;
