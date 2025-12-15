
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="relative bg-brand-primary w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Header - Fixed */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 id="modal-title" className="text-xl font-bold text-brand-text truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="flex-none p-1.5 rounded-full text-brand-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-text transition-colors"
            aria-label="关闭弹窗"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar text-brand-text">
          {children}
        </div>

        {/* Footer - Fixed (if present) */}
        {footer && (
          <div className="flex-none px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 bg-brand-primary">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
