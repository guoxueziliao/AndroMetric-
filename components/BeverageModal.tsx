import React, { useState, useEffect } from 'react';
import { X, Clock, Coffee, CupSoda, Leaf, Zap, Plus, Minus, Check, PencilLine } from 'lucide-react';
import Modal from './Modal';
import { CaffeineItem } from '../types';

interface BeverageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: CaffeineItem) => void;
    initialData?: CaffeineItem;
}

const CATEGORIES = [
    { id: 'coffee', label: '经典咖啡', icon: Coffee },
    { id: 'new_tea', label: '新式茶饮', icon: CupSoda },
    { id: 'chinese_tea', label: '传统中国茶', icon: Leaf },
    { id: 'functional', label: '功能/碳酸', icon: Zap },
    { id: 'custom', label: '自定义', icon: Plus },
];

const MENU_DATA: Record<string, any[]> = {
    coffee: [
        { name: '美式咖啡', vol: 480, desc: '标准' },
        { name: '拿铁', vol: 480, desc: '标准' },
        { name: '卡布奇诺', vol: 360, desc: '标准' },
        { name: '澳白 (Flat White)', vol: 300, desc: '标准' },
        { name: 'Dirty (脏咖)', vol: 200, desc: '标准' },
        { name: '摩卡', vol: 480, desc: '标准' },
        { name: '浓缩 (Espresso)', vol: 30, desc: '标准' },
        { name: '冷萃/冰滴', vol: 350, desc: '标准' },
    ],
    new_tea: [
        { name: '原叶鲜奶茶', vol: 500, desc: '标准' },
        { name: '经典奶茶 (奶精/轻乳)', vol: 500, desc: '标准' },
        { name: '水果茶 (大杯)', vol: 650, desc: '标准' },
        { name: '柠檬水/果味饮', vol: 600, desc: '标准' },
        { name: '芝士/奶盖茶', vol: 500, desc: '标准' },
        { name: '纯茶 (现泡/冷萃)', vol: 500, desc: '标准' },
        { name: '超级桶/吨吨桶', vol: 1000, desc: '标准' },
    ],
    chinese_tea: [
        { type: 'divider', label: '—— 经典名茶 ——' },
        { name: '西湖龙井', vol: 300, desc: '标准' },
        { name: '普洱熟茶', vol: 300, desc: '标准' },
        { name: '普洱生茶', vol: 300, desc: '标准' },
        { name: '安溪铁观音', vol: 300, desc: '标准' },
        { name: '武夷大红袍', vol: 300, desc: '标准' },
        { name: '洞庭碧螺春', vol: 300, desc: '标准' },
        { name: '茉莉花茶', vol: 300, desc: '标准' },
        { type: 'divider', label: '—— 六大茶系 ——' },
        { name: '绿茶 (炒青/烘青)', vol: 300, desc: '标准' },
        { name: '红茶 (滇红/祁红)', vol: 300, desc: '标准' },
        { name: '乌龙茶 (青茶)', vol: 300, desc: '标准' },
        { name: '白茶 (白毫银针/寿眉)', vol: 300, desc: '标准' },
        { name: '黑茶 (六堡/安化)', vol: 300, desc: '标准' },
        { name: '黄茶 (君山银针)', vol: 300, desc: '标准' },
    ],
    functional: [
        { name: '红牛/战马', vol: 250, desc: '标准' },
        { name: '魔爪 (Monster)', vol: 500, desc: '标准' },
        { name: '东鹏特饮', vol: 250, desc: '标准' },
        { name: '可乐/雪碧', vol: 330, desc: '标准' },
        { name: '力保健/提神液', vol: 100, desc: '标准' },
        { name: '电解质水', vol: 500, desc: '标准' },
    ]
};

const CUP_SIZES = [
    { label: '浓缩', vol: 30 },
    { label: '小杯', vol: 200 },
    { label: '中杯', vol: 360 },
    { label: '大杯', vol: 480 },
];

const BeverageModal: React.FC<BeverageModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [activeCat, setActiveCat] = useState('coffee');
    const [selectedName, setSelectedName] = useState('拿铁');
    const [volume, setVolume] = useState(480);
    const [time, setTime] = useState('');
    const [customName, setCustomName] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setSelectedName(initialData.name);
                setVolume(initialData.volume);
                setTime(initialData.time);
                if (initialData.isCustom) {
                    setActiveCat('custom');
                    setCustomName(initialData.name);
                } else {
                    // Try to find category
                    for (const catId of Object.keys(MENU_DATA)) {
                        if (MENU_DATA[catId].some(i => i.name === initialData.name)) {
                            setActiveCat(catId);
                            break;
                        }
                    }
                }
            } else {
                const now = new Date();
                setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                setActiveCat('coffee');
                setSelectedName('拿铁');
                setVolume(480);
                setCustomName('');
            }
        }
    }, [isOpen, initialData]);

    const handleItemClick = (item: any) => {
        if (item.type === 'divider') return;
        setSelectedName(item.name);
        setVolume(item.vol);
    };

    const handleConfirm = () => {
        const name = activeCat === 'custom' ? (customName || '自定义饮品') : selectedName;
        onSave({
            id: initialData?.id || Date.now().toString(),
            name,
            volume,
            time,
            count: 1,
            isCustom: activeCat === 'custom'
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "修改记录" : "记录提神饮品"}>
            <div className="flex flex-col h-[75vh] -mx-4 -mb-4">
                {/* Top Summary Display */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100 dark:border-orange-900/20">
                                <Coffee size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                                    {activeCat === 'custom' ? (customName || '请输入名称...') : selectedName}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 tabular-nums">
                                        {volume} ml
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold tabular-nums">{time}</span>
                                </div>
                            </div>
                        </div>
                        <Clock size={20} className="text-slate-300" />
                    </div>
                </div>

                {/* Main Content Area: Sidebar + List */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar */}
                    <div className="w-24 bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 flex flex-col pt-2 shrink-0">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCat(cat.id)}
                                className={`flex flex-col items-center justify-center py-4 px-1 gap-1 transition-all relative ${
                                    activeCat === cat.id ? 'text-orange-600 dark:text-orange-400 font-black' : 'text-slate-400 font-bold'
                                }`}
                            >
                                {activeCat === cat.id && (
                                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-orange-500 rounded-r-full"></div>
                                )}
                                <cat.icon size={20} />
                                <span className="text-[10px] text-center leading-tight">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right Item List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        {activeCat === 'custom' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">饮品名称</label>
                                <div className="relative">
                                    <PencilLine className="absolute left-3 top-3.5 text-orange-400" size={18} />
                                    <input 
                                        autoFocus
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        placeholder="例如：库迪生椰拿铁"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-orange-900/30 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {MENU_DATA[activeCat]?.map((item, idx) => (
                                    item.type === 'divider' ? (
                                        <div key={`div-${idx}`} className="py-2 text-[10px] font-black text-slate-300 dark:text-slate-600 text-center uppercase tracking-[0.2em]">
                                            {item.label}
                                        </div>
                                    ) : (
                                        <button
                                            key={item.name}
                                            onClick={() => handleItemClick(item)}
                                            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                                selectedName === item.name && activeCat !== 'custom'
                                                ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-900/10'
                                                : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-200'
                                            }`}
                                        >
                                            <div className="text-left">
                                                <div className="text-sm font-black text-slate-700 dark:text-slate-200">{item.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">{item.vol}ml {item.desc}</div>
                                            </div>
                                            {selectedName === item.name && activeCat !== 'custom' && (
                                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                                    <Check size={14} strokeWidth={4} />
                                                </div>
                                            )}
                                        </button>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Adjustment Area */}
                <div className="px-6 py-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-6 shrink-0">
                    {/* Precise ML Adjustment */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">单杯精确毫升 (ML)</span>
                        <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <button onClick={() => setVolume(v => Math.max(10, v - 10))} className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-slate-400 active:scale-90 transition-transform">
                                <Minus size={16} strokeWidth={3} />
                            </button>
                            <span className="text-xl font-black text-slate-800 dark:text-slate-100 w-16 text-center tabular-nums">{volume}</span>
                            <button onClick={() => setVolume(v => v + 10)} className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-slate-400 active:scale-90 transition-transform">
                                <Plus size={16} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Cup Sizes */}
                    <div className="grid grid-cols-4 gap-3">
                        {CUP_SIZES.map(size => (
                            <button
                                key={size.label}
                                onClick={() => setVolume(size.vol)}
                                className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border-2 transition-all ${
                                    volume === size.vol 
                                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 text-orange-600' 
                                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800 text-slate-400'
                                }`}
                            >
                                <span className="text-xs font-black mb-0.5">{size.label}</span>
                                <span className="text-[10px] font-bold opacity-60">{size.vol}</span>
                            </button>
                        ))}
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <Check size={20} strokeWidth={3} />
                        {initialData ? "确认修改" : "确认记录"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BeverageModal;