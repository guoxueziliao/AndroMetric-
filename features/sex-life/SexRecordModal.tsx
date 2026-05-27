
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronRight, Plus, Trash2, MapPin, ChevronDown, ChevronUp, Activity, Shirt, Zap, ArrowRight, Sparkles, Droplets, Flame, User, GripHorizontal, LayoutGrid, Tag, Star } from 'lucide-react';
import type { SexRecordDetails, SexInteraction, SexAction, SexActionType, PartnerProfile, LogEntry } from '../../domain';
import { getSexRecommendations, type Recommendation } from '../../utils/recommendationEngine';
import {
  ACT_OPTIONS,
  COSTUME_OPTIONS,
  EJACULATION_LOCATIONS,
  LOCATION_GROUPS,
  POSITION_OPTIONS,
  POST_SEX_OPTIONS,
  PROTECTION_OPTIONS,
  ROLE_OPTIONS,
  STATE_OPTIONS,
  TOY_OPTIONS
} from './model/sexModalData';
import { Card, Chip, TabButton } from './SexModalPrimitives';
import { ConfirmModal } from '../../shared/ui';
import { analyzeUserPatterns } from '../daily-log/model/smartDefaults';

interface SexRecordModalData {
  partners?: PartnerProfile[];
  logs?: LogEntry[];
}

interface SexRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: SexRecordDetails) => void;
  initialData?: SexRecordDetails;
  dateStr: string;
  data: SexRecordModalData;
  onAddPartner?: (name: string) => Promise<PartnerProfile | null>;
}

const SexRecordModal: React.FC<SexRecordModalProps> = ({ isOpen, onClose, onSave, initialData, data: modalData, onAddPartner }) => {
  const {
    partners = [],
    logs = []
  } = modalData;

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
  const [pendingDeleteInteraction, setPendingDeleteInteraction] = useState<string | null>(null);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [smartPartnerApplied, setSmartPartnerApplied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Sorting logic based on history
  const activeInteraction = data.interactions.find(i => i.id === editingInteractionId);
  const activePartnerName = activeInteraction?.partner;

  const recommendations = useMemo(() => getSexRecommendations(logs, activePartnerName), [logs, activePartnerName]);

  const handleApplyRecommendation = (rec: Recommendation) => {
      if (!activeInteraction) return;

      if (rec.type === 'position') {
          addToChain('position', rec.value);
      } else if (rec.type === 'toy') {
          toggleArrayItem('toys', rec.value);
      } else if (rec.type === 'costume') {
          toggleArrayItem('costumes', rec.value);
      }
  };

  const { sortedActs, sortedPositions } = useMemo(() => {
      const actCounts: Record<string, number> = {};
      const posCounts: Record<string, number> = {};

      if (logs && Array.isArray(logs)) {
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
      }

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
            setSmartPartnerApplied(false);
        } else {
            const firstId = Date.now().toString();
            const smartPartner = analyzeUserPatterns(logs, 'lastSexPartner');
            const useSmart = smartPartner.value && typeof smartPartner.value === 'string' && smartPartner.confidence > 0.5
                && partners.some(p => p.name === smartPartner.value);
            const initialPartner = useSmart ? (smartPartner.value as string) : '';
            setData({
                id: Date.now().toString(),
                startTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                interactions: [{ id: firstId, partner: initialPartner, location: '', role: '', costumes: [], toys: [], chain: [] }],
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
            setSmartPartnerApplied(!!useSmart);
        }
    }
  }, [initialData, isOpen, logs, partners]);

  const handleSave = () => {
      onSave(data);
      onClose();
  };

  const addInteraction = () => {
      const newId = Date.now().toString();
      setData(prev => ({
          ...prev,
          interactions: [...prev.interactions, {
              id: newId,
              partner: '',
              location: '',
              role: '',
              costumes: [],
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
      setPendingDeleteInteraction(id);
  };

  const confirmRemoveInteraction = () => {
      if (!pendingDeleteInteraction) return;
      setData(prev => ({ ...prev, interactions: prev.interactions.filter(i => i.id !== pendingDeleteInteraction) }));
      if (editingInteractionId === pendingDeleteInteraction) setEditingInteractionId(null);
      setPendingDeleteInteraction(null);
  };

  const updateActive = (field: keyof SexInteraction, value: any) => {
      if (!editingInteractionId) return;
      if (field === 'partner') setSmartPartnerApplied(false);
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
  
  const moveChainItem = (index: number, direction: -1 | 1) => {
      if (!activeInteraction) return;
      const chain = activeInteraction.chain;
      const target = index + direction;
      if (target < 0 || target >= chain.length) return;
      const newChain = [...chain];
      [newChain[index], newChain[target]] = [newChain[target], newChain[index]];
      updateActive('chain', newChain);
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
      if (p) return <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-text-on-accent shadow-sm ${p.avatarColor || 'bg-surface-border'}`}>{p.name[0]}</div>;
      return <div className="w-10 h-10 rounded-full bg-surface-border  flex items-center justify-center text-xs text-text-muted font-bold">?</div>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-bg  text-text-primary  flex flex-col h-full font-sans overflow-hidden">
        
        {/* --- Header --- */}
        <div className="flex-none px-4 py-3 flex items-center justify-between bg-surface-card  sticky top-0 z-10 border-b border-surface-border  shadow-sm">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-surface-muted dark:hover:bg-surface-muted text-text-muted transition-colors">
                <X size={24} />
            </button>
            <span className="font-bold text-lg tracking-wide text-text-primary dark:text-text-on-accent">
                {initialData ? '编辑记录' : '新增记录'}
            </span>
            <button 
                onClick={handleSave} 
                className="bg-accent hover:bg-accent-hover text-text-on-accent px-5 py-2 rounded-full text-sm font-bold shadow-md transition-all active:scale-95"
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
                        <span className="text-[10px] text-text-muted mb-1 z-10 font-bold uppercase tracking-widest">开始时间</span>
                        <input 
                            type="time" 
                            value={data.startTime} 
                            onChange={e => setData({...data, startTime: e.target.value})}
                            className="bg-transparent text-center w-full outline-none focus:text-accent text-2xl font-mono font-bold z-10 text-text-primary "
                        />
                    </Card>
                    <Card className="flex-1 p-4 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-text-muted mb-1 z-10 font-bold uppercase tracking-widest">持续时长 (分)</span>
                        <div className="flex items-baseline gap-1 z-10">
                            <input 
                                type="number" 
                                value={data.duration} 
                                onChange={e => setData({...data, duration: parseInt(e.target.value) || 0})}
                                className="bg-transparent text-center w-16 text-3xl font-black text-accent outline-none"
                            />
                        </div>
                    </Card>
                </div>

                {/* 2. Timeline Flow */}
                <div className="relative">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[19px] top-6 bottom-0 w-0.5 bg-surface-border  rounded-full"></div>

                    <div className="space-y-6">
                        {data.interactions.map((interaction, idx) => (
                            <div key={interaction.id} className="relative pl-12 group animate-in slide-in-from-bottom-5 duration-slow" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Timeline Node */}
                                <div className="absolute left-[10px] top-6 w-5 h-5 rounded-full bg-surface-card  border-4 border-accent z-10 flex items-center justify-center">
                                </div>
                                <div className="absolute -left-1 top-6 text-[10px] font-mono text-text-muted w-8 text-right opacity-0">
                                    {idx + 1}
                                </div>
                                
                                {/* Stage Card */}
                                <Card 
                                    onClick={() => { setEditingInteractionId(interaction.id); setActiveTab('action'); }}
                                    className="p-4 cursor-pointer hover:border-accent transition-all duration-slow active:scale-[0.99]"
                                >
                                    {/* Header Row */}
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            {getPartnerAvatar(interaction.partner)}
                                            <div>
                                                <div className={`text-sm font-bold ${interaction.partner ? 'text-text-primary ' : 'text-text-muted italic'}`}>
                                                    {interaction.partner || '点击选择伴侣'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {interaction.location && (
                                                        <span className="text-[10px] text-text-muted bg-surface-muted  px-1.5 rounded flex items-center">
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
                                                <button onClick={(e) => removeInteraction(interaction.id, e)} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                             )}
                                             <button className="p-2 rounded-full hover:bg-surface-muted dark:hover:bg-surface-muted text-text-muted hover:text-accent transition-colors"><ChevronRight size={16}/></button>
                                        </div>
                                    </div>
                                    
                                    {/* Action Chain Visual */}
                                    <div className="flex flex-wrap gap-2 items-center min-h-[2rem]">
                                        {interaction.chain.length > 0 ? (
                                            interaction.chain.map((a, i) => (
                                                <div key={a.id} className="flex items-center">
                                                    {(i > 0) && <ArrowRight size={12} className="text-text-muted  mx-1.5" />}
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
                                            <div className="flex items-center text-xs text-text-muted italic py-1 border border-dashed border-surface-border  px-3 rounded-lg w-full justify-center">
                                                <Plus size={12} className="mr-1"/> 添加动作流程...
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags Row (Costume/Toys) */}
                                    {(interaction.costumes?.length > 0 || interaction.toys?.length > 0) && (
                                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-border ">
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
                            className="w-full py-3 rounded-xl border-2 border-dashed border-surface-border  text-text-muted hover:border-accent hover:text-accent hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 text-sm font-bold group"
                        >
                            <div className="w-6 h-6 rounded-full bg-surface-border  flex items-center justify-center group-hover:bg-accent group-hover:text-text-on-accent transition-colors">
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
            className={`fixed inset-0 bg-overlay-scrim/30 backdrop-blur-[2px] z-[60] transition-opacity duration-slow ${editingInteractionId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setEditingInteractionId(null)}
        />
        
        <div 
            className={`fixed inset-x-0 bottom-0 z-[70] bg-surface-card  rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-slow ease-out flex flex-col h-[85vh] ${editingInteractionId ? 'translate-y-0' : 'translate-y-full'}`}
        >
             {/* Drawer Handle */}
             <div className="w-full h-6 flex items-center justify-center flex-none cursor-pointer hover:bg-surface-muted dark:hover:bg-surface-muted active:bg-surface-muted dark:active:bg-surface-muted rounded-t-3xl border-b border-surface-border " onClick={() => setEditingInteractionId(null)}>
                 <div className="w-12 h-1 bg-surface-border dark:bg-surface-muted rounded-full"></div>
             </div>

             {activeInteraction && (
                 <>
                     {/* Drawer Header & Tabs */}
                     <div className="flex-none px-4 pb-2 border-b border-surface-border ">
                         <div className="flex items-center justify-between my-3">
                             <div>
                                 <h3 className="text-lg font-bold text-text-primary  flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs text-text-on-accent">
                                        {data.interactions.findIndex(i => i.id === activeInteraction.id) + 1}
                                    </span>
                                    阶段编辑
                                 </h3>
                             </div>
                             <button onClick={() => setEditingInteractionId(null)} className="px-4 py-1.5 bg-surface-muted  text-text-primary  rounded-full text-xs font-bold hover:bg-surface-border dark:hover:bg-surface-muted">
                                 完成
                             </button>
                         </div>

                         <div className="flex bg-surface-muted  rounded-xl p-1 border border-surface-border ">
                            <TabButton active={activeTab === 'action'} onClick={() => setActiveTab('action')} icon={Activity} label="动作流程" />
                            <TabButton active={activeTab === 'context'} onClick={() => setActiveTab('context')} icon={User} label="伴侣场景" />
                            <TabButton active={activeTab === 'props'} onClick={() => setActiveTab('props')} icon={Tag} label="氛围道具" />
                         </div>
                     </div>

                     {/* Recommendations Bar */}
                     {recommendations.length > 0 && (
                         <div className="flex-none px-4 py-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-b border-surface-border ">
                             <div className="flex items-center gap-2 mb-2">
                                 <Sparkles size={12} className="text-blue-500" />
                                 <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">智能推荐 (Smart Suggest)</span>
                             </div>
                             <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                 {recommendations.map(rec => (
                                     <button 
                                         key={`${rec.type}-${rec.value}`}
                                         onClick={() => handleApplyRecommendation(rec)}
                                         className="flex-shrink-0 px-3 py-1.5 bg-surface-card  text-[10px] font-bold text-text-secondary  rounded-xl shadow-sm border border-surface-border  flex items-center gap-1.5 hover:text-blue-500 hover:border-blue-200 transition-all active:scale-95"
                                     >
                                         <span>{rec.value}</span>
                                         <span className="text-[8px] text-text-muted bg-surface-muted  px-1.5 py-0.5 rounded-md">{rec.type === 'position' ? '姿势' : rec.type === 'toy' ? '玩具' : '服饰'}</span>
                                     </button>
                                 ))}
                             </div>
                         </div>
                     )}

                     <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-surface-card ">
                         
                         {/* TAB 1: ACTION FLOW */}
                         {activeTab === 'action' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
                                 
                                 {/* Timeline Flow (Vertical) */}
                                 <div className="flex-1 min-h-[120px] bg-surface-muted  rounded-2xl border border-surface-border  p-4 relative overflow-hidden">
                                     <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-surface-border  rounded-full"></div>
                                     <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 pl-10">动作时间轴</div>

                                     <div id="timeline-flow" className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2 relative">
                                        {activeInteraction.chain.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 text-text-muted text-xs italic">
                                                <Activity size={24} className="mb-2 opacity-50"/>
                                                点击下方添加动作
                                            </div>
                                        ) : (
                                            activeInteraction.chain.map((a, i) => (
                                                <div
                                                    key={a.id}
                                                    className="relative pl-10"
                                                >
                                                    {/* Dot */}
                                                    <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-surface-border  bg-surface-border z-10"></div>

                                                    {/* Card */}
                                                    <div className={`flex items-center justify-between p-3 rounded-xl border bg-surface-card  shadow-sm ${a.type === 'act' ? 'border-purple-200 dark:border-purple-900' : 'border-blue-200 dark:border-blue-900'}`}>
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className="font-bold text-sm text-text-primary  truncate">{a.name}</span>
                                                            <span className={`text-[10px] uppercase font-bold ${a.type === 'act' ? 'text-purple-500' : 'text-blue-500'}`}>
                                                                {a.type === 'act' ? '行为' : '体位'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveChainItem(i, -1)}
                                                                disabled={i === 0}
                                                                aria-label="上移"
                                                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted dark:hover:bg-surface-muted hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent"
                                                            >
                                                                <ChevronUp size={16}/>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveChainItem(i, 1)}
                                                                disabled={i === activeInteraction.chain.length - 1}
                                                                aria-label="下移"
                                                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted dark:hover:bg-surface-muted hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent"
                                                            >
                                                                <ChevronDown size={16}/>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFromChain(a.id)}
                                                                aria-label="删除"
                                                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500"
                                                            >
                                                                <Trash2 size={16}/>
                                                            </button>
                                                        </div>
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
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block">选择伴侣</label>
                                    {smartPartnerApplied && activeInteraction.partner && (
                                        <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-2 text-[11px] font-bold text-pink-700 dark:border-pink-900/50 dark:bg-pink-900/20 dark:text-pink-300">
                                            <span className="flex items-center gap-1.5"><Sparkles size={12}/> 智能默认 · {activeInteraction.partner} · 可换</span>
                                            <button
                                                type="button"
                                                onClick={() => updateActive('partner', '')}
                                                className="rounded-full px-2 py-0.5 text-[10px] font-black text-pink-600 underline-offset-2 hover:underline dark:text-pink-400"
                                            >清除</button>
                                        </div>
                                    )}
                                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                                        {partners.map(p => {
                                            const isActive = activeInteraction.partner === p.name;
                                            return (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => updateActive('partner', p.name)}
                                                    className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-slow ${isActive ? 'opacity-100 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                                >
                                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold shadow-md ring-2 ${isActive ? 'ring-brand-accent ring-offset-2 dark:ring-offset-slate-900' : 'ring-transparent'} ${p.avatarColor || 'bg-surface-border'} text-text-on-accent`}>
                                                        {p.name[0]}
                                                    </div>
                                                    <span className={`text-[10px] font-medium ${isActive ? 'text-accent' : 'text-text-muted'}`}>{p.name}</span>
                                                </button>
                                            );
                                        })}
                                        {/* Manual Input Fallback */}
                                        <div className="w-[1px] h-14 bg-surface-border  mx-2"></div>
                                        {onAddPartner && (
                                            <button
                                                type="button"
                                                onClick={() => setIsAddPartnerOpen(true)}
                                                className="flex-shrink-0 flex flex-col items-center gap-2 opacity-90 hover:opacity-100"
                                                aria-label="新增伴侣"
                                            >
                                                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 border-2 border-dashed border-accent flex items-center justify-center">
                                                    <Plus size={22} className="text-accent" strokeWidth={3}/>
                                                </div>
                                                <span className="text-[10px] font-bold text-accent">新建</span>
                                            </button>
                                        )}
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-14 h-14 rounded-full bg-surface-muted  border border-surface-border  flex items-center justify-center">
                                                <User size={20} className="text-text-muted"/>
                                            </div>
                                            <input
                                                placeholder="临时伴侣"
                                                value={activeInteraction.partner}
                                                onChange={e => updateActive('partner', e.target.value)}
                                                className="bg-transparent border-b border-surface-border  text-center text-xs w-16 focus:border-accent outline-none text-text-primary  pb-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-surface-border ">
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block">地点</label>
                                        <div className="space-y-3">
                                            {Object.entries(LOCATION_GROUPS).map(([group, locs]) => (
                                                <div key={group} className="flex flex-wrap gap-2 items-center">
                                                    <span className="text-[10px] text-text-muted w-8">{group}</span>
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
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block">角色扮演</label>
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
        <div className={`fixed bottom-0 inset-x-0 z-50 bg-surface-card/95 /95 backdrop-blur-md border-t border-surface-border  transition-transform duration-slow ${editingInteractionId ? 'translate-y-full' : 'translate-y-0'}`}>
             
             {/* Collapsed Bar */}
             <button 
                onClick={() => setIsGlobalPanelOpen(!isGlobalPanelOpen)} 
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-surface-muted dark:hover:bg-surface-muted transition-colors"
             >
                 <div className="flex items-center gap-3">
                     <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                         <GripHorizontal size={14}/> 全局设定
                     </span>
                     <div className="flex gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${data.ejaculation ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-surface-muted  text-text-muted border-transparent'}`}>
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
                    <ChevronDown size={16} className={`text-text-muted transition-transform duration-slow ${isGlobalPanelOpen ? 'rotate-180' : ''}`}/>
                 </div>
             </button>

             {/* Expanded Content */}
             {isGlobalPanelOpen && (
                 <div className="p-5 pb-8 space-y-6 animate-in slide-in-from-bottom-5 max-h-[60vh] overflow-y-auto custom-scrollbar bg-surface-muted ">
                     
                     {/* 1. Safety & State */}
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <label className="text-[10px] text-text-muted uppercase font-bold">保护措施</label>
                             <div className="relative">
                                 <select 
                                    value={data.protection}
                                    onChange={e => updateGlobal('protection', e.target.value)}
                                    className="w-full bg-surface-card  text-text-primary  text-xs rounded-xl p-3 outline-none border border-surface-border  focus:border-accent appearance-none"
                                >
                                    {PROTECTION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-3.5 text-text-muted pointer-events-none"/>
                             </div>
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] text-text-muted uppercase font-bold">自身状态</label>
                             <div className="relative">
                                 <select 
                                    value={data.state}
                                    onChange={e => updateGlobal('state', e.target.value)}
                                    className="w-full bg-surface-card  text-text-primary  text-xs rounded-xl p-3 outline-none border border-surface-border  focus:border-accent appearance-none"
                                >
                                    <option value="">正常</option>
                                    {STATE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-3.5 text-text-muted pointer-events-none"/>
                             </div>
                         </div>
                     </div>

                     {/* 2. Ejaculation Control */}
                     <div className="bg-surface-card  rounded-xl p-4 border border-surface-border  space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-text-primary  flex items-center gap-2"><Droplets size={16} className="text-blue-500"/> 射精详情</span>
                            <button 
                                onClick={() => updateGlobal('ejaculation', !data.ejaculation)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${data.ejaculation ? 'bg-blue-600' : 'bg-surface-border dark:bg-surface-muted'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-surface-card rounded-full transition-transform shadow-sm ${data.ejaculation ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        
                        {data.ejaculation && (
                            <div className="pt-2 border-t border-surface-border  space-y-3 animate-in fade-in">
                                <label className="text-[10px] text-text-muted uppercase font-bold">位置</label>
                                <div className="flex flex-wrap gap-2">
                                    {EJACULATION_LOCATIONS.map(loc => (
                                        <button 
                                            key={loc}
                                            onClick={() => updateGlobal('ejaculationLocation', loc)}
                                            className={`text-[10px] px-3 py-1.5 rounded-lg border font-medium transition-all ${data.ejaculationLocation === loc ? 'bg-blue-600 text-text-on-accent border-blue-600 shadow-md scale-105' : 'bg-surface-muted  text-text-secondary  border-surface-border  hover:border-surface-border'}`}
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                                {data.ejaculationLocation?.includes('口') && (
                                     <div className="flex items-center gap-2 mt-2">
                                         <input id="swallow" type="checkbox" checked={data.semenSwallowed} onChange={e => updateGlobal('semenSwallowed', e.target.checked)} className="accent-pink-500 w-4 h-4 rounded"/>
                                         <label htmlFor="swallow" className="text-xs text-text-secondary  font-bold">吞精</label>
                                     </div>
                                )}
                            </div>
                        )}
                     </div>

                     {/* 3. Indicators Grid */}
                     <div className="space-y-2">
                         <span className="text-[10px] text-text-muted uppercase font-bold">高潮与特殊标记</span>
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
                                    className={`p-3 rounded-xl border flex items-center justify-between font-bold transition-all ${data.indicators[k as keyof typeof data.indicators] ? `bg-surface-card  border-accent shadow-sm ring-1 ring-brand-accent` : 'bg-surface-card  border-surface-border  text-text-muted'}`}
                                 >
                                     <span className="text-xs text-text-primary ">{l}</span>
                                     <Icon size={16} className={data.indicators[k as keyof typeof data.indicators] ? c : 'text-text-muted'}/>
                                 </button>
                             ))}
                         </div>
                     </div>
                     
                     {/* 4. Aftercare & Rating */}
                     <div className="space-y-3 pb-6 border-t border-surface-border  pt-4">
                        {/* Rating */}
                        <div className="bg-surface-card  border border-surface-border  rounded-xl p-3 flex justify-between items-center shadow-sm">
                            <span className="text-xs font-bold text-text-muted">伴侣满意度 / 表现评分</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                        key={star}
                                        onClick={() => updateGlobal('partnerScore', star)}
                                        className={`${(data.partnerScore || 0) >= star ? 'text-yellow-400' : 'text-text-muted '} hover:text-yellow-300 transition-colors`}
                                    >
                                        <Star size={18} fill={(data.partnerScore || 0) >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <span className="text-[10px] text-text-muted uppercase font-bold mt-2 block">善后 / 贤者时间</span>
                        <div className="flex flex-wrap gap-2">
                            {POST_SEX_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateGlobal('postSexActivity', data.postSexActivity?.includes(opt) ? data.postSexActivity.filter(x => x!==opt) : [...(data.postSexActivity||[]), opt])}
                                    className={`text-[10px] px-3 py-1.5 rounded transition-all ${data.postSexActivity?.includes(opt) ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-sm' : 'bg-surface-card  text-text-muted border border-surface-border  hover:border-surface-border'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                     </div>
                 </div>
             )}
        </div>
        <ConfirmModal
            isOpen={!!pendingDeleteInteraction}
            onClose={() => setPendingDeleteInteraction(null)}
            onConfirm={confirmRemoveInteraction}
            title="删除阶段"
            message="确定删除此阶段吗?该阶段的所有动作、伴侣选择都会丢失。"
            confirmLabel="删除"
        />
        {isAddPartnerOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-overlay-scrim/50 backdrop-blur-sm animate-in fade-in duration-normal" onClick={() => { setIsAddPartnerOpen(false); setNewPartnerName(''); }}>
                <div className="bg-surface-card  rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
                    <div>
                        <h3 className="text-base font-black text-text-primary ">新建伴侣</h3>
                        <p className="text-[11px] text-text-muted font-bold mt-1">仅保存名字,详细资料可稍后在「我的」-「伴侣管理」补充</p>
                    </div>
                    <input
                        autoFocus
                        value={newPartnerName}
                        onChange={e => setNewPartnerName(e.target.value)}
                        placeholder="名字 / 称呼"
                        className="w-full bg-surface-muted  border border-surface-border  rounded-xl p-3 text-sm font-bold outline-none focus:border-accent transition-colors"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && newPartnerName.trim() && onAddPartner) {
                                onAddPartner(newPartnerName.trim()).then(p => {
                                    if (p) updateActive('partner', p.name);
                                    setNewPartnerName('');
                                    setIsAddPartnerOpen(false);
                                });
                            }
                        }}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setIsAddPartnerOpen(false); setNewPartnerName(''); }}
                            className="flex-1 min-h-[44px] py-2 bg-surface-muted  text-text-muted font-bold rounded-xl"
                        >
                            取消
                        </button>
                        <button
                            disabled={!newPartnerName.trim() || !onAddPartner}
                            onClick={async () => {
                                if (!onAddPartner || !newPartnerName.trim()) return;
                                const p = await onAddPartner(newPartnerName.trim());
                                if (p) updateActive('partner', p.name);
                                setNewPartnerName('');
                                setIsAddPartnerOpen(false);
                            }}
                            className="flex-[2] min-h-[44px] py-2 bg-accent text-text-on-accent font-black rounded-xl disabled:opacity-50"
                        >
                            添加并选择
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SexRecordModal;
