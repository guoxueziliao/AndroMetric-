
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Check, ChevronRight, Clock, Plus, Trash2, MapPin, ChevronDown, Activity, PlayCircle, Shirt, Zap, ArrowRight, Sparkles, Droplets, Flame, User, GripHorizontal, LayoutGrid, Tag, ArrowUp, ArrowDown, GripVertical, Star } from 'lucide-react';
import { SexRecordDetails, SexInteraction, SexAction, SexActionType, PartnerProfile, LogEntry } from '../types';

interface SexRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: SexRecordDetails) => void;
  initialData?: SexRecordDetails;
  dateStr: string;
  partners?: PartnerProfile[];
  logs?: LogEntry[];
}

// --- Constants (Options) ---

const ACT_OPTIONS = [
  '亲吻', '舌吻', '爱抚', '种草莓', '手交', '口交', '乳交', '足交', '腿交', '指交', 
  '冰火', '漫游', '69', '毒龙', '肛交', '深喉', '颜骑', '吞精', '窒息', 'SP', '双龙', '其他'
];

const POSITION_OPTIONS = [
  '传教士', '女上位', '后入式', '侧卧式', '勺子式', '站立式', '站立后入', '抱起来操', 
  '火车便当', '坐式', '观音坐莲', '反向骑乘', '剪刀式', '蝴蝶式', 'M字开腿', '趴着式', 
  '椅子式', '桌边式', '壁咚', '镜前', '倒立', '69式'
];

const PROTECTION_OPTIONS = ['无保护措施', '避孕套', '避孕药', '体外射精', '其他'];

const LOCATION_GROUPS = {
    '居家': ['卧室', '客厅', '浴室', '厨房', '阳台', '沙发', '书桌'],
    '刺激': ['车震', '野战', '影院', '楼梯', '公共场所'],
    '出行': ['酒店', '民宿', '帐篷', '其他']
};

const STATE_OPTIONS = ['清醒', '微醺', '醉酒', '疲惫', '亢奋', '药物', 'High'];

const ROLE_OPTIONS = [
    '夫妻', '情侣', '炮友', '前任', '人妻', '朋友妻', '未亡人', '师生', 
    '医护', '上下级', '女仆', 'JK', '辣妹', 'NTR', '路人', '其他'
];

const COSTUME_OPTIONS = [
    '护士', 'OL', '空姐', '女仆', 'JK', '女警', '旗袍', '汉服', '和服', '兔女郎', '泳衣', '瑜伽裤',
    '黑丝', '白丝', '肉丝', '渔网', '吊带袜', '裸腿', '开档', '胶衣', '高跟鞋', '眼镜', '项圈', '兽耳'
];

const TOY_OPTIONS = [
    '假阴茎', '炮机', '肛塞', '拉珠', '跳蛋', '按摩棒', '飞机杯', '吮吸器', 
    '眼罩', '口球', '手铐', '鞭子', '夹子', '润滑液', '热油', '冰块'
];

const POST_SEX_OPTIONS = [
    '鸳鸯浴', '清洗', '排尿', '拥抱', '聊天', '按摩', '喂食', '秒睡', '事后烟', '玩手机', '贤者模式'
];

const EJACULATION_LOCATIONS = [
  '阴道内', '肛门内', '颜射', '口中', '胸部', '腹部', '臀部', '背部', '腿/脚', '手中', '体外'
];

// --- Visual Components ---

const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl ${className}`}
    >
        {children}
    </div>
);

const Chip: React.FC<{ label: string, active: boolean, onClick: () => void, color?: string }> = ({ label, active, onClick, color = 'blue' }) => {
    // Reverted to clean slate theme
    return (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap border ${
                active 
                ? 'bg-brand-accent text-white border-brand-accent shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-accent/50'
            }`}
        >
            {label}
        </button>
    );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ElementType, label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all flex-1 relative
            ${active ? 'text-brand-accent bg-blue-50 dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
    >
        <div className={`p-2 rounded-full mb-1`}>
            <Icon size={18} />
        </div>
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

const SexRecordModal: React.FC<SexRecordModalProps> = ({ isOpen, onClose, onSave, initialData, dateStr, partners = [], logs = [] }) => {
  const [data, setData] = useState<SexRecordDetails>({
    id: '',
    startTime: '',
    interactions: [],
    duration: 20,
    protection: '无保护措施',
    state: '',
    indicators: { lingerie: false, orgasm: true, partnerOrgasm: true, squirting: false, toys: false },
    ejaculation: true,
    ejaculationLocation: '',
    semenSwallowed: false,
    postSexActivity: [],
    partnerScore: 0,
    mood: 'happy',
    notes: '',
  });

  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'context' | 'action' | 'props'>('action');
  const [isGlobalPanelOpen, setIsGlobalPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Sorting logic based on history
  const activeInteraction = data.interactions.find(i => i.id === editingInteractionId);
  const activePartnerName = activeInteraction?.partner;

  const { sortedActs, sortedPositions } = useMemo(() => {
      const actCounts: Record<string, number> = {};
      const posCounts: Record<string, number> = {};

      logs.forEach(log => {
          if (!log.sex) return;
          log.sex.forEach(record => {
             const partnerMatch = activePartnerName && (record.interactions?.some(i => i.partner === activePartnerName) || record.partner === activePartnerName);
             const weight = partnerMatch ? 5 : 1; 

             const process = (actName: string, type: 'act' | 'pos') => {
                 if(type === 'act') actCounts[actName] = (actCounts[actName] || 0) + weight;
                 else posCounts[actName] = (posCounts[actName] || 0) + weight;
             }

             if (record.interactions) {
                  record.interactions.forEach(i => i.chain.forEach(a => process(a.name, a.type === 'act' ? 'act' : 'pos')));
             } else {
                  record.acts?.forEach(a => process(a, 'act'));
                  record.positions?.forEach(p => process(p, 'pos'));
             }
          });
      });

      const sortFn = (counts: Record<string, number>) => (a: string, b: string) => (counts[b] || 0) - (counts[a] || 0);
      return {
          sortedActs: [...ACT_OPTIONS].sort(sortFn(actCounts)),
          sortedPositions: [...POSITION_OPTIONS].sort(sortFn(posCounts))
      };
  }, [logs, activePartnerName]);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            let loadedInteractions = initialData.interactions || [];
            if (loadedInteractions.length === 0) {
                 loadedInteractions = [{
                     id: `init-${Date.now()}`,
                     partner: initialData.partner || '',
                     location: initialData.location || '',
                     role: '', costumes: [], toys: [], chain: [] 
                 }];
            }
            let loc = initialData.ejaculationLocation || '';
            let swallowed = initialData.semenSwallowed || false;
            if (loc === '口中/吞精') { loc = '口中'; swallowed = true; }

            setData({ 
                ...initialData, 
                interactions: loadedInteractions, 
                ejaculationLocation: loc, 
                semenSwallowed: swallowed, 
                state: initialData.state || '',
                partnerScore: initialData.partnerScore || 0
            });
        } else {
            const firstId = Date.now().toString();
            setData({
                id: Date.now().toString(),
                startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                interactions: [{ id: firstId, partner: '', location: '', role: '', costumes: [], toys: [], chain: [] }],
                duration: 20,
                protection: '无保护措施',
                state: '',
                indicators: { lingerie: false, orgasm: true, partnerOrgasm: true, squirting: false, toys: false },
                ejaculation: true,
                ejaculationLocation: '',
                semenSwallowed: false,
                postSexActivity: [],
                partnerScore: 0,
                mood: 'happy',
                notes: '',
            });
        }
    }
  }, [initialData, isOpen]);

  const handleSave = () => { 
      let finalData = { ...data };
      if (data.startTime) {
          const [h] = data.startTime.split(':').map(Number);
          if (h >= 3 && h < 6) {
              const tag = '通宵硬仗';
              if (!finalData.notes?.includes(tag)) {
                  finalData.notes = (finalData.notes ? finalData.notes + ' ' : '') + tag;
              }
          }
      }
      onSave(finalData); 
      onClose(); 
  };

  const addInteraction = () => {
      const newId = Date.now().toString();
      const last = data.interactions[data.interactions.length - 1];
      setData(prev => ({
          ...prev,
          interactions: [...prev.interactions, {
              id: newId,
              partner: last?.partner || '',
              location: last?.location || '',
              role: last?.role || '',
              costumes: last?.costumes || [],
              toys: [],
              chain: []
          }]
      }));
      setEditingInteractionId(newId);
      setActiveTab('action');
  };

  const removeInteraction = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.interactions.length <= 1) return;
      if (confirm('确定删除此阶段吗？')) {
          setData(prev => ({ ...prev, interactions: prev.interactions.filter(i => i.id !== id) }));
          if (editingInteractionId === id) setEditingInteractionId(null);
      }
  };

  const updateActive = (field: keyof SexInteraction, value: any) => {
      if (!editingInteractionId) return;
      setData(prev => ({
          ...prev,
          interactions: prev.interactions.map(i => i.id === editingInteractionId ? { ...i, [field]: value } : i)
      }));
  };

  const addToChain = (type: SexActionType, name: string) => {
      if (!activeInteraction) return;
      const newAction: SexAction = { id: Math.random().toString(36).substr(2, 9), type, name };
      updateActive('chain', [...activeInteraction.chain, newAction]);
      setTimeout(() => {
          const chainEl = document.getElementById('timeline-flow');
          if (chainEl) chainEl.scrollTop = chainEl.scrollHeight;
      }, 50);
  };

  const removeFromChain = (id: string) => {
      if (!activeInteraction) return;
      updateActive('chain', activeInteraction.chain.filter(a => a.id !== id));
  };
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIdx(index);
      e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIdx === null || draggedIdx === index) return;
      
      const newChain = [...(activeInteraction?.chain || [])];
      const draggedItem = newChain[draggedIdx];
      newChain.splice(draggedIdx, 1);
      newChain.splice(index, 0, draggedItem);
      
      updateActive('chain', newChain);
      setDraggedIdx(index);
  };
  
  const handleDragEnd = () => {
      setDraggedIdx(null);
  };

  const toggleArrayItem = (field: 'costumes' | 'toys', value: string) => {
      if (!activeInteraction) return;
      const current = activeInteraction[field] || [];
      const next = current.includes(value) ? current.filter(x => x !== value) : [...current, value];
      updateActive(field, next);
  };

  const updateGlobal = (field: keyof SexRecordDetails, value: any) => setData(p => ({ ...p, [field]: value }));
  const updateIndicator = (key: keyof SexRecordDetails['indicators'], val: boolean) => 
    setData(p => ({ ...p, indicators: { ...p.indicators, [key]: val } }));

  const getPartnerAvatar = (name: string) => {
      const p = partners.find(p => p.name === name);
      if (p) return <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${p.avatarColor || 'bg-slate-400'}`}>{p.name[0]}</div>;
      return <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500 font-bold">?</div>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-primary dark:bg-slate-950 text-brand-text dark:text-slate-100 flex flex-col h-full font-sans overflow-hidden">
        
        {/* --- Header --- */}
        <div className="flex-none px-4 py-3 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-muted transition-colors">
                <X size={24} />
            </button>
            <span className="font-bold text-lg tracking-wide text-brand-text dark:text-white">
                {initialData ? '编辑记录' : '新增记录'}
            </span>
            <button 
                onClick={handleSave} 
                className="bg-brand-accent hover:bg-brand-accent-hover text-white px-5 py-2 rounded-full text-sm font-bold shadow-md transition-all active:scale-95"
            >
                保存
            </button>
        </div>

        {/* --- Main Content (Timeline View) --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative" ref={scrollRef}>
            <div className="px-5 py-6 pb-40">
                
                {/* 1. Stats Summary Cards */}
                <div className="flex gap-4 mb-8">
                    <Card className="flex-1 p-4 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-brand-muted mb-1 z-10 font-bold uppercase tracking-widest">开始时间</span>
                        <input 
                            type="time" 
                            value={data.startTime} 
                            onChange={e => setData({...data, startTime: e.target.value})}
                            className="bg-transparent text-center w-full outline-none focus:text-brand-accent text-2xl font-mono font-bold z-10 text-brand-text dark:text-slate-200"
                        />
                    </Card>
                    <Card className="flex-1 p-4 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-brand-muted mb-1 z-10 font-bold uppercase tracking-widest">持续时长 (分)</span>
                        <div className="flex items-baseline gap-1 z-10">
                            <input 
                                type="number" 
                                value={data.duration} 
                                onChange={e => setData({...data, duration: parseInt(e.target.value) || 0})}
                                className="bg-transparent text-center w-16 text-3xl font-black text-brand-accent outline-none"
                            />
                        </div>
                    </Card>
                </div>

                {/* 2. Timeline Flow */}
                <div className="relative">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[19px] top-6 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>

                    <div className="space-y-6">
                        {data.interactions.map((interaction, idx) => (
                            <div key={interaction.id} className="relative pl-12 group animate-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Timeline Node */}
                                <div className="absolute left-[10px] top-6 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-brand-accent z-10 flex items-center justify-center">
                                </div>
                                <div className="absolute -left-1 top-6 text-[10px] font-mono text-brand-muted w-8 text-right opacity-0">
                                    {idx + 1}
                                </div>
                                
                                {/* Stage Card */}
                                <Card 
                                    onClick={() => { setEditingInteractionId(interaction.id); setActiveTab('action'); }}
                                    className="p-4 cursor-pointer hover:border-brand-accent transition-all duration-300 active:scale-[0.99]"
                                >
                                    {/* Header Row */}
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            {getPartnerAvatar(interaction.partner)}
                                            <div>
                                                <div className={`text-sm font-bold ${interaction.partner ? 'text-brand-text dark:text-slate-200' : 'text-slate-400 italic'}`}>
                                                    {interaction.partner || '点击选择伴侣'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {interaction.location && (
                                                        <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 rounded flex items-center">
                                                            <MapPin size={10} className="mr-1"/>{interaction.location}
                                                        </span>
                                                    )}
                                                    {interaction.role && (
                                                        <span className="text-[10px] text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 px-1.5 rounded border border-pink-100 dark:border-pink-800">
                                                            {interaction.role}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                             {data.interactions.length > 1 && (
                                                <button onClick={(e) => removeInteraction(interaction.id, e)} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                             )}
                                             <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-accent transition-colors"><ChevronRight size={16}/></button>
                                        </div>
                                    </div>
                                    
                                    {/* Action Chain Visual */}
                                    <div className="flex flex-wrap gap-2 items-center min-h-[2rem]">
                                        {interaction.chain.length > 0 ? (
                                            interaction.chain.map((a, i) => (
                                                <div key={a.id} className="flex items-center">
                                                    {(i > 0) && <ArrowRight size={12} className="text-slate-300 dark:text-slate-600 mx-1.5" />}
                                                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold border ${
                                                        a.type === 'act' 
                                                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border-purple-100 dark:border-purple-800' 
                                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                                                    }`}>
                                                        {a.name}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center text-xs text-slate-400 italic py-1 border border-dashed border-slate-300 dark:border-slate-700 px-3 rounded-lg w-full justify-center">
                                                <Plus size={12} className="mr-1"/> 添加动作流程...
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags Row (Costume/Toys) */}
                                    {(interaction.costumes?.length > 0 || interaction.toys?.length > 0) && (
                                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            {interaction.costumes?.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 flex items-center"><Shirt size={8} className="mr-1"/>{c}</span>)}
                                            {interaction.toys?.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 flex items-center"><Zap size={8} className="mr-1"/>{t}</span>)}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        ))}
                    </div>

                    {/* Add Stage Button */}
                    <div className="pl-12 mt-8">
                        <button 
                            onClick={addInteraction}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-brand-accent hover:text-brand-accent hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 text-sm font-bold group"
                        >
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-colors">
                                <Plus size={14} /> 
                            </div>
                            添加下一阶段
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- Editor Drawer (Sliding Overlay) --- */}
        {/* Backdrop for Drawer */}
        <div 
            className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${editingInteractionId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setEditingInteractionId(null)}
        />
        
        <div 
            className={`fixed inset-x-0 bottom-0 z-[70] bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out flex flex-col h-[85vh] ${editingInteractionId ? 'translate-y-0' : 'translate-y-full'}`}
        >
             {/* Drawer Handle */}
             <div className="w-full h-6 flex items-center justify-center flex-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-t-3xl border-b border-slate-100 dark:border-slate-800" onClick={() => setEditingInteractionId(null)}>
                 <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
             </div>

             {activeInteraction && (
                 <>
                     {/* Drawer Header & Tabs */}
                     <div className="flex-none px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                         <div className="flex items-center justify-between my-3">
                             <div>
                                 <h3 className="text-lg font-bold text-brand-text dark:text-slate-100 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center text-xs text-white">
                                        {data.interactions.findIndex(i => i.id === activeInteraction.id) + 1}
                                    </span>
                                    阶段编辑
                                 </h3>
                             </div>
                             <button onClick={() => setEditingInteractionId(null)} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-brand-text dark:text-slate-200 rounded-full text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700">
                                 完成
                             </button>
                         </div>

                         <div className="flex bg-slate-50 dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                            <TabButton active={activeTab === 'action'} onClick={() => setActiveTab('action')} icon={Activity} label="动作流程" />
                            <TabButton active={activeTab === 'context'} onClick={() => setActiveTab('context')} icon={User} label="伴侣场景" />
                            <TabButton active={activeTab === 'props'} onClick={() => setActiveTab('props')} icon={Tag} label="氛围道具" />
                         </div>
                     </div>

                     <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white dark:bg-slate-900">
                         
                         {/* TAB 1: ACTION FLOW */}
                         {activeTab === 'action' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
                                 
                                 {/* Timeline Flow (Vertical) */}
                                 <div className="flex-1 min-h-[120px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden">
                                     <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-10">动作时间轴 (可拖拽)</div>
                                     
                                     <div id="timeline-flow" className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2 relative">
                                        {activeInteraction.chain.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs italic">
                                                <Activity size={24} className="mb-2 opacity-50"/>
                                                点击下方添加动作
                                            </div>
                                        ) : (
                                            activeInteraction.chain.map((a, i) => (
                                                <div 
                                                    key={a.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, i)}
                                                    onDragOver={(e) => handleDragOver(e, i)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`relative pl-10 group cursor-move transition-transform duration-200 ${draggedIdx === i ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                                >
                                                    {/* Dot */}
                                                    <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-slate-400 z-10 group-hover:bg-brand-accent group-hover:scale-125 transition-all"></div>
                                                    
                                                    {/* Card */}
                                                    <div className={`flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-900 shadow-sm ${a.type === 'act' ? 'border-purple-200 dark:border-purple-900' : 'border-blue-200 dark:border-blue-900'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-slate-400 cursor-grab active:cursor-grabbing"><GripVertical size={16}/></div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-brand-text dark:text-slate-200">{a.name}</span>
                                                                <span className={`text-[10px] uppercase font-bold ${a.type === 'act' ? 'text-purple-500' : 'text-blue-500'}`}>
                                                                    {a.type === 'act' ? '行为' : '体位'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => removeFromChain(a.id)}
                                                            className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-1 gap-6 pb-20">
                                     <div>
                                         <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2"><Activity size={16}/> 行为 (Act)</h4>
                                         <div className="flex flex-wrap gap-2">
                                             {sortedActs.map(opt => <Chip key={opt} label={opt} active={false} onClick={() => addToChain('act', opt)} color="purple"/>)}
                                         </div>
                                     </div>
                                     <div>
                                         <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2"><LayoutGrid size={16}/> 姿势 (Position)</h4>
                                         <div className="flex flex-wrap gap-2">
                                             {sortedPositions.map(opt => <Chip key={opt} label={opt} active={false} onClick={() => addToChain('position', opt)} color="blue"/>)}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         )}

                         {/* TAB 2: CONTEXT */}
                         {activeTab === 'context' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">选择伴侣</label>
                                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                                        {partners.map(p => {
                                            const isActive = activeInteraction.partner === p.name;
                                            return (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => updateActive('partner', p.name)}
                                                    className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 ${isActive ? 'opacity-100 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                                >
                                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold shadow-md ring-2 ${isActive ? 'ring-brand-accent ring-offset-2 dark:ring-offset-slate-900' : 'ring-transparent'} ${p.avatarColor || 'bg-slate-400'} text-white`}>
                                                        {p.name[0]}
                                                    </div>
                                                    <span className={`text-[10px] font-medium ${isActive ? 'text-brand-accent' : 'text-slate-500'}`}>{p.name}</span>
                                                </button>
                                            );
                                        })}
                                        {/* Manual Input Fallback */}
                                        <div className="w-[1px] h-14 bg-slate-200 dark:bg-slate-800 mx-2"></div>
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                                <User size={20} className="text-slate-400"/>
                                            </div>
                                            <input 
                                                placeholder="临时伴侣" 
                                                value={activeInteraction.partner}
                                                onChange={e => updateActive('partner', e.target.value)}
                                                className="bg-transparent border-b border-slate-300 dark:border-slate-700 text-center text-xs w-16 focus:border-brand-accent outline-none text-brand-text dark:text-slate-300 pb-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">地点</label>
                                        <div className="space-y-3">
                                            {Object.entries(LOCATION_GROUPS).map(([group, locs]) => (
                                                <div key={group} className="flex flex-wrap gap-2 items-center">
                                                    <span className="text-[10px] text-slate-400 w-8">{group}</span>
                                                    {locs.map(l => (
                                                        <Chip 
                                                            key={l} label={l} color="teal"
                                                            active={activeInteraction.location === l}
                                                            onClick={() => updateActive('location', l)}
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">角色扮演</label>
                                        <div className="flex flex-wrap gap-2">
                                            {ROLE_OPTIONS.map(r => (
                                                <Chip 
                                                    key={r} label={r} color="pink"
                                                    active={activeInteraction.role === r}
                                                    onClick={() => updateActive('role', r)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             </div>
                         )}

                         {/* TAB 3: PROPS */}
                         {activeTab === 'props' && (
                             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                 <div>
                                     <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2"><Shirt size={16}/> 服饰 (Costumes)</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {COSTUME_OPTIONS.map(opt => (
                                             <Chip 
                                                key={opt} label={opt} color="indigo"
                                                active={activeInteraction.costumes?.includes(opt) || false} 
                                                onClick={() => toggleArrayItem('costumes', opt)} 
                                             />
                                         ))}
                                     </div>
                                 </div>
                                 <div>
                                     <h4 className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2"><Zap size={16}/> 玩具/道具 (Toys)</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {TOY_OPTIONS.map(opt => (
                                             <Chip 
                                                key={opt} label={opt} color="orange"
                                                active={activeInteraction.toys?.includes(opt) || false} 
                                                onClick={() => toggleArrayItem('toys', opt)} 
                                             />
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         )}
                     </div>
                 </>
             )}
        </div>


        {/* --- Bottom Global Controls (Expandable) --- */}
        <div className={`fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-transform duration-300 ${editingInteractionId ? 'translate-y-full' : 'translate-y-0'}`}>
             
             {/* Collapsed Bar */}
             <button 
                onClick={() => setIsGlobalPanelOpen(!isGlobalPanelOpen)} 
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
             >
                 <div className="flex items-center gap-3">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                         <GripHorizontal size={14}/> 全局设定
                     </span>
                     <div className="flex gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${data.ejaculation ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'}`}>
                            {data.ejaculation ? '已射精' : '未射精'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${data.protection !== '无保护措施' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                            {data.protection}
                        </span>
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                    {/* Mini Indicators */}
                    {data.indicators.orgasm && <Flame size={12} className="text-red-500"/>}
                    {data.indicators.partnerOrgasm && <Sparkles size={12} className="text-pink-500"/>}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isGlobalPanelOpen ? 'rotate-180' : ''}`}/>
                 </div>
             </button>

             {/* Expanded Content */}
             {isGlobalPanelOpen && (
                 <div className="p-5 pb-8 space-y-6 animate-in slide-in-from-bottom-5 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950/50">
                     
                     {/* 1. Safety & State */}
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <label className="text-[10px] text-slate-500 uppercase font-bold">保护措施</label>
                             <div className="relative">
                                 <select 
                                    value={data.protection}
                                    onChange={e => updateGlobal('protection', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-brand-text dark:text-slate-200 text-xs rounded-xl p-3 outline-none border border-slate-200 dark:border-slate-700 focus:border-brand-accent appearance-none"
                                >
                                    {PROTECTION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-3.5 text-slate-500 pointer-events-none"/>
                             </div>
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] text-slate-500 uppercase font-bold">自身状态</label>
                             <div className="relative">
                                 <select 
                                    value={data.state}
                                    onChange={e => updateGlobal('state', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-brand-text dark:text-slate-200 text-xs rounded-xl p-3 outline-none border border-slate-200 dark:border-slate-700 focus:border-brand-accent appearance-none"
                                >
                                    <option value="">正常</option>
                                    {STATE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-3.5 text-slate-500 pointer-events-none"/>
                             </div>
                         </div>
                     </div>

                     {/* 2. Ejaculation Control */}
                     <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-brand-text dark:text-slate-200 flex items-center gap-2"><Droplets size={16} className="text-blue-500"/> 射精详情</span>
                            <button 
                                onClick={() => updateGlobal('ejaculation', !data.ejaculation)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${data.ejaculation ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${data.ejaculation ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        
                        {data.ejaculation && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">位置</label>
                                <div className="flex flex-wrap gap-2">
                                    {EJACULATION_LOCATIONS.map(loc => (
                                        <button 
                                            key={loc}
                                            onClick={() => updateGlobal('ejaculationLocation', loc)}
                                            className={`text-[10px] px-3 py-1.5 rounded-lg border font-medium transition-all ${data.ejaculationLocation === loc ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                                {data.ejaculationLocation.includes('口') && (
                                     <div className="flex items-center gap-2 mt-2">
                                         <input id="swallow" type="checkbox" checked={data.semenSwallowed} onChange={e => updateGlobal('semenSwallowed', e.target.checked)} className="accent-pink-500 w-4 h-4 rounded"/>
                                         <label htmlFor="swallow" className="text-xs text-slate-600 dark:text-slate-300 font-bold">吞精</label>
                                     </div>
                                )}
                            </div>
                        )}
                     </div>

                     {/* 3. Indicators Grid */}
                     <div className="space-y-2">
                         <span className="text-[10px] text-slate-500 uppercase font-bold">高潮与特殊标记</span>
                         <div className="grid grid-cols-2 gap-3">
                             {[
                                 { k: 'orgasm', l: '我高潮了', i: Flame, c: 'text-red-500' }, 
                                 { k: 'partnerOrgasm', l: '伴侣高潮', i: Sparkles, c: 'text-pink-500' }, 
                                 { k: 'squirting', l: '潮吹/喷水', i: Droplets, c: 'text-blue-500' },
                                 { k: 'lingerie', l: '情趣内衣', i: Shirt, c: 'text-purple-500' }
                             ].map(({k, l, i: Icon, c}) => (
                                 <button 
                                    key={k}
                                    onClick={() => updateIndicator(k as any, !data.indicators[k as keyof typeof data.indicators])}
                                    className={`p-3 rounded-xl border flex items-center justify-between font-bold transition-all ${data.indicators[k as keyof typeof data.indicators] ? `bg-white dark:bg-slate-800 border-brand-accent shadow-sm ring-1 ring-brand-accent` : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}
                                 >
                                     <span className="text-xs text-brand-text dark:text-slate-200">{l}</span>
                                     <Icon size={16} className={data.indicators[k as keyof typeof data.indicators] ? c : 'text-slate-300'}/>
                                 </button>
                             ))}
                         </div>
                     </div>
                     
                     {/* 4. Aftercare & Rating */}
                     <div className="space-y-3 pb-6 border-t border-slate-200 dark:border-slate-800 pt-4">
                        {/* Rating */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex justify-between items-center shadow-sm">
                            <span className="text-xs font-bold text-slate-500">伴侣满意度 / 表现评分</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                        key={star}
                                        onClick={() => updateGlobal('partnerScore', star)}
                                        className={`${(data.partnerScore || 0) >= star ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-700'} hover:text-yellow-300 transition-colors`}
                                    >
                                        <Star size={18} fill={(data.partnerScore || 0) >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <span className="text-[10px] text-slate-500 uppercase font-bold mt-2 block">善后 / 贤者时间</span>
                        <div className="flex flex-wrap gap-2">
                            {POST_SEX_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateGlobal('postSexActivity', data.postSexActivity?.includes(opt) ? data.postSexActivity.filter(x => x!==opt) : [...(data.postSexActivity||[]), opt])}
                                    className={`text-[10px] px-3 py-1.5 rounded transition-all ${data.postSexActivity?.includes(opt) ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                     </div>
                 </div>
             )}
        </div>
    </div>
  );
};

export default SexRecordModal;
