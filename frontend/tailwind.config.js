/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0B0F',
        surface: 'rgba(255,255,255,0.05)',
        brand: {
          purple: '#8B5CF6',
          blue: '#3B82F6'
        },
        risk: {
          high: '#EF4444',
          medium: '#EAB308',
          low: '#22C55E'
        },
        text: {
          primary: '#F1F5F9',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'orb-float-1': 'orbFloat1 8s ease-in-out infinite',
        'orb-float-2': 'orbFloat2 10s ease-in-out infinite',
        'orb-float-3': 'orbFloat3 12s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite'
      },
      keyframes: {
        orbFloat1: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(80px, 60px) scale(1.1)' }
        },
        orbFloat2: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-60px, -80px) scale(1.05)' }
        },
        orbFloat3: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(40px, -50px) scale(0.95)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      }
    }
  },
  plugins: []
}
