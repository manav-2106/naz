import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { copy } from '../data/copy'
import { hasFinePointer, clamp } from '../lib/device'
import { CatHeart, Paw } from './doodles'

type Mode = 'heart' | 'ring' | 'paw'

const INTERACTIVE = '[data-cursor], a, button, [role="button"], input[type="range"], label'

function labelFor(key: string | null): string {
  const table = copy.cursor as Record<string, string>
  return (key && table[key]) || copy.cursor.open
}

/** Soft heart-with-cat-ears that follows the mouse. Only exists for real mice, and only hides the native cursor once it has shown up. */
export default function Cursor() {
  const [fine] = useState(hasFinePointer)
  return fine ? <CursorInner /> : null
}

function CursorInner() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 520, damping: 34, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 520, damping: 34, mass: 0.5 })
  const rot = useMotionValue(0)
  const srot = useSpring(rot, { stiffness: 220, damping: 18 })
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<Mode>('heart')
  const [label, setLabel] = useState('')
  const [pressed, setPressed] = useState(false)
  const shown = useRef(false)

  useEffect(() => {
    let rest = 0
    const root = document.documentElement
    const onMove = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return
      x.set(e.clientX)
      y.set(e.clientY)
      if (!shown.current) {
        shown.current = true
        sx.jump(e.clientX)
        sy.jump(e.clientY)
        setVisible(true)
        root.classList.add('custom-cursor')
      }
      rot.set(clamp(e.movementX * 1.4, -22, 22))
      window.clearTimeout(rest)
      rest = window.setTimeout(() => rot.set(0), 90)
    }
    const onOver = (e: PointerEvent): void => {
      const target = e.target instanceof Element ? (e.target.closest('[data-cursor]') ?? e.target.closest(INTERACTIVE)) : null
      if (!target) {
        setMode('heart')
        return
      }
      const key = target.getAttribute('data-cursor')
      if (target.matches('input[type="range"]') || key === 'drag') {
        setLabel(copy.cursor.drag || 'drag')
        setMode('paw')
        return
      }
      setLabel(labelFor(key))
      setMode('ring')
    }
    const onDown = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') setPressed(true)
    }
    const onUp = (): void => setPressed(false)
    const onLeave = (): void => setVisible(false)
    const onEnter = (): void => {
      if (shown.current) setVisible(true)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    root.addEventListener('mouseleave', onLeave)
    root.addEventListener('mouseenter', onEnter)
    return () => {
      window.clearTimeout(rest)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      root.removeEventListener('mouseleave', onLeave)
      root.removeEventListener('mouseenter', onEnter)
      root.classList.remove('custom-cursor')
    }
  }, [x, y, sx, sy, rot])

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{ x: sx, y: sy, opacity: visible ? 1 : 0 }}
    >
      <motion.div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2" style={{ rotate: srot }}>
        <motion.div
          animate={{ scale: mode === 'heart' ? (pressed ? 0.72 : 1) : 0, opacity: mode === 'heart' ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        >
          <CatHeart className="h-8 w-8 drop-shadow-[0_2px_3px_rgba(242,104,154,0.4)]" />
        </motion.div>
        <motion.div
          className="absolute left-1/2 top-1/2 -ml-[34px] -mt-[34px] flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-rose bg-[rgba(255,227,236,0.88)]"
          animate={{ scale: mode === 'ring' ? (pressed ? 0.8 : 1) : 0, opacity: mode === 'ring' ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        >
          <span className="font-ui text-[13px] font-semibold lowercase tracking-wide text-cocoa">{label}</span>
        </motion.div>
        <motion.div
          className="absolute left-1/2 top-1/2 -ml-[26px] -mt-[26px] flex h-[52px] w-[52px] flex-col items-center justify-center rounded-full bg-[rgba(255,227,236,0.9)]"
          animate={{ scale: mode === 'paw' ? (pressed ? 0.78 : 1) : 0, opacity: mode === 'paw' ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        >
          <Paw className="h-7 w-7" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
