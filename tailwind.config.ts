import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '360px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      short: { raw: '(max-height: 520px) and (orientation: landscape)' },
    },
    extend: {
      colors: {
        cream: '#FFF8F4',
        milk: '#FFFDFB',
        blush: '#FFE3EC',
        petal: '#FFCFE0',
        strawberry: '#FFB5CD',
        bubblegum: '#FF8FB5',
        rose: '#F2689A',
        rosedeep: '#C0386A',
        butter: '#FFEBA8',
        matcha: '#D3EBCB',
        lavender: '#E8DCFF',
        cocoa: '#5B2A3E',
        'cocoa-soft': '#8B5468',
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
        ui: ['"Fredoka Variable"', '"Trebuchet MS"', 'sans-serif'],
        hand: ['"Caveat Variable"', '"Comic Sans MS"', 'cursive'],
        body: ['"Nunito Variable"', '"Trebuchet MS"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 24px -8px rgba(242,104,154,0.28), 0 3px 8px rgba(242,104,154,0.14)',
        lift: '0 18px 36px -10px rgba(242,104,154,0.34), 0 6px 14px rgba(242,104,154,0.18)',
        sticker: '3px 4px 0 #F2689A',
        'sticker-sm': '2px 3px 0 #F2689A',
        '2xs': '0 1px 2px 0 rgba(0,0,0,0.07)',
        xs: '0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        blob: '28px 34px 26px 36px',
        'blob-2': '36px 24px 38px 26px',
        'blob-3': '30px 38px 24px 32px',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translate3d(-12vw,0,0)' },
          '100%': { transform: 'translate3d(112vw,0,0)' },
        },
        floaty: {
          '0%,100%': { transform: 'translate3d(0,0,0) rotate(var(--r,0deg))' },
          '50%': { transform: 'translate3d(0,-14px,0) rotate(calc(var(--r,0deg) + 6deg))' },
        },
        blink: {
          '0%,92%,100%': { transform: 'scaleY(1)' },
          '96%': { transform: 'scaleY(0.08)' },
        },
        bob: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-8px,0)' },
        },
        eq: {
          '0%,100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        zzz: {
          '0%': { transform: 'translate3d(0,0,0) scale(0.7)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'translate3d(14px,-26px,0) scale(1.2)', opacity: '0' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        beat: {
          '0%,100%': { transform: 'scale(1)' },
          '20%': { transform: 'scale(1.18)' },
          '40%': { transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.1)' },
        },
        breathe: {
          '0%,100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.025)' },
        },
        walk: {
          '0%,100%': { transform: 'translate3d(0,0,0) rotate(-3deg)' },
          '50%': { transform: 'translate3d(0,-3px,0) rotate(3deg)' },
        },
        wiggle: {
          '0%,100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        wave: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-22deg)' },
          '50%': { transform: 'rotate(18deg)' },
          '75%': { transform: 'rotate(-14deg)' },
        },
      },
      animation: {
        drift: 'drift 70s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        blink: 'blink 5s infinite',
        bob: 'bob 1.6s ease-in-out infinite',
        eq: 'eq 0.9s ease-in-out infinite',
        zzz: 'zzz 2.4s ease-out infinite',
        spin: 'spin 4s linear infinite',
        beat: 'beat 1.6s ease-in-out infinite',
        walk: 'walk 0.45s ease-in-out infinite',
        breathe: 'breathe 3.4s ease-in-out infinite',
        wiggle: 'wiggle 1.2s ease-in-out infinite',
        wave: 'wave 0.85s ease-in-out infinite',
      },
      scale: {
        '102': '1.02',
        '97': '0.97',
        '103': '1.03',
      },
    },
  },
  plugins: [],
} satisfies Config
