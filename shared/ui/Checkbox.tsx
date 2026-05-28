import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export type CheckboxTone = 'default' | 'danger' | 'quiet';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: CheckboxTone;
  'aria-label'?: string;
}

const checkedClass: Record<CheckboxTone, string> = {
  default: 'border-accent bg-accent text-text-on-accent',
  danger: 'border-state-danger-text bg-state-danger-text text-text-on-accent',
  quiet: 'border-text-muted bg-text-muted text-text-on-accent',
};

interface CheckboxMarkProps {
  checked: boolean;
  tone: CheckboxTone;
}

const CheckboxMark: React.FC<CheckboxMarkProps> = ({ checked, tone }) => (
  <span
    className={`
      flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors
      ${checked ? checkedClass[tone] : 'border-surface-border bg-surface-card text-transparent'}
    `}
  >
    {checked && (
      <motion.span
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Check size={14} strokeWidth={3} />
      </motion.span>
    )}
  </span>
);

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  tone = 'default',
  'aria-label': ariaLabel,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={`
      inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all
      ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer active:scale-95'}
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2
    `}
  >
    <CheckboxMark checked={checked} tone={tone} />
  </button>
);

interface CheckboxFieldProps extends CheckboxProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  tone = 'default',
  'aria-label': ariaLabel,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={`
      flex min-h-[44px] w-full items-center gap-3 py-2 text-left transition-opacity
      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-[0.99]'}
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2
    `}
  >
    <span className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center">
      <CheckboxMark checked={checked} tone={tone} />
    </span>
    <div className="min-w-0 flex-1">
      <span className="text-sm font-bold text-text-primary">{label}</span>
      {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
    </div>
  </button>
);

export default Checkbox;
