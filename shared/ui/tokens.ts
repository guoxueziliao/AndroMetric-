export const VISUAL_TOKENS = {
  // Component styles should use these semantic tokens instead of legacy brand aliases or literal colors.
  surfaces: ['surface-base', 'surface-card', 'surface-muted', 'surface-border', 'surface-inverted', 'surface-elevated', 'overlay-scrim'],
  text: ['text-primary', 'text-secondary', 'text-muted', 'text-inverted', 'text-on-accent'],
  accents: ['accent', 'accent-hover', 'accent-vivid', 'accent-muted'],
  states: ['state-danger', 'state-warning', 'state-success', 'state-info'],
  charts: ['chart-primary', 'chart-secondary', 'chart-tertiary', 'chart-quaternary'],
  motion: ['duration-fast', 'duration-normal', 'duration-slow', 'easing-standard', 'easing-emphasized']
} as const;

export type SurfaceToken = typeof VISUAL_TOKENS.surfaces[number];
export type TextToken = typeof VISUAL_TOKENS.text[number];
export type AccentToken = typeof VISUAL_TOKENS.accents[number];
export type StateToken = typeof VISUAL_TOKENS.states[number];
export type ChartToken = typeof VISUAL_TOKENS.charts[number];
export type MotionToken = typeof VISUAL_TOKENS.motion[number];
