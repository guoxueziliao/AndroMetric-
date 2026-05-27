import React from 'react';
import type { TodayTile, TodayTileKey } from './model/p1Summary';

interface TodayGridProps {
  tiles: TodayTile[];
  onSelect: (key: TodayTileKey) => void;
}

const toneClasses: Record<TodayTile['tone'], string> = {
  blue: 'from-state-info-bg to-state-info-bg/60 border-state-info-text/25 text-state-info-text',
  emerald: 'from-state-success-bg to-state-success-bg/60 border-state-success-text/25 text-state-success-text',
  amber: 'from-state-warning-bg to-state-warning-bg/60 border-state-warning-text/25 text-state-warning-text',
  pink: 'from-accent-vivid/10 to-accent-vivid/5 border-accent-vivid/30 text-accent-vivid',
  violet: 'from-chart-tertiary/10 to-chart-tertiary/5 border-chart-tertiary/30 text-chart-tertiary',
  slate: 'from-surface-muted to-surface-card border-surface-border text-text-secondary'
};

const TodayGrid: React.FC<TodayGridProps> = ({ tiles, onSelect }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">今日九宫格</h2>
      <span className="text-[10px] font-bold text-text-muted">状态 + 数字</span>
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
