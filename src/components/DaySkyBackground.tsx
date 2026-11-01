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

const STOPS = [
  { progress: 0.0, bg: hexToRgb('#FFF8F4'), wash: hexToRgb('#FFE3EC') },
  { progress: 0.25, bg: hexToRgb('#FFFDFB'), wash: hexToRgb('#FFCFE0') },
  { progress: 0.5, bg: hexToRgb('#FFFBF0'), wash: hexToRgb('#FFEBA8') },
  { progress: 0.75, bg: hexToRgb('#FFF0F5'), wash: hexToRgb('#FFB5CD') },
  { progress: 1.0, bg: hexToRgb('#FFEBF2'), wash: hexToRgb('#FFCFE0') },
]

export default function DaySkyBackground() {
  const bgRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const el = bgRef.current
    if (!el) return

    if (reducedMotion) {
      el.style.backgroundColor = '#FFFBF0'
      return
    }

    let ticking = false

    const updateColor = () => {
      ticking = false
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      if (maxScroll <= 0) return

      const p = Math.min(1, Math.max(0, window.scrollY / maxScroll))

      // Find surrounding stops
      let i = 0
      while (i < STOPS.length - 2 && p > STOPS[i + 1]!.progress) {
        i++
      }

      const s1 = STOPS[i]!
      const s2 = STOPS[i + 1]!
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

    window.addEventListener('scroll', onScroll, { passive: true })
    updateColor()

    return () => {
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
