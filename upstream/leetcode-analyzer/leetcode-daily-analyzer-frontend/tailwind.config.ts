import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#080A0A',
        foreground: '#F2F5F2',
        obsidian: {
          950: '#080A0A',
          900: '#0D1010',
          850: '#111414',
          800: '#121616',
          700: '#151919',
          600: '#1C2222',
          500: '#222828',
          400: '#2A3030',
        },
        lime: {
          300: '#C8FF33',
          400: '#B6FF00',
          500: '#9FE600',
          600: '#84C200',
        },
        text: {
          primary: '#F2F5F2',
          secondary: '#A4ADAA',
          muted: '#626B68',
        },
        diff: {
          positive: '#B6FF00',
          negative: '#EF4444',
          neutral: '#626B68',
        },
        diffBadge: {
          bg: '#142010',
          border: '#284518',
          text: '#B6FF00',
        },
        card: {
          bg: '#121616',
          border: '#222828',
          hoverBorder: '#303838',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
