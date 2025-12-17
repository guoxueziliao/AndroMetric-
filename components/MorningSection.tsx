
import React from 'react';
import { SunMedium, Zap, Hourglass, BatteryMedium, Battery } from 'lucide-react';
import { MorningRecord } from '../types';
import HardnessSelector from './HardnessSelector';
import { IconToggleButton } from './FormControls';

interface MorningSectionProps {
    morning: MorningRecord;
    onChange: (field: keyof MorningRecord, value: any) => void;
}

const RETENTION_OPTS = [
    {value: 'instant', label: '秒软 (<30s)'}, 
    {value: 'brief', label: '快速 (2m内)'}, 
    {value: 'normal', label: '正常 (5m内)'}, 
    {value: 'extended', label: '持久 (>5m)'}
];

const MorningSection: React.FC<MorningSectionProps> = ({ morning, onChange }) => {
    const renderRetentionIcon = (v: string) => {
        if (v === 'instant') return <Zap size={20} className="text-red-500"/>;
        if (v === 'brief') return <Hourglass size={20} className="text-orange-500"/>;
        if (v === 'normal') return <BatteryMedium size={20} className="text-green-500"/>;
        return <Battery size={20} className="text-blue-500"/>;
    };

    return (
        <div className="bg-brand-card dark:bg-slate-900 rounded-card p-5 shadow-soft border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center mb-4">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-2 text-amber-600 dark:text-amber-500">
                    <SunMedium size={16} />
                </div>
                晨间状态
            </h3>
            
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl mb-4 transition-colors">
                <label className="font-bold text-sm text-brand-text dark:text-slate-200">有晨勃吗？</label>
                <input 
                    type="checkbox" 
                    className="toggle-checkbox" 
                    checked={morning.wokeWithErection ?? true} 
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
                    
                    <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="woken" 
                            checked={morning.wokenByErection} 
                            onChange={e => onChange('wokenByErection', e.target.checked)} 
                            className="w-5 h-5 rounded text-brand-accent focus:ring-brand-accent border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">被勃起弄醒 (雄激素旺盛)</span>
                    </label>
                </div>
            )}
        </div>
    );
};

export default MorningSection;
