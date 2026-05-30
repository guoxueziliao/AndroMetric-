import React, { useState } from 'react';
import { Modal } from '../../../shared/ui';
import { Save, FileText, Edit3 } from 'lucide-react';
import type { ExperienceCardDraft } from '../../stats/model/experienceCardService';

interface ExperienceCardSaveModalProps {
  draft: ExperienceCardDraft;
  onSave: (draft: ExperienceCardDraft) => void;
  onCancel: () => void;
}

const ExperienceCardSaveModal: React.FC<ExperienceCardSaveModalProps> = ({
  draft,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(draft.title);
  const [userReflection, setUserReflection] = useState(draft.userReflection);

  const handleSave = () => {
    onSave({ ...draft, title: title.trim() || draft.title, userReflection: userReflection.trim() });
  };

  return (
    <Modal isOpen onClose={onCancel} title="保存经验卡">
      <div className="space-y-4">
        {/* Fact summary (read-only) */}
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText size={12} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted">事实摘要</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">{draft.factSummary}</p>
        </div>

        {/* Editable title */}
        <div>
          <label className="text-xs font-bold text-text-primary mb-1 block">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给这次观察起个名字"
            className="w-full px-3 py-2 text-xs bg-surface-card border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Editable user reflection */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Edit3 size={12} className="text-accent" />
            <label className="text-xs font-bold text-text-primary">我的观察心得</label>
          </div>
          <textarea
            value={userReflection}
            onChange={(e) => setUserReflection(e.target.value)}
            placeholder="这次观察你注意到了什么？"
            rows={4}
            className="w-full px-3 py-2 text-xs bg-surface-card border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Limitations (read-only) */}
        {draft.limitations.length > 0 && (
          <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
            <p className="text-[10px] font-bold text-text-muted mb-1">说明</p>
            <ul className="space-y-0.5 text-[10px] text-text-muted">
              {draft.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border text-[10px] text-text-muted">
          <p>经验卡是你自己的主观沉淀，不代表规律或结论。</p>
          <p className="mt-1">保存后可以随时在统计中回看。</p>
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
            onClick={handleSave}
            className="flex-1 py-2.5 text-xs font-bold text-text-on-accent bg-accent rounded-xl flex items-center justify-center gap-1"
          >
            <Save size={12} />
            保存经验
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExperienceCardSaveModal;
