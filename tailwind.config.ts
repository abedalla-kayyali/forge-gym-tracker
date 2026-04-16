import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          green: '#2ecc71',
          bg: '#080c09',
          surface: '#0f1a12',
          border: '#1a2e1f',
          text: '#e0e0e0',
          muted: '#8a8a8a',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        condensed: ['Barlow Condensed', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
