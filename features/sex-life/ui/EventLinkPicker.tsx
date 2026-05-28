import React, { useState, useEffect, useCallback } from 'react';
import { BottomSheet } from '../../../shared/ui';
import { StorageService } from '../../../core/storage';
import { computeLinkCandidates, addLink, removeLink, type AdultEventType, type LinkCandidate, type AnyAdultEvent } from '../model/eventLinking';
import type { PornUseEvent, MasturbationEvent, SexEvent } from '../../../domain';
import { Flame, Hand, Heart } from 'lucide-react';

interface EventLinkPickerProps {
  isOpen: boolean;
  onClose: () => void;
  sourceEvent: AnyAdultEvent;
  sourceType: AdultEventType;
  onLinked: () => void;
}

const TYPE_ICONS: Record<AdultEventType, React.ReactNode> = {
  porn_use: <Flame size={14} />,
  masturbation: <Hand size={14} />,
  sex: <Heart size={14} fill="currentColor" fillOpacity={0.2} />,
};

const TYPE_LABELS: Record<AdultEventType, string> = {
  porn_use: '色情使用',
  masturbation: '自慰',
  sex: '性爱',
};

const EventLinkPicker: React.FC<EventLinkPickerProps> = ({
  isOpen,
  onClose,
  sourceEvent,
  sourceType,
  onLinked,
}) => {
  const [candidates, setCandidates] = useState<LinkCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCandidates = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const [pu, mb, sx] = await Promise.all([
        StorageService.pornUseEvents.queries.all(),
        StorageService.masturbationEvents.queries.all(),
        StorageService.sexEvents.queries.all(),
      ]);
      const cands = computeLinkCandidates({
        sourceEvent,
        sourceType,
        pornUseEvents: pu,
        masturbationEvents: mb,
        sexEvents: sx,
      });
      setCandidates(cands);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, sourceEvent, sourceType]);

  useEffect(() => { loadCandidates(); }, [loadCandidates]);

  const handleToggleLink = async (candidate: LinkCandidate) => {
    try {
      // Fetch current source and target from storage
      const sourceFromDb = await (
        sourceType === 'porn_use' ? StorageService.pornUseEvents.queries.byId(sourceEvent.id)
          : sourceType === 'masturbation' ? StorageService.masturbationEvents.queries.byId(sourceEvent.id)
            : StorageService.sexEvents.queries.byId(sourceEvent.id)
      );
      const targetFromDb = await (
        candidate.type === 'porn_use' ? StorageService.pornUseEvents.queries.byId(candidate.id)
          : candidate.type === 'masturbation' ? StorageService.masturbationEvents.queries.byId(candidate.id)
            : StorageService.sexEvents.queries.byId(candidate.id)
      );
      if (!sourceFromDb || !targetFromDb) return;

      const [updatedSource, updatedTarget] = candidate.alreadyLinked
        ? removeLink(sourceFromDb, sourceType, targetFromDb, candidate.type)
        : addLink(sourceFromDb, sourceType, targetFromDb, candidate.type);

      // Save both
      const saveSource = sourceType === 'porn_use'
        ? StorageService.pornUseEvents.save(updatedSource as PornUseEvent)
        : sourceType === 'masturbation'
          ? StorageService.masturbationEvents.save(updatedSource as MasturbationEvent)
          : StorageService.sexEvents.save(updatedSource as SexEvent);
      const saveTarget = candidate.type === 'porn_use'
        ? StorageService.pornUseEvents.save(updatedTarget as PornUseEvent)
        : candidate.type === 'masturbation'
          ? StorageService.masturbationEvents.save(updatedTarget as MasturbationEvent)
          : StorageService.sexEvents.save(updatedTarget as SexEvent);

      await Promise.all([saveSource, saveTarget]);
      onLinked();
      await loadCandidates();
    } catch {
      // silently fail — the UI will refresh on next open
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="关联事件"
      maxHeight="60vh"
    >
      {loading ? (
        <p className="text-sm text-text-muted text-center py-4">加载中...</p>
      ) : candidates.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">暂无可关联事件</p>
      ) : (
        <div className="space-y-2">
          {candidates.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleToggleLink(c)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left min-h-[44px] ${c.alreadyLinked ? 'bg-accent/10 border-accent/30' : 'bg-surface-card border-surface-border hover:bg-surface-muted'}`}
            >
              <span className="text-text-muted">{TYPE_ICONS[c.type]}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-text-primary">{TYPE_LABELS[c.type]}</span>
                <span className="text-[10px] text-text-muted ml-2">{c.startedAt.slice(11, 16)}</span>
                <div className="text-[10px] text-text-muted truncate">{c.summary}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${c.alreadyLinked ? 'bg-accent text-text-on-accent' : 'bg-surface-muted text-text-muted'}`}>
                {c.alreadyLinked ? '已关联' : '关联'}
              </span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
};

export default EventLinkPicker;
