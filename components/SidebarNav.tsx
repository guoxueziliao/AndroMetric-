import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, BarChart3, Heart, User, Settings,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export type NavItem = 'calendar' | 'stats' | 'sexlife' | 'my';

interface SidebarNavProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: NavItem; label: string; icon: typeof Calendar }[] = [
  { id: 'calendar', label: '日历', icon: Calendar },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'sexlife', label: '性生活', icon: Heart },
  { id: 'my', label: '我的', icon: User },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ 
  activeItem, 
  onNavigate,
  isCollapsed,
  onToggleCollapse
}) => {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="hidden lg:flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 fixed left-0 top-0 z-40"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <motion.div
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          className="font-black text-xl text-brand-accent whitespace-nowrap overflow-hidden"
        >
          硬度日记
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleCollapse}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon size={22} />
              <motion.span
                animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                className="font-bold whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
      {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Settings size={22} />
          <motion.span
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className="font-bold whitespace-nowrap overflow-hidden"
          >
            设置
          </motion.span>
        </motion.button>
      </div>
    </motion.aside>
  );
};

export default SidebarNav;
