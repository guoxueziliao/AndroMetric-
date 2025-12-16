
import React from 'react';
import { Calendar, BarChart3, User, HeartHandshake } from 'lucide-react';

type ActiveView = 'calendar' | 'stats' | 'sexlife' | 'my';

interface BottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
        isActive 
          ? 'bg-brand-accent text-white shadow-glow translate-y-[-4px]' 
          : 'text-brand-muted hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      {isActive && (
        <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-brand-accent"></span>
      )}
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-auto">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-2 flex gap-2 ring-1 ring-black/5">
        <NavItem
          icon={Calendar}
          isActive={activeView === 'calendar'}
          onClick={() => onViewChange('calendar')}
        />
        <NavItem
          icon={BarChart3}
          isActive={activeView === 'stats'}
          onClick={() => onViewChange('stats')}
        />
        <NavItem
          icon={HeartHandshake}
          isActive={activeView === 'sexlife'}
          onClick={() => onViewChange('sexlife')}
        />
        <NavItem
          icon={User}
          isActive={activeView === 'my'}
          onClick={() => onViewChange('my')}
        />
      </div>
    </nav>
  );
};

export default BottomNav;
