
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Clock, Smile, PenLine, Tag, Smartphone, User, Target, Layers, Plus, Zap, Minus, FilePlus, Bookmark, ShieldCheck, Trash2, ArrowLeft, ArrowRight, MapPin, AlertTriangle, Search, Droplets, BatteryCharging, BatteryWarning } from 'lucide-react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, Mood, MasturbationMaterial, EjaculationVolume, PostNutMood, PostNutFatigue } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

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

const VOLUME_LEVELS: { val: EjaculationVolume, label: string, desc: string, color: string }[] = [
    { val: 1, label: '滞留', desc: '几乎没出来，干涩', color: 'text-red-400' },
    { val: 2, label: '流出', desc: '缓缓流出，量少', color: 'text-orange-400' },
    { val: 3, label: '喷射', desc: '标准节奏，量正常', color: 'text-blue-400' },
    { val: 4, label: '汹涌', desc: '量大浓厚，湿透纸巾', color: 'text-indigo-400' },
    { val: 5, label: '爆发', desc: '极强冲力，超大量', color: 'text-purple-500 font-bold' },
];

const POST_MOODS: { val: PostNutMood, label: string }[] = [
    { val: 'satisfied', label: '😌 满足' },
    { val: 'calm', label: '😐 平淡' },
    { val: 'empty', label: '😶 空虚' },
    { val: 'regret', label: '😣 后悔' },
    { val: 'craving', label: '😋 再来一次' }
];

const FATIGUE_LEVELS: { val: PostNutFatigue, label: string }[] = [
    { val: 'refreshed', label: '⚡ 精神焕发' },
    { val: 'no_change', label: '👌 无变化' },
    { val: 'sleepy', label: '🥱 略困' },
    { val: 'exhausted', label: '🛌 秒睡' }
];

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
                    <button
                        onClick={handleAdd}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-brand-accent text-brand-accent bg-blue-50 dark:bg-blue-900/20 flex items-center animate-in fade-in"
                    >
                        <Plus size={12} className="mr-1"/> 创建 "{searchTerm}"
                    </button>
                )}

                {filteredOptions.map(opt => (
                    <button
                        key={opt}
                        onClick={() => onToggle(opt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 border ${
                            isSelected(opt) 
                            ? 'bg-brand-accent text-white border-brand-accent shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-brand-muted border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {opt}
                    </button>
                ))}

                {filteredOptions.length === 0 && !searchTerm && (
                    <div className="text-xs text-slate-400 py-1">暂无选项</div>
                )}
                
                {onAdd && !searchTerm && !showSearch && (
                    <button
                        onClick={() => setSearchTerm(' ')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-brand-accent hover:border-brand-accent transition-colors flex items-center bg-transparent"
                    >
                        <Plus size={12} className="mr-1"/> 自定义
                    </button>
                )}
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
    volumeForceLevel: 3,
    postMood: 'satisfied',
    fatigue: 'no_change',
    orgasmIntensity: 3,
    mood: 'neutral',
    stressLevel: 3,
    energyLevel: 3,
    interrupted: false,
    interruptionReasons: [],
    notes: '',
    status: 'completed'
  });
  
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;
  
  const [actorInput, setActorInput] = useState('');
  
  // Custom Options Persistence
  const [customOptions, setCustomOptions] = useLocalStorage<CustomOptions>('userCustomOptions_masturbation', {
      sources: [],
      platforms: [],
      categories: [],
      tools: [],
      scenes: []
  });
  
  // Material Adding State
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState<MasturbationMaterial>({ id: '', label: '', publisher: '', actors: [], tags: [] });
  const [newMatActorInput, setNewMatActorInput] = useState('');

  // Target Suggestion State
  const [showTargetSuggestions, setShowTargetSuggestions] = useState(false);

  // --- Sorting & Initialization ---
  const { sortedSources, sortedPlatforms, sortedCategories, sortedTools, sortedScenes, sortedTargets } = useMemo(() => {
      const counts = { 
          source: {} as Record<string, number>, 
          platform: {} as Record<string, number>, 
          cat: {} as Record<string, number>,
          tool: {} as Record<string, number>,
          target: {} as Record<string, number>,
          scene: {} as Record<string, number>
      };
      
      logs.forEach(log => {
          if (!log.masturbation) return;
          log.masturbation.forEach(rec => {
              if (rec.assets) {
                  rec.assets.sources.forEach(s => counts.source[s] = (counts.source[s] || 0) + 1);
                  rec.assets.platforms.forEach(p => counts.platform[p] = (counts.platform[p] || 0) + 1);
                  rec.assets.categories.forEach(c => counts.cat[c] = (counts.cat[c] || 0) + 1);
                  if (rec.assets.target) counts.target[rec.assets.target] = (counts.target[rec.assets.target] || 0) + 1;
              }
              if (rec.tools) rec.tools.forEach(t => counts.tool[t] = (counts.tool[t] || 0) + 1);
              if (rec.location) counts.scene[rec.location] = (counts.scene[rec.location] || 0) + 1;
          });
      });

      const mergeAndSort = (base: string[], custom: string[], countMap: Record<string, number>) => {
          const combined = Array.from(new Set([...base, ...custom]));
          return combined.sort((a, b) => (countMap[b] || 0) - (countMap[a] || 0));
      };

      const partnerNames = new Set(partners.map(p => p.name));
      const historyTargets = Object.keys(counts.target).filter(t => !partnerNames.has(t));
      const sortedHistoryTargets = historyTargets.sort((a, b) => counts.target[b] - counts.target[a]);

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
                location: initialData.location || '',
                assets: {
                    sources: [], 
                    platforms: [], 
                    categories: [], 
                    target: '',
                    actors: [], 
                    ...initialData.assets
                },
                materialsList: initialData.materialsList || [],
                edging: initialData.edging || 'none',
                edgingCount: initialData.edgingCount || (initialData.edging === 'once' ? 1 : initialData.edging === 'multiple' ? 2 : 0),
                lubricant: initialData.lubricant || '',
                useCondom: initialData.useCondom || false,
                volumeForceLevel: initialData.volumeForceLevel || 3,
                postMood: initialData.postMood || 'satisfied',
                fatigue: initialData.fatigue || 'no_change',
                interrupted: initialData.interrupted || false,
                interruptionReasons: initialData.interruptionReasons || [],
                status: initialData.status || 'completed'
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
                volumeForceLevel: 3,
                postMood: 'satisfied',
                fatigue: 'no_change',
                orgasmIntensity: 3,
                mood: 'neutral',
                stressLevel: 3,
                energyLevel: 3,
                interrupted: false,
                interruptionReasons: [],
                notes: '',
                status: 'completed'
            });
        }
        setIsAddingMaterial(false);
        setShowTargetSuggestions(false);
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    onSave({ ...data, status: 'completed' });
    onClose();
  };

  // Helpers
  const updateAsset = (key: 'sources' | 'platforms' | 'categories' | 'actors', val: string) => {
      setData(prev => {
          const current = prev.assets?.[key] || [];
          const next = current.includes(val) ? current.filter(x => x !== val) : [...current, val];
          return { ...prev, assets: { ...prev.assets!, [key]: next } };
      });
  };

  const addActor = () => {
      if (actorInput.trim()) {
          const name = actorInput.trim();
          updateAsset('actors', name);
          setActorInput('');
      }
  };

  const toggleTool = (tool: string) => {
      setData(prev => {
          const current = prev.tools || [];
          const next = current.includes(tool) ? current.filter(t => t !== tool) : [...current, tool];
          return { ...prev, tools: next };
      });
  };

  const addCustomOption = (key: keyof CustomOptions, value: string) => {
      if (!customOptions[key].includes(value)) {
          setCustomOptions(prev => ({
              ...prev,
              [key]: [...prev[key], value]
          }));
      }
      if (key === 'tools') {
          toggleTool(value);
      } else if (key === 'scenes') {
          setData(prev => ({ ...prev, location: value }));
      } else if (key === 'categories' || key === 'platforms' || key === 'sources') {
          updateAsset(key, value);
      }
  };

  const updateEdgingCount = (count: number) => {
      let type: 'none' | 'once' | 'multiple' = 'none';
      if (count === 1) type = 'once';
      else if (count > 1) type = 'multiple';
      
      setData(prev => ({
          ...prev,
          edgingCount: count,
          edging: type
      }));
  };

  const getTargetColor = (name: string) => {
      const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400', 'bg-rose-400'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
  };

  // --- Material Logic ---
  const startAddMaterial = () => {
      setNewMaterial({ id: Date.now().toString(), label: '', publisher: '', actors: [], tags: [] });
      setNewMatActorInput('');
      setIsAddingMaterial(true);
  };

  const saveMaterial = () => {
      const updatedMaterials = [...(data.materialsList || []), newMaterial];
      const currentAssets = { ...data.assets };
      const newActors = [...(currentAssets.actors || [])];
      const newTags = [...(currentAssets.categories || [])];
      
      newMaterial.actors.forEach(a => { if(!newActors.includes(a)) newActors.push(a); });
      newMaterial.tags.forEach(t => { if(!newTags.includes(t)) newTags.push(t); });
      
      setData(prev => ({
          ...prev,
          materialsList: updatedMaterials,
          assets: { ...prev.assets!, actors: newActors, categories: newTags }
      }));
      setIsAddingMaterial(false);
  };

  const deleteMaterial = (id: string) => {
      setData(prev => ({ ...prev, materialsList: prev.materialsList?.filter(m => m.id !== id) }));
  };

  const addMatActor = () => {
      if (newMatActorInput.trim()) {
          setNewMaterial(p => ({ ...p, actors: [...p.actors, newMatActorInput.trim()] }));
          setNewMatActorInput('');
      }
  };

  const toggleMatTag = (tag: string) => {
      setNewMaterial(p => {
          const tags = p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag];
          return { ...p, tags };
      });
  };

  const addCustomTagForMaterial = (tag: string) => {
      if (!customOptions.categories.includes(tag)) {
          setCustomOptions(prev => ({ ...prev, categories: [...prev.categories, tag] }));
      }
      toggleMatTag(tag);
  };

  // --- Wizard Logic ---
  const nextStep = () => { if(step < TOTAL_STEPS) setStep(step + 1); else handleSave(); };
  const prevStep = () => { if(step > 1) setStep(step - 1); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-primary dark:bg-slate-950 text-brand-text dark:text-slate-100 flex flex-col h-full font-sans overflow-hidden">
      
      {/* SECTION 01: Header with Progress */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-muted transition-colors"><X size={24}/></button>
            <span className="text-lg font-bold text-brand-text dark:text-white transition-all">
                {step === 1 && '1. 基础与内容'}
                {step === 2 && '2. 标签与XP'}
                {step === 3 && '3. 场景与工具'}
                {step === 4 && '4. 结果与贤者时间'}
            </span>
            <div className="w-8"></div>
        </div>
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full">
            <div 
                className="h-full bg-brand-accent transition-all duration-300 ease-out" 
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            ></div>
        </div>
      </div>

      {/* Main Scroll View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* STEP 1: Content & Time */}
        {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300">
                <Block title="时间">
                    <div className="grid grid-cols-2 gap-4">
                        <Row label="开始时间">
                            <input 
                                type="time" 
                                value={data.startTime} 
                                onChange={e => setData({...data, startTime: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 text-brand-text dark:text-slate-200 text-lg font-mono font-bold rounded-xl px-2 py-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-accent text-center"
                            />
                        </Row>
                        <Row label="持续时长">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-1 overflow-hidden">
                                <button onClick={() => setData({...data, duration: Math.max(1, (data.duration||0)-5)})} className="p-3 text-slate-500 hover:text-brand-accent"><Minus size={16}/></button>
                                <input 
                                    type="number" 
                                    value={data.duration} 
                                    onChange={e => setData({...data, duration: parseInt(e.target.value) || 0})}
                                    className="flex-1 bg-transparent text-center text-brand-text dark:text-slate-200 text-lg font-bold outline-none w-full"
                                />
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

                <Block title="详细信息">
                    {/* Materials List (Same as before) */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">施法材料 (可选)</span>
                            {!isAddingMaterial && (
                                <button onClick={startAddMaterial} className="text-xs text-brand-accent font-bold flex items-center bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                                    <Plus size={12} className="mr-1"/> 添加详情
                                </button>
                            )}
                        </div>

                        {isAddingMaterial ? (
                            <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-brand-accent/30 shadow-sm animate-in zoom-in-95">
                                <input placeholder="番号 / 标题 (可选)" value={newMaterial.label} onChange={e => setNewMaterial({...newMaterial, label: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs outline-none" />
                                <input placeholder="发行商 / 厂牌" value={newMaterial.publisher} onChange={e => setNewMaterial({...newMaterial, publisher: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs outline-none" />
                                <div className="flex gap-2">
                                    <input placeholder="添加主演 (回车)" value={newMatActorInput} onChange={e => setNewMatActorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMatActor()} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs outline-none" />
                                    <button onClick={addMatActor} className="bg-slate-200 dark:bg-slate-700 p-2 rounded"><Plus size={14}/></button>
                                </div>
                                {newMaterial.actors.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {newMaterial.actors.map(a => <span key={a} className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">{a}</span>)}
                                    </div>
                                )}
                                <div className="h-20 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded p-1">
                                    <ChipSelect options={sortedCategories} selected={newMaterial.tags} onToggle={toggleMatTag} onAdd={addCustomTagForMaterial} multi placeholder="搜索标签..."/>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsAddingMaterial(false)} className="flex-1 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 rounded text-slate-500 font-bold">取消</button>
                                    <button onClick={saveMaterial} className="flex-1 py-1.5 text-xs bg-brand-accent text-white rounded font-bold">确认添加</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.materialsList && data.materialsList.length > 0 ? (
                                    data.materialsList.map((m, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-start">
                                            <div>
                                                {m.label && <div className="font-bold text-brand-text dark:text-slate-200">{m.label}</div>}
                                                {m.publisher && <div className="text-[10px] text-slate-500">🏢 {m.publisher}</div>}
                                                {m.actors.length > 0 && <div className="text-[10px] text-indigo-500 mt-1">👤 {m.actors.join(', ')}</div>}
                                                {m.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {m.tags.map(t => <span key={t} className="text-[9px] bg-slate-100 dark:bg-slate-900 px-1 rounded text-slate-500">#{t}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => deleteMaterial(m.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-[10px] text-slate-400 py-2 italic">无详细材料记录</div>
                                )}
                            </div>
                        )}
                    </div>

                    <Row label="施法对象 (Target)">
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                            {partners.map(p => {
                                const isSelected = data.assets?.target === p.name;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setData(prev => ({...prev, assets: {...prev.assets!, target: prev.assets?.target === p.name ? '' : p.name}}))}
                                        className="flex flex-col items-center gap-2 flex-shrink-0 group focus:outline-none snap-start"
                                    >
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md transition-all duration-300 ${p.avatarColor || 'bg-slate-400'} ${isSelected ? 'ring-4 ring-brand-accent ring-offset-2 dark:ring-offset-slate-900 scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}>
                                            {p.name[0]}
                                        </div>
                                        <span className={`text-xs font-bold max-w-[80px] truncate ${isSelected ? 'text-brand-accent' : 'text-slate-600 dark:text-slate-400'}`}>{p.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative mt-2">
                            <User size={16} className="absolute left-3 top-3 text-brand-muted"/>
                            <input 
                                value={data.assets?.target || ''} 
                                onChange={e => setData(prev => ({...prev, assets: {...prev.assets!, target: e.target.value}}))} 
                                onFocus={() => setShowTargetSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowTargetSuggestions(false), 200)}
                                placeholder="或输入临时昵称..." 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm text-brand-text dark:text-slate-200 outline-none focus:border-brand-accent placeholder-brand-muted" 
                            />
                            {showTargetSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                                    <div className="p-2">
                                        <span className="text-[10px] text-brand-muted font-bold px-2 block mb-1">历史对象</span>
                                        {sortedTargets.filter(t => t.includes(data.assets?.target || '')).length > 0 ? (
                                            sortedTargets.filter(t => t.includes(data.assets?.target || '')).slice(0, 8).map(t => (
                                                <button 
                                                    key={t}
                                                    onClick={() => setData(prev => ({...prev, assets: {...prev.assets!, target: t}}))}
                                                    className="w-full flex items-center px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left group"
                                                >
                                                    <div className={`w-8 h-8 rounded-full ${getTargetColor(t)} text-white flex items-center justify-center text-xs font-bold mr-3 shadow-sm group-hover:scale-110 transition-transform`}>
                                                        {t[0]}
                                                    </div>
                                                    <span className="text-sm font-medium text-brand-text dark:text-slate-200 flex-1 truncate">{t}</span>
                                                    <Check size={14} className={`text-brand-accent transition-opacity ${data.assets?.target === t ? 'opacity-100' : 'opacity-0'}`} />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-xs text-slate-400 text-center py-2">无匹配记录</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Row>
                </Block>
            </div>
        )}

        {/* STEP 2: XP & Tags */}
        {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300">
                <Block title="标签与偏好">
                    <Row label="类型 / XP (用于生成雷达图)">
                        <ChipSelect options={sortedCategories} selected={data.assets?.categories || []} onToggle={v => updateAsset('categories', v)} onAdd={v => addCustomOption('categories', v)} multi placeholder="搜索XP标签 (如: 巨乳)..." />
                    </Row>
                    
                    <Row label="主演 / 发行商">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {data.assets?.actors?.map(actor => (
                                <button key={actor} onClick={() => updateAsset('actors', actor)} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center group">
                                    {actor} <X size={10} className="ml-1 opacity-50 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <input value={actorInput} onChange={e => setActorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addActor()} placeholder="输入名字或番号前缀 + 回车" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-3 pr-10 text-sm text-brand-text dark:text-slate-200 outline-none focus:border-brand-accent placeholder-slate-400" />
                            <button onClick={addActor} disabled={!actorInput.trim()} className="absolute right-2 top-2 p-1 bg-brand-accent text-white rounded-lg disabled:opacity-30 disabled:bg-slate-300"><Plus size={14}/></button>
                        </div>
                    </Row>
                </Block>
            </div>
        )}

        {/* STEP 3: Process */}
        {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300">
                <Block title="操作流程">
                    <Row label="场景 / 姿势">
                        <ChipSelect 
                            options={sortedScenes} 
                            selected={data.location || ''} 
                            onToggle={v => setData({...data, location: data.location === v ? '' : v})} 
                            onAdd={v => addCustomOption('scenes', v)} 
                            placeholder="搜索场景..."
                        />
                    </Row>

                    <Row label="辅助工具">
                        <ChipSelect options={sortedTools} selected={data.tools} onToggle={toggleTool} onAdd={v => addCustomOption('tools', v)} multi placeholder="搜索工具..." />
                    </Row>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                    <div className="space-y-3">
                        <RowSplit label="使用润滑剂?">
                            <button onClick={() => setData({...data, lubricant: data.lubricant ? '' : '通用'})} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${data.lubricant ? 'bg-brand-accent' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${data.lubricant ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </RowSplit>
                        {data.lubricant && (
                            <div className="pt-2 animate-in fade-in">
                                <ChipSelect options={LUBRICANT_TYPES} selected={data.lubricant} onToggle={v => setData({...data, lubricant: v})} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-3">
                        <RowSplit label="佩戴安全套?">
                            <button onClick={() => setData({...data, useCondom: !data.useCondom})} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${data.useCondom ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${data.useCondom ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </RowSplit>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                    <Row label="边缘控制 (Edging)">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500">
                                {data.edgingCount === 0 ? '无边缘' : 
                                 data.edgingCount === 1 ? '1 次 (单次)' : 
                                 `${data.edgingCount} 次 (多次)`}
                            </span>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => updateEdgingCount(Math.max(0, (data.edgingCount || 0) - 1))}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full shadow-sm border transition-all ${data.edgingCount === 0 ? 'bg-slate-100 text-slate-300 border-slate-200' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-50'}`}
                                    disabled={data.edgingCount === 0}
                                >
                                    <Minus size={18} strokeWidth={3}/>
                                </button>
                                <span className="font-mono font-black text-2xl w-8 text-center text-brand-accent">
                                    {data.edgingCount || 0}
                                </span>
                                <button 
                                    onClick={() => updateEdgingCount(Math.min(15, (data.edgingCount || 0) + 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 text-brand-accent shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 active:scale-95 transition-transform"
                                >
                                    <Plus size={18} strokeWidth={3}/>
                                </button>
                            </div>
                        </div>
                    </Row>
                </Block>
            </div>
        )}

        {/* STEP 4: Result (Updated for v0.0.6) */}
        {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300">
                <Block title="结局">
                    <RowSplit label="最终射精">
                        <button onClick={() => setData({...data, ejaculation: !data.ejaculation})} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${data.ejaculation ? 'bg-brand-accent' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${data.ejaculation ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </RowSplit>
                    {data.ejaculation && (
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            {/* Tissue Stress Test */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                                    <Droplets size={14} className="mr-1"/> 纸巾压力测试 (量与力)
                                </label>
                                <input 
                                    type="range" min={1} max={5} value={data.volumeForceLevel || 3} 
                                    onChange={e => {
                                        const v = Number(e.target.value) as EjaculationVolume;
                                        // Vibrate if available
                                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                            if (v === 5) navigator.vibrate([50, 30, 50]);
                                            else navigator.vibrate(20);
                                        }
                                        setData({...data, volumeForceLevel: v});
                                    }}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-2xl font-bold text-slate-400">Lv.{data.volumeForceLevel || 3}</span>
                                    <div className="text-right">
                                        <div className={`font-bold ${VOLUME_LEVELS[(data.volumeForceLevel || 3) - 1].color}`}>
                                            {VOLUME_LEVELS[(data.volumeForceLevel || 3) - 1].label}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            {VOLUME_LEVELS[(data.volumeForceLevel || 3) - 1].desc}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Block>

                <Block title="贤者时间 (Post-Nut Clarity)">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">射后心理</label>
                            <div className="flex flex-col gap-2">
                                {POST_MOODS.map(m => (
                                    <button 
                                        key={m.val} 
                                        onClick={() => setData({...data, postMood: m.val})}
                                        className={`text-xs p-2 rounded-lg border text-left transition-all ${data.postMood === m.val ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-brand-accent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">身体疲劳</label>
                            <div className="flex flex-col gap-2">
                                {FATIGUE_LEVELS.map(f => (
                                    <button 
                                        key={f.val} 
                                        onClick={() => setData({...data, fatigue: f.val})}
                                        className={`text-xs p-2 rounded-lg border text-left transition-all ${data.fatigue === f.val ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Block>

                <Block title="意外">
                    <RowSplit label="是否被打断?">
                        <button onClick={() => setData({...data, interrupted: !data.interrupted})} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${data.interrupted ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${data.interrupted ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </RowSplit>
                    {data.interrupted && (
                        <div className="pt-2 animate-in fade-in">
                            <ChipSelect 
                                options={INTERRUPTION_OPTIONS} 
                                selected={data.interruptionReasons || []} 
                                onToggle={(val) => {
                                    const current = data.interruptionReasons || [];
                                    const next = current.includes(val) ? current.filter(x => x !== val) : [...current, val];
                                    setData({...data, interruptionReasons: next});
                                }}
                                onAdd={(val) => {
                                     const current = data.interruptionReasons || [];
                                     if (!current.includes(val)) setData({...data, interruptionReasons: [...current, val]});
                                }}
                                multi 
                            />
                        </div>
                    )}
                </Block>

                <Block title="备注">
                    <textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-brand-text dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-accent min-h-[80px] leading-relaxed resize-none" placeholder="记录当下的感受、灵感或特殊情况..." />
                </Block>
            </div>
        )}

        {/* Bottom Spacer */}
        <div className="h-10"></div>
      </div>

      {/* SECTION 08: Bottom Navigation (Fixed) */}
      <div className="flex-none p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg flex gap-3">
          {step > 1 && (
              <button 
                onClick={prevStep}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-brand-text dark:text-slate-200 font-bold rounded-2xl transition-transform active:scale-[0.98] flex items-center justify-center"
              >
                  <ArrowLeft size={18} className="mr-2"/> 上一步
              </button>
          )}
          <button 
            onClick={nextStep}
            className={`flex-[2] py-3.5 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2`}
          >
              {step === TOTAL_STEPS ? (
                  <><Check size={20} strokeWidth={3} /> 完成记录</>
              ) : (
                  <>下一步 <ArrowRight size={18} strokeWidth={3} /></>
              )}
          </button>
      </div>

    </div>
  );
};

export default MasturbationRecordModal;
