
import { LogEntry } from '../types';

export interface DrinkPreset {
    key: string;
    name: string;
    volume: number;
    abv: number;
    icon: string;
    category: 'beer' | 'spirit' | 'wine' | 'mixed' | 'other';
}

// 扩展后的普适酒类预设库
export const DRINK_TYPES: DrinkPreset[] = [
    // 啤酒类
    { key: 'beer_can', name: '听装啤酒', volume: 330, abv: 4.5, icon: '🥫', category: 'beer' },
    { key: 'beer_bottle', name: '大瓶啤酒', volume: 500, abv: 4.0, icon: '🍺', category: 'beer' },
    { key: 'beer_craft', name: '精酿/原浆', volume: 500, abv: 6.5, icon: '🍻', category: 'beer' },
    
    // 白酒类
    { key: 'baijiu_sip', name: '一小杯白酒', volume: 15, abv: 52.0, icon: '🍶', category: 'spirit' },
    { key: 'baijiu_1', name: '白酒 (1两)', volume: 50, abv: 52.0, icon: '🥃', category: 'spirit' },
    { key: 'baijiu_half', name: '半斤白酒', volume: 250, abv: 42.0, icon: '🏺', category: 'spirit' },
    
    // 红/白/黄酒
    { key: 'red_wine', name: '红酒 (标准杯)', volume: 150, abv: 12.5, icon: '🍷', category: 'wine' },
    { key: 'yellow_wine', name: '黄酒 (1碗)', volume: 200, abv: 15.0, icon: '🥣', category: 'wine' },
    { key: 'champagne', name: '香槟/气泡', volume: 125, abv: 12.0, icon: '🥂', category: 'wine' },

    // 日韩/流行
    { key: 'soju', name: '韩国烧酒', volume: 360, abv: 16.5, icon: '🧪', category: 'other' },
    { key: 'sake', name: '清酒', volume: 180, abv: 15.0, icon: '🍵', category: 'other' },
    { key: 'highball', name: '嗨棒 (Highball)', volume: 350, abv: 8.0, icon: '🍹', category: 'mixed' },

    // 洋酒/调味
    { key: 'whisky', name: '威士忌 (Pure)', volume: 45, abv: 40.0, icon: '🥃', category: 'spirit' },
    { key: 'brandy', name: '白兰地', volume: 45, abv: 40.0, icon: '🥃', category: 'spirit' },
    { key: 'cocktail', name: '经典鸡尾酒', volume: 200, abv: 18.0, icon: '🍸', category: 'mixed' },
];

/**
 * 计算纯酒精克数公式：
 * 酒精克数 = 饮酒量(ml) × 酒精度(ABV%) × 0.8 (酒精密度)
 */
export const calculatePureAlcohol = (volume: number, abv: number): number => {
    return Math.round((volume * (abv / 100) * 0.8) * 10) / 10;
};

// 预设计算
export const PRESET_DRINKS = DRINK_TYPES.map(d => ({
    ...d,
    pure: calculatePureAlcohol(d.volume, d.abv)
}));

export const getPrediction = (grams: number) => {
    // 酒精对硬度的负面影响预测模型
    const impact = Math.min(2.5, grams / 25);
    return {
        impact: impact.toFixed(1),
        predicted: Math.max(1, Math.round(4 - impact))
    };
};

export const updateAlcoholModel = (logs: LogEntry[]) => {
    // 预留接口
};
