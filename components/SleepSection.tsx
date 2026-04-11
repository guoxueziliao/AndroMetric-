import React, { useMemo, useState, useEffect } from 'react';
import { BedDouble, Leaf, CloudDrizzle, Heart, CloudSun, Clock, Edit2, Trash2, Plus, AlertCircle, Sparkles, MapPin, Thermometer } from 'lucide-react';
import { SleepRecord, NapRecord, LogEntry, SleepAttire, SleepTemperature } from '../types';
import DateTimePicker from './DateTimePicker';
import { RangeSlider } from './FormControls';
import { useSmartDefaults } from '../hooks/useSmartDefaults';

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
    <div className={`bg-brand-card dark:bg-slate-900 rounded-card p-5 shadow-soft border ${timeError ? 'border-red-300 dark:border-red-900' : 'border-slate-100 dark:border-slate-800'} space-y-5 transition-colors`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-2 text-blue-600">
            <BedDouble size={16} />
          </div>
          睡眠周期
        </h3>
        {timeError && (
          <span className="text-xs font-bold text-red-500 flex items-center animate-pulse">
            <AlertCircle size={12} className="mr-1"/>
            {timeError}
          </span>
        )}
      </div>

      {showSmartTip && currentDate && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full flex-shrink-0">
              <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                智能推荐
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                基于您的历史数据，为您推荐睡眠默认值
              </p>
              <button
                onClick={handleApplySmartDefaults}
                className="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                一键应用推荐
              </button>
              <button
                onClick={() => setShowSmartTip(false)}
                className="ml-2 text-xs px-2 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
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
        min={1} max={5} colorClass="accent-blue-500"
        value={sleep.quality}
        onChange={(v: number) => onChange('quality', v)}
      />

      <div className="flex gap-2">
        {[
          { key: 'naturalAwakening', label: '自然醒', icon: Leaf, color: 'text-green-600' },
          { key: 'nocturnalEmission', label: '梦遗', icon: CloudDrizzle, color: 'text-blue-600' },
          { key: 'withPartner', label: '同睡', icon: Heart, color: 'text-pink-600' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key as any, !(sleep as any)[item.key])}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
              (sleep as any)[item.key]
              ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-inner'
              : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50'
            }`}
          >
            <item.icon size={18} className={`mb-1 ${(sleep as any)[item.key] ? item.color : 'text-slate-400'}`}/>
            <span className={`text-[10px] font-bold ${(sleep as any)[item.key] ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 border border-purple-100 dark:border-purple-900/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
            <Sparkles size={14} className="mr-1.5"/> 梦境记录
          </div>
          <div className="flex items-center">
            <input type="checkbox" className="toggle-checkbox h-4 w-8" checked={showDreams} onChange={e => handleDreamToggle(e.target.checked)} />
          </div>
        </div>
        {showDreams && (
          <div className="flex flex-wrap gap-2 animate-in fade-in">
            {DREAM_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => toggleDreamType(t.value)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${sleep.dreamTypes?.includes(t.value) ? 'bg-purple-500 text-white border-purple-600 shadow-sm' : 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800 text-slate-500'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block pl-1">睡眠环境</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <MapPin size={14} className="text-slate-400"/>
            <select
              value={sleep.environment?.location || 'home'}
              onChange={e => updateEnv('location', e.target.value)}
              className="bg-transparent text-xs w-full outline-none text-brand-text dark:text-slate-300 appearance-none font-medium"
            >
              {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Thermometer size={14} className="text-slate-400"/>
            <select
              value={sleep.environment?.temperature || 'comfortable'}
              onChange={e => updateEnv('temperature', e.target.value)}
              className="bg-transparent text-xs w-full outline-none text-brand-text dark:text-slate-300 appearance-none font-medium"
            >
              {TEMPS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center"><CloudSun size={14} className="mr-1"/>午休</h4>
          <button type="button" onClick={onAddNap} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-lg font-bold">+ 添加</button>
        </div>
        <div className="space-y-2">
          {sleep.naps?.map(r => (
            <div key={r.id} className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-2.5 rounded-xl flex justify-between items-center text-sm">
              <span className="font-bold text-orange-700 dark:text-orange-300 flex items-center">
                <Clock size={14} className="mr-2 opacity-70"/>
                {r.startTime}
                <span className="mx-1 opacity-40">-</span>
                {r.endTime || '...'}
                <span className="text-xs opacity-60 ml-2 font-normal">({r.ongoing ? '进行中' : `${r.duration}m`})</span>
              </span>
              <div className="flex gap-2 text-orange-400">
                <Edit2 size={14} className="cursor-pointer hover:text-orange-600" onClick={() => onEditNap(r)}/>
                <Trash2 size={14} className="cursor-pointer hover:text-orange-600" onClick={() => onDeleteNap(r.id)}/>
              </div>
            </div>
          ))}
          {(!sleep.naps || sleep.naps.length === 0) && (
            <button type="button" onClick={onAddNap} className="w-full h-12 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium hover:border-orange-300 hover:text-orange-500 transition-colors">
              暂无记录，点击添加
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SleepSection;
