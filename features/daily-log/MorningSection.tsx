import React, { useEffect, useState } from 'react';
import { SunMedium, Zap, Hourglass, BatteryMedium, Battery, Sparkles } from 'lucide-react';
import type { MorningRecord, LogEntry, HardnessLevel, MorningWoodRetention } from '../../domain';
import { HardnessSelector, IconToggleButton } from '../../shared/ui';
import { useSmartDefaults } from './model/useSmartDefaults';

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
    if (v === 'instant') return <Zap size={20} className="text-state-danger-text"/>;
    if (v === 'brief') return <Hourglass size={20} className="text-state-warning-text"/>;
    if (v === 'normal') return <BatteryMedium size={20} className="text-state-success-text"/>;
    return <Battery size={20} className="text-state-info-text"/>;
  };

  return (
    <div className="bg-surface-card rounded-card p-5 shadow-soft border border-surface-border">
      <h3 className="text-sm font-bold text-text-primary flex items-center mb-4">
        <div className="p-1.5 bg-state-warning-bg rounded-lg mr-2 text-state-warning-text">
          <SunMedium size={16} />
        </div>
        晨间状态
      </h3>

      {showSmartTip && currentDate && (
        <div className="mb-4 p-3 bg-gradient-to-r from-state-warning-bg to-state-warning-bg/60 rounded-xl border border-state-warning-text/25">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-state-warning-bg rounded-full flex-shrink-0">
              <Sparkles size={14} className="text-state-warning-text" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-state-warning-text mb-1">
                智能推荐
              </p>
              <p className="text-xs text-state-warning-text/80 mb-2">
                基于您的历史数据，为您推荐今日默认值
              </p>
              <button
                onClick={handleApplySmartDefaults}
                className="text-xs px-3 py-1.5 bg-state-warning-text hover:bg-state-warning-text/90 text-text-on-accent rounded-lg font-medium transition-colors"
              >
                一键应用推荐
              </button>
              <button
                onClick={() => setShowSmartTip(false)}
                className="ml-2 text-xs px-2 py-1.5 text-state-warning-text hover:text-text-primary transition-colors"
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 mb-4">
        <label className="text-xs font-bold text-text-muted uppercase tracking-wider pl-1">有晨勃吗？</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: true, label: '有', cls: 'bg-state-warning-text text-text-on-accent border-state-warning-text' },
            { value: false, label: '没有', cls: 'bg-surface-inverted text-text-inverted border-surface-inverted' },
            { value: null, label: '未记录', cls: 'bg-surface-muted text-text-muted border-surface-border' },
          ].map(opt => {
            const isSel = morning.wokeWithErection === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onChange('wokeWithErection', opt.value)}
                className={`min-h-[44px] py-2 rounded-xl text-sm font-black border-2 transition-all ${isSel ? opt.cls + ' shadow-soft' : 'bg-surface-card border-surface-border text-text-muted'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {morning.wokeWithErection && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
          <HardnessSelector
            value={morning.hardness || 3}
            onChange={(v) => onChange('hardness', v)}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider pl-1">维持时间</label>
            <IconToggleButton
              options={RETENTION_OPTS}
              selected={morning.retention || 'normal'}
              onSelect={v => onChange('retention', v)}
              renderIcon={renderRetentionIcon}
            />
          </div>

          <label className="flex items-center space-x-3 p-3 rounded-xl border border-surface-border hover:bg-surface-muted transition-colors cursor-pointer">
            <input
              type="checkbox"
              id="woken"
              checked={morning.wokenByErection}
              onChange={e => onChange('wokenByErection', e.target.checked)}
              className="w-5 h-5 rounded text-accent focus:ring-accent border-surface-border"
            />
            <span className="text-sm font-medium text-text-secondary">被勃起弄醒 (雄激素旺盛)</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default MorningSection;
