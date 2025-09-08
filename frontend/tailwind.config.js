/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Futuristic tech palette
        'vs-bg':      '#020617', // deep navy
        'vs-surface': '#020617',
        'vs-panel':   '#0b1220',
        'vs-border':  '#1f2937',
        'vs-blue':    '#38bdf8', // electric blue
        'vs-green':   '#4ade80', // accent green
        'vs-yellow':  '#facc15',
        'vs-orange':  '#fb923c',
        'vs-purple':  '#a855f7',
        'vs-red':     '#f97373',
        'vs-text':    '#e5e7eb',
        'vs-muted':   '#6b7280',
        'vs-number':  '#a5f3fc',
      },
      fontFamily: {
        mono: ['Fira Code', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'binary-fall': 'binaryFall linear infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'slide-in':    'slideIn 0.3s ease-out',
        'fade-up':     'fadeUp 0.5s ease-out',
      },
      keyframes: {
        binaryFall: {
          '0%':   { transform: 'translateY(-100%)', opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0.3' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,122,204,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(0,122,204,0.8)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        fadeUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      boxShadow: {
        'blue-glow':  '0 0 15px rgba(0, 122, 204, 0.4)',
        'green-glow': '0 0 15px rgba(78, 201, 176, 0.4)',
        'inner-top':  'inset 0 2px 4px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
