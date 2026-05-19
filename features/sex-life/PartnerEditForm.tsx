import React from 'react';
import { Cigarette, Flag, Plus, Trash2, Wine } from 'lucide-react';
import type { PartnerProfile, PartnerType } from '../../domain';
import {
  MILESTONE_PRESETS,
  ORIGIN_PRESETS,
  SENSITIVE_SPOTS,
  STIMULATION_METHODS,
  TYPE_CONFIG
} from './model/partnerManagerData';

interface TempMilestone {
  name: string;
  date: string;
}

interface PartnerEditFormProps {
  formData: Partial<PartnerProfile>;
  editStep: number;
  tempMilestone: TempMilestone;
  onChangeFormData: (next: Partial<PartnerProfile>) => void;
  onChangeTempMilestone: (next: TempMilestone) => void;
  onToggleArrayItem: (field: keyof PartnerProfile, value: string) => void;
  onStepChange: (step: number) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const PartnerEditForm: React.FC<PartnerEditFormProps> = ({
  formData,
  editStep,
  tempMilestone,
  onChangeFormData,
  onChangeTempMilestone,
  onToggleArrayItem,
  onStepChange,
  onCancel,
  onSubmit
}) => {
  const update = (patch: Partial<PartnerProfile>) => onChangeFormData({ ...formData, ...patch });

  return (
    <div className="flex flex-col h-full">
      {/* Step Indicators */}
      <div className="flex space-x-1 mb-6">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className={`h-1 flex-1 rounded-full ${editStep >= step ? 'bg-brand-accent' : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6">

        {/* Step 1: Basic & Social */}
        {editStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">基本资料 & 关系属性</h3>

            <div>
              <label className="text-xs text-brand-muted">姓名 / 代号</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 focus:border-brand-accent outline-none"
                value={formData.name || ''}
                onChange={e => update({ name: e.target.value })}
                placeholder="输入姓名或代号 (如: 8号技师)"
                autoFocus
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-brand-muted">关系性质</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isMarried"
                    className="w-4 h-4 rounded border-slate-300 accent-rose-500"
                    checked={formData.isMarried || false}
                    onChange={e => update({ isMarried: e.target.checked })}
                  />
                  <label htmlFor="isMarried" className="text-xs font-bold text-rose-500">已婚状态 (人妻)</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TYPE_CONFIG) as PartnerType[]).map(typeKey => {
                  const conf = TYPE_CONFIG[typeKey];
                  const isSelected = formData.type === typeKey;
                  return (
                    <button
                      key={typeKey}
                      onClick={() => update({ type: typeKey })}
                      className={`text-left p-2 rounded border transition-all ${isSelected ? `${conf.color} text-white` : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-brand-muted'}`}
                    >
                      <div className="text-sm font-bold">{conf.label}</div>
                      <div className="text-[10px] opacity-80">{conf.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-muted">相识途径</label>
                <input
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm"
                  value={formData.origin || ''}
                  onChange={e => update({ origin: e.target.value })}
                  placeholder="e.g. 探探"
                  list="origin-options"
                />
                <datalist id="origin-options">
                  {ORIGIN_PRESETS.map(o => <option key={o} value={o} />)}
                </datalist>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['洗浴/SPA', '夜店', '探探', '外围'].map(o => (
                    <span key={o} onClick={() => update({ origin: o })} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-200 text-brand-muted">{o}</span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-brand-muted">初次经历</label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm"
                    value={formData.firstEncounterDate || ''}
                    onChange={e => update({ firstEncounterDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
              <label className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Flag size={12} /> 关键里程碑
              </label>

              {formData.milestones && Object.entries(formData.milestones).map(([name, date]) => (
                <div key={name} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded mb-2">
                  <div>
                    <div className="text-xs font-bold text-brand-text dark:text-slate-200">{name}</div>
                    <div className="text-[10px] text-brand-muted font-mono">{date as React.ReactNode}</div>
                  </div>
                  <button
                    onClick={() => {
                      const newM = { ...formData.milestones };
                      delete newM[name];
                      update({ milestones: newM });
                    }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm"
                    placeholder="名称 (e.g. 第一次)"
                    value={tempMilestone.name}
                    onChange={e => onChangeTempMilestone({ ...tempMilestone, name: e.target.value })}
                    list="milestone-presets"
                  />
                  <datalist id="milestone-presets">
                    {MILESTONE_PRESETS.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div className="w-32">
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm"
                    value={tempMilestone.date}
                    onChange={e => onChangeTempMilestone({ ...tempMilestone, date: e.target.value })}
                  />
                </div>
                <button
                  onClick={() => {
                    if (tempMilestone.name && tempMilestone.date) {
                      update({ milestones: { ...formData.milestones, [tempMilestone.name]: tempMilestone.date } });
                      onChangeTempMilestone({ name: '', date: '' });
                    }
                  }}
                  className="p-2 bg-brand-accent text-white rounded hover:bg-brand-accent-hover"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Physical Body */}
        {editStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">身体密码 & 敏感带</h3>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-brand-muted">年龄</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.age || ''} onChange={e => update({ age: parseInt(e.target.value) || undefined })} /></div>
              <div><label className="text-xs text-brand-muted">罩杯</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.cupSize || ''} onChange={e => update({ cupSize: e.target.value })} /></div>
              <div><label className="text-xs text-brand-muted">身高(cm)</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.height || ''} onChange={e => update({ height: parseInt(e.target.value) || undefined })} /></div>
              <div><label className="text-xs text-brand-muted">体重(kg)</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.weight || ''} onChange={e => update({ weight: parseInt(e.target.value) || undefined })} /></div>
            </div>

            <div>
              <label className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-2 block">敏感点 (多选)</label>
              <div className="flex flex-wrap gap-2">
                {SENSITIVE_SPOTS.map(spot => (
                  <button
                    key={spot}
                    onClick={() => onToggleArrayItem('sensitiveSpots', spot)}
                    className={`text-xs px-2 py-1 rounded border transition-all ${formData.sensitiveSpots?.includes(spot) ? 'bg-pink-500 text-white border-pink-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                  >
                    {spot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 block">喜欢的刺激方式 (多选)</label>
              <div className="flex flex-wrap gap-2">
                {STIMULATION_METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => onToggleArrayItem('stimulationPreferences', m)}
                    className={`text-xs px-2 py-1 rounded border transition-all ${formData.stimulationPreferences?.includes(m) ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Capability & XP */}
        {editStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">开发程度 & XP</h3>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="text-xs text-brand-muted flex justify-between">
                  <span>深喉能力 (Level {formData.deepThroatLevel || 0})</span>
                  <span>0=不行, 3=到底</span>
                </label>
                <input
                  type="range" min="0" max="3" step="1"
                  value={formData.deepThroatLevel || 0}
                  onChange={e => update({ deepThroatLevel: parseInt(e.target.value) as 0 | 1 | 2 | 3 })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-2 block">高潮难度</label>
                <div className="flex bg-slate-200 dark:bg-slate-700 rounded p-1">
                  {(['easy', 'medium', 'hard'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => update({ orgasmDifficulty: d })}
                      className={`flex-1 text-xs py-1 rounded ${formData.orgasmDifficulty === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      {d === 'easy' ? '易高潮' : d === 'medium' ? '普通' : '难高潮'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={formData.analDeveloped || false} onChange={e => update({ analDeveloped: e.target.checked })} className="rounded text-indigo-500" />
                  后庭开发
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={formData.squirtingAbility || false} onChange={e => update({ squirtingAbility: e.target.checked })} className="rounded text-blue-500" />
                  潮吹体质
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2 block">反差设定</label>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-slate-400">日常人设</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" value={formData.contrastDaily || ''} onChange={e => update({ contrastDaily: e.target.value })} placeholder="e.g. 高冷女上司" /></div>
                <div><label className="text-[10px] text-slate-400">床上人设</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" value={formData.contrastBedroom || ''} onChange={e => update({ contrastBedroom: e.target.value })} placeholder="e.g. 淫乱母狗" /></div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Inner World & Social */}
        {editStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-lg text-brand-text dark:text-slate-200">内在与社会属性</h3>

            <div className="space-y-3">
              <div><label className="text-xs text-brand-muted">职业</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1" value={formData.occupation || ''} onChange={e => update({ occupation: e.target.value })} /></div>
              <div>
                <label className="text-xs text-brand-muted">烟酒习惯</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                    <Cigarette size={16} className="text-slate-400" />
                    <select className="bg-transparent text-sm outline-none w-full" value={formData.smoking || 'none'} onChange={e => update({ smoking: e.target.value as PartnerProfile['smoking'] })}>
                      <option value="none">不抽烟</option>
                      <option value="occasional">偶尔</option>
                      <option value="frequent">老烟枪</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                    <Wine size={16} className="text-slate-400" />
                    <select className="bg-transparent text-sm outline-none w-full" value={formData.alcohol || 'none'} onChange={e => update({ alcohol: e.target.value as PartnerProfile['alcohol'] })}>
                      <option value="none">不喝酒</option>
                      <option value="occasional">小酌</option>
                      <option value="frequent">酒鬼</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-brand-muted">价值观 / 看重</label>
                <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" value={formData.primaryValues || ''} onChange={e => update({ primaryValues: e.target.value })} placeholder="e.g. 钱, 忠诚, 情绪价值" />
              </div>
              <div>
                <label className="text-xs text-brand-muted">雷点 / 讨厌</label>
                <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm" value={formData.petPeeves || ''} onChange={e => update({ petPeeves: e.target.value })} placeholder="e.g. 迟到, 体味" />
              </div>
            </div>

            <div>
              <label className="text-xs text-brand-muted">备注</label>
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 text-sm h-24"
                value={formData.notes || ''}
                onChange={e => update({ notes: e.target.value })}
                placeholder="其他需要记录的信息..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => editStep > 1 ? onStepChange(editStep - 1) : onCancel()}
          className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
        >
          {editStep > 1 ? '上一步' : '取消'}
        </button>
        <button
          onClick={() => editStep < 4 ? onStepChange(editStep + 1) : onSubmit()}
          className="px-6 py-2 bg-brand-accent text-white font-bold rounded-xl shadow-lg shadow-blue-500/30"
        >
          {editStep < 4 ? '下一步' : '保存档案'}
        </button>
      </div>
    </div>
  );
};

export default PartnerEditForm;
