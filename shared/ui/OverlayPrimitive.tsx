import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { motionDuration, motionEase } from './motionTokens';

// Module-level ref-count for body scroll lock
const scrollLockStack = new Set<number>();
let nextLockId = 0;

function acquireScrollLock(): number {
  const id = nextLockId++;
  scrollLockStack.add(id);
  if (scrollLockStack.size === 1) {
    document.body.style.overflow = 'hidden';
  }
  return id;
}

function releaseScrollLock(id: number): void {
  scrollLockStack.delete(id);
  if (scrollLockStack.size === 0) {
    document.body.style.overflow = '';
  }
}

export type OverlayVariant = 'default' | 'danger' | 'adult' | 'quiet';

interface OverlayPrimitiveProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  variant?: OverlayVariant;
  layout?: 'center' | 'bottom';
  backdropClassName?: string;
  contentClassName?: string;
  contentVariants?: Variants;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
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

const defaultContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: motionDuration.slow, ease: motionEase.emphasized }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: motionDuration.normal }
  }
};

const defaultBackdropClass = 'fixed inset-0 z-50 flex items-center justify-center bg-overlay-scrim/60 p-4 backdrop-blur-md';

const OverlayPrimitive: React.FC<OverlayPrimitiveProps> = ({
  isOpen,
  onClose,
  children,
  closeOnBackdrop = true,
  closeOnEsc = true,
  layout = 'center',
  backdropClassName,
  contentClassName,
  contentVariants: customContentVariants,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}) => {
  const lockIdRef = useRef<number | null>(null);

  // ESC handler
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // Scroll lock (ref-counted, acquire only when transitioning closed→open)
  useEffect(() => {
    if (isOpen && lockIdRef.current === null) {
      lockIdRef.current = acquireScrollLock();
    } else if (!isOpen && lockIdRef.current !== null) {
      releaseScrollLock(lockIdRef.current);
      lockIdRef.current = null;
    }
    return () => {
      if (lockIdRef.current !== null) {
        releaseScrollLock(lockIdRef.current);
        lockIdRef.current = null;
      }
    };
  }, [isOpen]);

  const resolvedContentVariants = customContentVariants ?? defaultContentVariants;

  const resolvedBackdropClass = backdropClassName ?? (layout === 'bottom'
    ? 'fixed inset-0 z-50 flex items-end justify-center bg-overlay-scrim/45 backdrop-blur-sm'
    : defaultBackdropClass);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={resolvedBackdropClass}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            variants={resolvedContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={contentClassName}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OverlayPrimitive;
