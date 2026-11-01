import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { config } from '../data/config'
import { copy } from '../data/copy'
import { useIdle } from '../hooks/useIdle'
import { useMusic } from '../hooks/useMusic'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { fire } from '../lib/confetti'
import { LOOK_EVENT, type LookDetail } from '../lib/events'
import { haptics } from '../lib/haptics'
import { startPurr } from '../lib/purr'
import { sfx } from '../lib/sfx'
import { toast } from '../lib/toast'
import { Bow, Heart } from './doodles'

export type BilliPose =
  | 'default'
  | 'asleep'
  | 'stretch'
  | 'walk'
  | 'blossom'
  | 'sign'
  | 'peek'
  | 'gift'
  | 'waving'

interface Props {
  /** The main Billi reacts to taps, falls asleep, hides secret egg, purrs when held. */
  interactive?: boolean
  className?: string
  partyHat?: boolean
  waving?: boolean
  pose?: BilliPose
}

export const INK = '#5B2A3E'

/** Hand-drawn Billi cat with real WebAudio purring, eye tracking, and rich pose vignettes. */
export default function Billi({
  interactive = false,
  className,
  partyHat = false,
  waving = false,
  pose = 'default',
}: Props) {
  const { volume, setVolume } = useMusic()
  const reducedMotion = useReducedMotion()

  const [unlockedHat, setUnlockedHat] = useState(() => {
    try {
      return localStorage.getItem('naz_billi_party_hat') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onPartyHat = () => setUnlockedHat(true)
    window.addEventListener('billi_party_hat', onPartyHat)
    return () => window.removeEventListener('billi_party_hat', onPartyHat)
  }, [])

  const showPartyHat = partyHat || unlockedHat
  const svgRef = useRef<SVGSVGElement>(null)
  const lookRef = useRef<SVGGElement>(null)
  const [happy, setHappy] = useState(false)
  const idle = useIdle(20000, interactive)
  const controls = useAnimationControls()

  // Tap vs Hold management
  const taps = useRef(0)
  const tapTimer = useRef(0)
  const happyTimer = useRef(0)

  // Purr hold state (Feature F6)
  const [isPurring, setIsPurring] = useState(false)
  const [purrProgress, setPurrProgress] = useState(0) // 0 to 1
  const [floatingHearts, setFloatingHearts] = useState<number[]>([])

  const holdStartTimer = useRef(0)
  const purrInterval = useRef(0)
  const heartFloatInterval = useRef(0)
  const stopPurrAudio = useRef<(() => void) | null>(null)
  const holdStartTime = useRef(0)
  const prevVolume = useRef(volume)
  const endHoldPurrRef = useRef<() => void>(() => {})

  const sleeping = (interactive && idle) || pose === 'asleep'
  const effectivePose = pose !== 'default' ? pose : waving ? 'waving' : 'default'
  const mood = sleeping
    ? 'sleep'
    : isPurring
      ? 'purr'
      : happy
        ? 'happy'
        : 'open'

  // Eye tracking loop
  useEffect(() => {
    let raf = 0
    let pending = false
    let px = 0
    let py = 0
    const apply = (): void => {
      pending = false
      const svg = svgRef.current
      const g = lookRef.current
      if (!svg || !g) return
      const r = svg.getBoundingClientRect()
      const cx = r.left + r.width * 0.5
      const cy = r.top + r.height * 0.4
      const dx = px - cx
      const dy = py - cy
      const d = Math.hypot(dx, dy) || 1
      const m = Math.min(1, d / 240)
      g.style.transform = `translate(${(dx / d) * m * 5}px, ${(dy / d) * m * 3.6}px)`
    }
    const schedule = (x: number, y: number): void => {
      px = x
      py = y
      if (!pending) {
        pending = true
        raf = requestAnimationFrame(apply)
      }
    }
    const onMove = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') schedule(e.clientX, e.clientY)
    }
    const onLook = (e: Event): void => {
      const d = (e as CustomEvent<LookDetail>).detail
      schedule(d.x, d.y)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener(LOOK_EVENT, onLook)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener(LOOK_EVENT, onLook)
    }
  }, [])

  // Start Purr hold
  const startHoldPurr = useCallback(() => {
    if (!interactive) return
    window.clearTimeout(holdStartTimer.current)

    holdStartTimer.current = window.setTimeout(() => {
      setIsPurring(true)
      holdStartTime.current = Date.now()
      haptics.purr()

      // Duck background music to 40%
      prevVolume.current = volume
      stopPurrAudio.current = startPurr((duck) => {
        if (duck) setVolume(Math.min(volume, 0.4))
        else setVolume(prevVolume.current)
      })

      // Interval for blush and haptic purr pulses
      window.clearInterval(purrInterval.current)
      purrInterval.current = window.setInterval(() => {
        const elapsed = (Date.now() - holdStartTime.current) / 1000
        setPurrProgress(Math.min(1, elapsed / 6))
        if (!reducedMotion) haptics.purr()

        // Auto release after 12 seconds
        if (elapsed >= 12) {
          endHoldPurrRef.current()
        }
      }, 200)

      // Float up a tiny heart every 700ms
      window.clearInterval(heartFloatInterval.current)
      heartFloatInterval.current = window.setInterval(() => {
        setFloatingHearts((prev) => [...prev.slice(-4), Date.now()])
      }, 700)
    }, 350)
  }, [interactive, volume, setVolume, reducedMotion])

  // End Purr hold
  const endHoldPurr = useCallback(() => {
    window.clearTimeout(holdStartTimer.current)
    window.clearInterval(purrInterval.current)
    window.clearInterval(heartFloatInterval.current)

    if (stopPurrAudio.current) {
      stopPurrAudio.current()
      stopPurrAudio.current = null
    }

    if (isPurring) {
      setIsPurring(false)
      const heldSeconds = (Date.now() - holdStartTime.current) / 1000

      // Bounce back happily
      setHappy(true)
      sfx.pop()
      haptics.heart()
      window.clearTimeout(happyTimer.current)
      happyTimer.current = window.setTimeout(() => setHappy(false), 1400)

      if (heldSeconds >= 6) {
        toast('she likes you. obviously. ♡')
        void fire.hearts({ x: 0.5, y: 0.5 }, 12)
      }
    }
    setPurrProgress(0)
    setFloatingHearts([])
  }, [isPurring])

  endHoldPurrRef.current = endHoldPurr

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      window.clearTimeout(tapTimer.current)
      window.clearTimeout(happyTimer.current)
      window.clearTimeout(holdStartTimer.current)
      window.clearInterval(purrInterval.current)
      window.clearInterval(heartFloatInterval.current)
      if (stopPurrAudio.current) stopPurrAudio.current()
    }
  }, [])

  // Normal tap action (egg & tap bounce)
  const onTap = (): void => {
    // If was purring, tap is ignored
    if (isPurring) return

    sfx.pop()
    haptics.purr()
    setHappy(true)
    window.clearTimeout(happyTimer.current)
    happyTimer.current = window.setTimeout(() => setHappy(false), 1300)
    taps.current += 1
    window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => {
      taps.current = 0
    }, 1600)

    if (taps.current >= 5) {
      taps.current = 0
      haptics.celebrate()
      toast(copy.billi.egg)
      sfx.chime()
      void controls.start({
        rotate: [0, 360],
        scale: [1, 1.2, 1],
        transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
      })
      const r = svgRef.current?.getBoundingClientRect()
      if (r) {
        void fire.hearts(
          {
            x: (r.left + r.width / 2) / window.innerWidth,
            y: (r.top + r.height / 2) / window.innerHeight,
          },
          34,
        )
      }
    }
  }

  // Blush color interpolation: #FFB5CD (0) -> #F2689A (1)
  const cheekColor = isPurring ? '#F2689A' : '#FFB5CD'

  const body = (
    <svg
      ref={svgRef}
      viewBox="0 0 150 156"
      className="block h-full w-full overflow-visible select-none"
      aria-hidden="true"
      focusable="false"
    >
      {/* tail */}
      <path
        d="M112 142c22 2 34-12 26-30-4-9-14-8-12 0 2 7 8 8 6 14"
        fill="none"
        stroke={INK}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M112 142c22 2 34-12 26-30-4-9-14-8-12 0 2 7 8 8 6 14"
        fill="none"
        stroke="#FFCFE0"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* body with squash-and-stretch during purr */}
      <g
        className={clsx(!isPurring && 'animate-breathe')}
        style={{
          transformOrigin: '75px 154px',
          transform: isPurring ? 'scale(1.06, 0.93)' : undefined,
          transition: 'transform 0.3s ease',
        }}
      >
        <path
          d={
            effectivePose === 'stretch'
              ? 'M24 154C15 130 40 102 75 102s60 28 51 52Z'
              : 'M32 154C22 116 38 92 75 92s53 24 43 62Z'
          }
          fill="#FFFDFB"
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M58 154c-2-18 4-30 17-30s19 12 17 30Z"
          fill="#FFE3EC"
        />
        <ellipse cx="54" cy="150" rx="13" ry="7.5" fill="#FFFDFB" stroke={INK} strokeWidth="3" />
        <path d="M50 150v4M58 150v4" stroke="#FFB5CD" strokeWidth="2" strokeLinecap="round" />

        {/* Right paw variation based on pose */}
        {effectivePose === 'waving' ? (
          <g className="animate-wave" style={{ transformOrigin: '96px 125px' }}>
            <ellipse
              cx="106"
              cy="118"
              rx="13"
              ry="8.5"
              fill="#FFFDFB"
              stroke={INK}
              strokeWidth="3"
              transform="rotate(-30 106 118)"
            />
            <ellipse
              cx="106"
              cy="118"
              rx="7"
              ry="4.5"
              fill="#FFE3EC"
              transform="rotate(-30 106 118)"
            />
          </g>
        ) : effectivePose === 'sign' ? (
          /* Holding a cute sign with heart */
          <g>
            <ellipse cx="96" cy="144" rx="11" ry="7" fill="#FFFDFB" stroke={INK} strokeWidth="3" />
            <rect
              x="84"
              y="112"
              width="36"
              height="28"
              rx="4"
              fill="#FFFDFB"
              stroke={INK}
              strokeWidth="2.5"
            />
            <path
              d="M102 122 C99 118 94 120 95 125 C96 128 102 133 102 133 C102 133 108 128 109 125 C110 120 105 118 102 122 Z"
              fill="#F2689A"
            />
          </g>
        ) : effectivePose === 'blossom' ? (
          /* Holding a little blossom flower */
          <g>
            <ellipse cx="96" cy="144" rx="11" ry="7" fill="#FFFDFB" stroke={INK} strokeWidth="3" />
            <circle cx="108" cy="132" r="5" fill="#FFCFE0" stroke={INK} strokeWidth="2" />
            <circle cx="108" cy="132" r="2" fill="#FFEBA8" />
          </g>
        ) : effectivePose === 'gift' ? (
          /* Carrying a mini gift box */
          <g>
            <rect
              x="85"
              y="130"
              width="24"
              height="20"
              rx="3"
              fill="#FF8FB5"
              stroke={INK}
              strokeWidth="2.5"
            />
            <line x1="97" y1="130" x2="97" y2="150" stroke="#FFEBA8" strokeWidth="3" />
            <line x1="85" y1="140" x2="109" y2="140" stroke="#FFEBA8" strokeWidth="3" />
          </g>
        ) : (
          <>
            <ellipse cx="96" cy="150" rx="13" ry="7.5" fill="#FFFDFB" stroke={INK} strokeWidth="3" />
            <path d="M92 150v4M100 150v4" stroke="#FFB5CD" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </g>

      {/* head */}
      <path d="M33 46 30 10l31 18Z" fill="#FFFDFB" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M38 38 37 21l15 9Z" fill="#FFB5CD" />
      <path d="M117 46l3-36-31 18Z" fill="#FFFDFB" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M112 38l1-17-15 9Z" fill="#FFB5CD" />
      <ellipse cx="75" cy="66" rx="48" ry="42" fill="#FFFDFB" stroke={INK} strokeWidth="3" />
      <path d="M62 30v9M70 27v12M78 27v12M86 30v9" stroke="#FFB5CD" strokeWidth="3.5" strokeLinecap="round" />

      {/* party hat if high score reached */}
      {showPartyHat && (
        <g className="animate-wiggle" style={{ transformOrigin: '75px 25px' }}>
          <path
            d="M59 28 L75 -6 L91 28 Q75 33 59 28 Z"
            fill="#FF7597"
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M63 21 L87 21" stroke="#FFEBA8" strokeWidth="3" strokeLinecap="round" />
          <path d="M67 12 L83 12" stroke="#FFFDFB" strokeWidth="3" strokeLinecap="round" />
          <path d="M71 4 L79 4" stroke="#FFEBA8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="75" cy="-7" r="5.5" fill="#FFEBA8" stroke={INK} strokeWidth="2.5" />
          <circle cx="76.5" cy="-6" r="1.5" fill="#FFFDFB" />
        </g>
      )}

      {/* Cheeks: blush color intensifies when petted */}
      <ellipse
        cx="42"
        cy="80"
        rx={isPurring ? 11 : 9}
        ry={isPurring ? 8 : 6}
        fill={cheekColor}
        opacity={isPurring ? 0.75 + purrProgress * 0.25 : 0.75}
        style={{ transition: 'fill 0.3s, rx 0.3s' }}
      />
      <ellipse
        cx="108"
        cy="80"
        rx={isPurring ? 11 : 9}
        ry={isPurring ? 8 : 6}
        fill={cheekColor}
        opacity={isPurring ? 0.75 + purrProgress * 0.25 : 0.75}
        style={{ transition: 'fill 0.3s, rx 0.3s' }}
      />

      {/* eyes */}
      {mood === 'open' && (
        <g ref={lookRef} style={{ transition: 'transform 0.12s ease-out' }}>
          <g className="animate-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="55" cy="66" rx="6" ry="7.5" fill={INK} />
            <ellipse cx="95" cy="66" rx="6" ry="7.5" fill={INK} />
            <circle cx="53" cy="63" r="2.2" fill="#FFFDFB" />
            <circle cx="93" cy="63" r="2.2" fill="#FFFDFB" />
          </g>
        </g>
      )}
      {(mood === 'happy' || mood === 'purr') && (
        <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
          <path d="M47 70q8-12 16 0" />
          <path d="M87 70q8-12 16 0" />
        </g>
      )}
      {mood === 'sleep' && (
        <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
          <path d="M47 66q8 8 16 0" />
          <path d="M87 66q8 8 16 0" />
        </g>
      )}

      {/* nose and mouth */}
      <path
        d="M70 76q5-3 10 0-3 6-5 6t-5-6Z"
        fill="#F2689A"
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M75 82q-5 8-12 4M75 82q5 8 12 4"
        fill="none"
        stroke={INK}
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* whiskers */}
      <g stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".7">
        <path d="M30 74 12 70M30 80 12 82M120 74l18-4M120 80l18 2" />
      </g>
    </svg>
  )

  return (
    <motion.div animate={controls} className={clsx('relative inline-block', className)}>
      {sleeping && (
        <div
          className="pointer-events-none absolute -right-2 -top-4 z-10 flex items-end font-hand text-2xl text-cocoa-soft select-none"
          aria-hidden="true"
        >
          <span className="animate-zzz">z</span>
          <span className="animate-zzz [animation-delay:0.8s]">z</span>
          <span className="animate-zzz [animation-delay:1.6s]">z</span>
          <span className="ml-1 text-base">{copy.billi.idle}</span>
        </div>
      )}

      {/* Floating hearts while purring */}
      <AnimatePresence>
        {floatingHearts.map((id) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2"
          >
            <Heart className="w-5 h-5 text-rose" />
          </motion.div>
        ))}
      </AnimatePresence>

      {interactive ? (
        <motion.button
          type="button"
          data-cursor="pop"
          aria-label={config.ui.petsBilli}
          onClick={onTap}
          onPointerDown={startHoldPurr}
          onPointerUp={endHoldPurr}
          onPointerCancel={endHoldPurr}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              startHoldPurr()
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              endHoldPurr()
            }
          }}
          style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
          whileTap={{ scaleX: 1.05, scaleY: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 14 }}
          className="relative block h-full w-full cursor-pointer border-0 bg-transparent p-0 [transform-origin:50%_100%] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose"
        >
          {body}
          <Bow className="pointer-events-none absolute right-[10%] top-[2%] w-[24%] rotate-[18deg]" />
        </motion.button>
      ) : (
        <div className="relative h-full w-full" aria-hidden="true">
          {body}
          <Bow className="pointer-events-none absolute right-[10%] top-[2%] w-[24%] rotate-[18deg]" />
        </div>
      )}
    </motion.div>
  )
}
