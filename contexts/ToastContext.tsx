
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, type ToastType } from '../shared/ui';

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ msg: string, type: ToastType, visible: boolean }>({ 
        msg: '', type: 'info', visible: false 
    });

    const showToast = useCallback((message: string, type: ToastType) => {
        setToast({ msg: message, type, visible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast 
                message={toast.msg} 
                type={toast.type} 
                isVisible={toast.visible} 
                onClose={hideToast} 
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
