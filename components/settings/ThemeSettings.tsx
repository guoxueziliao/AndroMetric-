import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Palette, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ThemeSettings: React.FC = () => {
  const {
    themeColor,
    themeMode,
    isGradient,
    isDark,
    themeColors,
    setThemeColor,
    setThemeMode,
    toggleGradient
  } = useTheme();

  const colorOptions = [
    { id: 'blue', name: '蓝色', class: 'bg-blue-500', shadow: 'shadow-blue-500/30' },
    { id: 'purple', name: '紫色', class: 'bg-purple-500', shadow: 'shadow-purple-500/30' },
    { id: 'green', name: '绿色', class: 'bg-green-500', shadow: 'shadow-green-500/30' },
    { id: 'orange', name: '橙色', class: 'bg-orange-500', shadow: 'shadow-orange-500/30' },
    { id: 'pink', name: '粉色', class: 'bg-pink-500', shadow: 'shadow-pink-500/30' }
  ] as const;

  const modeOptions = [
    { id: 'light', name: '浅色', icon: Sun },
    { id: 'dark', name: '深色', icon: Moon },
    { id: 'system', name: '跟随系统', icon: Monitor }
  ] as const;

  return (
    <div className="space-y-8 p-4">
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
          <Palette size={14} className="mr-1.5" />
          主题色
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {colorOptions.map((color) => (
            <motion.button
              key={color.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setThemeColor(color.id as any)}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                themeColor === color.id
                  ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-${color.id}-500 ${color.shadow} shadow-lg`
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${color.class}`} />
              <span className={`text-[10px] font-bold ${themeColor === color.id ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                {color.name}
              </span>
              {themeColor === color.id && (
                <motion.div
                  layoutId="colorIndicator"
                  className={`absolute inset-0 rounded-2xl border-2 border-${color.id}-500 opacity-20`}
                />
              )}
            </motion.button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
          <Sun size={14} className="mr-1.5" />
          外观模式
        </h3>
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
          {modeOptions.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setThemeMode(mode.id as any)}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-lg transition-all ${
                  themeMode === mode.id
                    ? 'bg-white dark:bg-slate-700 text-brand-accent shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={14} />
                {mode.name}
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          当前: {isDark ? '深色模式' : '浅色模式'}
        </p>
      </section>

      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
          <Sparkles size={14} className="mr-1.5" />
          高级选项
        </h3>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">渐变背景</p>
              <p className="text-xs text-slate-400">启用柔和的渐变背景效果</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isGradient}
                onChange={toggleGradient}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThemeSettings;
