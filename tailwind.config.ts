import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 Color System with Full Tonal Palettes
        // All colors reference CSS variables defined in globals.css
        md: {
          // Primary palette (Blue) - Full tonal range
          primary: {
            DEFAULT: 'var(--md-primary)',
            light: 'var(--md-primary-light)',
            dark: 'var(--md-primary-dark)',
          },

          // Secondary palette (Deep Purple)
          secondary: {
            DEFAULT: 'var(--md-secondary)',
            light: 'var(--md-secondary-light)',
            dark: 'var(--md-secondary-dark)',
          },

          // Tertiary palette (Cyan)
          tertiary: {
            DEFAULT: 'var(--md-tertiary)',
            light: 'var(--md-tertiary-light)',
            dark: 'var(--md-tertiary-dark)',
          },

          // Error palette (Red)
          error: {
            DEFAULT: 'var(--md-error)',
            light: 'var(--md-error-light)',
            dark: 'var(--md-error-dark)',
          },

          // Warning palette (Orange)
          warning: {
            DEFAULT: 'var(--md-warning)',
            light: 'var(--md-warning-light)',
            dark: 'var(--md-warning-dark)',
          },

          // Success palette (Green)
          success: {
            DEFAULT: 'var(--md-success)',
            light: 'var(--md-success-light)',
            dark: 'var(--md-success-dark)',
          },

          // Surface colors (dark theme with elevation)
          surface: {
            DEFAULT: 'var(--md-surface)',
            dim: 'var(--md-surface-dim)',
            variant: 'var(--md-surface-variant)',
            container: 'var(--md-surface-container)',
            'container-low': 'var(--md-surface-container-low)',
            'container-high': 'var(--md-surface-container-high)',
            'container-highest': 'var(--md-surface-container-highest)',
          },

          // On-colors (text on colored backgrounds)
          on: {
            surface: 'var(--md-on-surface)',
            'surface-variant': 'var(--md-on-surface-variant)',
            primary: 'var(--md-on-primary)',
            secondary: 'var(--md-on-secondary)',
            tertiary: 'var(--md-on-tertiary)',
            error: 'var(--md-on-error)',
            warning: 'var(--md-on-warning)',
            success: 'var(--md-on-success)',
          },

          // Outline colors (borders, dividers)
          outline: {
            DEFAULT: 'var(--md-outline)',
            variant: 'var(--md-outline-variant)',
          },

          // Brand accent
          accent: {
            DEFAULT: 'var(--md-accent)',
            light: 'var(--md-accent-light)',
            dark: 'var(--md-accent-dark)',
          },

          // State layers (interaction feedback)
          state: {
            hover: 'var(--md-state-hover)',
            focus: 'var(--md-state-focus)',
            pressed: 'var(--md-state-pressed)',
            dragged: 'var(--md-state-dragged)',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
      },
      animation: {
        flash: 'flash 0.75s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
