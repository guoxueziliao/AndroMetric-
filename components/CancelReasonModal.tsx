
import React from 'react';
import Modal from './Modal';
import { MousePointerClick, XCircle, HelpCircle } from 'lucide-react';

interface CancelReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    title?: string;
}

const REASONS = [
    { id: 'mistouch', label: '误触 / 测试', icon: MousePointerClick, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'giveup', label: '中途放弃', icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'other', label: '其他原因', icon: HelpCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
];

const CancelReasonModal: React.FC<CancelReasonModalProps> = ({ isOpen, onClose, onConfirm, title = "取消记录" }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4 py-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">请选择取消原因，以便在历史中标记</p>
                <div className="grid gap-3">
                    {REASONS.map((reason) => (
                        <button
                            key={reason.id}
                            onClick={() => onConfirm(reason.label)}
                            className={`flex items-center p-4 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all ${reason.bg}`}
                        >
                            <div className={`p-2 rounded-full bg-white dark:bg-slate-900 shadow-sm mr-4 ${reason.color}`}>
                                <reason.icon size={20} />
                            </div>
                            <span className="font-bold text-brand-text dark:text-slate-200">{reason.label}</span>
                        </button>
                    ))}
                </div>
                <button 
                    onClick={onClose}
                    className="w-full py-3 mt-2 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
                >
                    暂不取消
                </button>
            </div>
        </Modal>
    );
};

export default CancelReasonModal;
