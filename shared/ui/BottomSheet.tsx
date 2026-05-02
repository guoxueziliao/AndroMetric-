import React, { useEffect } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const sheetVariants: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: 48,
    transition: { duration: 0.18 }
  }
};

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-lg rounded-t-[2rem] bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/10 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-black text-brand-text dark:text-slate-100">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 pb-5 text-brand-text dark:text-slate-300">
              {children}
            </div>

            {footer && (
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-white/10 dark:bg-slate-900/80">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
