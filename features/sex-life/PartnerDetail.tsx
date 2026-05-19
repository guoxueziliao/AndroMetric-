import React from 'react';
import { BrainCircuit, Edit2, Flag, Heart, Ruler as RulerIcon, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import type { PartnerProfile } from '../../domain';
import {
  type PartnerStatsMap,
  TYPE_CONFIG,
  getPartnerCategory
} from './model/partnerManagerData';

interface PartnerDetailProps {
  partner: PartnerProfile;
  partnerStats: PartnerStatsMap;
  onEdit: (partner: PartnerProfile) => void;
  onDeleteRequest: (id: string) => void;
}

const PartnerDetail: React.FC<PartnerDetailProps> = ({ partner, partnerStats, onEdit, onDeleteRequest }) => {
  const p = partner;
  const typeInfo = p.type ? TYPE_CONFIG[p.type] : null;
  const cat = getPartnerCategory(p);
  const stats = partnerStats[p.name];

  return (
    <div className="space-y-6 animate-in slide-in-from-right">
      {/* Header Card */}
      <div className={`${p.avatarColor || 'bg-slate-500'} rounded-2xl p-6 text-white shadow-md relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold">{p.name}</h2>
              {cat && <span className="text-xs bg-black/30 px-2 py-0.5 rounded border border-white/20 font-bold">{cat.label}</span>}
              {typeInfo && <span className="text-xs bg-black/20 px-2 py-0.5 rounded border border-white/20">{typeInfo.label}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {p.age && <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{p.age}岁</span>}
              {p.height && <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{p.height}cm</span>}
              {p.weight && <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{p.weight}kg</span>}
              {p.cupSize && <span className="bg-pink-500/80 px-2 py-0.5 rounded text-sm">{p.cupSize}</span>}
            </div>
            <div className="mt-3 text-xs opacity-90 flex flex-col gap-1">
              {p.firstEncounterDate && <span>📅 初次见面: {p.firstEncounterDate}</span>}
              {p.origin && <span>📍 来源: {p.origin}</span>}
              {stats && <span>⏳ 最近互动: {stats.lastDate} ({stats.daysAgo}天前)</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(p)} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><Edit2 size={18} /></button>
            <button onClick={() => onDeleteRequest(p.id)} className="p-2 bg-white/20 rounded-full hover:bg-red-500/50"><Trash2 size={18} /></button>
          </div>
        </div>
        {(p.contrastDaily || p.contrastBedroom) && (
          <div className="mt-4 flex rounded-lg overflow-hidden text-xs border border-white/20">
            <div className="flex-1 bg-white/90 text-slate-800 p-2 flex flex-col items-center justify-center">
              <span className="opacity-50 font-bold mb-1">☀️ 日常</span>
              <span className="font-bold">{p.contrastDaily || '-'}</span>
            </div>
            <div className="flex-1 bg-black/40 text-white p-2 flex flex-col items-center justify-center">
              <span className="opacity-50 font-bold mb-1">🌙 床上</span>
              <span className="font-bold">{p.contrastBedroom || '-'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Satisfaction Ratio */}
      {stats && (stats.myCum > 0 || stats.partnerCum > 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-around">
          <div className="text-center">
            <span className="text-xs text-brand-muted block mb-1">让她高潮</span>
            <span className="text-xl font-black text-pink-500">{stats.partnerCum}次</span>
          </div>
          <div className="text-slate-300 font-light text-2xl">VS</div>
          <div className="text-center">
            <span className="text-xs text-brand-muted block mb-1">自己射精</span>
            <span className="text-xl font-black text-blue-500">{stats.myCum}次</span>
          </div>
        </div>
      )}

      {/* Milestones Timeline */}
      {p.milestones && Object.keys(p.milestones).length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><Flag size={16} className="mr-2 text-yellow-500" /> 纪念日 / 里程碑</h3>
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-2 space-y-4 py-1">
            {Object.entries(p.milestones)
              .sort(([, dA], [, dB]) => new Date(dA as string).getTime() - new Date(dB as string).getTime())
              .map(([name, date]) => (
                <div key={name} className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-400 border-2 border-white dark:border-slate-900"></div>
                  <p className="text-xs text-brand-muted font-mono">{date as React.ReactNode}</p>
                  <p className="text-sm font-bold text-brand-text dark:text-slate-200">{name}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Body & Sensitivity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><Heart size={16} className="mr-2 text-pink-500" /> 身体密码</h3>
        <div className="space-y-4">
          <div>
            <span className="text-xs text-brand-muted block mb-2 font-medium">敏感点</span>
            <div className="flex flex-wrap gap-1.5">
              {p.sensitiveSpots?.length ? p.sensitiveSpots.map(s => <span key={s} className="text-xs bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 px-2 py-1 rounded-full border border-pink-100 dark:border-pink-900">{s}</span>) : <span className="text-xs text-slate-400">未知</span>}
            </div>
          </div>
          {p.stimulationPreferences && p.stimulationPreferences.length > 0 && (
            <div>
              <span className="text-xs text-brand-muted block mb-2 font-medium">喜好的刺激</span>
              <div className="flex flex-wrap gap-1.5">
                {p.stimulationPreferences.map(s => <span key={s} className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-900">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Capability */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><RulerIcon size={16} className="mr-2 text-indigo-500" /> 开发与能力</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-center">
            <span className="text-xs text-brand-muted">深喉等级</span>
            <div className="font-bold text-indigo-500 text-lg">Lv.{p.deepThroatLevel || 0}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-center">
            <span className="text-xs text-brand-muted">高潮难度</span>
            <div className="font-bold text-indigo-500 text-lg">{p.orgasmDifficulty === 'easy' ? '易' : p.orgasmDifficulty === 'hard' ? '难' : '中'}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.analDeveloped && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 px-2 py-1 rounded border border-purple-200">✅ 后庭已开发</span>}
          {p.squirtingAbility && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 px-2 py-1 rounded border border-blue-200">💦 潮吹体质</span>}
        </div>
      </div>

      {/* Inner World & Notes */}
      {(p.primaryValues || p.petPeeves || p.notes) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-brand-muted uppercase mb-3 flex items-center"><BrainCircuit size={16} className="mr-2 text-purple-500" /> 内心与备注</h3>
          <div className="space-y-3">
            {p.primaryValues && (
              <div>
                <span className="text-xs text-brand-muted flex items-center mb-1"><ThumbsUp size={12} className="mr-1" /> 最看重 / 喜欢</span>
                <p className="text-sm font-medium text-brand-text dark:text-slate-200">{p.primaryValues}</p>
              </div>
            )}
            {p.petPeeves && (
              <div>
                <span className="text-xs text-brand-muted flex items-center mb-1"><ThumbsDown size={12} className="mr-1" /> 最讨厌 / 雷点</span>
                <p className="text-sm font-medium text-brand-text dark:text-slate-200">{p.petPeeves}</p>
              </div>
            )}
            {p.notes && (
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm italic text-brand-muted mt-2">
                "{p.notes}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDetail;
