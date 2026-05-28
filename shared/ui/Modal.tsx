import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import OverlayPrimitive, { type OverlayVariant } from './OverlayPrimitive';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';
export type ModalVariant = OverlayVariant;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Overlay semantic variant. Affects closeOnBackdrop default and future theming. */
  variant?: ModalVariant;
  /** Max-width of the modal panel. Default 'md'. */
  size?: ModalSize;
  /** Whether clicking the backdrop closes the modal. Default: true except for 'danger'. */
  closeOnBackdrop?: boolean;
  /** Secondary description text shown below the title. */
  description?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = 'default',
  size = 'md',
  closeOnBackdrop,
  description,
}) => {
  const resolvedCloseOnBackdrop = closeOnBackdrop ?? (variant !== 'danger');

  return (
    <OverlayPrimitive
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={resolvedCloseOnBackdrop}
      closeOnEsc
      variant={variant}
      aria-label={title ? undefined : '对话框'}
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`relative bg-surface-card w-full ${sizeClasses[size]} rounded-[2rem] shadow-2xl dark:shadow-dark-glow flex flex-col max-h-[90dvh] overflow-hidden border border-surface-border/60`}
      >
        {(title || description) && (
          <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-surface-border/60 bg-surface-card/80 backdrop-blur-md">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id="modal-title" className="text-xl font-black text-text-primary truncate pr-4 tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-text-muted mt-0.5 truncate">{description}</p>
              )}
            </div>
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
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar text-text-secondary">
          {children}
        </div>

        {footer && (
          <div className="flex-none px-6 py-5 border-t border-surface-border/60 flex justify-end space-x-3 bg-surface-muted/80 backdrop-blur-md">
            {footer}
          </div>
        )}
      </div>
    </OverlayPrimitive>
  );
};

export default Modal;
