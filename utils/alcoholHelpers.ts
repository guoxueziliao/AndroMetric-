
import { LogEntry } from '../types';

export interface DrinkPreset {
    key: string;
    name: string;
    volume: number;
    abv: number;
    icon: string;
    category: 'beer' | 'spirit' | 'wine' | 'mixed' | 'other';
}

// 与截图 3/4 匹配的预设库
export const DRINK_TYPES: DrinkPreset[] = [
    { key: 'beer_bottle_large', name: '大瓶啤酒', volume: 500, abv: 4.0, icon: '🍺', category: 'beer' },
    { key: 'beer_can', name: '罐装啤酒', volume: 330, abv: 4.5, icon: '🥫', category: 'beer' },
    { key: 'beer_bottle_std', name: '瓶装啤酒', volume: 600, abv: 3.5, icon: '🍾', category: 'beer' },
    { key: 'baijiu_1', name: '1两白酒', volume: 50, abv: 52.0, icon: '🍶', category: 'spirit' },
    { key: 'baijiu_half', name: '半斤白酒', volume: 250, abv: 42.0, icon: '🏺', category: 'spirit' },
    { key: 'medicinal_wine', name: '药酒', volume: 50, abv: 35.0, icon: '🏥', category: 'spirit' },
    { key: 'red_wine', name: '红酒(杯)', volume: 150, abv: 12.5, icon: '🍷', category: 'wine' },
    { key: 'fruit_wine', name: '果酒', volume: 330, abv: 8.0, icon: '🍑', category: 'wine' },
    { key: 'soju', name: '韩国烧酒', volume: 360, abv: 16.5, icon: '🧪', category: 'other' },
    { key: 'sake', name: '清酒', volume: 180, abv: 15.0, icon: '🍵', category: 'other' },
    { key: 'cocktail', name: '鸡尾酒', volume: 250, abv: 15.0, icon: '🍸', category: 'mixed' },
];

export const calculatePureAlcohol = (volume: number, abv: number): number => {
    return Math.round((volume * (abv / 100) * 0.8) * 10) / 10;
};

export const getPrediction = (grams: number) => {
    // 根据摄入量预测对身体的影响等级（1-5级）
    let predicted = 1;
    if (grams > 100) predicted = 5;
    else if (grams > 60) predicted = 4;
    else if (grams > 30) predicted = 3;
    else if (grams > 10) predicted = 2;

    const impact = Math.min(2.5, grams / 25).toFixed(1);
    return { impact, predicted };
};

export const updateAlcoholModel = (logs: LogEntry[]) => {
    // 逻辑预留
};
