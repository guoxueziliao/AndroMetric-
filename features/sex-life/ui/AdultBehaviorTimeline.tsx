import React, { useState, useEffect } from 'react';
import { StorageService } from '../../../core/storage';
import { buildDayTimeline, countOrphanLinks, type TimelineEntry } from '../model/dayTimeline';
import { Flame, Hand, Heart, Link2 } from 'lucide-react';

interface AdultBehaviorTimelineProps {
  targetDate: string;
}

const TYPE_ICONS = {
  porn_use: <Flame size={14} />,
  masturbation: <Hand size={14} />,
  sex: <Heart size={14} fill="currentColor" fillOpacity={0.2} />,
};

const TYPE_LABELS = {
  porn_use: '色情使用',
  masturbation: '自慰',
  sex: '性爱',
};

const TYPE_COLORS = {
  porn_use: 'bg-accent-vivid/10 border-accent-vivid/30 text-accent-vivid',
  masturbation: 'bg-state-info-bg border-state-info-text/30 text-state-info-text',
  sex: 'bg-accent/10 border-accent/30 text-accent',
};

const AdultBehaviorTimeline: React.FC<AdultBehaviorTimelineProps> = ({ targetDate }) => {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pu, mb, sx] = await Promise.all([
          StorageService.pornUseEvents.queries.byTargetDate(targetDate),
          StorageService.masturbationEvents.queries.byTargetDate(targetDate),
          StorageService.sexEvents.queries.byTargetDate(targetDate),
        ]);
        setEntries(buildDayTimeline({ pornUseEvents: pu, masturbationEvents: mb, sexEvents: sx, targetDate }));
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetDate]);

  if (loading) {
    return <p className="text-[11px] text-text-muted/70 italic pl-1">加载中...</p>;
  }

  if (entries.length === 0) {
    return <p className="text-[11px] text-text-muted/70 italic pl-1">这一天还没有成人行为事件</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const orphanCount = countOrphanLinks(entry, entries);
        const hasLinks = entry.linkedIds.some((lid) => entries.some((e) => e.id === lid));
        return (
          <div key={entry.id} className={`relative flex gap-3 ${i > 0 ? 'pt-3 border-t border-surface-border/40' : ''}`}>
            {/* Time column */}
            <div className="flex-none w-12 text-right">
              <span className="text-[11px] font-mono font-bold text-text-muted">{entry.time}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${TYPE_COLORS[entry.type]}`}>
                  {TYPE_ICONS[entry.type]}
                  {TYPE_LABELS[entry.type]}
                </span>
                <span className="text-xs font-bold text-text-primary truncate">{entry.summary}</span>
              </div>

              {entry.details.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {entry.details.map((d, j) => (
                    <span key={j} className="text-[10px] text-text-muted bg-surface-muted px-1.5 py-0.5 rounded">{d}</span>
                  ))}
                </div>
              )}

              {hasLinks && (
                <div className="flex items-center gap-1 mt-1">
                  <Link2 size={10} className="text-accent" />
                  <span className="text-[10px] text-accent font-bold">
                    关联 {entry.linkedIds.filter((lid) => entries.some((e) => e.id === lid)).length} 个事件
                  </span>
                </div>
              )}

              {orphanCount > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Link2 size={10} className="text-state-warning-text" />
                  <span className="text-[10px] text-state-warning-text font-bold">
                    {orphanCount} 个关联事件已不存在
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdultBehaviorTimeline;
