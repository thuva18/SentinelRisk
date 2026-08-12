/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: '#39FF14',
        crimson: '#DC143C',
        amber: { DEFAULT: '#F59E0B' },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'pulse-glow-red': 'pulseGlowRed 2s infinite',
        'pulse-glow-amber': 'pulseGlowAmber 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'scan': 'scan 2.5s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px #39FF14, 0 0 10px #39FF14', borderColor: 'rgba(57, 255, 20, 0.5)' },
          '50%': { boxShadow: '0 0 20px #39FF14, 0 0 40px #39FF14', borderColor: 'rgba(57, 255, 20, 1)' },
        },
        pulseGlowRed: {
          '0%, 100%': { boxShadow: '0 0 5px #DC143C, 0 0 10px #DC143C', borderColor: 'rgba(220, 20, 60, 0.5)' },
          '50%': { boxShadow: '0 0 20px #DC143C, 0 0 40px #DC143C', borderColor: 'rgba(220, 20, 60, 1)' },
        },
        pulseGlowAmber: {
          '0%, 100%': { boxShadow: '0 0 5px #F59E0B, 0 0 10px #F59E0B', borderColor: 'rgba(245, 158, 11, 0.5)' },
          '50%': { boxShadow: '0 0 20px #F59E0B, 0 0 40px #F59E0B', borderColor: 'rgba(245, 158, 11, 1)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
