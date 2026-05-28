import React, { useState, useEffect } from 'react';
import { Modal, Toast } from '../../shared/ui';
import type { PornUseEvent, AdultBehaviorScale5, PornContentType, AdultBehaviorAfterState, MasturbationEvent, SexEvent } from '../../domain';
import { createPornUseEventDraft, validatePornUseEvent } from '../sex-life/model/pornUseEventModel';
import { StorageService } from '../../core/storage';
import EventLinkPicker from '../sex-life/ui/EventLinkPicker';
import { Hand, Heart, Link2, X } from 'lucide-react';
import { removeLink } from '../sex-life/model/eventLinking';

interface PornUseRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: PornUseEvent) => void;
  initialData?: PornUseEvent;
  dateStr: string;
}

const CONTENT_TYPE_OPTIONS: { value: PornContentType; label: string }[] = [
  { value: 'video', label: '视频' },
  { value: 'image', label: '图片' },
  { value: 'text', label: '文字' },
  { value: 'audio', label: '音频' },
  { value: 'live', label: '直播' },
  { value: 'chat', label: '聊天' },
  { value: 'social_feed', label: '社媒' },
  { value: 'ai_generated', label: 'AI生成' },
  { value: 'fantasy_reading', label: '幻想阅读' },
  { value: 'other', label: '其他' },
];

const AFTER_STATE_OPTIONS: { value: AdultBehaviorAfterState; label: string }[] = [
  { value: 'satisfied', label: '满足' },
  { value: 'calm', label: '平静' },
  { value: 'tired', label: '疲惫' },
  { value: 'empty', label: '空虚' },
  { value: 'anxious', label: '焦虑' },
  { value: 'guilty', label: '愧疚' },
  { value: 'more_aroused', label: '更兴奋' },
  { value: 'neutral', label: '无感' },
];

const PornUseRecordModal: React.FC<PornUseRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  dateStr,
}) => {
  const [startedAt, setStartedAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [contentTypes, setContentTypes] = useState<PornContentType[]>([]);
  const [arousalLevel, setArousalLevel] = useState<AdultBehaviorScale5 | null>(null);
  const [ledToMasturbation, setLedToMasturbation] = useState<boolean | null>(null);
  const [ejaculated, setEjaculated] = useState<boolean | null>(null);
  const [afterState, setAfterState] = useState<AdultBehaviorAfterState[]>([]);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [linkedMb, setLinkedMb] = useState<MasturbationEvent[]>([]);
  const [linkedSx, setLinkedSx] = useState<SexEvent[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setStartedAt(initialData.startedAt ? initialData.startedAt.slice(11, 16) : '');
      setDurationMinutes(initialData.durationMinutes != null ? String(initialData.durationMinutes) : '');
      setContentTypes(initialData.contentTypes ?? []);
      setArousalLevel(initialData.arousalLevel);
      setLedToMasturbation(initialData.ledToMasturbation);
      setEjaculated(initialData.ejaculated);
      setAfterState(initialData.afterState ?? []);
      setNotes(initialData.notes ?? '');
    } else {
      const now = new Date();
      setStartedAt(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setDurationMinutes('');
      setContentTypes([]);
      setArousalLevel(null);
      setLedToMasturbation(null);
      setEjaculated(null);
      setAfterState([]);
      setNotes('');
    }
  }, [isOpen, initialData]);

  // Load linked events when editing
  useEffect(() => {
    if (!isOpen || !initialData) { setLinkedMb([]); setLinkedSx([]); return; }
    const load = async () => {
      const mb = initialData.linkedMasturbationEventIds.length > 0
        ? (await Promise.all(initialData.linkedMasturbationEventIds.map(id => StorageService.masturbationEvents.queries.byId(id)))).filter((e): e is MasturbationEvent => !!e)
        : [];
      const sx = initialData.linkedSexEventIds.length > 0
        ? (await Promise.all(initialData.linkedSexEventIds.map(id => StorageService.sexEvents.queries.byId(id)))).filter((e): e is SexEvent => !!e)
        : [];
      setLinkedMb(mb);
      setLinkedSx(sx);
    };
    load().catch(() => {});
  }, [isOpen, initialData]);

  const handleUnlink = async (targetId: string, targetType: 'masturbation' | 'sex') => {
    if (!initialData) return;
    const target = targetType === 'masturbation'
      ? await StorageService.masturbationEvents.queries.byId(targetId)
      : await StorageService.sexEvents.queries.byId(targetId);
    if (!target) return;
    const [updatedPu, updatedTarget] = removeLink(initialData, 'porn_use', target, targetType);
    await StorageService.pornUseEvents.save(updatedPu as PornUseEvent);
    if (targetType === 'masturbation') await StorageService.masturbationEvents.save(updatedTarget as MasturbationEvent);
    else await StorageService.sexEvents.save(updatedTarget as SexEvent);
    setLinkedMb(prev => prev.filter(e => e.id !== targetId));
    setLinkedSx(prev => prev.filter(e => e.id !== targetId));
    setToast({ message: '已解除关联', type: 'success' });
  };

  const toggleContentType = (ct: PornContentType) => {
    setContentTypes(prev => prev.includes(ct) ? prev.filter(v => v !== ct) : [...prev, ct]);
  };

  const toggleAfterState = (as: AdultBehaviorAfterState) => {
    setAfterState(prev => prev.includes(as) ? prev.filter(v => v !== as) : [...prev, as]);
  };

  const handleSave = async () => {
    const startedAtISO = `${dateStr}T${startedAt}:00`;
    const event = createPornUseEventDraft({
      startedAt: startedAtISO,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      contentTypes,
      arousalLevel,
      ledToMasturbation,
      ejaculated,
      afterState,
      notes: notes || undefined,
      ...(initialData ? { source: initialData.source } : {}),
    });

    // Preserve id, createdAt, and linked ids when editing
    if (initialData) {
      (event as PornUseEvent).id = initialData.id;
      (event as PornUseEvent).createdAt = initialData.createdAt;
      (event as PornUseEvent).linkedMasturbationEventIds = linkedMb.map(e => e.id);
      (event as PornUseEvent).linkedSexEventIds = linkedSx.map(e => e.id);
    }

    const errors = validatePornUseEvent(event);
    if (errors.length > 0) {
      setToast({ message: errors[0].message, type: 'error' });
      return;
    }

    try {
      await StorageService.pornUseEvents.save(event);
      onSave(event);
      setToast({ message: '色情使用记录已保存', type: 'success' });
      setTimeout(() => onClose(), 300);
    } catch {
      setToast({ message: '保存失败', type: 'error' });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="色情使用记录"
        variant="adult"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <button type="button" onClick={onClose} className="flex-1 min-h-[44px] py-3 bg-surface-muted rounded-xl font-bold text-text-secondary">取消</button>
            <button type="button" onClick={handleSave} className="flex-1 min-h-[44px] py-3 bg-accent text-text-on-accent rounded-xl font-bold">保存</button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* 时间 */}
          <div>
            <label className="text-xs font-bold text-text-muted block mb-1">开始时间</label>
            <input type="time" value={startedAt} onChange={e => setStartedAt(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-muted text-text-primary text-sm" />
          </div>

          {/* 时长 */}
          <div>
            <label className="text-xs font-bold text-text-muted block mb-1">时长（分钟）</label>
            <input type="number" min="0" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} placeholder="可选" className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-muted text-text-primary text-sm" />
          </div>

          {/* 内容类型 */}
          <div>
            <label className="text-xs font-bold text-text-muted block mb-2">内容类型</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => toggleContentType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${contentTypes.includes(opt.value) ? 'bg-accent text-text-on-accent border-accent' : 'bg-surface-card border-surface-border text-text-muted'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 唤起强度 */}
          <div>
            <label className="text-xs font-bold text-text-muted block mb-2">唤起强度</label>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as const).map(v => (
                <button key={v} type="button" onClick={() => setArousalLevel(v)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-colors ${arousalLevel === v ? 'bg-accent text-text-on-accent border-accent' : 'bg-surface-card border-surface-border text-text-muted'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 是否进入自慰 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted">是否进入自慰</span>
            <div className="flex gap-2">
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={() => setLedToMasturbation(v)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${ledToMasturbation === v ? 'bg-accent text-text-on-accent border-accent' : 'bg-surface-card border-surface-border text-text-muted'}`}>
                  {v ? '是' : '否'}
                </button>
              ))}
            </div>
          </div>

          {/* 是否射精 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted">是否射精</span>
            <div className="flex gap-2">
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={() => setEjaculated(v)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${ejaculated === v ? 'bg-accent text-text-on-accent border-accent' : 'bg-surface-card border-surface-border text-text-muted'}`}>
                  {v ? '是' : '否'}
                </button>
              ))}
            </div>
          </div>

          {/* 使用后状态 */}
          <div>
            <label className="text-xs font-bold text-text-muted block mb-2">使用后状态</label>
            <div className="flex flex-wrap gap-2">
              {AFTER_STATE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => toggleAfterState(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${afterState.includes(opt.value) ? 'bg-accent text-text-on-accent border-accent' : 'bg-surface-card border-surface-border text-text-muted'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="text-xs font-bold text-text-muted block mb-1">备注</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="可选"
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-muted text-text-primary text-sm resize-none" />
          </div>

          {/* 关联事件 */}
          {initialData && (
            <div>
              <label className="text-xs font-bold text-text-muted block mb-2">关联事件</label>
              <div className="space-y-2">
                {linkedMb.map(mb => (
                  <div key={mb.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-card border border-surface-border">
                    <Hand size={14} className="text-text-muted" />
                    <span className="text-xs font-bold text-text-primary flex-1">自慰 · {mb.startedAt.slice(11, 16)}</span>
                    <button type="button" onClick={() => handleUnlink(mb.id, 'masturbation')} className="p-1 text-text-muted hover:text-state-danger-text"><X size={14} /></button>
                  </div>
                ))}
                {linkedSx.map(sx => (
                  <div key={sx.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-card border border-surface-border">
                    <Heart size={14} fill="currentColor" fillOpacity={0.2} className="text-text-muted" />
                    <span className="text-xs font-bold text-text-primary flex-1">性爱 · {sx.startedAt.slice(11, 16)}</span>
                    <button type="button" onClick={() => handleUnlink(sx.id, 'sex')} className="p-1 text-text-muted hover:text-state-danger-text"><X size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setLinkPickerOpen(true)}
                  className="w-full py-2 rounded-lg border border-dashed border-surface-border text-xs font-bold text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-1">
                  <Link2 size={14} /> 添加关联
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {initialData && (
        <EventLinkPicker
          isOpen={linkPickerOpen}
          onClose={() => setLinkPickerOpen(false)}
          sourceEvent={initialData}
          sourceType="porn_use"
          onLinked={() => {
            // Reload linked events
            StorageService.pornUseEvents.queries.byId(initialData.id).then(pu => {
              if (!pu) return;
              Promise.all([
                Promise.all(pu.linkedMasturbationEventIds.map(id => StorageService.masturbationEvents.queries.byId(id))),
                Promise.all(pu.linkedSexEventIds.map(id => StorageService.sexEvents.queries.byId(id))),
              ]).then(([mb, sx]) => {
                setLinkedMb(mb.filter((e): e is MasturbationEvent => !!e));
                setLinkedSx(sx.filter((e): e is SexEvent => !!e));
              });
            }).catch(() => {});
          }}
        />
      )}

      {toast && (
        <div className="fixed top-4 left-0 right-0 z-[200] flex justify-center pointer-events-none">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </>
  );
};

export default PornUseRecordModal;
