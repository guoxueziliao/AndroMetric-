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
      className={`group relative flex flex-col items-center justify-center flex-1 h-14 transition-all duration-300 active:scale-90 ${
        isActive 
          ? 'text-brand-accent' 
          : 'text-brand-muted hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 scale-110' : ''}`}>
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      {isActive && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-accent animate-in zoom-in duration-300"></span>
      )}
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full">
      {/* 毛玻璃背景容器 */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 px-2 pt-2 pb-8 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-none ring-1 ring-black/5">
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
      
      {/* 适配 iOS 底部安全区 (Home Indicator) 的额外空白 */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl"></div>
    </nav>
  );
};

export default BottomNav;