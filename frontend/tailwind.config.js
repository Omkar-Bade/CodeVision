/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Professional developer platform palette (LeetCode / GitHub style)
        'vs-bg':      '#0B1120',   // page background — deep navy
        'vs-surface': '#111827',   // card / panel background
        'vs-panel':   '#111827',   // alias for panels
        'vs-border':  '#1F2937',   // all borders
        'vs-blue':    '#3B82F6',   // primary accent — blue-500
        'vs-green':   '#22C55E',   // success / new variable
        'vs-yellow':  '#EAB308',   // warning / loop variable
        'vs-orange':  '#F97316',   // string values
        'vs-purple':  '#8B5CF6',   // special values
        'vs-red':     '#EF4444',   // error state
        'vs-text':    '#E5E7EB',   // primary text — gray-200
        'vs-muted':   '#9CA3AF',   // secondary text — gray-400
        'vs-number':  '#60A5FA',   // numeric literal color
      },
      fontFamily: {
        // UI text — modern, clean developer font
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Code — JetBrains Mono preferred, Fira Code as fallback
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-up':  'fadeUp 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
