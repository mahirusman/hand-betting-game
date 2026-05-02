/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0a0a0f',
        'game-surface': '#12121a',
        'game-card': '#1a1a28',
        'game-border': '#2a2a3d',
        'game-accent': '#6c63ff',
        'game-higher': '#22c55e',
        'game-lower': '#ef4444',
        'game-gold': '#f59e0b',
        'game-text': '#e2e8f0',
        'game-muted': '#64748b',
      },
      fontFamily: {
        display: ['Rajdhani', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        tile: '0 18px 45px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glow-higher': '0 0 0 1px rgba(34,197,94,0.45), 0 18px 45px -12px rgba(34,197,94,0.55)',
        'glow-lower': '0 0 0 1px rgba(239,68,68,0.45), 0 18px 45px -12px rgba(239,68,68,0.55)',
        'glow-gold': '0 0 0 1px rgba(245,158,11,0.45), 0 18px 45px -12px rgba(245,158,11,0.45)',
        glass: '0 30px 60px -30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'glass-card':
          'linear-gradient(155deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01) 60%), radial-gradient(circle at 100% 0%, rgba(108,99,255,0.18), transparent 55%)',
        'gold-shimmer':
          'linear-gradient(120deg, rgba(245,158,11,0) 0%, rgba(245,158,11,0.85) 45%, rgba(245,158,11,0) 100%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 320ms ease-out both',
      },
    },
  },
  plugins: [],
};

module.exports = config;
