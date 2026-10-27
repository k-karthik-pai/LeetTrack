import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#080A0A',
        surface: {
          DEFAULT: '#121616',
          sidebar: '#0A0C0C',
          'surf-1': '#0D1010',
          'surf-2': '#111414',
          'surf-3': '#121616',
          'surf-4': '#151919',
          elevated: '#151919',
          border: '#222828',
          'border-subtle': '#202626',
          'border-active': '#2A3030',
        },
        lime: {
          primary: '#B6FF00',
          dark: '#9FE600',
          light: '#C8FF33',
        },
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          400: '#94a3b8',
          500: '#B6FF00',
          600: '#9FE600',
          700: '#C8FF33',
        },
        leetcode: {
          easy: '#B6FF00', // Override color scheme to match Electric Lime accent
          medium: '#ffc01e',
          hard: '#ff375f',
          accent: '#B6FF00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(182, 255, 0, 0.08)',
        'glow-accent': '0 0 20px rgba(182, 255, 0, 0.08)',
        'glow-lime': '0 0 15px rgba(182, 255, 0, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
