import React from 'react';
import type { TodayTile, TodayTileKey } from './model/p1Summary';

interface TodayGridProps {
  tiles: TodayTile[];
  onSelect: (key: TodayTileKey) => void;
}

const toneClasses: Record<TodayTile['tone'], string> = {
  blue: 'from-sky-50 to-blue-50 border-sky-100 text-sky-700 dark:from-sky-950/60 dark:to-blue-950/60 dark:border-sky-900/30 dark:text-sky-300',
  emerald: 'from-emerald-50 to-lime-50 border-emerald-100 text-emerald-700 dark:from-emerald-950/60 dark:to-lime-950/60 dark:border-emerald-900/30 dark:text-emerald-300',
  amber: 'from-amber-50 to-orange-50 border-amber-100 text-amber-700 dark:from-amber-950/60 dark:to-orange-950/60 dark:border-amber-900/30 dark:text-amber-300',
  pink: 'from-pink-50 to-rose-50 border-pink-100 text-pink-700 dark:from-pink-950/60 dark:to-rose-950/60 dark:border-pink-900/30 dark:text-pink-300',
  violet: 'from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700 dark:from-violet-950/60 dark:to-fuchsia-950/60 dark:border-violet-900/30 dark:text-violet-300',
  slate: 'from-slate-50 to-white border-slate-100 text-slate-700 dark:from-slate-900 dark:to-slate-950 dark:border-slate-800 dark:text-slate-200'
};

const TodayGrid: React.FC<TodayGridProps> = ({ tiles, onSelect }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">今日九宫格</h2>
      <span className="text-[10px] font-bold text-slate-400">状态 + 数字</span>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          onClick={() => onSelect(tile.key)}
          className={`min-h-[104px] rounded-[1.5rem] border bg-gradient-to-br p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] ${toneClasses[tile.tone]}`}
        >
          <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{tile.label}</div>
          <div className="mt-2 text-xl font-black leading-none">{tile.value}</div>
          <div className="mt-2 line-clamp-2 text-[11px] font-bold opacity-75">{tile.status}</div>
        </button>
      ))}
    </div>
  </section>
);

export default TodayGrid;
