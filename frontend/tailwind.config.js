/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: {
          DEFAULT: '#121212',
          card: '#161616',
          panel: '#1A1A1A',
          hover: '#222222',
        },
        border: {
          subtle: '#222222',
          muted: '#2A2A2A',
        },
        primary: {
          DEFAULT: '#F5F5F5',
          muted: '#858585',
          dim: '#555555',
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
