
import React, { useState, useEffect } from 'react';
import { Clock, Check, Coffee, CupSoda, Zap, Plus, Minus, Leaf, Beer } from 'lucide-react';
import Modal from './Modal';
import { CaffeineItem } from '../types';

interface CaffeineRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: CaffeineItem) => void;
}

// --- Deeply Localized Category & Drink Data ---

type DrinkCategory = 'coffee' | 'milk_tea' | 'chinese_tea' | 'energy';

const CATEGORIES: { id: DrinkCategory; name: string; icon: React.ElementType }[] = [
    { id: 'coffee', name: '经典咖啡', icon: Coffee },
    { id: 'milk_tea', name: '新式茶饮', icon: CupSoda },
    { id: 'chinese_tea', name: '传统中式茶', icon: Leaf },
    { id: 'energy', name: '功能饮料', icon: Zap },
];

const DRINK_DATABASE: Record<DrinkCategory, { name: string; defaultVol: number; tags?: string[] }[]> = {
    coffee: [
        { name: '生椰拿铁', defaultVol: 480, tags: ['瑞幸/库迪'] },
        { name: '橙C美式', defaultVol: 480, tags: ['瑞幸'] },
        { name: '陨石拿铁', defaultVol: 480, tags: ['瑞幸'] },
        { name: '酱香拿铁', defaultVol: 480, tags: ['瑞幸/茅台'] },
        { name: '冰美式', defaultVol: 480, tags: ['基础提神'] },
        { name: 'Dirty/脏咖', defaultVol: 200, tags: ['小份浓郁'] },
        { name: '澳白/FlatWhite', defaultVol: 300, tags: ['星巴克/Manner'] },
        { name: '潘帕斯拿铁', defaultVol: 480, tags: ['库迪'] },
        { name: '浓缩 (Espresso)', defaultVol: 30, tags: ['高浓度'] },
    ],
    milk_tea: [
        { name: '伯牙绝弦', defaultVol: 500, tags: ['霸王茶姬'] },
        { name: '幽兰拿铁', defaultVol: 450, tags: ['茶颜悦色'] },
        { name: '多肉葡萄', defaultVol: 650, tags: ['喜茶/奈雪'] },
        { name: '杨枝甘露', defaultVol: 500, tags: ['沪上阿姨/7分甜'] },
        { name: '冰鲜柠檬水', defaultVol: 600, tags: ['蜜雪冰城'] },
        { name: '珍珠奶茶', defaultVol: 500, tags: ['一点点/CoCo'] },
        { name: '吨吨桶', defaultVol: 1000, tags: ['蜜雪/奈雪'] },
        { name: '绿开心', defaultVol: 500, tags: ['沪上阿姨'] },
    ],
    chinese_tea: [
        { name: '熟普洱', defaultVol: 300, tags: ['消食/解腻'] },
        { name: '生普洱', defaultVol: 300, tags: ['高咖啡因'] },
        { name: '大红袍/岩茶', defaultVol: 300, tags: ['乌龙茶系'] },
        { name: '正山小种/红茶', defaultVol: 300, tags: ['经典红茶'] },
        { name: '龙井/绿茶', defaultVol: 300, tags: ['清爽'] },
        { name: '白毫银针/白茶', defaultVol: 300, tags: ['甘甜'] },
        { name: '茉莉花茶', defaultVol: 300, tags: ['清香'] },
        { name: '铁观音', defaultVol: 300, tags: ['乌龙茶系'] },
    ],
    energy: [
        { name: '东方树叶', defaultVol: 500, tags: ['无糖茶饮'] },
        { name: '红牛/东鹏', defaultVol: 250, tags: ['高牛磺酸'] },
        { name: '外星人电解质水', defaultVol: 500, tags: ['补水'] },
        { name: '三得利乌龙茶', defaultVol: 500, tags: ['刮油'] },
        { name: '可乐/雪碧', defaultVol: 330, tags: ['快乐水'] },
        { name: '维他柠檬茶', defaultVol: 250, tags: ['提神'] },
    ]
};

const SIZE_PRESETS = [
    { label: '浓缩', val: 30, desc: 'Shot' },
    { label: '小杯', val: 200, desc: 'Dirty' },
    { label: '中杯', val: 360, desc: '瑞幸/标准' },
    { label: '大杯', val: 480, desc: 'Luckin/Starbucks' },
    { label: '标准', val: 500, desc: '奶茶标准' },
    { label: '超大', val: 650, desc: '大杯水果茶' },
    { label: '吨吨桶', val: 1000, desc: '蜜雪冰城' },
];

const CaffeineRecordModal: React.FC<CaffeineRecordModalProps> = ({ isOpen, onClose, onSave }) => {
    const [time, setTime] = useState('');
    const [activeCategory, setActiveCategory] = useState<DrinkCategory>('coffee');
    const [selectedName, setSelectedName] = useState('');
    const [volume, setVolume] = useState(480);
    const [isCustomMode, setIsCustomMode] = useState(false);

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
            <div className="h-[75vh] flex flex-col -mx-4 relative overflow-hidden">
                
                {/* 1. Header: Status Bar */}
                <div className="px-4 mb-4 flex-none">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                                {(() => {
                                    const Icon = CATEGORIES.find(c => c.id === activeCategory)?.icon;
                                    return Icon ? <Icon size={24} className="text-amber-600" /> : <Coffee size={24} className="text-amber-600" />;
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

                {/* 2. Body: Category & Grid */}
                <div className="flex-1 flex overflow-hidden border-t border-slate-100 dark:border-slate-800">
                    
                    {/* Left: Category Sidebar */}
                    <div className="w-24 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col gap-1 p-2 overflow-y-auto custom-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveCategory(cat.id); setIsCustomMode(false); }}
                                className={`flex flex-col items-center justify-center py-4 px-1 rounded-xl transition-all ${
                                    activeCategory === cat.id && !isCustomMode
                                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-500 shadow-sm font-bold border border-slate-100 dark:border-slate-700 scale-105' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <cat.icon size={20} className="mb-2"/>
                                <span className="text-[10px] whitespace-nowrap">{cat.name}</span>
                            </button>
                        ))}
                        
                        <div className="my-2 border-t border-slate-200 dark:border-slate-800 opacity-50"></div>
                        
                        <button
                            onClick={() => { setIsCustomMode(true); setSelectedName(''); }}
                            className={`flex flex-col items-center justify-center py-4 px-1 rounded-xl transition-all ${
                                isCustomMode
                                ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm font-bold border border-amber-200 dark:border-amber-800' 
                                : 'text-slate-400 border border-dashed border-slate-300 dark:border-slate-700'
                            }`}
                        >
                            <Plus size={20} className="mb-2"/>
                            <span className="text-[10px]">自定义</span>
                        </button>
                    </div>

                    {/* Right: Items Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-900 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-3 pb-20">
                            {DRINK_DATABASE[activeCategory].map(drink => (
                                <button
                                    key={drink.name}
                                    onClick={() => handleSelectDrink(drink)}
                                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                                        selectedName === drink.name && !isCustomMode
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500' 
                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-sm font-black text-brand-text dark:text-slate-100">{drink.name}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                                <span className="font-mono">{drink.defaultVol}ml</span>
                                                {drink.tags && (
                                                    <div className="flex gap-1">
                                                        {drink.tags.map(t => (
                                                            <span key={t} className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold">{t}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {selectedName === drink.name && !isCustomMode && (
                                            <div className="bg-amber-500 text-white rounded-full p-1 shadow-sm">
                                                <Check size={12} strokeWidth={4}/>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Bottom: Volume Tweaker */}
                <div className="flex-none p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">单杯精确毫升 (ml)</label>
                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700">
                            <button onClick={() => setVolume(v => Math.max(10, v - 10))} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-amber-50 rounded-lg text-slate-500 shadow-sm transition-colors"><Minus size={14} strokeWidth={3}/></button>
                            <input 
                                className="w-16 text-center bg-transparent text-lg font-black text-brand-text dark:text-slate-100 outline-none font-mono" 
                                value={volume}
                                onChange={e => setVolume(parseInt(e.target.value) || 0)}
                            />
                            <button onClick={() => setVolume(v => v + 10)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-amber-50 rounded-lg text-slate-500 shadow-sm transition-colors"><Plus size={14} strokeWidth={3}/></button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1">
                        {SIZE_PRESETS.map(preset => (
                            <button
                                key={preset.val}
                                onClick={() => setVolume(preset.val)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border transition-all min-w-[85px] ${
                                    volume === preset.val
                                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400 font-black shadow-sm ring-1 ring-amber-500/20'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-amber-200'
                                }`}
                            >
                                <span className="text-xs">{preset.label}</span>
                                <span className="text-[10px] opacity-60 font-mono mt-0.5">{preset.val}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CaffeineRecordModal;
