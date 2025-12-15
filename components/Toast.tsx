
import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    isVisible: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const styles = {
        success: 'bg-emerald-500 text-white shadow-emerald-500/30',
        error: 'bg-red-500 text-white shadow-red-500/30',
        info: 'bg-blue-500 text-white shadow-blue-500/30'
    };
    
    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-full shadow-lg transition-all duration-300 animate-in slide-in-from-top-5 fade-in ${styles[type]}`}>
            {icons[type]}
            <span className="text-sm font-bold tracking-wide">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/10">
                <X size={16}/>
            </button>
        </div>
    );
};

export default Toast;
