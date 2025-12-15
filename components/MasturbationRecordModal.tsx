
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Clock, Smile, PenLine, Tag, Smartphone, User, Target, Layers, Plus, Zap, Minus, FilePlus, Bookmark, ShieldCheck, Trash2, ArrowLeft, ArrowRight, MapPin, AlertTriangle, Search, Battery, Droplets, BatteryCharging, Wind, Film, Hash } from 'lucide-react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, Mood, MasturbationMaterial } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
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
const PLATFORMS = ['Telegram', 'Pornhub', 'Twitter', 'Xvideos', 'OnlyFans', 'Jable', '抖音/TikTok', '微信/QQ', '本地硬盘', '91', 'MissAV'];
const CATEGORIES = [
    '巨乳', '贫乳', '长腿', '丝袜', '足交', '人妻/熟女', '母子', '学生/JK', 
    '女上司/OL', '颜射', '口交', '内射', 'SM/调教', '群P', 'NTR', '纯爱', 
    'Cosplay', '欧美', '国产', '日韩', '自拍/偷拍', '剧情', 'ASMR', '粗口', 'VR'
];
const TOOL_OPTIONS = ['手', '润滑液', '飞机杯', '名器/倒模', '电动玩具', '前列腺按摩器', '枕头'];
const SCENE_OPTIONS = ['卧室/床上', '浴室/洗澡', '厕所/马桶', '书桌/电脑前', '客厅/沙发', '阳台', '车里', '公司/学校', '野外', '站立'];
const INTERRUPTION_OPTIONS = ['🚪 有人敲门', '📞 电话/微信', '🐱 猫/狗捣乱', '🚴‍♂️ 外卖/快递', '👁️ 突然被看到', '🔊 噪音干扰'];

const LUBRICANT_TYPES = ['水溶性', '油性', '硅基', '唾液', '乳液'];

const FORCE_LEVELS = [
    { lvl: 1, label: '滞留/干涩', desc: '几乎没出来，黏在根部' },
    { lvl: 2, label: '流出/易理', desc: '缓缓流出，一张纸轻松搞定' },
    { lvl: 3, label: '喷射/标准', desc: '有明显的喷射节奏' },
    { lvl: 4, label: '汹涌/湿透', desc: '量大浓厚，纸巾完全湿透' },
    { lvl: 5, label: '爆发/穿透', desc: '极强冲力，射穿或溢出' }
];

const POST_MOODS = ['满足', '平淡', '空虚', '后悔', '想再来一次'];
const FATIGUE_LEVELS = ['精神焕发', '无变化', '略有困意', '极度疲惫', '秒睡'];

interface CustomOptions {
    sources: string[];
    platforms: string[];
    categories: string[];
    tools: string[];
    scenes: string[];
}

// --- UI Components ---

const ChipSelect = ({ 
    options, 
    selected, 
    onToggle, 
    onAdd,
    multi = false,
    placeholder = "搜索或添加..."
}: { 
    options: string[], 
    selected: string[] | string, 
    onToggle: (val: string) => void, 
    onAdd?: (val: string) => void,
    multi?: boolean,
    placeholder?: string
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm]);

    const isSelected = (opt: string) => multi ? (selected as string[]).includes(opt) : selected === opt;

    const handleAdd = () => {
        if (searchTerm.trim()) {
            onAdd?.(searchTerm.trim());
            setSearchTerm('');
        }
    };
    
    const showSearch = options.length > 12;

    return (
        <div className="space-y-2">
            {(showSearch || searchTerm) && (
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                    <input 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-2 text-xs outline-none focus:border-brand-accent transition-colors placeholder-slate-400"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
            )}

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pt-1">
                {searchTerm && !filteredOptions.includes(searchTerm) && onAdd && (
                    <button onClick={handleAdd} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-brand-accent text-brand-accent bg-blue-50 dark:bg-blue-900/20 flex items-center animate-in fade-in">
                        <Plus size={12} className="mr-1"/> 创建 "{searchTerm}"
                    </button>
                )}
                {filteredOptions.map(opt => (
                    <button key={opt} onClick={() => onToggle(opt)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 border ${isSelected(opt) ? 'bg-brand-accent text-white border-brand-accent shadow-sm' : 'bg-white dark:bg-slate-800 text-brand-muted border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

const Block = ({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) => (
    <div className={`space-y-2 ${className}`}>
        <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest pl-1">{title}</h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {children}
        </div>
    </div>
);

const Row = ({ label, children, className = '' }: { label: string, children: React.ReactNode, className?: string }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <span className="text-xs font-bold text-brand-text dark:text-slate-300">{label}</span>
        {children}
    </div>
);

const RowSplit = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-brand-text dark:text-slate-300">{label}</span>
        {children}
    </div>
);

const Slider = ({ value, min, max, onChange, labels }: { value: number, min: number, max: number, onChange: (v: number) => void, labels?: string[] }) => (
    <div className="w-full pt-1 pb-2">
        <input 
            type="range" min={min} max={max} value={value} 
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-accent hover:accent-brand-accent-hover"
        />
        {labels && (
            <div className="flex justify-between text-[10px] text-brand-muted mt-2 px-1">
                {labels.map((l, i) => <span key={i} className={i === value - 1 ? 'text-brand-accent font-bold' : ''}>{l}</span>)}
            </div>
        )}
    </div>
);

// --- Main Modal ---

const MasturbationRecordModal: React.FC<MasturbationRecordModalProps> = ({ isOpen, onClose, onSave, initialData, dateStr, logs = [], partners = [] }) => {
  const [data, setData] = useState<MasturbationRecordDetails>({
    id: '',
    startTime: '',
    duration: 15,
    location: '',
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
    status: 'completed',
    volumeForceLevel: 3,
    postMood: '平淡',
    fatigue: '无变化'
  });
  
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;
  const [actorInput, setActorInput] = useState('');
  const [customOptions, setCustomOptions] = useLocalStorage<CustomOptions>('userCustomOptions_masturbation', { sources: [], platforms: [], categories: [], tools: [], scenes: [] });
  
  // Detailed Material Form State
  const [newMaterial, setNewMaterial] = useState<MasturbationMaterial>({ id: '', label: '', publisher: '', actors: [], tags: [] });
  const [newMatActorInput, setNewMatActorInput] = useState('');
  const [newMatTagInput, setNewMatTagInput] = useState('');
  const [showTargetSuggestions, setShowTargetSuggestions] = useState(false);

  // --- Helpers ---
  const currentInventory = useMemo(() => calculateInventory(logs), [logs]);

  const { sortedSources, sortedPlatforms, sortedCategories, sortedTools, sortedScenes, sortedTargets } = useMemo(() => {
      const counts = { 
          source: {} as Record<string, number>, platform: {} as Record<string, number>, cat: {} as Record<string, number>,
          tool: {} as Record<string, number>, target: {} as Record<string, number>, scene: {} as Record<string, number>
      };
      logs.forEach(log => log.masturbation?.forEach(rec => {
          rec.assets?.sources.forEach(s => counts.source[s] = (counts.source[s] || 0) + 1);
          rec.assets?.platforms.forEach(p => counts.platform[p] = (counts.platform[p] || 0) + 1);
          rec.assets?.categories.forEach(c => counts.cat[c] = (counts.cat[c] || 0) + 1);
          if (rec.assets?.target) counts.target[rec.assets.target] = (counts.target[rec.assets.target] || 0) + 1;
          rec.tools?.forEach(t => counts.tool[t] = (counts.tool[t] || 0) + 1);
          if (rec.location) counts.scene[rec.location] = (counts.scene[rec.location] || 0) + 1;
      }));
      const mergeAndSort = (base: string[], custom: string[], countMap: Record<string, number>) => Array.from(new Set([...base, ...custom])).sort((a, b) => (countMap[b] || 0) - (countMap[a] || 0));
      const partnerNames = new Set(partners.map(p => p.name));
      const sortedHistoryTargets = Object.keys(counts.target).filter(t => !partnerNames.has(t)).sort((a, b) => counts.target[b] - counts.target[a]);
      return {
          sortedSources: mergeAndSort(SOURCES, customOptions.sources, counts.source),
          sortedPlatforms: mergeAndSort(PLATFORMS, customOptions.platforms, counts.platform),
          sortedCategories: mergeAndSort(CATEGORIES, customOptions.categories, counts.cat),
          sortedTools: mergeAndSort(TOOL_OPTIONS, customOptions.tools, counts.tool),
          sortedScenes: mergeAndSort(SCENE_OPTIONS, customOptions.scenes, counts.scene),
          sortedTargets: sortedHistoryTargets
      };
  }, [logs, customOptions, partners]);

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        if (initialData) {
            setData({
                ...initialData,
                volumeForceLevel: initialData.volumeForceLevel || 3,
                postMood: initialData.postMood || '平淡',
                fatigue: initialData.fatigue || '无变化',
                // Legacy mapping if needed
                assets: { sources: [], platforms: [], categories: [], target: '', actors: [], ...initialData.assets }
            });
            if (initialData.status === 'inProgress' && initialData.startTime) {
                const now = new Date();
                const [h, m] = initialData.startTime.split(':').map(Number);
                const startDate = new Date(); startDate.setHours(h); startDate.setMinutes(m); startDate.setSeconds(0);
                let diff = Math.round((now.getTime() - startDate.getTime()) / 60000);
                if (diff < 0) diff += 24 * 60;
                if (diff === 0) diff = 1;
                setData(p => ({ ...p, duration: diff }));
            }
        } else {
            setData({
                id: Date.now().toString(),
                startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                duration: 15,
                location: '',
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
                status: 'completed',
                volumeForceLevel: 3,
                postMood: '平淡',
                fatigue: '无变化'
            });
        }
        setNewMaterial({ id: '', label: '', publisher: '', actors: [], tags: [] });
    }
  }, [initialData, isOpen]);

  const handleSave = () => { onSave({ ...data, status: 'completed' }); onClose(); };

  const prevStep = () => setStep(s => Math.max(1, s - 1));
  const nextStep = () => {
      if (step === TOTAL_STEPS) {
          handleSave();
      } else {
          setStep(s => Math.min(TOTAL_STEPS, s + 1));
      }
  };
  
  const handleAddMaterial = () => {
      if (!newMaterial.label && !newMaterial.publisher && newMaterial.actors.length === 0 && newMaterial.tags.length === 0) return;
      const item: MasturbationMaterial = {
          ...newMaterial,
          id: Date.now().toString()
      };
      
      // Auto-add tags to global categories if they are new
      newMaterial.tags.forEach(t => addCustomOption('categories', t));
      
      // Auto-add global categories if matching
      const mergedTags = new Set([...newMaterial.tags, ...(data.assets?.categories || [])]);
      
      setData(prev => ({
          ...prev,
          materialsList: [...(prev.materialsList || []), item],
          // Keep legacy string array in sync for simple displays
          materials: [...prev.materials, item.label || '未命名素材'],
          assets: {
              ...prev.assets!,
              categories: Array.from(mergedTags)
          }
      }));
      setNewMaterial({ id: '', label: '', publisher: '', actors: [], tags: [] });
  };
  
  const handleCancelMaterial = () => {
      setNewMaterial({ id: '', label: '', publisher: '', actors: [], tags: [] });
      setNewMatActorInput('');
      setNewMatTagInput('');
  };

  const updateAsset = (key: any, val: string) => setData(prev => {
      const current = prev.assets?.[key] || [];
      const next = current.includes(val) ? current.filter((x: any) => x !== val) : [...current, val];
      return { ...prev, assets: { ...prev.assets!, [key]: next } };
  });
  
  const addCustomOption = (key: keyof CustomOptions, value: string) => {
      if (!customOptions[key].includes(value)) setCustomOptions(prev => ({ ...prev, [key]: [...prev[key], value] }));
      if (key === 'tools') setData(p => ({ ...p, tools: p.tools.includes(value) ? p.tools.filter(t => t!==value) : [...p.tools, value] }));
      else if (key === 'scenes') setData(prev => ({ ...prev, location: value }));
      else updateAsset(key, value);
  };
  
  const toggleNewMaterialTag = (tag: string) => {
      setNewMaterial(prev => {
          const tags = prev.tags || [];
          if (tags.includes(tag)) return { ...prev, tags: tags.filter(t => t !== tag) };
          return { ...prev, tags: [...tags, tag] };
      });
  };
  
  const getTargetColor = (name: string) => {
      const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400'];
      let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-primary dark:bg-slate-950 text-brand-text dark:text-slate-100 flex flex-col h-full font-sans overflow-hidden">
      
      {/* Header */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm relative">
        <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-muted"><X size={24}/></button>
            <div className="flex flex-col items-center">
                <span className="text-lg font-bold">自慰记录</span>
                <span className="text-[10px] text-brand-accent font-bold flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full mt-0.5">
                    <BatteryCharging size={10} className="mr-1"/> 库存: {currentInventory}
                </span>
            </div>
            <div className="w-8"></div>
        </div>
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full"><div className="h-full bg-brand-accent transition-all duration-300 ease-out" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* STEP 1: Content & Time */}
        {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in">
                <Block title="时间">
                    <div className="grid grid-cols-2 gap-4">
                        <Row label="开始时间">
                            <input type="time" value={data.startTime} onChange={e => setData({...data, startTime: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-brand-text dark:text-slate-200 text-lg font-mono font-bold rounded-xl px-2 py-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-accent text-center"/>
                        </Row>
                        <Row label="持续时长">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-1 overflow-hidden">
                                <button onClick={() => setData({...data, duration: Math.max(1, (data.duration||0)-5)})} className="p-3 text-slate-500 hover:text-brand-accent"><Minus size={16}/></button>
                                <input type="number" value={data.duration} onChange={e => setData({...data, duration: parseInt(e.target.value) || 0})} className="flex-1 bg-transparent text-center text-brand-text dark:text-slate-200 text-lg font-bold outline-none w-full"/>
                                <span className="text-xs text-brand-muted mr-1 font-bold">min</span>
                                <button onClick={() => setData({...data, duration: (data.duration||0)+5})} className="p-3 text-slate-500 hover:text-brand-accent"><Plus size={16}/></button>
                            </div>
                        </Row>
                    </div>
                </Block>
                <Block title="来源">
                    <Row label="素材来源">
                        <ChipSelect options={sortedSources} selected={data.assets?.sources || []} onToggle={v => updateAsset('sources', v)} onAdd={v => addCustomOption('sources', v)} multi placeholder="搜索来源..."/>
                    </Row>
                    {(data.assets?.sources.some(s => ['视频','直播','图片','漫画'].includes(s))) && (
                        <Row label="平台">
                            <ChipSelect options={sortedPlatforms} selected={data.assets?.platforms || []} onToggle={v => updateAsset('platforms', v)} onAdd={v => addCustomOption('platforms', v)} multi placeholder="搜索平台..."/>
                        </Row>
                    )}
                </Block>

                <Block title="施法材料 (可选)">
                    {/* List of added materials */}
                    {data.materialsList && data.materialsList.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {data.materialsList.map((m, i) => (
                                <div key={i} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 flex justify-between items-start animate-in slide-in-from-top-2">
                                    <div className="flex gap-2">
                                        <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded flex items-center justify-center text-slate-500">
                                            <Film size={16}/>
                                        </div>
                                        <div>
                                            <div className="font-bold text-brand-text dark:text-slate-200 text-sm">{m.label || '未命名'}</div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {m.publisher && <span className="text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 rounded text-slate-500">🏢 {m.publisher}</span>}
                                                {m.actors.length > 0 && <span className="text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 rounded text-slate-500">👤 {m.actors.join(', ')}</span>}
                                                {m.tags.map(t => <span key={t} className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-1 rounded border border-blue-100 dark:border-blue-900">#{t}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setData(p => ({...p, materialsList: p.materialsList?.filter((_, idx) => idx !== i)}))} className="text-slate-400 hover:text-red-500 p-1"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Detailed Input Form */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                        <input 
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-brand-accent transition-colors"
                            placeholder="番号 / 标题 (可选)"
                            value={newMaterial.label || ''}
                            onChange={e => setNewMaterial({...newMaterial, label: e.target.value})}
                        />
                        <input 
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-brand-accent transition-colors"
                            placeholder="发行商 / 厂牌"
                            value={newMaterial.publisher || ''}
                            onChange={e => setNewMaterial({...newMaterial, publisher: e.target.value})}
                        />
                        
                        {/* Actors Input */}
                        <div>
                            <div className="flex flex-wrap gap-2 mb-2 empty:hidden">
                                {newMaterial.actors.map(a => (
                                    <span key={a} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded text-xs border border-indigo-100 dark:border-indigo-800 flex items-center">
                                        {a}
                                        <button onClick={() => setNewMaterial(p => ({...p, actors: p.actors.filter(x => x!==a)}))} className="ml-1 hover:text-red-500"><X size={10}/></button>
                                    </span>
                                ))}
                            </div>
                            <div className="relative">
                                <input 
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-brand-accent transition-colors"
                                    placeholder="添加主演 (回车)"
                                    value={newMatActorInput}
                                    onChange={e => setNewMatActorInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newMatActorInput.trim()) {
                                            e.preventDefault();
                                            setNewMaterial(p => ({...p, actors: [...p.actors, newMatActorInput.trim()]}));
                                            setNewMatActorInput('');
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => { if(newMatActorInput.trim()) { setNewMaterial(p => ({...p, actors: [...p.actors, newMatActorInput.trim()]})); setNewMatActorInput(''); }}}
                                    className="absolute right-2 top-1.5 p-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 hover:text-brand-accent"
                                >
                                    <Plus size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* Tags Input for Material */}
                        <div>
                            <div className="flex flex-wrap gap-2 mb-2 empty:hidden">
                                {newMaterial.tags.map(t => (
                                    <span key={t} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded text-xs border border-blue-100 dark:border-blue-900 flex items-center">
                                        #{t}
                                        <button onClick={() => toggleNewMaterialTag(t)} className="ml-1 hover:text-red-500"><X size={10}/></button>
                                    </span>
                                ))}
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-3 text-slate-400"/>
                                <input 
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-accent transition-colors"
                                    placeholder="搜索标签..."
                                    value={newMatTagInput}
                                    onChange={e => setNewMatTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newMatTagInput.trim()) {
                                            e.preventDefault();
                                            toggleNewMaterialTag(newMatTagInput.trim());
                                            setNewMatTagInput('');
                                        }
                                    }}
                                />
                            </div>
                            {/* Quick Select Tags Suggestions */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {sortedCategories.slice(0, 8).filter(c => !newMaterial.tags.includes(c)).map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => toggleNewMaterialTag(c)}
                                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button 
                                onClick={handleCancelMaterial}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleAddMaterial}
                                disabled={!newMaterial.label && !newMaterial.publisher && newMaterial.actors.length === 0 && newMaterial.tags.length === 0}
                                className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-brand-accent font-bold rounded-lg text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:bg-slate-100 transition-colors border border-blue-100 dark:border-blue-900"
                            >
                                确认添加
                            </button>
                        </div>
                    </div>
                </Block>

                <Block title="施法对象">
                    <Row label="目标 (Target)">
                        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                            {partners.map(p => {
                                const isSelected = data.assets?.target === p.name;
                                return (
                                    <button key={p.id} onClick={() => setData(prev => ({...prev, assets: {...prev.assets!, target: prev.assets?.target === p.name ? '' : p.name}}))} className="flex flex-col items-center gap-2 flex-shrink-0 snap-start">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md transition-all ${p.avatarColor || 'bg-slate-400'} ${isSelected ? 'ring-4 ring-brand-accent ring-offset-2 dark:ring-offset-slate-900 scale-105' : 'opacity-70 hover:opacity-100'}`}>{p.name[0]}</div>
                                        <span className={`text-xs font-bold max-w-[80px] truncate ${isSelected ? 'text-brand-accent' : 'text-slate-600 dark:text-slate-400'}`}>{p.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative mt-2">
                            <User size={16} className="absolute left-3 top-3 text-brand-muted"/>
                            <input value={data.assets?.target || ''} onChange={e => setData(prev => ({...prev, assets: {...prev.assets!, target: e.target.value}}))} onFocus={() => setShowTargetSuggestions(true)} onBlur={() => setTimeout(() => setShowTargetSuggestions(false), 200)} placeholder="或输入临时昵称..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm text-brand-text dark:text-slate-200 outline-none focus:border-brand-accent placeholder-brand-muted" />
                            {showTargetSuggestions && sortedTargets.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 z-50 max-h-48 overflow-y-auto custom-scrollbar p-2">
                                    {sortedTargets.slice(0, 8).map(t => (
                                        <button key={t} onClick={() => setData(prev => ({...prev, assets: {...prev.assets!, target: t}}))} className="w-full flex items-center px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg text-left">
                                            <div className={`w-6 h-6 rounded-full ${getTargetColor(t)} text-white flex items-center justify-center text-[10px] font-bold mr-2`}>{t[0]}</div>
                                            <span className="text-sm font-medium flex-1 truncate">{t}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Row>
                </Block>
            </div>
        )}

        {/* STEP 2: XP & Tags */}
        {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in">
                <Block title="标签与偏好">
                    <Row label="类型 / XP (生成雷达图)">
                        <ChipSelect options={sortedCategories} selected={data.assets?.categories || []} onToggle={v => updateAsset('categories', v)} onAdd={v => addCustomOption('categories', v)} multi placeholder="搜索XP标签 (如: 巨乳)..." />
                    </Row>
                    <Row label="主演 (全局)">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {data.assets?.actors?.map(actor => (
                                <button key={actor} onClick={() => updateAsset('actors', actor)} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center group">
                                    {actor} <X size={10} className="ml-1 opacity-50 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <input value={actorInput} onChange={e => setActorInput(e.target.value)} onKeyDown={e => {if(e.key==='Enter' && actorInput.trim()){ updateAsset('actors', actorInput.trim()); setActorInput('');}}} placeholder="输入名字 + 回车" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-3 pr-10 text-sm outline-none focus:border-brand-accent" />
                            <button onClick={() => {if(actorInput.trim()){ updateAsset('actors', actorInput.trim()); setActorInput('');}}} className="absolute right-2 top-2 p-1 bg-brand-accent text-white rounded-lg"><Plus size={14}/></button>
                        </div>
                    </Row>
                </Block>
            </div>
        )}

        {/* STEP 3: Process */}
        {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in">
                <Block title="场景与工具">
                    <Row label="场景">
                        <ChipSelect options={sortedScenes} selected={data.location || ''} onToggle={v => setData({...data, location: data.location === v ? '' : v})} onAdd={v => addCustomOption('scenes', v)} placeholder="搜索场景..." />
                    </Row>
                    <Row label="工具">
                        <ChipSelect options={sortedTools} selected={data.tools} onToggle={v => setData(p => ({...p, tools: p.tools.includes(v)?p.tools.filter(t=>t!==v):[...p.tools, v]}))} onAdd={v => addCustomOption('tools', v)} multi placeholder="搜索工具..." />
                    </Row>
                    <div className="pt-2">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500">边缘控制 (Edging): {data.edgingCount} 次</span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setData(p => ({...p, edgingCount: Math.max(0, (p.edgingCount||0)-1), edging: (p.edgingCount||0)-1 > 0 ? 'multiple' : 'none'}))} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 border shadow-sm"><Minus size={16}/></button>
                                <button onClick={() => setData(p => ({...p, edgingCount: (p.edgingCount||0)+1, edging: (p.edgingCount||0)+1 === 1 ? 'once' : 'multiple'}))} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-accent text-white shadow-md"><Plus size={16}/></button>
                            </div>
                        </div>
                    </div>
                    <div className="pt-2">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-500">被打断?</span>
                                <input type="checkbox" className="toggle-checkbox h-5 w-9" checked={data.interrupted} onChange={e => setData({...data, interrupted: e.target.checked})}/>
                            </div>
                            {data.interrupted && (
                                <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                                    {INTERRUPTION_OPTIONS.map(opt => (
                                        <button key={opt} onClick={() => setData(p => ({...p, interruptionReasons: p.interruptionReasons?.includes(opt)?p.interruptionReasons.filter(x=>x!==opt):[...(p.interruptionReasons||[]), opt]}))} className={`text-[10px] p-2 rounded border transition-all ${data.interruptionReasons?.includes(opt) ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-500'}`}>{opt}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Block>
            </div>
        )}

        {/* STEP 4: Outcome */}
        {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in">
                <Block title="结局与状态">
                    <RowSplit label="最终射精">
                        <div className="flex items-center">
                            <span className={`text-xs mr-2 font-bold ${data.ejaculation ? 'text-blue-500' : 'text-slate-400'}`}>{data.ejaculation ? '已发射' : '寸止/未射'}</span>
                            <input type="checkbox" className="toggle-checkbox h-6 w-11" checked={data.ejaculation} onChange={e => setData({...data, ejaculation: e.target.checked})}/>
                        </div>
                    </RowSplit>
                    
                    {data.ejaculation && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30 space-y-4 animate-in fade-in">
                            <div>
                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 block uppercase">愉悦强度 (1-5)</label>
                                <Slider value={data.orgasmIntensity || 3} min={1} max={5} onChange={v => setData({...data, orgasmIntensity: v})} labels={['无感', '微爽', '舒适', '很爽', '升天']}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 block uppercase">发射力度 (纸巾测试)</label>
                                <div className="space-y-1">
                                    {FORCE_LEVELS.map(L => (
                                        <button key={L.lvl} onClick={() => setData({...data, volumeForceLevel: L.lvl as any})} className={`w-full text-left p-2 rounded-lg border text-xs flex justify-between items-center transition-all ${data.volumeForceLevel === L.lvl ? 'bg-blue-500 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                            <span className="font-bold">Lv.{L.lvl} {L.label}</span>
                                            <span className={`text-[10px] ${data.volumeForceLevel === L.lvl ? 'text-blue-100' : 'text-slate-400'}`}>{L.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <Row label="贤者时间 (心理)">
                            <div className="flex flex-col gap-1">
                                {POST_MOODS.map(m => (
                                    <button key={m} onClick={() => setData({...data, postMood: m})} className={`text-xs py-1.5 rounded border transition-all ${data.postMood === m ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>{m}</button>
                                ))}
                            </div>
                        </Row>
                        <Row label="身体疲劳度">
                            <div className="flex flex-col gap-1">
                                {FATIGUE_LEVELS.map(f => (
                                    <button key={f} onClick={() => setData({...data, fatigue: f})} className={`text-xs py-1.5 rounded border transition-all ${data.fatigue === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>{f}</button>
                                ))}
                            </div>
                        </Row>
                    </div>

                    <Row label="备注">
                        <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm h-20 outline-none focus:border-brand-accent" placeholder="番号、链接或特殊感受..." value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} />
                    </Row>
                </Block>
            </div>
        )}

      </div>

      {/* Footer Nav */}
      <div className="flex-none p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center z-20">
          <button onClick={prevStep} className={`px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}>
              上一步
          </button>
          <div className="flex gap-1">
              {[1, 2, 3, 4].map(s => <div key={s} className={`w-2 h-2 rounded-full transition-all ${step === s ? 'bg-brand-accent w-4' : 'bg-slate-200 dark:bg-slate-700'}`}></div>)}
          </div>
          <button onClick={nextStep} className="px-8 py-3 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center">
              {step === TOTAL_STEPS ? <Check size={18} className="mr-2"/> : null}
              {step === TOTAL_STEPS ? '完成' : '下一步'}
          </button>
      </div>
    </div>
  );
};

export default MasturbationRecordModal;
