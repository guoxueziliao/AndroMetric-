import { LogEntry } from '../types';

export const hydrateLog = (partial: Partial<LogEntry>): LogEntry => {
    const now = new Date().toISOString();
    return {
        date: partial.date || new Date().toISOString().split('T')[0],
        status: partial.status || 'pending',
        updatedAt: Date.now(),
        morning: {
            id: 'default',
            wokeWithErection: false,
            ...partial.morning
        },
        sleep: {
            id: 'default',
            quality: 3,
            naps: [],
            ...partial.sleep
        },
        health: {
            isSick: false,
            ...partial.health
        },
        location: partial.location || null,
        weather: partial.weather || null,
        mood: partial.mood || null,
        stressLevel: partial.stressLevel || null,
        alcohol: partial.alcohol || 'none',
        alcoholRecord: partial.alcoholRecord || { totalGrams: 0, durationMinutes: 0, isLate: false, items: [] },
        pornConsumption: partial.pornConsumption || 'none',
        caffeineIntake: partial.caffeineIntake || 'none',
        dailyEvents: partial.dailyEvents || [],
        exercise: partial.exercise || [],
        sex: partial.sex || [],
        masturbation: partial.masturbation || [],
        tags: partial.tags || [],
        notes: partial.notes || '',
        changeHistory: partial.changeHistory || []
    };
};