
import { LogEntry } from '../types';

export interface DrinkPreset {
    key: string;
    name: string;
    volume: number;
    abv: number;
    icon: string;
    category: 'beer' | 'spirit' | 'wine' | 'mixed' | 'other';
}

// 扩展后的普适酒类预设库，适配截图 3 的快速加酒网格
export const DRINK_TYPES: DrinkPreset[] = [
    // 啤酒类
    { key: 'beer_bottle', name: '大瓶啤酒', volume: 500, abv: 4.0, icon: '🍺', category: 'beer' },
    { key: 'beer_can', name: '罐装啤酒', volume: 330, abv: 4.5, icon: '🥫', category: 'beer' },
    { key: 'beer_glass', name: '瓶装啤酒', volume: 600, abv: 3.5, icon: '🍾', category: 'beer' },
    
    // 白酒类
    { key: 'baijiu_1', name: '1两白酒', volume: 50, abv: 52.0, icon: '🍶', category: 'spirit' },
    { key: 'baijiu_half', name: '半斤白酒', volume: 250, abv: 42.0, icon: '🏺', category: 'spirit' },
    
    // 葡萄酒
    { key: 'red_wine', name: '红酒(杯)', volume: 150, abv: 12.5, icon: '🍷', category: 'wine' },
    { key: 'champagne', name: '香槟/气泡', volume: 125, abv: 12.0, icon: '🥂', category: 'wine' },

    // 洋酒/其他
    { key: 'whisky', name: '威士忌', volume: 45, abv: 40.0, icon: '🥃', category: 'spirit' },
    { key: 'brandy', name: '白兰地', volume: 45, abv: 40.0, icon: '🥃', category: 'spirit' },
    { key: 'soju', name: '韩国烧酒', volume: 360, abv: 16.5, icon: '🧪', category: 'other' },
    { key: 'cocktail', name: '鸡尾酒', volume: 250, abv: 15.0, icon: '🍸', category: 'mixed' },
];

/**
 * 计算纯酒精克数公式：
 * 酒精克数 = 饮酒量(ml) × 酒精度(ABV%) × 0.8 (酒精密度)
 */
export const calculatePureAlcohol = (volume: number, abv: number): number => {
    return Math.round((volume * (abv / 100) * 0.8) * 10) / 10;
};

export const getPrediction = (grams: number) => {
    // 预测模型：每 25g 酒精降低约 1 级硬度
    const impact = Math.min(2.5, grams / 25);
    return {
        impact: impact.toFixed(1),
        predicted: Math.max(1, Math.round(4 - impact))
    };
};

export const updateAlcoholModel = (logs: LogEntry[]) => {
    // 预留接口
};
