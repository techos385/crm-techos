import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── COLOR DE MARCA (cambiar en UN SOLO LUGAR) ───
      colors: {
        marca: {
          DEFAULT: '#7cc2e8',
          50:  '#f0f8fd',
          100: '#daf0fb',
          200: '#b6e1f7',
          300: '#7cc2e8',  // ← color principal
          400: '#54aad9',
          500: '#3393c7',
          600: '#2478ae',
          700: '#1f5f8e',
          800: '#1d5077',
          900: '#1c4363',
        },
        // Acentos por sección
        seccion: {
          dashboard: '#7cc2e8',
          clientes:  '#60a5fa',
          embudo:    '#a78bfa',
          agenda:    '#34d399',
          pagos:     '#fbbf24',
          tareas:    '#f97316',
          completados: '#22c55e',
          perdidos:  '#94a3b8',
          archivados:'#6b7280',
          agenda_publica: '#2dd4bf',
          equipo:    '#22d3ee',
          compartir: '#7cc2e8',
          admin:     '#7cc2e8',
        },
        // Temperaturas
        caliente: '#ef4444',
        tibio:    '#eab308',
        frio:     '#3b82f6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '1rem',
        'modal': '1.25rem',
        'pill':  '9999px',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modal':   '0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'glass':   '0 4px 32px 0 rgb(0 0 0 / 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
      },
      animation: {
        'count-up': 'countUp 0.5s ease-out',
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'confetti': 'confetti 1.5s ease-out forwards',
        'pulse-dot': 'pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        confetti: {
          '0%':   { opacity: '1', transform: 'scale(0.5)' },
          '50%':  { opacity: '1', transform: 'scale(1.2)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}

export default config
