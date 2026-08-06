import type { Config } from 'tailwindcss';

// Brand tokens carried over from the approved UI design (Abraj Al Yasir Tasks.dc.html) —
// navy/slate/teal/gold, not a default Tailwind palette.
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: '#050361', foreground: '#ffffff' },
        secondary: { DEFAULT: '#244469', foreground: '#ffffff' },
        accent: { DEFAULT: '#458c8e', foreground: '#ffffff' },
        gold: { DEFAULT: '#e5d424', foreground: '#14162b' },
        destructive: { DEFAULT: '#c1453a', foreground: '#ffffff' },
        muted: { DEFAULT: '#f4f5f8', foreground: '#5b5f78' },
        card: { DEFAULT: '#ffffff', foreground: '#14162b' },
        popover: { DEFAULT: '#ffffff', foreground: '#14162b' },
        input: '#e2e4ea',
        ring: '#458c8e',
      },
      borderRadius: { lg: '10px', md: '8px', sm: '6px' },
      fontFamily: { sans: ['Tajawal', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
