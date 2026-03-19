import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:        { DEFAULT: '#0A0F1E', 800: '#0D1526' },
        slate:       { DEFAULT: '#111827', 700: '#1F2937', 600: '#374151' },
        card:        '#1F2937',
        primary:     { DEFAULT: '#8B5CF6', hover: '#7C3AED', light: '#C4B5FD' },
        accent:      { DEFAULT: '#3B82F6', light: '#93C5FD' },
        success:     { DEFAULT: '#10B981', light: '#6EE7B7' },
        warning:     { DEFAULT: '#F59E0B', light: '#FCD34D' },
        danger:      { DEFAULT: '#EF4444', light: '#FCA5A5' },
        textprimary:  '#F9FAFB',
        textsecondary: '#9CA3AF',
        border:      '#374151',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'ping-slow':   'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
