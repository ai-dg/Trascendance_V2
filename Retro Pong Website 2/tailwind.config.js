/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff1493',
        secondary: '#00ffff',
        accent: '#9d4edd',
        'bg-dark': '#0a0a2e',
        'bg-darker': '#0f0f23',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
      },
      animation: {
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0%' },
          '50%': { 'background-position': '100%' },
        },
        'glow-pulse': {
          '0%, 100%': { 'box-shadow': '0 0 20px #ff1493' },
          '50%': { 'box-shadow': '0 0 40px #ff1493, 0 0 60px #ff1493' },
        },
      },
      backgroundImage: {
        'retro-gradient': 'linear-gradient(#0a0a2e 0%, #16213e 50%, #0f0f23 100%)',
        'title-gradient': 'linear-gradient(45deg, #ff1493, #0ff, #9d4edd)',
      },
      textShadow: {
        'retro': '0 0 10px #ff1493',
        'retro-cyan': '0 0 10px #0ff',
        'retro-title': '0 0 30px #ff149380',
      },
    },
  },
  plugins: [],
}
