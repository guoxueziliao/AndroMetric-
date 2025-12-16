
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Clock, Smile, PenLine, Tag, Smartphone, User, Target, Layers, Plus, Zap, Minus, FilePlus, Bookmark, ShieldCheck, Trash2, ArrowLeft, ArrowRight, MapPin, AlertTriangle, Search, Battery, Droplets, BatteryCharging, Wind, Film, Hash, Edit2, Globe, Activity, Thermometer, BrainCircuit } from 'lucide-react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, Mood, MasturbationMaterial } from '../types';
import Modal from './Modal';
import { calculateInventory } from '../utils/helpers';

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
const CATEGORIES = [
    '巨乳', '贫乳', '长腿', '丝袜', '足交', '人妻/熟女', '母子', '学生/JK', 
    '女上司/OL', '颜射', '口交', '内射', 'SM/调教', '群P', 'NTR', '纯爱', 
    'Cosplay', '欧美', '国产', '日韩', '自拍/偷拍', '剧情', 'ASMR', '粗口', 'VR'
];
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

    // Material Form State
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [tempMaterial, setTempMaterial] = useState<MasturbationMaterial>({
        id: '',
        label: '',
        publisher: '',
        actors: [],
        tags: []
    });
    
    const [tempActor, setTempActor] = useState('');
    const [tempTag, setTempTag] = useState('');

    const inventoryTime = useMemo(() => calculateInventory(logs), [logs]);

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
            setIsAddingMaterial(false);
            setTempMaterial({ id: '', label: '', publisher: '', actors: [], tags: [] });
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

    // --- Material List Logic ---

    const handleAddMaterialClick = () => {
        setTempMaterial({ id: '', label: '', publisher: '', actors: [], tags: [] });
        setIsAddingMaterial(true);
    };

    const handleEditMaterialClick = (material: MasturbationMaterial) => {
        setTempMaterial({ ...material });
        setIsAddingMaterial(true);
    };

    const handleSaveMaterial = () => {
        if (!tempMaterial.label) return;
        
        setData(prev => {
            const list = prev.materialsList || [];
            
            // Check if updating existing
            if (tempMaterial.id && list.some(m => m.id === tempMaterial.id)) {
                return {
                    ...prev,
                    materialsList: list.map(m => m.id === tempMaterial.id ? tempMaterial : m)
                };
            } else {
                // Create new
                const newMat = { ...tempMaterial, id: tempMaterial.id || Date.now().toString() };
                return {
                    ...prev,
                    materialsList: [...list, newMat]
                };
            }
        });

        // Reset
        setTempMaterial({ id: '', label: '', publisher: '', actors: [], tags: [] });
        setIsAddingMaterial(false);
    };

    const removeMaterial = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering edit
        if(confirm('移除此素材?')) {
            setData(prev => ({
                ...prev,
                materialsList: prev.materialsList?.filter(m => m.id !== id) || []
            }));
        }
    };

    const addTempActor = () => {
        if (tempActor && !tempMaterial.actors.includes(tempActor)) {
            setTempMaterial(prev => ({ ...prev, actors: [...prev.actors, tempActor] }));
            setTempActor('');
        }
    };

    const addTempTag = () => {
        if (tempTag && !tempMaterial.tags.includes(tempTag)) {
            setTempMaterial(prev => ({ ...prev, tags: [...prev.tags, tempTag] }));
            setTempTag('');
        }
    };

    const incrementEdging = () => updateData('edgingCount', (data.edgingCount || 0) + 1);
    const decrementEdging = () => updateData('edgingCount', Math.max(0, (data.edgingCount || 0) - 1));

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
                            <Clock size={18} className="text-slate-400" />
                        </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">时长 (分钟)</label>
                        <div className="flex items-center justify-between">
                            <input 
                                type="number" 
                                value={data.duration} 
                                onChange={e => updateData('duration', parseInt(e.target.value)||0)}
                                className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-200 outline-none w-full"
                            />
                            <span className="text-xs text-slate-400 font-bold">MIN</span>
                        </div>
                    </div>
                </div>

                {/* 2. Source & XP (The Core) */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-brand-text dark:text-slate-200 flex items-center gap-2">
                        <Layers size={16} className="text-purple-500"/> 素材与内容
                    </h3>
                    
                    <div className="space-y-3">
                        {/* Sources */}
                        <div className="flex flex-wrap gap-2">
                            {SOURCES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => toggleAssetItem('sources', s)}
                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${data.assets?.sources?.includes(s) ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-bold' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Platforms (Added Back) */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {PLATFORMS.map(p => (
                                <button
                                    key={p}
                                    onClick={() => toggleAssetItem('platforms', p)}
                                    className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all flex items-center ${data.assets?.platforms?.includes(p) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                                >
                                    <Globe size={10} className="mr-1"/>
                                    {p}
                                </button>
                            ))}
                        </div>
                        
                        {/* Categories / Tags */}
                        <div className="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">性癖 / 类型 (多选)</label>
                            <div className="flex flex-wrap gap-2 h-32 overflow-y-auto custom-scrollbar content-start">
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => toggleAssetItem('categories', c)}
                                        className={`px-2 py-1 text-[10px] rounded border transition-all ${data.assets?.categories?.includes(c) ? 'bg-pink-500 text-white border-pink-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-pink-300'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Object */}
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">施法对象</label>
                            <div className="relative">
                                <Target size={14} className="absolute left-3 top-3 text-slate-400"/>
                                <input 
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs shadow-sm focus:border-brand-accent outline-none"
                                    placeholder="或输入临时对象 (如: 某网黄, 前任...)"
                                    value={data.assets?.target || ''}
                                    onChange={e => updateAssets('target', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Detailed Material List (Optional) */}
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-brand-text dark:text-slate-200 flex items-center gap-2">
                            <Bookmark size={16} className="text-indigo-500"/> 具体清单
                        </h3>
                        <button 
                            onClick={handleAddMaterialClick}
                            className="text-xs text-indigo-500 font-bold flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded"
                        >
                            <Plus size={14}/> 添加素材
                        </button>
                    </div>

                    {isAddingMaterial && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-xl p-3 space-y-3 animate-in fade-in">
                            <input 
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs"
                                placeholder="标题 / 番号 / 描述"
                                value={tempMaterial.label || ''}
                                onChange={e => setTempMaterial({...tempMaterial, label: e.target.value})}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs"
                                    placeholder="发行商 / 厂牌"
                                    value={tempMaterial.publisher || ''}
                                    onChange={e => setTempMaterial({...tempMaterial, publisher: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs"
                                        placeholder="添加主演 (回车)"
                                        value={tempActor}
                                        onChange={e => setTempActor(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addTempActor()}
                                    />
                                    <button onClick={addTempActor} className="bg-slate-200 dark:bg-slate-700 px-3 rounded text-slate-600 dark:text-slate-300"><Plus size={14}/></button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {tempMaterial.actors.map(a => <span key={a} className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded flex items-center">{a} <X size={10} className="ml-1 cursor-pointer" onClick={() => setTempMaterial(p => ({...p, actors: p.actors.filter(x => x!==a)}))}/></span>)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs"
                                        placeholder="搜索标签..."
                                        value={tempTag}
                                        onChange={e => setTempTag(e.target.value)}
                                        list="category-suggestions"
                                    />
                                    <datalist id="category-suggestions">
                                        {CATEGORIES.map(c => <option key={c} value={c}/>)}
                                    </datalist>
                                    <button onClick={addTempTag} className="bg-slate-200 dark:bg-slate-700 px-3 rounded text-slate-600 dark:text-slate-300"><Plus size={14}/></button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {tempMaterial.tags.map(t => <span key={t} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded flex items-center">{t} <X size={10} className="ml-1 cursor-pointer" onClick={() => setTempMaterial(p => ({...p, tags: p.tags.filter(x => x!==t)}))}/></span>)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddingMaterial(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg font-bold">取消</button>
                                <button onClick={handleSaveMaterial} className="flex-1 py-2 bg-indigo-500 text-white text-xs rounded-lg font-bold flex items-center justify-center"><Plus size={14} className="mr-1"/> 确认添加</button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {data.materialsList?.length === 0 && !isAddingMaterial && (
                            <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900">
                                暂无详细清单，可点击上方添加
                            </div>
                        )}
                        {data.materialsList?.map(m => (
                            <div 
                                key={m.id} 
                                onClick={() => handleEditMaterialClick(m)}
                                className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 relative group cursor-pointer hover:border-brand-accent hover:shadow-sm transition-all"
                            >
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                        <Film size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-brand-text dark:text-slate-200 truncate pr-10">{m.label}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {m.publisher && <span className="text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 rounded flex items-center"><Smartphone size={8} className="mr-1"/>{m.publisher}</span>}
                                            {m.tags.slice(0,3).map(t => <span key={t} className="text-[10px] text-blue-500">#{t}</span>)}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => removeMaterial(m.id, e)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Tools & Environment */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">辅助工具</label>
                        <div className="flex flex-wrap gap-2">
                            {TOOL_OPTIONS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => toggleTool(t)}
                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${data.tools?.includes(t) ? 'bg-orange-500 text-white border-orange-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">场景 / 姿势</label>
                        <div className="flex flex-wrap gap-2">
                            {SCENE_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => updateData('location', s)}
                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${data.location === s ? 'bg-teal-500 text-white border-teal-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Droplets size={16}/> 润滑剂
                        </div>
                        <select 
                            className="bg-transparent text-xs font-bold text-brand-text dark:text-slate-200 outline-none text-right pr-2"
                            value={data.lubricant || ''}
                            onChange={e => updateData('lubricant', e.target.value)}
                        >
                            <option value="">未使用</option>
                            {LUBRICANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* 5. Edging & Outcome */}
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">边缘控制 (Edging)</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded border border-yellow-200 font-bold">推荐</span>
                        </div>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            <button onClick={decrementEdging} className="w-8 h-7 flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"><Minus size={14}/></button>
                            <span className="w-8 text-center text-sm font-black text-brand-accent">{data.edgingCount || 0}</span>
                            <button onClick={incrementEdging} className="w-8 h-7 flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"><Plus size={14}/></button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-300">最终射精</label>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox"
                                checked={data.ejaculation ?? true}
                                onChange={e => updateData('ejaculation', e.target.checked)}
                            />
                        </div>
                        
                        {data.ejaculation && (
                            <div className="space-y-4 animate-in fade-in">
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="font-bold text-slate-500">射精量 & 力度 (纸巾测试)</span>
                                        <span className="font-bold text-blue-500">Level {data.volumeForceLevel}</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="5" step="1"
                                        value={data.volumeForceLevel || 3}
                                        onChange={e => updateData('volumeForceLevel', parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="mt-1 text-xs text-slate-400 text-center">
                                        {FORCE_LEVELS.find(l => l.lvl === (data.volumeForceLevel || 3))?.desc}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="font-bold text-slate-500">愉悦强度</span>
                                        <span className="font-bold text-pink-500">{data.orgasmIntensity}/5</span>
                                    </div>
                                    <div className="flex justify-between gap-1">
                                        {[1,2,3,4,5].map(i => (
                                            <button 
                                                key={i} 
                                                onClick={() => updateData('orgasmIntensity', i)}
                                                className={`flex-1 h-8 rounded border transition-all ${data.orgasmIntensity === i ? 'bg-pink-500 border-pink-600 text-white font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                                            >
                                                {i}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. State Sliders (Added Back) */}
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-brand-text dark:text-slate-200 flex items-center gap-2">
                        <Activity size={16} className="text-indigo-500"/> 状态评估
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                        {/* Energy */}
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-bold text-slate-500">精力状态</span>
                                <span className="text-indigo-500 font-bold">{data.energyLevel}/5</span>
                            </div>
                            <input 
                                type="range" min="1" max="5" 
                                value={data.energyLevel || 3}
                                onChange={e => updateData('energyLevel', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>疲惫</span><span>充沛</span><span>爆表</span>
                            </div>
                        </div>
                        {/* Mood */}
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-bold text-slate-500">心情</span>
                                <span className="text-pink-500 font-bold">{data.mood === 'sad' ? '低落' : data.mood === 'excited' ? '兴奋' : '平淡'}</span>
                            </div>
                            <input 
                                type="range" min="1" max="5" 
                                value={data.mood === 'sad' ? 1 : data.mood === 'anxious' ? 2 : data.mood === 'happy' ? 4 : data.mood === 'excited' ? 5 : 3}
                                onChange={e => {
                                    const v = parseInt(e.target.value);
                                    const m = v === 1 ? 'sad' : v === 2 ? 'anxious' : v === 4 ? 'happy' : v === 5 ? 'excited' : 'neutral';
                                    updateData('mood', m);
                                }}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>低落</span><span>平淡</span><span>兴奋</span>
                            </div>
                        </div>
                        {/* Stress */}
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-bold text-slate-500">压力</span>
                                <span className="text-orange-500 font-bold">{data.stressLevel}/5</span>
                            </div>
                            <input 
                                type="range" min="1" max="5" 
                                value={data.stressLevel || 3}
                                onChange={e => updateData('stressLevel', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>放松</span><span>微压</span><span>崩溃</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. Post-Game */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">贤者时间 (心理)</label>
                        <select 
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none shadow-sm"
                            value={data.postMood || ''}
                            onChange={e => updateData('postMood', e.target.value)}
                        >
                            {POST_MOOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">身体疲劳度</label>
                        <select 
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none shadow-sm"
                            value={data.fatigue || ''}
                            onChange={e => updateData('fatigue', e.target.value)}
                        >
                            {FATIGUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>

                {/* 8. Interruption (Optional) */}
                <div className="pt-2">
                    <button 
                        onClick={() => updateData('interrupted', !data.interrupted)}
                        className={`text-xs flex items-center gap-1 ${data.interrupted ? 'text-red-500 font-bold' : 'text-slate-400'}`}
                    >
                        <AlertTriangle size={12}/> {data.interrupted ? '施法被打断' : '记录被打断情况 (可选)'}
                    </button>
                    {data.interrupted && (
                        <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in">
                            {INTERRUPTION_OPTIONS.map(opt => {
                                const reason = opt.split(' ')[1];
                                const isSelected = data.interruptionReasons?.includes(reason);
                                return (
                                    <button 
                                        key={reason}
                                        onClick={() => {
                                            const current = data.interruptionReasons || [];
                                            const next = current.includes(reason) ? current.filter(x => x!==reason) : [...current, reason];
                                            updateData('interruptionReasons', next);
                                        }}
                                        className={`px-2 py-1 text-[10px] rounded border transition-all ${isSelected ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                    >
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <PenLine size={14} className="absolute left-3 top-3 text-slate-400"/>
                    <input 
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none focus:border-brand-accent shadow-sm"
                        placeholder="其他备注..."
                        value={data.notes || ''}
                        onChange={e => updateData('notes', e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default MasturbationRecordModal;
