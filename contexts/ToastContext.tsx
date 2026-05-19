
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast, ToastStack, type ToastType } from '../shared/ui';

interface ToastEntry {
    id: string;
    msg: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;
const nextToastId = () => `toast-${Date.now()}-${++toastIdCounter}`;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastEntry[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = nextToastId();
        setToasts(prev => [...prev, { id, msg: message, type }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastStack>
                <AnimatePresence>
                    {toasts.map(t => (
                        <Toast
                            key={t.id}
                            message={t.msg}
                            type={t.type}
                            onClose={() => dismissToast(t.id)}
                        />
                    ))}
                </AnimatePresence>
            </ToastStack>
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
