import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
/* Added Droplets and Edit2 to imports from lucide-react */
import { X, Check, Clock, Film, PenLine, Plus, Minus, BatteryCharging, Wind, Sparkles, Hash, Settings, Users, ChevronRight, ArrowLeft, Trash2, Tag, MonitorPlay, Search, ArrowRight, Zap, Banana, Droplets, Edit2 } from 'lucide-react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, ContentItem } from '../types';
import Modal from './Modal';
import { calculateInventory } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import { XP_GROUPS } from '../utils/constants';

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
    // 核心状态：view 用于控制双模式切换
    const [view, setView] = useState<'finish' | 'details'>('details');
    const [data, setData] = useState<MasturbationRecordDetails>({
        id: '', startTime: '', duration: 15, status: 'completed', tools: ['手'], contentItems: [],
        materials: [], props: [], assets: { sources: [], platforms: [], categories: [], target: '', actors: [] }, materialsList: [],
        edging: 'none', edgingCount: 0, lubricant: '', useCondom: false, ejaculation: true, orgasmIntensity: 3,
        mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], notes: '',
        volumeForceLevel: 3, postMood: '平静/贤者', fatigue: '无明显疲劳'
    });

    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

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
                // 重点：如果条目是“进行中”，则首先展示双选界面
                setView(initialData.status === 'inProgress' ? 'finish' : 'details');
            } else {
                setView('details');
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
        }
    }, [isOpen, initialData]);

    const handleQuickSettle = () => {
        const now = new Date();
        const [h, m] = (data.startTime || '00:00').split(':').map(Number);
        let diff = (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m);
        if (diff < 0) diff += 1440;
        onSave({ ...data, duration: Math.max(1, diff), status: 'completed', quickLog: true });
        onClose();
    };

    const handleGoToDetails = () => {
        const now = new Date();
        const [h, m] = (data.startTime || '00:00').split(':').map(Number);
        let diff = (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m);
        if (diff < 0) diff += 1440;
        setData(prev => ({ ...prev, duration: Math.max(1, diff) }));
        setView('details');
    };

    const handleSave = () => {
        onSave({ ...data, status: 'completed' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={view === 'finish' ? "施法结束" : (initialData ? "编辑记录" : "记录施法")}
            footer={view === 'details' ? (
                <button onClick={handleSave} className="w-full py-4 bg-brand-accent text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Check size={20} strokeWidth={3}/> 保存记录
                </button>
            ) : null}
        >
            {view === 'finish' ? (
                <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center space-y-2 mb-8">
                        <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
                            <Banana size={40} />
                        </div>
                        <h3 className="text-xl font-black text-brand-text dark:text-slate-100">功德圆满，如何结算？</h3>
                        <p className="text-sm text-brand-muted">记录将自动计算本次施法时长</p>
                    </div>

                    <div className="grid gap-4">
                        <button 
                            onClick={handleQuickSettle}
                            className="group p-6 bg-slate-50 dark:bg-slate-900 border-2 border-transparent hover:border-emerald-500/50 rounded-3xl text-left transition-all active:scale-[0.98] shadow-sm flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Zap size={24}/>
                                </div>
                                <div>
                                    <div className="font-black text-slate-800 dark:text-slate-100">快速结案</div>
                                    <div className="text-xs text-slate-400 mt-1">仅保存时间，稍后再补全</div>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-300" />
                        </button>

                        <button 
                            onClick={handleGoToDetails}
                            className="group p-6 bg-slate-50 dark:bg-slate-900 border-2 border-transparent hover:border-brand-accent/50 rounded-3xl text-left transition-all active:scale-[0.98] shadow-sm flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Sparkles size={24}/>
                                </div>
                                <div>
                                    <div className="font-black text-slate-800 dark:text-slate-100">完善详情</div>
                                    <div className="text-xs text-slate-400 mt-1">记录素材、体感与贤者心情</div>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-300" />
                        </button>
                    </div>

                    <button onClick={onClose} className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">取消并继续计时</button>
                </div>
            ) : (
                <div className="space-y-8 pb-10 animate-in fade-in duration-300">
                    {/* 时间卡片 */}
                    <div className="bg-blue-50 dark:bg-slate-900/50 rounded-[2rem] p-6 border border-blue-100 dark:border-white/5 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm"><Clock size={24}/></div>
                             <div>
                                 <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-0.5">施法时长 (分)</label>
                                 <div className="flex items-baseline gap-2">
                                     <input type="number" value={data.duration} onChange={e => setData({...data, duration: parseInt(e.target.value) || 0})} className="bg-transparent text-3xl font-black text-blue-600 dark:text-blue-400 w-16 outline-none"/>
                                     <span className="text-sm font-bold text-blue-300">MINS</span>
                                 </div>
                             </div>
                        </div>
                        <div className="text-right">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">开始时刻</label>
                             <input type="time" value={data.startTime} onChange={e => setData({...data, startTime: e.target.value})} className="bg-transparent text-lg font-mono font-bold text-slate-600 dark:text-slate-300 outline-none text-right w-20"/>
                        </div>
                    </div>

                    {/* 射精位置与力度 */}
                    <div className="space-y-5">
                        <div className="flex justify-between items-center px-1">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Droplets size={14}/> 释放反馈</label>
                             <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                                 <button onClick={() => setData({...data, ejaculation: true})} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${data.ejaculation ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}>已射精</button>
                                 <button onClick={() => setData({...data, ejaculation: false})} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${!data.ejaculation ? 'bg-white dark:bg-slate-700 text-slate-600 shadow-sm' : 'text-slate-400'}`}>Edging</button>
                             </div>
                        </div>
                        
                        {data.ejaculation && (
                            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-5 gap-2">
                                    {FORCE_LEVELS.map(f => {
                                        const isSel = data.volumeForceLevel === f.lvl;
                                        return (
                                            <button key={f.lvl} onClick={() => setData({...data, volumeForceLevel: f.lvl})} className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all ${isSel ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400 opacity-60'}`}>
                                                <span className="text-sm font-black">Lv.{f.lvl}</span>
                                                <span className="text-[8px] font-bold mt-0.5">{f.label.split('/')[0]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-[10px] text-slate-500 italic border border-slate-100 dark:border-white/5">
                                    <span className="font-black text-blue-500 mr-2">特征</span> 
                                    {FORCE_LEVELS.find(f => f.lvl === data.volumeForceLevel)?.desc}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 素材库 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MonitorPlay size={14}/> 素材清单</label>
                             <button onClick={() => setEditingItem({ id: Math.random().toString(36).substr(2, 9), type: '视频', platform: 'Telegram', title: '', actors: [], xpTags: [], notes: '' })} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Plus size={16}/></button>
                        </div>
                        <div className="space-y-2">
                            {data.contentItems?.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm">
                                     <div className="flex items-center gap-3">
                                         <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400"><Film size={16}/></div>
                                         <div>
                                             <div className="text-xs font-black text-slate-700 dark:text-slate-200">{item.title || item.type}</div>
                                             <div className="text-[10px] text-slate-400 font-bold">{item.platform}</div>
                                         </div>
                                     </div>
                                     <div className="flex gap-1">
                                         <button onClick={() => setEditingItem(item)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={14}/></button>
                                         <button onClick={() => setData({...data, contentItems: data.contentItems.filter(i => i.id !== item.id)})} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                     </div>
                                </div>
                            ))}
                            {data.contentItems.length === 0 && <div className="text-center py-6 text-xs text-slate-300 italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">暂无素材记录</div>}
                        </div>
                    </div>

                    {/* 贤者总结 */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10}/> 贤者心情</label>
                             <select value={data.postMood} onChange={e => setData({...data, postMood: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                                 {POST_MOOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><BatteryCharging size={10}/> 生理疲劳</label>
                             <select value={data.fatigue} onChange={e => setData({...data, fatigue: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                                 {FATIGUE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                        </div>
                    </div>

                    <div className="relative group pt-4">
                        <div className="absolute left-5 top-8 text-slate-400 group-focus-within:text-blue-500 transition-colors"><PenLine size={18} /></div>
                        <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-3xl p-5 pl-14 text-xs font-medium outline-none focus:border-blue-400 min-h-[120px]" placeholder="记录施法中的特别感受、XP新大陆或被打断的原因..." value={data.notes} onChange={e => setData({...data, notes: e.target.value})}/>
                    </div>
                </div>
            )}

            {/* 素材编辑内部弹窗 */}
            <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="编辑素材详情">
                 {editingItem && (
                     <div className="space-y-6 pb-4">
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase">内容形式</label>
                                 <select value={editingItem.type} onChange={e => setEditingItem({...editingItem, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 text-xs font-bold">
                                     {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase">平台来源</label>
                                 <select value={editingItem.platform} onChange={e => setEditingItem({...editingItem, platform: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 text-xs font-bold">
                                     {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                 </select>
                             </div>
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase">标题/别名</label>
                             <input value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} placeholder="识别此素材的名称..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 text-xs font-bold"/>
                         </div>
                         <button 
                             onClick={() => {
                                 const nextItems = data.contentItems.find(i => i.id === editingItem.id) 
                                     ? data.contentItems.map(i => i.id === editingItem.id ? editingItem : i)
                                     : [...data.contentItems, editingItem];
                                 setData({...data, contentItems: nextItems});
                                 setEditingItem(null);
                             }}
                             className="w-full py-4 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl"
                         >保存素材信息</button>
                     </div>
                 )}
            </Modal>
        </Modal>
    );
};

export default MasturbationRecordModal;