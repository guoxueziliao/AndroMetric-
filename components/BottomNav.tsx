import React from 'react';
import { Calendar, BarChart3, User, HeartHandshake } from 'lucide-react';

type ActiveView = 'calendar' | 'stats' | 'sexlife' | 'my';

interface BottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
  const activeClasses = 'text-brand-accent bg-blue-50 dark:bg-slate-800 scale-105';
  const inactiveClasses = 'text-brand-muted hover:text-brand-text';
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all w-16 ${isActive ? activeClasses : inactiveClasses}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      {/* <span className="text-[10px] mt-1 font-bold">{label}</span> */}
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="fixed bottom-6 left-6 right-6 max-w-2xl mx-auto z-40">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full shadow-lg border border-slate-100 dark:border-slate-800 h-16 flex justify-around items-center px-2">
        <NavItem
          icon={Calendar}
          label="日历"
          isActive={activeView === 'calendar'}
          onClick={() => onViewChange('calendar')}
        />
        <NavItem
          icon={BarChart3}
          label="统计"
          isActive={activeView === 'stats'}
          onClick={() => onViewChange('stats')}
        />
        <NavItem
          icon={HeartHandshake}
          label="性爱"
          isActive={activeView === 'sexlife'}
          onClick={() => onViewChange('sexlife')}
        />
        <NavItem
          icon={User}
          label="我的"
          isActive={activeView === 'my'}
          onClick={() => onViewChange('my')}
        />
      </div>
    </nav>
  );
};

export default BottomNav;