
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-[#0f172a] w-full max-w-md rounded-[2rem] shadow-2xl dark:shadow-dark-glow flex flex-col max-h-[90vh] overflow-hidden transition-all border border-transparent dark:border-white/5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header - Fixed */}
        <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a]/50 backdrop-blur-md">
          <h2 id="modal-title" className="text-xl font-black text-brand-text dark:text-slate-100 truncate pr-4 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="flex-none p-1.5 rounded-full text-brand-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-brand-text dark:hover:text-slate-200 transition-all active:scale-90"
            aria-label="关闭弹窗"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar text-brand-text dark:text-slate-300">
          {children}
        </div>

        {/* Footer - Fixed (if present) */}
        {footer && (
          <div className="flex-none px-6 py-5 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3 bg-slate-50 dark:bg-[#0f172a]/80 backdrop-blur-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
