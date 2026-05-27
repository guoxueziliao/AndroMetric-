import React, { useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { motionDuration, motionEase } from './motionTokens';

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
    transition: { duration: motionDuration.normal }
  },
  exit: { 
    opacity: 0,
    transition: { duration: motionDuration.normal }
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
      duration: motionDuration.slow,
      ease: motionEase.emphasized
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: motionDuration.normal }
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-scrim/60 p-4 backdrop-blur-md"
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
            className="relative bg-surface-card w-full max-w-md rounded-[2rem] shadow-2xl dark:shadow-dark-glow flex flex-col max-h-[90vh] overflow-hidden border border-surface-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-surface-border/60 bg-surface-card/80 backdrop-blur-md">
              <h2 id="modal-title" className="text-xl font-black text-text-primary truncate pr-4 tracking-tight">{title}</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-none p-1.5 rounded-full text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors"
                aria-label="关闭弹窗"
              >
                <X size={24} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar text-text-secondary">
              {children}
            </div>

            {footer && (
              <div className="flex-none px-6 py-5 border-t border-surface-border/60 flex justify-end space-x-3 bg-surface-muted/80 backdrop-blur-md">
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
