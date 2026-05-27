import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/** Erection/hardness quality icon. Abstract vertical bar with scale markings. */
export const IconErection: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="2" width="6" height="16" rx="3" />
    <line x1="8" y1="6" x2="12" y2="6" opacity="0.5" />
    <line x1="8" y1="10" x2="12" y2="10" opacity="0.5" />
    <line x1="8" y1="14" x2="12" y2="14" opacity="0.5" />
    <path d="M12 18 L12 22" />
  </svg>
);

/** Sex/intercourse icon. Abstract union of two forms. */
export const IconSex: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4z" />
    <path d="M18 16a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4z" />
  </svg>
);

/** Masturbation icon. Abstract hand grip shape. */
export const IconMasturbation: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3v10" />
    <path d="M9 6c0 1.5 1 3 3 3s3-1.5 3-3" />
    <path d="M8 10c-1.5 0-3 1-3 3s1.5 3 3 3" />
    <path d="M16 10c1.5 0 3 1 3 3s-1.5 3-3 3" />
    <rect x="9" y="13" width="6" height="8" rx="2" />
  </svg>
);

/** Orgasm/ejaculation icon. Abstract fluid splash. */
export const IconOrgasm: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="14" r="4" />
    <path d="M12 10V4" />
    <path d="M9 6l3-3 3 3" />
    <path d="M8 14c-2-1-3-3-3-5" opacity="0.5" />
    <path d="M16 14c2-1 3-3 3-5" opacity="0.5" />
  </svg>
);
