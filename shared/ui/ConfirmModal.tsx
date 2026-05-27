import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal, { type ModalVariant } from './Modal';

export type ConfirmSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual tone. 'danger' shows warning icon + red button. Default 'danger'. */
  tone?: 'danger' | 'neutral';
  /** Behavioral severity. Controls closeOnBackdrop defaults and whether requireText is enforced. Default 'medium'. */
  severity?: ConfirmSeverity;
  /** When set, user must type this exact text to confirm. Automatically enforced when severity='critical'. */
  requireText?: string;
  /** Modal variant passed through to the underlying Modal. */
  variant?: ModalVariant;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message = '确定要执行此操作吗?',
  confirmLabel = '确认',
  cancelLabel = '取消',
  tone = 'danger',
  severity = 'medium',
  requireText,
  variant,
}) => {
  const [inputText, setInputText] = useState('');

  // Reset input when modal closes (handles parent-driven close without onClose call)
  useEffect(() => {
    if (!isOpen) setInputText('');
  }, [isOpen]);

  const effectiveRequireText = severity === 'critical'
    ? (requireText ?? '确认')
    : requireText;

  const isTextConfirmed = !effectiveRequireText || inputText === effectiveRequireText;

  const handleClose = () => {
    setInputText('');
    onClose();
  };

  const handleConfirm = () => {
    if (!isTextConfirmed) return;
    onConfirm();
    setInputText('');
    onClose();
  };

  const closeOnBackdrop = severity === 'low';

  const confirmClass = tone === 'danger'
    ? 'bg-state-danger-text text-text-on-accent hover:bg-state-danger-text/90'
    : 'bg-accent text-text-on-accent hover:bg-accent/90';

  const resolvedVariant: ModalVariant = variant ?? (tone === 'danger' ? 'danger' : 'default');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      variant={resolvedVariant}
      size="sm"
      closeOnBackdrop={closeOnBackdrop}
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 min-h-[44px] py-3 bg-surface-muted rounded-xl font-bold text-text-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isTextConfirmed}
            className={`flex-1 min-h-[44px] py-3 rounded-xl font-bold ${confirmClass} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3 py-2">
        {tone === 'danger' && (
          <AlertTriangle size={20} className="text-state-danger-text mt-0.5 shrink-0" />
        )}
        <div className="text-sm text-text-primary leading-relaxed">
          {message}
        </div>
      </div>

      {effectiveRequireText && (
        <div className="mt-3">
          <p className="text-xs text-text-muted mb-2">
            请输入 <span className="font-bold text-state-danger-text">"{effectiveRequireText}"</span> 以确认
          </p>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={effectiveRequireText}
            className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            autoComplete="off"
          />
        </div>
      )}
    </Modal>
  );
};

export default ConfirmModal;
