export const motionDuration = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3
} as const;

export const motionEase = {
  standard: [0.4, 0, 0.2, 1] as const,
  emphasized: [0.34, 1.56, 0.64, 1] as const
} as const;
