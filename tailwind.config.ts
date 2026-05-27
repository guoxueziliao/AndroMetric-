import type { Config } from 'tailwindcss';

const withOpacity = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './app/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
    './core/**/*.{ts,tsx}',
    './domain/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'surface-base': withOpacity('--surface-base'),
        'surface-card': withOpacity('--surface-card'),
        'surface-muted': withOpacity('--surface-muted'),
        'surface-border': withOpacity('--surface-border'),
        'surface-inverted': withOpacity('--surface-inverted'),
        'surface-elevated': withOpacity('--surface-elevated'),
        'overlay-scrim': withOpacity('--overlay-scrim'),
        'text-primary': withOpacity('--text-primary'),
        'text-secondary': withOpacity('--text-secondary'),
        'text-muted': withOpacity('--text-muted'),
        'text-inverted': withOpacity('--text-inverted'),
        'text-on-accent': withOpacity('--text-on-accent'),
        accent: withOpacity('--accent'),
        'accent-vivid': withOpacity('--accent-vivid'),
        'accent-muted': withOpacity('--accent-muted'),
        'state-danger-bg': withOpacity('--state-danger-bg'),
        'state-danger-text': withOpacity('--state-danger-text'),
        'state-warning-bg': withOpacity('--state-warning-bg'),
        'state-warning-text': withOpacity('--state-warning-text'),
        'state-success-bg': withOpacity('--state-success-bg'),
        'state-success-text': withOpacity('--state-success-text'),
        'state-info-bg': withOpacity('--state-info-bg'),
        'state-info-text': withOpacity('--state-info-text'),
        'chart-primary': withOpacity('--chart-primary'),
        'chart-secondary': withOpacity('--chart-secondary'),
        'chart-tertiary': withOpacity('--chart-tertiary'),
        'chart-quaternary': withOpacity('--chart-quaternary'),

        // 0.2.0 migration aliases. Remove after刀 30.
        'brand-bg': withOpacity('--surface-base'),
        'brand-card': withOpacity('--surface-card'),
        'brand-primary': withOpacity('--surface-muted'),
        'brand-secondary': withOpacity('--surface-elevated'),
        'brand-text': withOpacity('--text-primary'),
        'brand-muted': withOpacity('--text-muted'),
        'brand-accent': withOpacity('--accent'),
        'brand-accent-hover': withOpacity('--accent-hover'),
        'palette-ice': withOpacity('--surface-muted'),
        'palette-pink': withOpacity('--accent-vivid'),
        'pastel-red': withOpacity('--state-danger-bg'),
        'pastel-red-text': withOpacity('--state-danger-text'),
        'pastel-orange': withOpacity('--state-warning-bg'),
        'pastel-orange-text': withOpacity('--state-warning-text'),
        'pastel-yellow': withOpacity('--state-warning-bg'),
        'pastel-yellow-text': withOpacity('--state-warning-text'),
        'pastel-green': withOpacity('--state-success-bg'),
        'pastel-green-text': withOpacity('--state-success-text'),
        'pastel-blue': withOpacity('--state-info-bg'),
        'pastel-blue-text': withOpacity('--state-info-text'),
        'pastel-purple': withOpacity('--chart-tertiary'),
        'pastel-purple-text': withOpacity('--chart-tertiary'),
        'pastel-pink': withOpacity('--accent-vivid'),
        'pastel-pink-text': withOpacity('--accent-vivid')
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Microsoft YaHei',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        card: '1.75rem'
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        glow: 'var(--shadow-glow)',
        'dark-glow': 'var(--shadow-dark-glow)'
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms'
      },
      transitionTimingFunction: {
        standard: 'var(--easing-standard)',
        emphasized: 'var(--easing-emphasized)'
      }
    }
  },
  plugins: []
};

export default config;
