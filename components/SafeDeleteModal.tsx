import React, { useState } from 'react';
import Modal from './Modal';
import { ShieldAlert, Trash2 } from 'lucide-react';

interface SafeDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
}

const SafeDeleteModal: React.FC<SafeDeleteModalProps> = ({ isOpen, onClose, onConfirm, title = "危险操作", message = "确认要删除此记录吗？此操作不可撤销。" }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [inputValue, setInputValue] = useState('');

    const reset = () => {
        setStep(1);
        setInputValue('');
        onClose();
    };

    const handleFirstStep = () => {
        if (inputValue === '删除') {
            setStep(2);
        }
    };

    const handleFinalConfirm = () => {
        onConfirm();
        reset();
    };

    return (
        <Modal isOpen={isOpen} onClose={reset} title={step === 1 ? title : "再次确认"}>
            {step === 1 ? (
                <div className="space-y-4">
                    <p className="text-brand-text dark:text-slate-200">{message}</p>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                        <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                            请输入 "删除" 以继续
                        </label>
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="删除"
                            className="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={reset} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">取消</button>
                        <button 
                            onClick={handleFirstStep} 
                            disabled={inputValue !== '删除'}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            下一步
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-4 py-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">最终确认</h3>
                    <p className="text-sm text-brand-muted">如果手滑误删，数据将无法找回。</p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button onClick={reset} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-300">我再想想</button>
                        <button onClick={handleFinalConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30">确认删除</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default SafeDeleteModal;
