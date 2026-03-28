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
        background: '#FAF5EF',
        surface: '#FFFFFF',
        'surface-secondary': '#F7F0E8',
        'surface-border': '#E8DDD2',
        accent: '#E8651A',
        'accent-light': '#FFF0E6',
        success: '#059669',
        danger: '#DC2626',
        warning: '#D97706',
        'text-primary': '#111827',
        'text-secondary': '#374151',
        'text-muted': '#6B7280',
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        dm: ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-syne)', 'sans-serif'],
        heading: ['var(--font-instrument)', 'serif'],
        body: ['var(--font-barlow)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
