/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: '#39FF14',
        crimson: '#DC143C',
        amber: { DEFAULT: '#F59E0B' },
        slate: {
          850: '#131f37',
          900: '#0b132b',
          950: '#070c1e',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'slide-in': 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'pulse-glow-red': 'pulseGlowRed 2s infinite',
        'pulse-glow-amber': 'pulseGlowAmber 2s infinite',
        'spin-slow': 'spin 4s linear infinite',
        'scan': 'scan 2.5s linear infinite',
        'radar-sweep': 'radarSweep 3s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(57, 255, 20, 0.4)', borderColor: 'rgba(57, 255, 20, 0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(57, 255, 20, 0.8)', borderColor: 'rgba(57, 255, 20, 0.9)' },
        },
        pulseGlowRed: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(220, 20, 60, 0.4)', borderColor: 'rgba(220, 20, 60, 0.4)' },
          '50%': { boxShadow: '0 0 28px rgba(220, 20, 60, 0.85)', borderColor: 'rgba(220, 20, 60, 0.95)' },
        },
        pulseGlowAmber: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)', borderColor: 'rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(245, 158, 11, 0.8)', borderColor: 'rgba(245, 158, 11, 0.9)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
    },
  },
  plugins: [],
};
