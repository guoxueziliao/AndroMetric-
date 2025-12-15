
import { LogEntry } from '../types';

// Built-in Drink Types
export const DRINK_TYPES = [
    { key: 'beer_500', name: '大瓶啤酒', volume: 500, abv: 5.0, pure: 19.8, icon: '🍺' },
    { key: 'beer_330', name: '罐装啤酒', volume: 330, abv: 5.0, pure: 13.0, icon: '🥫' },
    { key: 'beer_600', name: '瓶装啤酒', volume: 600, abv: 4.8, pure: 22.8, icon: '🍾' },
    { key: 'baijiu_50', name: '1两白酒', volume: 50, abv: 52, pure: 20.6, icon: '🍶' },
    { key: 'baijiu_250', name: '半斤白酒', volume: 250, abv: 52, pure: 102.7, icon: '🏺' },
    { key: 'red_150', name: '红酒(杯)', volume: 150, abv: 13, pure: 15.4, icon: '🍷' },
    { key: 'cocktail', name: '鸡尾酒', volume: 300, abv: 20, pure: 47.5, icon: '🍸' },
    { key: 'whisky_50', name: '威士忌', volume: 50, abv: 40, pure: 15.8, icon: '🥃' },
    { key: 'sake_180', name: '清酒(合)', volume: 180, abv: 15, pure: 21.4, icon: '🍶' },
];

export const getDrinkByKey = (key: string) => DRINK_TYPES.find(d => d.key === key);

// --- Model Logic ---

/**
 * Calculates the personal alcohol impact model.
 * Stores result in localStorage keys: HD_alcohol_k, HD_alcohol_baseline, HD_alcohol_model_ver
 */
export const updateAlcoholModel = (logs: LogEntry[]) => {
    if (!logs || logs.length === 0) return;

    // 1. Calculate Baseline (Average hardness on days with NO alcohol in last 60 days)
    const validNoAlcLogs = logs.filter(l => 
        l.status === 'completed' &&
        l.morning?.wokeWithErection &&
        typeof l.morning?.hardness === 'number' &&
        (!l.alcohol || l.alcohol === 'none') &&
        (!l.alcoholRecord || l.alcoholRecord.totalGrams === 0)
    ).slice(0, 60); // Limit lookback

    if (validNoAlcLogs.length < 5) return; // Not enough baseline data

    const baselineSum = validNoAlcLogs.reduce((acc, l) => acc + (l.morning?.hardness || 0), 0);
    const baseline = baselineSum / validNoAlcLogs.length;

    // 2. Find Pairs: Drink(Day T) -> Hardness(Day T+1)
    // Note: Due to app logic, LogEntry[Date T] contains Drink(Day T) AND Morning(Day T).
    // So Drinking on Log[T] affects Morning of Log[T+1].
    // We need to sort logs chronologically.
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let sumX = 0; // Alcohol Grams / 10
    let sumY = 0; // Hardness Drop
    let sumXY = 0;
    let sumX2 = 0;
    let n = 0;

    for (let i = 0; i < sortedLogs.length - 1; i++) {
        const drinkLog = sortedLogs[i];
        const nextMorningLog = sortedLogs[i+1]; // Simplified: Assume consecutive days for now. 
        
        // Strict check: Is nextMorningLog actually the next day?
        const d1 = new Date(drinkLog.date);
        const d2 = new Date(nextMorningLog.date);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays !== 1) continue; // Not consecutive days

        // Check if there was significant alcohol
        const alcoholGrams = drinkLog.alcoholRecord?.totalGrams || 0;
        if (alcoholGrams < 10) continue; // Ignore tiny amounts

        // Check if next morning has valid hardness
        if (!nextMorningLog.morning?.wokeWithErection || typeof nextMorningLog.morning?.hardness !== 'number') continue;

        const drop = baseline - nextMorningLog.morning.hardness;
        
        // We only care about drops (alcohol usually doesn't increase hardness). 
        // If hardness increased, maybe other factors involved, treat as 0 drop or ignore?
        // Let's include all to be fair, but maybe weight negative drops less?
        // For simple linear regression, just include it.
        
        const x = alcoholGrams / 10; // Scale down for easier numbers
        const y = drop;

        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        n++;
    }

    if (n < 3) return; // Need at least 3 valid drink->morning pairs

    // Linear Regression through origin (Force 0g alcohol = 0 drop) -> Slope k = sumXY / sumX2
    // Or standard regression: we assume baseline is fixed, so we model Drop = k * Alcohol.
    // Minimizing error for y = kx -> k = sum(xy) / sum(x^2)
    const k = sumXY / sumX2;

    // Persist
    localStorage.setItem('HD_alcohol_k', (k * 10).toFixed(4)); // Store as "Drop per 10g" roughly? No, k is Drop per (Grams/10).
    // So if k=0.3, it means 1 unit of X (10g alcohol) causes 0.3 drop.
    // Storing exactly that.
    localStorage.setItem('HD_alcohol_baseline', baseline.toFixed(2));
    localStorage.setItem('HD_alcohol_model_ver', n.toString());
};

export const getPrediction = (currentGrams: number) => {
    const kStr = localStorage.getItem('HD_alcohol_k');
    const baseStr = localStorage.getItem('HD_alcohol_baseline');
    const countStr = localStorage.getItem('HD_alcohol_model_ver');

    if (!kStr || !baseStr) return null;

    const k = parseFloat(kStr); // Drop per 10g
    const baseline = parseFloat(baseStr);
    const count = parseInt(countStr || '0');

    // Formula: Hardness = Baseline - (k * (grams/10))
    const drop = k * (currentGrams / 10);
    const predicted = Math.max(1, baseline - drop);

    // Calculate safe allowance for target levels
    const safeGramsFor4 = ((baseline - 4) / k) * 10;
    const safeGramsFor3 = ((baseline - 3) / k) * 10;

    return {
        baseline,
        predicted: parseFloat(predicted.toFixed(1)),
        drop: parseFloat(drop.toFixed(1)),
        samples: count,
        safeLimits: {
            level4: Math.max(0, Math.floor(safeGramsFor4)),
            level3: Math.max(0, Math.floor(safeGramsFor3))
        }
    };
};