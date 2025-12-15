
import React from 'react';
import { SunMedium, Zap, Hourglass, BatteryMedium, Battery } from 'lucide-react';
import { MorningRecord, LogEntry } from '../types';
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
        <div className="bg-brand-secondary dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider flex items-center">
                <SunMedium size={16} className="mr-2 text-brand-accent"/>晨间状态
            </h3>
            
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <label className="font-medium text-brand-text dark:text-slate-200">有晨勃吗？</label>
                <input 
                    type="checkbox" 
                    className="toggle-checkbox" 
                    checked={morning.wokeWithErection ?? true} 
                    onChange={(e) => onChange('wokeWithErection', e.target.checked)} 
                />
            </div>

            {morning.wokeWithErection && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <HardnessSelector 
                        value={morning.hardness || 3} 
                        onChange={(v) => onChange('hardness', v)} 
                    />
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">维持时间 / 消退速度</label>
                        <IconToggleButton 
                            options={RETENTION_OPTS} 
                            selected={morning.retention || 'normal'} 
                            onSelect={v => onChange('retention', v)} 
                            renderIcon={renderRetentionIcon}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            id="woken" 
                            checked={morning.wokenByErection} 
                            onChange={e => onChange('wokenByErection', e.target.checked)} 
                            className="w-4 h-4 rounded text-brand-accent focus:ring-brand-accent"
                        />
                        <label htmlFor="woken" className="text-sm text-brand-text dark:text-slate-300">被勃起弄醒 (雄激素旺盛)</label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MorningSection;
