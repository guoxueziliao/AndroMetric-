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
      <div className={`${p.avatarColor || 'bg-surface-muted0'} rounded-2xl p-6 text-text-on-accent shadow-md relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-surface-card/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold">{p.name}</h2>
              {cat && <span className="text-xs bg-overlay-scrim/30 px-2 py-0.5 rounded border border-surface-card/20 font-bold">{cat.label}</span>}
              {typeInfo && <span className="text-xs bg-overlay-scrim/20 px-2 py-0.5 rounded border border-surface-card/20">{typeInfo.label}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {p.age && <span className="bg-overlay-scrim/20 px-2 py-0.5 rounded text-sm">{p.age}岁</span>}
              {p.height && <span className="bg-overlay-scrim/20 px-2 py-0.5 rounded text-sm">{p.height}cm</span>}
              {p.weight && <span className="bg-overlay-scrim/20 px-2 py-0.5 rounded text-sm">{p.weight}kg</span>}
              {p.cupSize && <span className="bg-accent-vivid/80 px-2 py-0.5 rounded text-sm">{p.cupSize}</span>}
            </div>
            <div className="mt-3 text-xs opacity-90 flex flex-col gap-1">
              {p.firstEncounterDate && <span>📅 初次见面: {p.firstEncounterDate}</span>}
              {p.origin && <span>📍 来源: {p.origin}</span>}
              {stats && <span>⏳ 最近互动: {stats.lastDate} ({stats.daysAgo}天前)</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(p)} className="p-2 bg-surface-card/20 rounded-full hover:bg-surface-card/30"><Edit2 size={18} /></button>
            <button onClick={() => onDeleteRequest(p.id)} className="p-2 bg-surface-card/20 rounded-full hover:bg-state-danger/50"><Trash2 size={18} /></button>
          </div>
        </div>
        {(p.contrastDaily || p.contrastBedroom) && (
          <div className="mt-4 flex rounded-lg overflow-hidden text-xs border border-surface-card/20">
            <div className="flex-1 bg-surface-card/90 text-text-primary p-2 flex flex-col items-center justify-center">
              <span className="opacity-50 font-bold mb-1">☀️ 日常</span>
              <span className="font-bold">{p.contrastDaily || '-'}</span>
            </div>
            <div className="flex-1 bg-overlay-scrim/40 text-text-on-accent p-2 flex flex-col items-center justify-center">
              <span className="opacity-50 font-bold mb-1">🌙 床上</span>
              <span className="font-bold">{p.contrastBedroom || '-'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Satisfaction Ratio */}
      {stats && (stats.myCum > 0 || stats.partnerCum > 0) && (
        <div className="bg-surface-card  border border-surface-border  rounded-xl p-4 flex items-center justify-around">
          <div className="text-center">
            <span className="text-xs text-text-muted block mb-1">让她高潮</span>
            <span className="text-xl font-black text-accent-vivid">{stats.partnerCum}次</span>
          </div>
          <div className="text-text-muted font-light text-2xl">VS</div>
          <div className="text-center">
            <span className="text-xs text-text-muted block mb-1">自己射精</span>
            <span className="text-xl font-black text-chart-primary">{stats.myCum}次</span>
          </div>
        </div>
      )}

      {/* Milestones Timeline */}
      {p.milestones && Object.keys(p.milestones).length > 0 && (
        <div className="bg-surface-card  border border-surface-border  rounded-xl p-4">
          <h3 className="text-sm font-bold text-text-muted uppercase mb-3 flex items-center"><Flag size={16} className="mr-2 text-state-warning" /> 纪念日 / 里程碑</h3>
          <div className="relative border-l-2 border-surface-border  ml-2 space-y-4 py-1">
            {Object.entries(p.milestones)
              .sort(([, dA], [, dB]) => new Date(dA as string).getTime() - new Date(dB as string).getTime())
              .map(([name, date]) => (
                <div key={name} className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-state-warning border-2 border-surface-card "></div>
                  <p className="text-xs text-text-muted font-mono">{date as React.ReactNode}</p>
                  <p className="text-sm font-bold text-text-primary ">{name}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Body & Sensitivity */}
      <div className="bg-surface-card  border border-surface-border  rounded-xl p-4">
        <h3 className="text-sm font-bold text-text-muted uppercase mb-3 flex items-center"><Heart size={16} className="mr-2 text-accent-vivid" /> 身体密码</h3>
        <div className="space-y-4">
          <div>
            <span className="text-xs text-text-muted block mb-2 font-medium">敏感点</span>
            <div className="flex flex-wrap gap-1.5">
              {p.sensitiveSpots?.length ? p.sensitiveSpots.map(s => <span key={s} className="text-xs bg-accent-vivid dark:bg-accent-vivid/20 text-accent-vivid dark:text-accent-vivid px-2 py-1 rounded-full border border-accent-vivid dark:border-accent-vivid">{s}</span>) : <span className="text-xs text-text-muted">未知</span>}
            </div>
          </div>
          {p.stimulationPreferences && p.stimulationPreferences.length > 0 && (
            <div>
              <span className="text-xs text-text-muted block mb-2 font-medium">喜好的刺激</span>
              <div className="flex flex-wrap gap-1.5">
                {p.stimulationPreferences.map(s => <span key={s} className="text-xs bg-state-warning dark:bg-state-warning/20 text-state-warning dark:text-state-warning px-2 py-1 rounded-full border border-state-warning dark:border-state-warning">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Capability */}
      <div className="bg-surface-card  border border-surface-border  rounded-xl p-4">
        <h3 className="text-sm font-bold text-text-muted uppercase mb-3 flex items-center"><RulerIcon size={16} className="mr-2 text-chart-tertiary" /> 开发与能力</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-muted  p-2 rounded text-center">
            <span className="text-xs text-text-muted">深喉等级</span>
            <div className="font-bold text-chart-tertiary text-lg">Lv.{p.deepThroatLevel || 0}</div>
          </div>
          <div className="bg-surface-muted  p-2 rounded text-center">
            <span className="text-xs text-text-muted">高潮难度</span>
            <div className="font-bold text-chart-tertiary text-lg">{p.orgasmDifficulty === 'easy' ? '易' : p.orgasmDifficulty === 'hard' ? '难' : '中'}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.analDeveloped && <span className="text-xs bg-chart-tertiary dark:bg-chart-tertiary/30 text-chart-tertiary px-2 py-1 rounded border border-chart-tertiary">✅ 后庭已开发</span>}
          {p.squirtingAbility && <span className="text-xs bg-chart-primary dark:bg-chart-primary/30 text-chart-primary px-2 py-1 rounded border border-chart-primary">💦 潮吹体质</span>}
        </div>
      </div>

      {/* Inner World & Notes */}
      {(p.primaryValues || p.petPeeves || p.notes) && (
        <div className="bg-surface-card  border border-surface-border  rounded-xl p-4">
          <h3 className="text-sm font-bold text-text-muted uppercase mb-3 flex items-center"><BrainCircuit size={16} className="mr-2 text-chart-tertiary" /> 内心与备注</h3>
          <div className="space-y-3">
            {p.primaryValues && (
              <div>
                <span className="text-xs text-text-muted flex items-center mb-1"><ThumbsUp size={12} className="mr-1" /> 最看重 / 喜欢</span>
                <p className="text-sm font-medium text-text-primary ">{p.primaryValues}</p>
              </div>
            )}
            {p.petPeeves && (
              <div>
                <span className="text-xs text-text-muted flex items-center mb-1"><ThumbsDown size={12} className="mr-1" /> 最讨厌 / 雷点</span>
                <p className="text-sm font-medium text-text-primary ">{p.petPeeves}</p>
              </div>
            )}
            {p.notes && (
              <div className="bg-surface-muted  p-3 rounded-lg text-sm italic text-text-muted mt-2">
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
