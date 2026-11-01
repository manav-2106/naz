import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface RGB {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): RGB {
  const num = parseInt(hex.replace('#', ''), 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(c1: RGB, c2: RGB, t: number): string {
  const r = Math.round(lerp(c1.r, c2.r, t))
  const g = Math.round(lerp(c1.g, c2.g, t))
  const b = Math.round(lerp(c1.b, c2.b, t))
  return `rgb(${r}, ${g}, ${b})`
}

const DAY_STOPS = [
  { progress: 0.0, bg: hexToRgb('#FFF8F4'), wash: hexToRgb('#FFE3EC') },
  { progress: 0.25, bg: hexToRgb('#FFFDFB'), wash: hexToRgb('#FFCFE0') },
  { progress: 0.5, bg: hexToRgb('#FFFBF0'), wash: hexToRgb('#FFEBA8') },
  { progress: 0.75, bg: hexToRgb('#FFF0F5'), wash: hexToRgb('#FFB5CD') },
  { progress: 1.0, bg: hexToRgb('#FFEBF2'), wash: hexToRgb('#FFCFE0') },
]

const NIGHT_STOPS = [
  { progress: 0.0, bg: hexToRgb('#160E22'), wash: hexToRgb('#321844') },
  { progress: 0.25, bg: hexToRgb('#1B112C'), wash: hexToRgb('#401B4E') },
  { progress: 0.5, bg: hexToRgb('#241635'), wash: hexToRgb('#51245E') },
  { progress: 0.75, bg: hexToRgb('#1E1230'), wash: hexToRgb('#451D52') },
  { progress: 1.0, bg: hexToRgb('#170E24'), wash: hexToRgb('#321844') },
]

export default function DaySkyBackground() {
  const bgRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const el = bgRef.current
    if (!el) return

    const isNight = () => document.documentElement.getAttribute('data-theme') === 'starlight'

    if (reducedMotion) {
      el.style.backgroundColor = isNight() ? '#1a1228' : '#FFFBF0'
      return
    }

    let ticking = false

    const updateColor = () => {
      ticking = false
      const stops = isNight() ? NIGHT_STOPS : DAY_STOPS
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const p = maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / maxScroll))

      let i = 0
      while (i < stops.length - 2 && p > stops[i + 1]!.progress) {
        i++
      }

      const s1 = stops[i]!
      const s2 = stops[i + 1]!
      const localT = (p - s1.progress) / (s2.progress - s1.progress)

      const currentBg = lerpColor(s1.bg, s2.bg, localT)
      const currentWash = lerpColor(s1.wash, s2.wash, localT)

      el.style.backgroundColor = currentBg
      document.documentElement.style.setProperty('--page-bg', currentBg)
      document.documentElement.style.setProperty('--accent-wash', currentWash)
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(updateColor)
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') {
          updateColor()
        }
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    window.addEventListener('scroll', onScroll, { passive: true })
    updateColor()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [reducedMotion])

  return (
    <div
      ref={bgRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 transition-colors duration-500 ease-out"
      style={{ backgroundColor: '#FFF8F4' }}
    />
  )
}
