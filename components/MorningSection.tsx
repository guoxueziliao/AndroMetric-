import React, { useEffect, useState } from 'react';
import { SunMedium, Zap, Hourglass, BatteryMedium, Battery, Sparkles } from 'lucide-react';
import { MorningRecord, LogEntry, HardnessLevel, MorningWoodRetention } from '../types';
import HardnessSelector from './HardnessSelector';
import { IconToggleButton } from './FormControls';
import { useSmartDefaults } from '../hooks/useSmartDefaults';

interface MorningSectionProps {
  morning: MorningRecord;
  onChange: (field: keyof MorningRecord, value: any) => void;
  logs?: LogEntry[];
  currentDate?: string;
}

const RETENTION_OPTS = [
  {value: 'instant', label: '秒软 (<30s)'},
  {value: 'brief', label: '快速 (2m内)'},
  {value: 'normal', label: '正常 (5m内)'},
  {value: 'extended', label: '持久 (>5m)'}
];

const MorningSection: React.FC<MorningSectionProps> = ({ morning, onChange, logs = [], currentDate }) => {
  const [showSmartTip, setShowSmartTip] = useState(false);
  const { getSmartDefault, hasEnoughData } = useSmartDefaults(logs);

  useEffect(() => {
    if (!currentDate || !hasEnoughData) return;

    const hardnessResult = getSmartDefault<HardnessLevel>('hardness', currentDate);
    const retentionResult = getSmartDefault<MorningWoodRetention>('retention', currentDate);

    if (hardnessResult.value && retentionResult.value) {
      setShowSmartTip(true);
    }
  }, [currentDate, hasEnoughData, getSmartDefault]);

  const handleApplySmartDefaults = () => {
    if (!currentDate) return;

    const hardnessResult = getSmartDefault<HardnessLevel>('hardness', currentDate);
    const retentionResult = getSmartDefault<MorningWoodRetention>('retention', currentDate);

    if (hardnessResult.value) {
      onChange('hardness', hardnessResult.value);
    }
    if (retentionResult.value) {
      onChange('retention', retentionResult.value);
    }
    setShowSmartTip(false);
  };

  const renderRetentionIcon = (v: string) => {
    if (v === 'instant') return <Zap size={20} className="text-red-500"/>;
    if (v === 'brief') return <Hourglass size={20} className="text-orange-500"/>;
    if (v === 'normal') return <BatteryMedium size={20} className="text-green-500"/>;
    return <Battery size={20} className="text-blue-500"/>;
  };

  return (
    <div className="bg-brand-card dark:bg-slate-900 rounded-card p-5 shadow-soft border border-slate-100 dark:border-slate-800">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center mb-4">
        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-2 text-amber-600">
          <SunMedium size={16} />
        </div>
        晨间状态
      </h3>

      {showSmartTip && currentDate && (
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-800 rounded-full flex-shrink-0">
              <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
                智能推荐
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                基于您的历史数据，为您推荐今日默认值
              </p>
              <button
                onClick={handleApplySmartDefaults}
                className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                一键应用推荐
              </button>
              <button
                onClick={() => setShowSmartTip(false)}
                className="ml-2 text-xs px-2 py-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-4">
        <label className="font-bold text-sm text-brand-text dark:text-slate-200">有晨勃吗？</label>
        <input
          type="checkbox"
          className="toggle-checkbox"
          checked={morning.wokeWithErection === true}
          onChange={(e) => onChange('wokeWithErection', e.target.checked)}
        />
      </div>

      {morning.wokeWithErection && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
          <HardnessSelector
            value={morning.hardness || 3}
            onChange={(v) => onChange('hardness', v)}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">维持时间</label>
            <IconToggleButton
              options={RETENTION_OPTS}
              selected={morning.retention || 'normal'}
              onSelect={v => onChange('retention', v)}
              renderIcon={renderRetentionIcon}
            />
          </div>

          <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              id="woken"
              checked={morning.wokenByErection}
              onChange={e => onChange('wokenByErection', e.target.checked)}
              className="w-5 h-5 rounded text-brand-accent focus:ring-brand-accent border-gray-300"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">被勃起弄醒 (雄激素旺盛)</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default MorningSection;
