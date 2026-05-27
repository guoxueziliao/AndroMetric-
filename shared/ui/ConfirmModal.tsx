import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'neutral';
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
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const confirmClass = tone === 'danger'
        ? 'bg-state-danger-text text-text-on-accent hover:bg-state-danger-text/90'
        : 'bg-accent text-text-on-accent hover:bg-accent/90';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <div className="flex gap-3 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 min-h-[44px] py-3 bg-surface-muted rounded-xl font-bold text-text-secondary"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`flex-1 min-h-[44px] py-3 rounded-xl font-bold ${confirmClass}`}
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
        </Modal>
    );
};

export default ConfirmModal;
