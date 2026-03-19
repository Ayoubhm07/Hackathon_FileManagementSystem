import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0A0F1E', 800: '#0D1526', 900: '#060B15' },
        slate: { DEFAULT: '#111827', 700: '#1F2937', 600: '#374151' },
        card: '#1F2937',
        primary: { DEFAULT: '#3B82F6', hover: '#2563EB', light: '#93C5FD' },
        success: { DEFAULT: '#10B981', light: '#6EE7B7' },
        warning: { DEFAULT: '#F59E0B', light: '#FCD34D' },
        danger: { DEFAULT: '#EF4444', light: '#FCA5A5' },
        purple: { DEFAULT: '#8B5CF6', light: '#C4B5FD' },
        textprimary: '#F9FAFB',
        textsecondary: '#9CA3AF',
        border: '#374151',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(55,65,81,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(55,65,81,0.3) 1px, transparent 1px)",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
