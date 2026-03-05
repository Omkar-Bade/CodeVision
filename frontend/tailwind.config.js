/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'vs-bg':      '#1e1e1e',
        'vs-surface': '#252526',
        'vs-panel':   '#2d2d2d',
        'vs-border':  '#3e3e42',
        'vs-blue':    '#007acc',
        'vs-green':   '#4ec9b0',
        'vs-yellow':  '#dcdcaa',
        'vs-orange':  '#ce9178',
        'vs-purple':  '#c586c0',
        'vs-red':     '#f44747',
        'vs-text':    '#d4d4d4',
        'vs-muted':   '#6a9955',
        'vs-number':  '#b5cea8',
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
