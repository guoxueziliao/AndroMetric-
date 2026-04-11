import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onClickAsync?: () => Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  successDuration?: number;
  className?: string;
  icon?: React.ReactNode;
  showRipple?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const variants = {
  primary: 'bg-brand-accent text-white hover:bg-brand-accent/90 shadow-lg shadow-brand-accent/30',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50'
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base'
};

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  onClickAsync,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  successDuration = 1500,
  className = '',
  icon,
  showRipple = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || isSuccess) return;

    if (showRipple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: rippleIdRef.current++, x, y };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    if (onClickAsync) {
      setIsLoading(true);
      try {
        await onClickAsync();
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), successDuration);
      } finally {
        setIsLoading(false);
      }
    } else if (onClick) {
      onClick();
    }
  }, [disabled, isLoading, isSuccess, onClick, onClickAsync, showRipple, successDuration]);

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      ref={buttonRef}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        relative overflow-hidden font-bold rounded-xl transition-colors
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Loader2 className="w-5 h-5 animate-spin" />
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <Check className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            {icon && <span>{icon}</span>}
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {showRipple && ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            opacity: 0.3,
            pointerEvents: 'none'
          }}
        />
      ))}
    </motion.button>
  );
};

export default AnimatedButton;
