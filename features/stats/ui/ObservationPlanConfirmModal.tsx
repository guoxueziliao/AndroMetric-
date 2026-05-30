import React, { useState } from 'react';
import { Modal } from '../../../shared/ui';
import { Eye, Calendar, FileText } from 'lucide-react';
import type { ObservationPlanDraft } from '../../stats/model/observationPlanService';

interface ObservationPlanConfirmModalProps {
  draft: ObservationPlanDraft;
  onConfirm: (windowDays: 7 | 14) => void;
  onCancel: () => void;
}

const ObservationPlanConfirmModal: React.FC<ObservationPlanConfirmModalProps> = ({
  draft,
  onConfirm,
  onCancel,
}) => {
  const [windowDays, setWindowDays] = useState<7 | 14>(draft.windowDays);

  return (
    <Modal isOpen onClose={onCancel} title="创建观察计划">
      <div className="space-y-4">
        {/* Plan summary */}
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye size={14} className="text-accent" />
            <span className="text-sm font-bold text-text-primary">{draft.title}</span>
          </div>

          <div className="space-y-1.5 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-text-muted" />
              <span>观察窗口：{windowDays} 天</span>
            </div>
            {draft.focusFields.length > 0 && (
              <div className="flex items-start gap-1.5">
                <FileText size={12} className="text-text-muted mt-0.5" />
                <span>关注：{draft.focusFields.slice(0, 4).join('、')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Window selection */}
        <div>
          <p className="text-xs font-bold text-text-primary mb-2">观察窗口</p>
          <div className="flex p-1 bg-surface-muted rounded-xl border border-surface-border">
            {([7, 14] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setWindowDays(d)}
                className={`flex-1 min-h-[36px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                  windowDays === d
                    ? 'bg-surface-card text-accent shadow-sm'
                    : 'text-text-muted'
                }`}
              >
                {d} 天
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border text-[10px] text-text-muted">
          <p>观察计划只是记录提醒和回看框架，不做任何结论或建议。</p>
          <p className="mt-1">到期后可以查看事实总结，仅供观察参考。</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-bold text-text-muted bg-surface-muted rounded-xl border border-surface-border"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(windowDays)}
            className="flex-1 py-2.5 text-xs font-bold text-text-on-accent bg-accent rounded-xl"
          >
            开始观察
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ObservationPlanConfirmModal;
