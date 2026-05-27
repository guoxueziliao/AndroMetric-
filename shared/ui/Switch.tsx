import React from 'react';
import { motion } from 'framer-motion';

export type SwitchTone = 'default' | 'danger' | 'quiet';
export type SwitchSize = 'sm' | 'md';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: SwitchTone;
  size?: SwitchSize;
  'aria-label'?: string;
}

const sizeConfig = {
  sm: {
    track: 'w-9 h-5',
    knob: 'w-3.5 h-3.5',
    knobOffset: 2,        // px from left edge
    knobTravel: 16,       // px the knob moves when checked
  },
  md: {
    track: 'w-12 h-[1.6rem]',
    knob: 'w-[1.2rem] h-[1.2rem]',
    knobOffset: 3,
    knobTravel: 24,
  },
} as const;

const toneTrack: Record<SwitchTone, string> = {
  default: 'bg-surface-muted dark:bg-surface-muted',
  danger: 'bg-surface-muted dark:bg-surface-muted',
  quiet: 'bg-surface-muted dark:bg-surface-muted',
};

const toneTrackChecked: Record<SwitchTone, string> = {
  default: 'bg-accent',
  danger: 'bg-state-danger-text',
  quiet: 'bg-text-muted',
};

const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  tone = 'default',
  size = 'md',
  'aria-label': ariaLabel,
}) => {
  const config = sizeConfig[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-300
        ${config.track}
        ${checked ? toneTrackChecked[tone] : toneTrack[tone]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2
      `}
    >
      <motion.span
        className="block rounded-full bg-white shadow-sm"
        style={{
          width: size === 'sm' ? 14 : 19.2,
          height: size === 'sm' ? 14 : 19.2,
        }}
        animate={{ x: checked ? config.knobTravel : config.knobOffset }}
        initial={{ x: config.knobOffset }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
};

interface SwitchFieldProps extends SwitchProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  description,
  ...switchProps
}) => (
  <label
    className={`
      flex items-center justify-between gap-3 min-h-[44px] py-2
      ${switchProps.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <div className="flex-1 min-w-0">
      <span className="text-sm font-bold text-text-primary">{label}</span>
      {description && (
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      )}
    </div>
    <Switch {...switchProps} />
  </label>
);

export default Switch;
