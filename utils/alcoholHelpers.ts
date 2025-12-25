import { LogEntry } from '../types';

export interface DrinkPreset {
    key: string;
    name: string;
    volume: number;
    abv: number;
    icon: string;
}

// 简化后的核心品类
export const DRINK_TYPES: DrinkPreset[] = [
    { key: 'beer', name: '啤酒', volume: 500, abv: 4.0, icon: '🍺' },
    { key: 'baijiu', name: '白酒', volume: 50, abv: 52.0, icon: '🍶' },
    { key: 'red_wine', name: '红酒', volume: 150, abv: 12.5, icon: '🍷' },
    { key: 'fruit_wine', name: '果酒', volume: 330, abv: 8.0, icon: '🍑' },
    { key: 'soju', name: '烧酒', volume: 360, abv: 16.5, icon: '🧪' },
    { key: 'sake', name: '清酒', volume: 180, abv: 15.0, icon: '🍵' },
    { key: 'cocktail', name: '鸡尾酒', volume: 250, abv: 15.0, icon: '🍸' },
    { key: 'other_wine', name: '其他', volume: 100, abv: 15.0, icon: '🥂' },
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
