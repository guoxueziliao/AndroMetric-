import React from 'react';
import { ChevronRight, Clock, Plus } from 'lucide-react';
import type { PartnerProfile } from '../../domain';
import {
  type PartnerStatsMap,
  TYPE_CONFIG,
  getPartnerCategory
} from './model/partnerManagerData';

interface PartnerListProps {
  partners: PartnerProfile[];
  sortedPartners: PartnerProfile[];
  partnerStats: PartnerStatsMap;
  onCreate: () => void;
  onView: (partner: PartnerProfile) => void;
}

const PartnerList: React.FC<PartnerListProps> = ({ partners, sortedPartners, partnerStats, onCreate, onView }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-lg text-text-primary ">伴侣档案 ({partners.length})</h3>
      <button onClick={onCreate} className="flex items-center px-3 py-1.5 bg-accent text-text-on-accent rounded-full text-sm font-medium hover:bg-accent-hover">
        <Plus size={16} className="mr-1" /> 新建档案
      </button>
    </div>

    <div className="grid gap-3">
      {sortedPartners.length === 0 ? (
        <div className="text-center py-10 text-text-muted text-sm border-2 border-dashed border-surface-border  rounded-xl">
          暂无伴侣档案，点击新建添加。
        </div>
      ) : (
        sortedPartners.map(p => {
          const typeInfo = p.type ? TYPE_CONFIG[p.type] : null;
          const cat = getPartnerCategory(p);
          const stats = partnerStats[p.name];
          const isInactive = stats && stats.daysAgo > 30;

          return (
            <div
              key={p.id}
              onClick={() => onView(p)}
              className={`border p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer transition-colors ${isInactive ? 'bg-surface-muted  border-surface-border  opacity-70' : 'bg-surface-card  border-surface-border  hover:border-accent'}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-text-on-accent font-bold shadow-sm ${isInactive ? 'bg-surface-border' : (p.avatarColor || 'bg-surface-border')}`}>
                  {p.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold ${isInactive ? 'text-text-muted' : 'text-text-primary '}`}>{p.name}</h4>
                    {cat && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isInactive ? 'bg-surface-border text-text-muted' : cat.color}`}>{cat.label}</span>}
                    {typeInfo && <span className={`text-[10px] text-text-on-accent px-1.5 py-0.5 rounded ${isInactive ? 'bg-surface-border' : typeInfo.color}`}>{typeInfo.label}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.origin && <span className="text-[10px] text-text-muted bg-surface-muted  px-1.5 rounded">{p.origin}</span>}
                    {stats && (
                      <span className={`text-[10px] flex items-center ${isInactive ? 'text-text-muted' : 'text-state-success dark:text-state-success'}`}>
                        <Clock size={10} className="mr-0.5" /> {stats.daysAgo === 0 ? '今天' : `${stats.daysAgo}天前`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {isInactive && <span className="text-[10px] text-text-muted block mb-1">已沉寂</span>}
                <ChevronRight size={20} className="text-text-muted inline-block" />
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

export default PartnerList;
