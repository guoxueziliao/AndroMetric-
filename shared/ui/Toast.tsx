import React, { useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { CheckCircle, XCircle, X, Info, AlertTriangle } from 'lucide-react';
import { motionEase } from './motionTokens';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const toastDurationByType: Record<ToastType, number> = {
  success: 2200,
  info: 2600,
  warning: 3600,
  error: 4500,
};

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
    y: -24,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: motionEase.standard
    }
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.95,
    transition: { duration: 0.16 }
  }
};

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration,
  showProgress = true
}) => {
  const resolvedDuration = duration ?? toastDurationByType[type];

  useEffect(() => {
    const timer = setTimeout(onClose, resolvedDuration);
    return () => clearTimeout(timer);
  }, [onClose, resolvedDuration]);

  const styles: Record<ToastType, string> = {
    success: 'bg-state-success-text text-text-on-accent shadow-state-success-text/30',
    error: 'bg-state-danger-text text-text-on-accent shadow-state-danger-text/30',
    info: 'bg-state-info-text text-text-on-accent shadow-state-info-text/30',
    warning: 'bg-state-warning-text text-text-on-accent shadow-state-warning-text/30',
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
  };

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`relative pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-full shadow-lg max-w-sm ${styles[type]}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
      >
        {icons[type]}
      </motion.div>

      <span className="text-sm font-bold tracking-wide line-clamp-2">{message}</span>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-surface-inverted/10 shrink-0"
        aria-label="关闭通知"
      >
        <X size={16}/>
      </motion.button>

      {showProgress && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-on-accent/30 rounded-full"
          initial={{ scaleX: 1, originX: 0 }}
          animate={{ scaleX: 0, originX: 0 }}
          transition={{ duration: resolvedDuration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

interface ToastStackProps {
  children: React.ReactNode;
}

export const ToastStack: React.FC<ToastStackProps> = ({ children }) => (
  <div
    className="fixed left-0 right-0 z-[100] pointer-events-none"
    style={{ top: 0, paddingTop: `max(1rem, env(safe-area-inset-top))` }}
  >
    <div className="flex flex-col items-center gap-2">
      {children}
    </div>
  </div>
);

export default Toast;
