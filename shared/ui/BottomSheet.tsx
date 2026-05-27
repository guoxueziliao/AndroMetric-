import React from 'react';
import type { Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { motionDuration } from './motionTokens';
import OverlayPrimitive from './OverlayPrimitive';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Max height of the sheet content area. Default '65vh'. */
  maxHeight?: string;
  /** Whether clicking the backdrop closes the sheet. Default true. */
  closeOnBackdrop?: boolean;
}

const sheetVariants: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDuration.slow,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: 48,
    transition: { duration: motionDuration.fast }
  }
};

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxHeight = '65vh',
  closeOnBackdrop = true,
}) => {
  return (
    <OverlayPrimitive
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEsc
      layout="bottom"
      backdropClassName="fixed inset-0 z-50 flex items-end justify-center bg-overlay-scrim/45 backdrop-blur-sm"
      contentVariants={sheetVariants}
      aria-label={title ? undefined : '底部面板'}
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
    >
      <div className="w-full max-w-lg rounded-t-[2rem] bg-surface-card border-t border-surface-border shadow-2xl">
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-surface-border" />
        <div className="flex items-center justify-between px-6 py-4">
          {title && <h2 id="bottom-sheet-title" className="text-lg font-black text-text-primary">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-5 text-text-secondary" style={{ maxHeight }}>
          {children}
        </div>

        {footer && (
          <div className="border-t border-surface-border bg-surface-muted/80 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </OverlayPrimitive>
  );
};

export default BottomSheet;
