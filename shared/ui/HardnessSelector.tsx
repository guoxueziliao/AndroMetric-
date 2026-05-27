import React from 'react';
import { motion } from 'framer-motion';

type Density = 'compact' | 'comfortable';

interface HardnessSelectorProps {
  value: number;
  onChange?: (value: number) => void;
  density?: Density;
  readOnly?: boolean;
  showDescription?: boolean;
}

interface LevelDef {
  val: number;
  primary: string;
  sub: string;
  description: string;
  color: string;
  selectedColor: string;
  barHeight: { compact: number; comfortable: number };
}

const LEVELS: LevelDef[] = [
  {
    val: 1,
    primary: '疲软',
    sub: '豆腐',
    description: '充血不足，阴茎完全柔软',
    color: 'bg-accent-muted/20 border-accent-muted/30',
    selectedColor: 'bg-accent-muted border-accent-muted shadow-glow',
    barHeight: { compact: 20, comfortable: 32 },
  },
  {
    val: 2,
    primary: '轻度勃起',
    sub: '剥皮',
    description: '轻微充血，硬度欠佳',
    color: 'bg-accent-muted/35 border-accent-muted/45',
    selectedColor: 'bg-accent-muted border-accent-muted shadow-glow',
    barHeight: { compact: 28, comfortable: 44 },
  },
  {
    val: 3,
    primary: '半勃起',
    sub: '带皮',
    description: '中等充血，勉强可插入',
    color: 'bg-accent/40 border-accent/50',
    selectedColor: 'bg-accent border-accent shadow-glow',
    barHeight: { compact: 36, comfortable: 56 },
  },
  {
    val: 4,
    primary: '充分勃起',
    sub: '冻瓜',
    description: '充分充血，可稳定插入',
    color: 'bg-accent/65 border-accent/75',
    selectedColor: 'bg-accent border-accent-hover shadow-glow',
    barHeight: { compact: 44, comfortable: 68 },
  },
  {
    val: 5,
    primary: '完全勃起',
    sub: '铁棒',
    description: '最大充血，高硬度',
    color: 'bg-surface-inverted/60 border-surface-inverted/70',
    selectedColor: 'bg-surface-inverted border-surface-inverted shadow-glow',
    barHeight: { compact: 52, comfortable: 80 },
  },
];

const HardnessSelector: React.FC<HardnessSelectorProps> = ({
  value,
  onChange,
  density = 'comfortable',
  readOnly = false,
  showDescription,
}) => {
  const resolvedShowDesc = showDescription ?? (density === 'comfortable');
  const interactive = !readOnly && !!onChange;

  return (
    <div className={`bg-surface-muted rounded-2xl border border-surface-border transition-colors ${density === 'compact' ? 'p-3' : 'p-5'}`}>
      {/* Bar segments */}
      <div className={`flex justify-between items-end px-1 ${density === 'compact' ? 'h-14 mb-2' : 'h-20 mb-3'}`}>
        {LEVELS.map((level) => {
          const isSelected = value === level.val;
          const barH = level.barHeight[density];

          return (
            <button
              key={level.val}
              type="button"
              onClick={interactive ? () => onChange(level.val) : undefined}
              disabled={!interactive}
              className={`group flex flex-col items-center gap-1 flex-1 relative z-10 focus:outline-none ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <motion.div
                className={`
                  w-full max-w-[2rem] rounded-lg border-2 transition-colors
                  ${isSelected ? level.selectedColor : level.color}
                  ${!isSelected && interactive ? 'opacity-40 dark:opacity-25 hover:opacity-80' : ''}
                  ${!isSelected && !interactive ? 'opacity-30 dark:opacity-20' : ''}
                `}
                animate={{
                  height: isSelected ? barH * 1.15 : barH,
                  scale: isSelected ? 1.05 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            </button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between px-1">
        {LEVELS.map((level) => {
          const isSelected = value === level.val;
          return (
            <div
              key={level.val}
              className={`flex-1 flex flex-col items-center transition-all ${isSelected ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className={`text-[10px] font-black leading-tight ${isSelected ? 'text-accent' : 'text-text-muted'}`}>
                {level.primary}
              </span>
              {density === 'comfortable' && (
                <span className={`text-[8px] font-bold mt-0.5 ${isSelected ? 'text-text-muted' : 'text-text-muted/60'}`}>
                  {level.sub}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Description */}
      {resolvedShowDesc && (
        <div className="text-center mt-3 min-h-[1.2rem]">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-bold text-accent"
          >
            {LEVELS[value - 1]?.description}
          </motion.span>
        </div>
      )}
    </div>
  );
};

export default HardnessSelector;
