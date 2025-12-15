
export const DRINK_TYPES = [
    { key: 'beer', name: '啤酒', volume: 330, abv: 0.05, pure: 13.2, icon: '🍺' },
    { key: 'wine', name: '红酒', volume: 150, abv: 0.13, pure: 15.6, icon: '🍷' },
    { key: 'liquor', name: '白酒/洋酒', volume: 45, abv: 0.40, pure: 14.4, icon: '🥃' },
    { key: 'cocktail', name: '鸡尾酒', volume: 200, abv: 0.10, pure: 16.0, icon: '🍸' },
];

export const getPrediction = (grams: number) => {
    // Simple mock model
    return { predicted: 3, drop: grams > 40 ? 1 : 0, samples: 10 };
};

export const updateAlcoholModel = (logs: any[]) => {
    // Stub
};
