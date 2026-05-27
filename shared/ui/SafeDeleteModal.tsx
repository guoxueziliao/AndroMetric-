import React, { useState } from 'react';
import Modal from './Modal';
import { ShieldAlert } from 'lucide-react';

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
                    <p className="text-text-primary">{message}</p>
                    <div className="bg-state-danger-bg border border-state-danger-text/30 p-3 rounded-lg">
                        <label className="block text-xs font-bold text-state-danger-text mb-1">
                            请输入 "删除" 以继续
                        </label>
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="删除"
                            className="w-full bg-surface-card border border-state-danger-text/40 rounded p-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-state-danger-text"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={reset} className="px-4 py-2 rounded-lg bg-surface-muted text-text-muted font-bold">取消</button>
                        <button 
                            onClick={handleFirstStep} 
                            disabled={inputValue !== '删除'}
                            className="px-4 py-2 rounded-lg bg-state-danger-text text-text-on-accent font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            下一步
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-4 py-4">
                    <div className="mx-auto w-16 h-16 bg-state-danger-bg rounded-full flex items-center justify-center text-state-danger-text animate-pulse">
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-state-danger-text">最终确认</h3>
                    <p className="text-sm text-text-muted">如果手滑误删，数据将无法找回。</p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button onClick={reset} className="flex-1 py-3 bg-surface-muted rounded-xl font-bold text-text-secondary">我再想想</button>
                        <button onClick={handleFinalConfirm} className="flex-1 py-3 bg-state-danger-text text-text-on-accent rounded-xl font-bold shadow-lg shadow-state-danger-text/30">确认删除</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default SafeDeleteModal;
