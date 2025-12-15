
import { LogEntry } from '../types';
import { analyzeSleep } from './helpers';

// --- Matrix Math Utils ---

type Matrix = number[][];
type Vector = number[];

const transpose = (A: Matrix): Matrix => {
    if (A.length === 0) return [];
    return A[0].map((_, colIndex) => A.map(row => row[colIndex]));
};

const multiply = (A: Matrix, B: Matrix): Matrix => {
    const rA = A.length;
    const cA = A[0].length;
    const rB = B.length;
    const cB = B[0].length;
    if (cA !== rB) throw new Error("Matrix dimensions mismatch");
    const C = Array(rA).fill(0).map(() => Array(cB).fill(0));
    for (let i = 0; i < rA; i++) {
        for (let j = 0; j < cB; j++) {
            let sum = 0;
            for (let k = 0; k < cA; k++) {
                sum += A[i][k] * B[k][j];
            }
            C[i][j] = sum;
        }
    }
    return C;
};

const multiplyVector = (A: Matrix, v: Vector): Vector => {
    return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
};

// Gaussian Elimination for Matrix Inverse
const inverse = (A: Matrix): Matrix | null => {
    const n = A.length;
    if (n !== A[0].length) return null; // Must be square

    // Augment with Identity Matrix
    const M = A.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))]);

    for (let i = 0; i < n; i++) {
        // Find pivot
        let pivotRow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(M[j][i]) > Math.abs(M[pivotRow][i])) pivotRow = j;
        }

        // Swap
        [M[i], M[pivotRow]] = [M[pivotRow], M[i]];

        const pivot = M[i][i];
        if (Math.abs(pivot) < 1e-10) return null; // Singular matrix

        // Normalize row
        for (let j = 0; j < 2 * n; j++) M[i][j] /= pivot;

        // Eliminate other rows
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const factor = M[j][i];
                for (let k = 0; k < 2 * n; k++) M[j][k] -= factor * M[i][k];
            }
        }
    }

    // Extract inverse
    return M.map(row => row.slice(n));
};

// --- Regression Logic ---

export interface RegressionResult {
    coefficients: Record<string, number>; // Factor Name -> Weight (Standardized Beta)
    rSquared: number;
    sampleSize: number;
    intercept: number;
}

const factors = [
    { key: 'sleep', label: '睡眠时长' },
    { key: 'alcohol', label: '饮酒量' },
    { key: 'exercise', label: '运动时长' },
    { key: 'masturbation', label: '前日手冲' },
    { key: 'stress', label: '压力水平' },
];

export const performRegression = (logs: LogEntry[], daysWindow: number | 'all'): RegressionResult | null => {
    // 1. Data Preparation & Filtering
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter by window
    let windowLogs = sortedLogs;
    if (daysWindow !== 'all') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysWindow);
        windowLogs = sortedLogs.filter(l => new Date(l.date) >= cutoff);
    }

    // 2. Build Dataset (X and Y)
    // We need pairs of [Predictors(T-1) -> Hardness(T)]
    // Crucial: 
    // - Sleep in Log T affects Hardness in Log T.
    // - Stress/Alcohol/Exercise in Log T is usually recorded for "Today". 
    //   Wait, based on migration V24, logs are strictly aligned to the calendar date.
    //   "Shifts 'alcohol' and 'pornConsumption' from Date D to Date D-1... Now Log(D) represents Date D's activities."
    //   This means Log[T] contains activities done on Day T.
    //   Therefore, Hardness on Morning T+1 is affected by Activities on Day T.
    
    const X_raw: number[][] = [];
    const Y_raw: number[] = [];

    // Map logs by date string for easy lookup of T (Predictor Day) and T+1 (Target Day)
    const logMap = new Map(windowLogs.map(l => [l.date, l]));

    // We iterate through logs. For each log `predLog` (Day T), we look for `targetLog` (Day T+1).
    windowLogs.forEach(predLog => {
        // Calculate Next Day Date String
        const dateT = new Date(predLog.date);
        const dateNext = new Date(dateT);
        dateNext.setDate(dateNext.getDate() + 1);
        const nextDateStr = dateNext.toISOString().split('T')[0]; // Simple YYYY-MM-DD
        
        // Find Target (Morning T+1)
        // Since we filtered windowLogs by date, we might miss the T+1 log if it's outside window but T is inside.
        // For regression, we need valid pairs. We can look up in the full `sortedLogs` or just `logMap`.
        // Let's use `logMap` which is restricted to window. This is cleaner.
        const targetLog = logMap.get(nextDateStr);

        if (!targetLog) return; // No next day record
        if (!targetLog.morning?.wokeWithErection || typeof targetLog.morning?.hardness !== 'number') return; // No valid target

        // Target: Hardness T+1
        const Y = targetLog.morning.hardness;

        // Predictor 1: Sleep leading into T+1 (Stored in Target Log T+1)
        // Note: Sleep typically happens Night T -> Morning T+1. 
        // Our app stores sleep in the log corresponding to the wake up day.
        const sleepAnalysis = analyzeSleep(targetLog.sleep?.startTime, targetLog.sleep?.endTime);
        const sleepHours = sleepAnalysis ? sleepAnalysis.durationHours : 7; // Impute avg if missing? Better to skip? Let's skip if critical data missing.
        
        // Predictors from Day T (Lifestyle)
        const alcoholGrams = predLog.alcoholRecord?.totalGrams || 0;
        const exerciseMins = predLog.exercise ? predLog.exercise.reduce((acc, e) => acc + (e.duration || 0), 0) : 0;
        const mbCount = predLog.masturbation ? predLog.masturbation.length : 0;
        const stress = predLog.stressLevel || 2; // Default to low stress

        // Construct Row
        Y_raw.push(Y);
        X_raw.push([sleepHours, alcoholGrams, exerciseMins, mbCount, stress]);
    });

    const N = Y_raw.length;
    // Need at least (Features + 2) samples for any meaningful regression
    if (N < 7) return null; 

    // 3. Standardization (Z-Score)
    // Important to make coefficients comparable
    const mean = (arr: number[]) => arr.reduce((a,b)=>a+b, 0) / arr.length;
    const std = (arr: number[], m: number) => Math.sqrt(arr.reduce((a,b) => a + (b-m)**2, 0) / (arr.length - 1)) || 1; // Avoid div/0

    const Y_mean = mean(Y_raw);
    const Y_std = std(Y_raw, Y_mean);
    const Y_stdized = Y_raw.map(y => (y - Y_mean) / Y_std);

    // Standardize Columns of X
    const X_cols = factors.map((_, i) => X_raw.map(row => row[i]));
    const X_stats = X_cols.map(col => {
        const m = mean(col);
        const s = std(col, m);
        return { mean: m, std: s };
    });

    const X_stdized = X_raw.map(row => 
        row.map((val, i) => (val - X_stats[i].mean) / (X_stats[i].std || 1)) // Avoid div/0 if std is 0 (constant feature)
    );

    // 4. OLS: Beta = (X'X)^-1 X'Y
    // Add Intercept column (1s) to X
    const X_design = X_stdized.map(row => [1, ...row]);
    
    try {
        const XT = transpose(X_design);
        const XTX = multiply(XT, X_design);
        const XTX_inv = inverse(XTX);
        
        if (!XTX_inv) return null; // Singular matrix (collinearity or constant features)

        const XTY = multiplyVector(XT, Y_stdized);
        const Beta = multiplyVector(XTX_inv, XTY); // [Intercept, b1, b2, b3, b4, b5]

        // 5. Result Formatting
        const coefficients: Record<string, number> = {};
        factors.forEach((f, i) => {
            // Beta[i+1] because index 0 is intercept
            coefficients[f.label] = Beta[i + 1]; 
        });

        // Calculate R-Squared
        // Predicted Y (standardized)
        const Y_pred_std = X_design.map(row => row.reduce((sum, val, i) => sum + val * Beta[i], 0));
        
        // Residual Sum of Squares
        const RSS = Y_stdized.reduce((sum, y, i) => sum + (y - Y_pred_std[i])**2, 0);
        // Total Sum of Squares (since Y is standardized, mean is 0, TSS is roughly N-1, actually sum(y^2))
        const TSS = Y_stdized.reduce((sum, y) => sum + y**2, 0);
        
        const rSquared = 1 - (RSS / (TSS || 1));

        return {
            coefficients,
            rSquared,
            sampleSize: N,
            intercept: Beta[0]
        };

    } catch (e) {
        console.error("Regression Failed", e);
        return null;
    }
};