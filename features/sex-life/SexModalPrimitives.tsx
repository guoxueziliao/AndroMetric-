import React from 'react';

/**
 * SexRecordModal 内部专用的小型展示原件。仅用于该 modal,不暴露到 shared/ui。
 */

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-surface-card  border border-surface-border  shadow-sm rounded-2xl ${className}`}
  >
    {children}
  </div>
);

export const Chip: React.FC<{ label: string; active: boolean; onClick: () => void; color?: string }> = ({ label, active, onClick }) => (
  <button
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-normal active:scale-95 whitespace-nowrap border ${
      active
        ? 'bg-accent text-text-on-accent border-accent shadow-sm'
        : 'bg-surface-muted  text-text-secondary  border-surface-border  hover:border-accent/50'
    }`}
  >
    {label}
  </button>
);

export const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all flex-1 relative
      ${active ? 'text-accent bg-chart-primary ' : 'text-text-muted hover:text-text-secondary dark:hover:text-text-muted'}`}
  >
    <div className="p-2 rounded-full mb-1">
      <Icon size={18} />
    </div>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);
