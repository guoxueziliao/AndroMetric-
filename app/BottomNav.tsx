import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, User, Heart } from 'lucide-react';

type ActiveView = 'calendar' | 'state' | 'sexlife' | 'my';

interface BottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  label: string;
}> = ({ icon: Icon, isActive, onClick, label }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      aria-pressed={isActive}
      className={`group relative flex flex-col items-center justify-center flex-1 min-h-[56px] gap-0.5 py-1 transition-colors duration-300 ${
        isActive
        ? 'text-brand-accent'
        : 'text-brand-muted hover:text-text-muted dark:hover:text-text-muted'
      }`}
    >
      <motion.div
        animate={isActive ? { scale: 1.1, y: 0 } : { scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`p-1.5 rounded-2xl transition-colors duration-300 ${isActive ? 'bg-accent dark:bg-accent/10' : ''}`}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
      <span className={`text-[10px] font-bold leading-none ${isActive ? 'opacity-100' : 'opacity-70'}`}>
        {label}
      </span>
      {isActive && (
        <motion.span
          layoutId="bottomNavIndicator"
          className="absolute bottom-0 w-1 h-1 rounded-full bg-brand-accent"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white/80 dark:bg-surface-muted/80 backdrop-blur-2xl border-t border-surface-border/50 dark:border-surface-border/50 lg:hidden">
      <div className="px-2 pt-1 pb-2 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
        <NavItem
          icon={Calendar}
          label="日历"
          isActive={activeView === 'calendar'}
          onClick={() => onViewChange('calendar')}
        />
        <NavItem
          icon={Activity}
          label="状态"
          isActive={activeView === 'state'}
          onClick={() => onViewChange('state')}
        />
        <NavItem
          icon={Heart}
          label="性生活"
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
      <div className="h-[env(safe-area-inset-bottom)]"></div>
    </nav>
  );
};

export default BottomNav;
