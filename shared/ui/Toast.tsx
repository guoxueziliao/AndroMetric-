import React, { useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { CheckCircle, XCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
  showProgress?: boolean;
}

const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: -30,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.34, 1.56, 0.64, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.25 }
  }
};

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 3000,
  showProgress = true
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

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
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`relative pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-full shadow-lg ${styles[type]}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
      >
        {icons[type]}
      </motion.div>

      <span className="text-sm font-bold tracking-wide">{message}</span>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/10"
        aria-label="关闭通知"
      >
        <X size={16}/>
      </motion.button>

      {showProgress && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 rounded-full"
          initial={{ scaleX: 1, originX: 0 }}
          animate={{ scaleX: 0, originX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

interface ToastStackProps {
  children: React.ReactNode;
}

export const ToastStack: React.FC<ToastStackProps> = ({ children }) => (
  <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
    <div className="flex flex-col items-center gap-2 pt-6">
      {children}
    </div>
  </div>
);

export default Toast;
