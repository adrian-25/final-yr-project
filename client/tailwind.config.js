/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0f1e',
        surface: '#0f1629',
        'surface-2': '#1a2235',
        'surface-3': '#1e293b',
        primary: '#10b981',
        primary_dark: '#059669',
        'primary-glow': 'rgba(16,185,129,0.15)',
        accent: '#06b6d4',
        'accent-glow': 'rgba(6,182,212,0.15)',
        danger: '#ef4444',
        warning: '#f59e0b',
        'warning-glow': 'rgba(245,158,11,0.15)',
        critical: '#dc2626',
        suspicious: '#a78bfa',
        text: '#f1f5f9',
        text_muted: '#64748b',
        'text-dim': '#94a3b8',
        border: '#1e293b',
        'border-bright': '#334155',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)",
        'radial-glow': 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)',
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.12) 0%, transparent 60%)',
        'surface-gradient': 'linear-gradient(135deg, #0f1629 0%, #0a0f1e 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(16,185,129,0.15)',
        'glow': '0 0 20px rgba(16,185,129,0.2)',
        'glow-lg': '0 0 40px rgba(16,185,129,0.25)',
        'glow-accent': '0 0 20px rgba(6,182,212,0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'panel': '0 8px 40px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(16,185,129,0.15)' },
          '50%': { boxShadow: '0 0 25px rgba(16,185,129,0.35)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
