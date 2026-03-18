import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#07070A',
          secondary: '#0D0D14',
          tertiary: '#111118',
        },
        accent: {
          cyan: '#00F0FF',
          violet: '#8B5CF6',
          cyan_dim: 'rgba(0,240,255,0.15)',
          violet_dim: 'rgba(139,92,246,0.15)',
        },
        glass: {
          border: 'rgba(255,255,255,0.06)',
          bg: 'rgba(255,255,255,0.03)',
          bg2: 'rgba(255,255,255,0.06)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shake': 'shake 0.3s ease-in-out',
        'particle': 'particle 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,240,255,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(0,240,255,0.7)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        particle: {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(2) translateY(-20px)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0,240,255,0.4)',
        'glow-cyan-lg': '0 0 40px rgba(0,240,255,0.6)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.4)',
        'glow-red': '0 0 15px rgba(239,68,68,0.5)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'piano': '0 -4px 40px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [],
}

export default config
