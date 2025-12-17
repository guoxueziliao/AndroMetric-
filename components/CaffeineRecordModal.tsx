
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Check, Coffee, CupSoda, Zap, ChevronRight, Search, Plus, Minus, X } from 'lucide-react';
import Modal from './Modal';
import { CaffeineItem } from '../types';

interface CaffeineRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: CaffeineItem) => void;
}

// --- Localized Data Configuration ---

type DrinkCategory = 'coffee' | 'tea' | 'soda';

const CATEGORIES: { id: DrinkCategory; name: string; icon: React.ElementType }[] = [
    { id: 'coffee', name: '咖啡', icon: Coffee },
    { id: 'tea', name: '奶茶/茶', icon: CupSoda },
    { id: 'soda', name: '饮料/提神', icon: Zap },
];

const DRINK_DATABASE: Record<DrinkCategory, { name: string; defaultVol: number; tags?: string[] }[]> = {
    coffee: [
        { name: '美式咖啡', defaultVol: 480, tags: ['瑞幸', '星巴克'] },
        { name: '拿铁', defaultVol: 480, tags: ['奶咖'] },
        { name: '生椰拿铁', defaultVol: 480, tags: ['瑞幸/库迪', '爆款'] },
        { name: '澳白/FlatWhite', defaultVol: 300, tags: ['浓郁'] },
        { name: 'Dirty/脏咖', defaultVol: 200, tags: ['小份'] },
        { name: '冷萃/冰滴', defaultVol: 350, tags: ['提神'] },
        { name: '浓缩 (Espresso)', defaultVol: 30, tags: ['Shot'] },
    ],
    tea: [
        { name: '鲜奶茶', defaultVol: 500, tags: ['霸王茶姬', '茶颜'] },
        { name: '珍珠奶茶', defaultVol: 500, tags: ['一点点', 'CoCo'] },
        { name: '水果茶', defaultVol: 650, tags: ['喜茶', '奈雪'] },
        { name: '柠檬水', defaultVol: 600, tags: ['蜜雪冰城'] },
        { name: '原叶茶', defaultVol: 300, tags: ['功夫茶', '茶包'] },
        { name: '抹茶拿铁', defaultVol: 480, tags: ['星巴克'] },
        { name: '吨吨桶', defaultVol: 1000, tags: ['蜜雪', '超大'] },
    ],
    soda: [
        { name: '可乐/雪碧', defaultVol: 330, tags: ['快乐水'] },
        { name: '红牛/东鹏', defaultVol: 250, tags: ['功能饮料'] },
        { name: '电解质水', defaultVol: 500, tags: ['外星人'] },
        { name: '无糖茶', defaultVol: 500, tags: ['东方树叶'] },
    ]
};

const SIZE_PRESETS = [
    { label: '小/浓缩', val: 200, desc: 'Dirty/小杯' },
    { label: '中杯', val: 360, desc: '瑞幸热饮' },
    { label: '大杯', val: 480, desc: '瑞幸/星巴克' },
    { label: '标准', val: 500, desc: '奶茶店标配' },
    { label: '超大', val: 650, desc: '喜茶/水果茶' },
    { label: '吨吨桶', val: 1000, desc: '蜜雪冰城' },
];

const CaffeineRecordModal: React.FC<CaffeineRecordModalProps> = ({ isOpen, onClose, onSave }) => {
    const [time, setTime] = useState('');
    const [activeCategory, setActiveCategory] = useState<DrinkCategory>('coffee');
    const [selectedName, setSelectedName] = useState('');
    const [volume, setVolume] = useState(480);
    const [isCustomMode, setIsCustomMode] = useState(false); // If user types custom name

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            setSelectedName('生椰拿铁');
            setVolume(480);
            setActiveCategory('coffee');
            setIsCustomMode(false);
        }
    }, [isOpen]);

    const handleSelectDrink = (drink: { name: string; defaultVol: number }) => {
        setSelectedName(drink.name);
        setVolume(drink.defaultVol);
        setIsCustomMode(false);
    };

    const handleSelectSize = (size: number) => {
        setVolume(size);
    };

    const handleSave = () => {
        if (!time || !selectedName) return;
        const newItem: CaffeineItem = {
            id: Date.now().toString(),
            name: selectedName,
            time: time,
            count: 1,
            volume: volume
        };
        onSave(newItem);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="记录提神饮品"
            footer={
                <button 
                    onClick={handleSave} 
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center transition-all active:scale-[0.98]"
                >
                    <Check size={20} className="mr-2"/> 确认记录
                </button>
            }
        >
            <div className="h-[75vh] flex flex-col -mx-4 relative">
                
                {/* 1. Header: Time & Preview */}
                <div className="px-4 mb-4 flex-none">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                                {(() => {
                                    const Icon = CATEGORIES.find(c => c.id === activeCategory)?.icon;
                                    return Icon ? <Icon size={24} className="text-amber-600" /> : null;
                                })()}
                            </div>
                            <div className="min-w-0">
                                {isCustomMode ? (
                                    <input 
                                        autoFocus
                                        value={selectedName}
                                        onChange={e => setSelectedName(e.target.value)}
                                        className="bg-transparent font-bold text-lg text-brand-text dark:text-slate-100 outline-none w-full placeholder-slate-400"
                                        placeholder="输入饮品名称..."
                                    />
                                ) : (
                                    <div className="font-black text-lg text-brand-text dark:text-slate-100 truncate">{selectedName}</div>
                                )}
                                <div className="text-xs font-mono text-slate-500 font-bold mt-0.5 flex items-center">
                                    <span className="bg-white dark:bg-slate-700 px-1.5 rounded border border-slate-100 dark:border-slate-600 mr-2">{volume} ml</span>
                                    {time}
                                </div>
                            </div>
                        </div>
                        <input 
                            type="time" 
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="bg-transparent text-right font-mono font-bold text-slate-400 outline-none w-20 text-sm"
                        />
                    </div>
                </div>

                {/* 2. Main Content: Split View */}
                <div className="flex-1 flex overflow-hidden border-t border-slate-100 dark:border-slate-800">
                    
                    {/* Left: Categories */}
                    <div className="w-24 bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 flex flex-col gap-1 p-2 overflow-y-auto custom-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all ${
                                    activeCategory === cat.id 
                                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-500 shadow-sm font-bold border border-slate-100 dark:border-slate-700' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <cat.icon size={20} className="mb-1"/>
                                <span className="text-[10px]">{cat.name.split('/')[0]}</span>
                            </button>
                        ))}
                        
                        {/* Custom Button */}
                        <button
                            onClick={() => { setIsCustomMode(true); setSelectedName(''); }}
                            className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all mt-auto ${
                                isCustomMode
                                ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm font-bold' 
                                : 'text-slate-400 border border-dashed border-slate-300 dark:border-slate-700'
                            }`}
                        >
                            <Plus size={20} className="mb-1"/>
                            <span className="text-[10px]">自定义</span>
                        </button>
                    </div>

                    {/* Right: Items Grid */}
                    <div className="flex-1 overflow-y-auto p-3 bg-white dark:bg-slate-900 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-3 pb-20">
                            {DRINK_DATABASE[activeCategory].map(drink => (
                                <button
                                    key={drink.name}
                                    onClick={() => handleSelectDrink(drink)}
                                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                                        selectedName === drink.name && !isCustomMode
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500' 
                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <div className="text-sm font-bold text-brand-text dark:text-slate-200">{drink.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                        <span>{drink.defaultVol}ml</span>
                                        {drink.tags && <span className="opacity-70 text-[9px] bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-500 dark:text-slate-300">{drink.tags[0]}</span>}
                                    </div>
                                    {selectedName === drink.name && !isCustomMode && (
                                        <div className="absolute right-0 bottom-0 p-1 bg-amber-500 text-white rounded-tl-lg">
                                            <Check size={12} strokeWidth={3}/>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Sheet: Size Selector (Fixed) */}
                <div className="flex-none p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-10">
                    <div className="flex justify-between items-end mb-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">容量选择 (ml)</label>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button onClick={() => setVolume(v => Math.max(10, v - 10))} className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500"><Minus size={12}/></button>
                            <input 
                                className="w-12 text-center bg-transparent text-sm font-black text-brand-text dark:text-slate-200 outline-none" 
                                value={volume}
                                onChange={e => setVolume(parseInt(e.target.value) || 0)}
                            />
                            <button onClick={() => setVolume(v => v + 10)} className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500"><Plus size={12}/></button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        {SIZE_PRESETS.map(preset => (
                            <button
                                key={preset.val}
                                onClick={() => handleSelectSize(preset.val)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl border transition-all min-w-[70px] ${
                                    volume === preset.val
                                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400 font-bold'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                <span className="text-xs">{preset.label}</span>
                                <span className="text-[10px] opacity-60 font-normal">{preset.val}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CaffeineRecordModal;
