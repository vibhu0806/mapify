/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#FFFFFF',
          panel: '#F8FAFC',
          hover: '#F1F5F9',
        },
        brand: {
          blue: '#00529B',
          blueHover: '#004077',
          green: '#108C38',
          greenHover: '#0E7A31',
          accent: '#FFB800',
        },
        border: {
          subtle: '#E2E8F0',
          muted: '#CBD5E1',
        },
        primary: {
          DEFAULT: '#0F172A',
          muted: '#475569',
          dim: '#94A3B8',
        },
        accent: {
          green: '#10B981',
          greenMuted: 'rgba(16, 185, 129, 0.15)',
          amber: '#F59E0B',
          amberMuted: 'rgba(245, 158, 11, 0.15)',
          red: '#EF4444',
          redMuted: 'rgba(239, 68, 68, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        widest: '.2em',
        tightest: '-.03em',
      }
    },
  },
  plugins: [],
}
