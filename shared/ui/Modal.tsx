import React, { useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const contentVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      duration: 0.3, 
      ease: [0.34, 1.56, 0.64, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white dark:bg-[#0f172a] w-full max-w-md rounded-[2rem] shadow-2xl dark:shadow-dark-glow flex flex-col max-h-[90vh] overflow-hidden border border-transparent dark:border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a]/50 backdrop-blur-md">
              <h2 id="modal-title" className="text-xl font-black text-brand-text dark:text-slate-100 truncate pr-4 tracking-tight">{title}</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-none p-1.5 rounded-full text-brand-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-brand-text dark:hover:text-slate-200 transition-colors"
                aria-label="关闭弹窗"
              >
                <X size={24} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar text-brand-text dark:text-slate-300">
              {children}
            </div>

            {footer && (
              <div className="flex-none px-6 py-5 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3 bg-slate-50 dark:bg-[#0f172a]/80 backdrop-blur-md">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
