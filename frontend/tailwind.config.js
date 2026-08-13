/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070A0F',
          900: '#0B1018',
          800: '#121826',
          700: '#1A2333',
          600: '#243044',
        },
        mist: {
          50: '#F4F7FB',
          100: '#E8EEF6',
          200: '#C9D4E3',
          300: '#9AACC2',
          400: '#6B829D',
        },
        accent: {
          DEFAULT: '#2DD4A8',
          dim: '#1FA88A',
          soft: 'rgba(45, 212, 168, 0.12)',
        },
      },
      fontFamily: {
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35)',
        glow: '0 0 40px rgba(45, 212, 168, 0.15)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(ellipse at top, rgba(45,212,168,0.08), transparent 50%), linear-gradient(180deg, #0B1018 0%, #070A0F 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      },
    },
  },
  plugins: [],
}
