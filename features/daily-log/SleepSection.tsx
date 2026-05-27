import React, { useMemo, useState, useEffect } from 'react';
import { BedDouble, Leaf, CloudDrizzle, Heart, CloudSun, Clock, Edit2, Trash2, AlertCircle, Sparkles, MapPin, Thermometer } from 'lucide-react';
import type { SleepRecord, NapRecord, LogEntry, SleepAttire, SleepTemperature } from '../../domain';
import { DateTimePicker, RangeSlider, Switch } from '../../shared/ui';
import { useSmartDefaults } from './model/useSmartDefaults';

interface SleepSectionProps {
  sleep: SleepRecord;
  onChange: (field: keyof SleepRecord, value: any) => void;
  onEditNap: (nap: NapRecord) => void;
  onDeleteNap: (id: string) => void;
  onAddNap: () => void;
  logs?: LogEntry[];
  currentDate?: string;
}

const DREAM_TYPES = [
  { value: 'erotic', label: '春梦' },
  { value: 'nightmare', label: '噩梦' },
  { value: 'normal', label: '普通' },
  { value: 'lucid', label: '清醒梦' },
  { value: 'weird', label: '离奇' },
];

const LOCATIONS = [
  { value: 'home', label: '家里' },
  { value: 'hotel', label: '酒店' },
  { value: 'others_home', label: '别人家' },
  { value: 'dorm', label: '宿舍' },
  { value: 'office', label: '办公室' },
  { value: 'transport', label: '通勤中' },
  { value: 'other', label: '其他' },
];

const TEMPS = [
  { value: 'cold', label: '冷' },
  { value: 'comfortable', label: '舒适' },
  { value: 'hot', label: '热' },
];

const SleepSection: React.FC<SleepSectionProps> = ({ sleep, onChange, onEditNap, onDeleteNap, onAddNap, logs = [], currentDate }) => {
  const [showDreams, setShowDreams] = useState(sleep.hasDream || false);
  const [showSmartTip, setShowSmartTip] = useState(false);
  const { getSmartDefault, hasEnoughData } = useSmartDefaults(logs);

  useEffect(() => {
    if (!currentDate || !hasEnoughData) return;

    const qualityResult = getSmartDefault<number>('sleepQuality', currentDate);
    const attireResult = getSmartDefault<SleepAttire>('sleepAttire', currentDate);
    const tempResult = getSmartDefault<SleepTemperature>('sleepTemperature', currentDate);

    if (qualityResult.value || attireResult.value || tempResult.value) {
      setShowSmartTip(true);
    }
  }, [currentDate, hasEnoughData, getSmartDefault]);

  const handleApplySmartDefaults = () => {
    if (!currentDate) return;

    const qualityResult = getSmartDefault<number>('sleepQuality', currentDate);
    const attireResult = getSmartDefault<SleepAttire>('sleepAttire', currentDate);
    const tempResult = getSmartDefault<SleepTemperature>('sleepTemperature', currentDate);

    if (qualityResult.value) {
      onChange('quality', qualityResult.value);
    }
    if (attireResult.value) {
      onChange('attire', attireResult.value);
    }
    if (tempResult.value) {
      onChange('environment', { ...sleep.environment, temperature: tempResult.value });
    }
    setShowSmartTip(false);
  };

  const timeError = useMemo(() => {
    if (sleep.startTime && sleep.endTime) {
      const s = new Date(sleep.startTime).getTime();
      const e = new Date(sleep.endTime).getTime();
      if (e <= s) return "起床时间需晚于入睡时间";
      if ((e - s) > 24 * 60 * 60 * 1000) return "时长异常 (>24h)";
    }
    return null;
  }, [sleep.startTime, sleep.endTime]);

  const toggleDreamType = (type: string) => {
    const types = sleep.dreamTypes || [];
    const newTypes = types.includes(type) ? types.filter(t => t !== type) : [...types, type];
    onChange('dreamTypes', newTypes);
  };

  const handleDreamToggle = (checked: boolean) => {
    setShowDreams(checked);
    onChange('hasDream', checked);
    if (!checked) onChange('dreamTypes', []);
  };

  const updateEnv = (key: 'location' | 'temperature', val: string) => {
    onChange('environment', { ...sleep.environment, [key]: val });
  };

  return (
    <div className={`bg-surface-card rounded-card p-5 shadow-soft border ${timeError ? 'border-state-danger-text' : 'border-surface-border'} space-y-5 transition-colors`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-text-primary flex items-center">
          <div className="p-1.5 bg-state-info-bg rounded-lg mr-2 text-state-info-text">
            <BedDouble size={16} />
          </div>
          睡眠周期
        </h3>
        {timeError && (
          <span className="text-xs font-bold text-state-danger-text flex items-center animate-pulse">
            <AlertCircle size={12} className="mr-1"/>
            {timeError}
          </span>
        )}
      </div>

      {showSmartTip && currentDate && (
        <div className="p-3 bg-gradient-to-r from-state-info-bg to-accent-muted/10 rounded-xl border border-state-info-text/25">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-state-info-bg rounded-full flex-shrink-0">
              <Sparkles size={14} className="text-state-info-text" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-state-info-text mb-1">
                智能推荐
              </p>
              <p className="text-xs text-state-info-text/80 mb-2">
                基于您的历史数据，为您推荐睡眠默认值
              </p>
              <button
                onClick={handleApplySmartDefaults}
                className="text-xs px-3 py-1.5 bg-state-info-text hover:bg-state-info-text/90 text-text-on-accent rounded-lg font-medium transition-colors"
              >
                一键应用推荐
              </button>
              <button
                onClick={() => setShowSmartTip(false)}
                className="ml-2 text-xs px-2 py-1.5 text-state-info-text hover:text-text-primary transition-colors"
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <DateTimePicker label="入睡时间" value={sleep.startTime || ''} onChange={(v) => onChange('startTime', v)} />
        <DateTimePicker label="起床时间" value={sleep.endTime || ''} onChange={(v) => onChange('endTime', v)} />
      </div>

      <RangeSlider
        leftLabel="质量极差 (1)" rightLabel="睡得超棒 (5)"
        min={1} max={5} colorClass="accent-accent"
        value={sleep.quality ?? 3}
        onChange={(v: number) => onChange('quality', v)}
      />

      <div className="flex gap-2">
        {[
          { key: 'naturalAwakening', label: '自然醒', icon: Leaf, color: 'text-state-success-text' },
          { key: 'nocturnalEmission', label: '梦遗', icon: CloudDrizzle, color: 'text-state-info-text' },
          { key: 'withPartner', label: '同睡', icon: Heart, color: 'text-accent-vivid' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key as any, !(sleep as any)[item.key])}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
              (sleep as any)[item.key]
              ? 'bg-surface-muted border-surface-border shadow-inner'
              : 'bg-surface-card border-transparent hover:bg-surface-muted'
            }`}
          >
            <item.icon size={18} className={`mb-1 ${(sleep as any)[item.key] ? item.color : 'text-text-muted'}`}/>
            <span className={`text-[10px] font-bold ${(sleep as any)[item.key] ? 'text-text-secondary' : 'text-text-muted'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-chart-tertiary/10 rounded-xl p-3 border border-chart-tertiary/25">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-chart-tertiary font-bold text-xs uppercase tracking-wider">
            <Sparkles size={14} className="mr-1.5"/> 梦境记录
          </div>
          <div className="flex items-center">
            <Switch size="sm" checked={showDreams} onCheckedChange={handleDreamToggle} aria-label="梦境记录" />
          </div>
        </div>
        {showDreams && (
          <div className="flex flex-wrap gap-2 animate-in fade-in">
            {DREAM_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => toggleDreamType(t.value)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${sleep.dreamTypes?.includes(t.value) ? 'bg-chart-tertiary text-text-on-accent border-chart-tertiary shadow-soft' : 'bg-surface-card border-chart-tertiary/25 text-text-secondary'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-text-muted uppercase tracking-wider block pl-1">睡眠环境</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-surface-muted p-2 rounded-xl border border-surface-border flex items-center gap-2">
            <MapPin size={14} className="text-text-muted"/>
            <select
              value={sleep.environment?.location || 'home'}
              onChange={e => updateEnv('location', e.target.value)}
              className="bg-transparent text-xs w-full outline-none text-text-primary appearance-none font-medium"
            >
              {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex-1 bg-surface-muted p-2 rounded-xl border border-surface-border flex items-center gap-2">
            <Thermometer size={14} className="text-text-muted"/>
            <select
              value={sleep.environment?.temperature || 'comfortable'}
              onChange={e => updateEnv('temperature', e.target.value)}
              className="bg-transparent text-xs w-full outline-none text-text-primary appearance-none font-medium"
            >
              {TEMPS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-surface-border">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-text-muted uppercase flex items-center"><CloudSun size={14} className="mr-1"/>午休</h4>
          <button type="button" onClick={onAddNap} className="text-[10px] bg-state-warning-bg text-state-warning-text px-2 py-1 rounded-lg font-bold">+ 添加</button>
        </div>
        <div className="space-y-2">
          {sleep.naps?.map(r => (
            <div key={r.id} className="bg-state-warning-bg/50 border border-state-warning-text/25 p-2.5 rounded-xl flex justify-between items-center text-sm">
              <span className="font-bold text-state-warning-text flex items-center">
                <Clock size={14} className="mr-2 opacity-70"/>
                {r.startTime}
                <span className="mx-1 opacity-40">-</span>
                {r.endTime || '...'}
                <span className="text-xs opacity-60 ml-2 font-normal">({r.ongoing ? '进行中' : `${r.duration}m`})</span>
              </span>
              <div className="flex gap-2 text-state-warning-text/75">
                <Edit2 size={14} className="cursor-pointer hover:text-state-warning-text" onClick={() => onEditNap(r)}/>
                <Trash2 size={14} className="cursor-pointer hover:text-state-warning-text" onClick={() => onDeleteNap(r.id)}/>
              </div>
            </div>
          ))}
          {(!sleep.naps || sleep.naps.length === 0) && (
            <button type="button" onClick={onAddNap} className="w-full h-12 border-2 border-dashed border-surface-border rounded-xl flex items-center justify-center text-text-muted text-xs font-medium hover:border-state-warning-text/40 hover:text-state-warning-text transition-colors">
              暂无记录，点击添加
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SleepSection;
