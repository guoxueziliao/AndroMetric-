
import React from 'react';
import { Mood, StressLevel } from '../types';

// --- Reusable Controls ---

export const IconToggleButton = ({ options, selected, onSelect, renderIcon }: { options: {value: string, label: string}[], selected: any, onSelect: (val: any) => void, renderIcon: (val: any) => React.ReactNode }) => (
    <div className={`grid ${options.length >= 5 ? 'grid-cols-5' : options.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
        {options.map(({ value, label }) => (
            <button 
                key={value} 
                type="button" 
                onClick={() => onSelect(value)} 
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all active:scale-95 ${selected === value ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-accent border-brand-accent shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-brand-muted hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
                {renderIcon(value)}
                <span className="text-[10px] mt-1 font-medium">{label}</span>
            </button>
        ))}
    </div>
);

export const RangeSlider = ({ value, min, max, onChange, leftLabel, rightLabel, colorClass = "accent-brand-accent" }: any) => (
    <div className="space-y-1">
        <div className="flex justify-between text-xs text-brand-muted px-1">
            <span>{leftLabel}</span>
            <span className="font-bold text-brand-text dark:text-slate-300">{value}</span>
            <span>{rightLabel}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value || min} 
            onChange={(e) => onChange(Number(e.target.value))} 
            className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${colorClass}`}
        />
    </div>
);

export const FaceSelector = ({ options, value, onChange }: { options: { val: any, label: string, emoji: string, color: string }[], value: any, onChange: (val: any) => void }) => (
    <div className="flex justify-between gap-1">
        {options.map((opt) => {
            const isSelected = value === opt.val;
            return (
                <button
                    key={opt.val}
                    type="button"
                    onClick={() => onChange(opt.val)}
                    className={`flex flex-col items-center transition-all duration-200 ${isSelected ? 'scale-110 -translate-y-1' : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105'}`}
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 ${isSelected ? `border-white dark:border-slate-800 shadow-md ${opt.color}` : 'bg-slate-100 dark:bg-slate-800 border-transparent'}`}>
                        {opt.emoji}
                    </div>
                    <span className={`text-[10px] mt-1 font-bold ${isSelected ? 'text-brand-text dark:text-slate-100' : 'text-slate-400'}`}>
                        {opt.label}
                    </span>
                </button>
            )
        })}
    </div>
);

// --- Constants ---

export const MOOD_FACES: { val: Mood, label: string, emoji: string, color: string }[] = [
    { val: 'excited', label: '兴奋', emoji: '🤩', color: 'bg-pink-100' },
    { val: 'happy', label: '开心', emoji: '😆', color: 'bg-green-100' },
    { val: 'neutral', label: '平淡', emoji: '😐', color: 'bg-slate-100' },
    { val: 'anxious', label: '焦虑', emoji: '😰', color: 'bg-orange-100' },
    { val: 'sad', label: '低落', emoji: '😭', color: 'bg-blue-100' },
    { val: 'angry', label: '生气', emoji: '😡', color: 'bg-red-100' },
];

export const STRESS_FACES: { val: StressLevel, label: string, emoji: string, color: string }[] = [
    { val: 1, label: '放松', emoji: '😌', color: 'bg-green-100' },
    { val: 2, label: '还好', emoji: '🙂', color: 'bg-lime-100' },
    { val: 3, label: '一般', emoji: '😐', color: 'bg-yellow-100' },
    { val: 4, label: '压力', emoji: '😓', color: 'bg-orange-100' },
    { val: 5, label: '崩溃', emoji: '🤯', color: 'bg-red-100' },
];
