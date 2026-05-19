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
        ? 'bg-red-500 text-white hover:bg-red-600'
        : 'bg-brand-accent text-white hover:bg-brand-accent-hover';

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
                        className="flex-1 min-h-[44px] py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-300"
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
                    <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="text-sm text-brand-text dark:text-slate-200 leading-relaxed">
                    {message}
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
