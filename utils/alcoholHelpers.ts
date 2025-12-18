
import { LogEntry } from '../types';

// 更普适的大众酒类预设
export const DRINK_TYPES = [
    { key: 'beer_bottle', name: '大瓶啤酒', volume: 500, abv: 4.0, icon: '🍺', category: 'beer' },
    { key: 'beer_can', name: '听装啤酒', volume: 330, abv: 4.5, icon: '🥫', category: 'beer' },
    { key: 'red_wine', name: '红酒 (杯)', volume: 150, abv: 12.0, icon: '🍷', category: 'wine' },
    { key: 'baijiu_1', name: '白酒 (1两)', volume: 50, abv: 52.0, icon: '🍶', category: 'spirit' },
    { key: 'baijiu_half', name: '半斤白酒', volume: 250, abv: 42.0, icon: '🏺', category: 'spirit' },
    { key: 'whisky', name: '威士忌', volume: 45, abv: 40.0, icon: '🥃', category: 'spirit' },
    { key: 'cocktail', name: '鸡尾酒', volume: 250, abv: 15.0, icon: '🍸', category: 'mixed' },
    { key: 'yellow_wine', name: '黄酒/花雕', volume: 200, abv: 15.0, icon: '🍶', category: 'other' },
];

/**
 * 计算纯酒精克数公式：
 * 酒精克数 = 饮酒量(ml) × 酒精度(ABV%) × 0.8 (酒精密度)
 */
export const calculatePureAlcohol = (volume: number, abv: number): number => {
    return Math.round((volume * (abv / 100) * 0.8) * 10) / 10;
};

// 预设计算每个预设的纯酒精量
export const PRESET_DRINKS = DRINK_TYPES.map(d => ({
    ...d,
    pure: calculatePureAlcohol(d.volume, d.abv)
}));

export const getPrediction = (grams: number) => {
    // 简单的负反馈预测：每 20g 酒精可能降低 0.5-1 级硬度
    const impact = Math.min(2.5, grams / 25);
    return {
        impact: impact.toFixed(1),
        predicted: Math.max(1, Math.round(4 - impact))
    };
};

export const updateAlcoholModel = (logs: LogEntry[]) => {
    // 预留插件接口
};
