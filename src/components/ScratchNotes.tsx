import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SCRATCH_CONFIG, type ScratchCardData } from '../data/scratch'
import { fire } from '../lib/confetti'
import { haptics } from '../lib/haptics'
import { sfx } from '../lib/sfx'
import { toast } from '../lib/toast'
import { Tape } from './doodles'

interface ScratchCardProps {
  card: ScratchCardData
}

function SingleScratchCard({ card }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cleared, setCleared] = useState(false)
  const isScratching = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize glitter pink scratch layer on canvas
  const initFoil = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || cleared) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const w = canvas.offsetWidth || 280
    const h = canvas.offsetHeight || 220
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)

    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Pink foil base gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, '#FFB5CD')
    grad.addColorStop(0.5, '#FFCFE0')
    grad.addColorStop(1, '#FF8FB5')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Subtle heart pattern on foil
    ctx.fillStyle = 'rgba(255, 253, 251, 0.45)'
    ctx.font = `${Math.round(13 * dpr)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const stepX = 32 * dpr
    const stepY = 32 * dpr
    for (let x = 16 * dpr; x < canvas.width; x += stepX) {
      for (let y = 18 * dpr; y < canvas.height; y += stepY) {
        ctx.fillText('♡', x + (Math.floor(y / stepY) % 2 === 0 ? 12 * dpr : 0), y)
      }
    }

    // Border stroke on foil
    ctx.strokeStyle = '#F2689A'
    ctx.lineWidth = 2 * dpr
    ctx.strokeRect(2 * dpr, 2 * dpr, canvas.width - 4 * dpr, canvas.height - 4 * dpr)
  }, [cleared])

  useEffect(() => {
    initFoil()
  }, [initFoil])

  const triggerReveal = useCallback(() => {
    if (cleared) return
    setCleared(true)
    haptics.celebrate()
    sfx.chime()
    void fire.petals({ x: 0.5, y: 0.5 })
    toast(SCRATCH_CONFIG.uncoveredToast)
  }, [cleared])

  // Check scratch percentage on a coarse 12x12 grid
  const checkCoverage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || cleared) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    if (w === 0 || h === 0) return

    const stepX = Math.floor(w / 12)
    const stepY = Math.floor(h / 12)
    let transparentCount = 0
    let totalSamples = 0

    const imgData = ctx.getImageData(0, 0, w, h).data

    for (let y = stepY / 2; y < h; y += stepY) {
      for (let x = stepX / 2; x < w; x += stepX) {
        const index = (Math.floor(y) * w + Math.floor(x)) * 4
        const alpha = imgData[index + 3]
        if (alpha !== undefined && alpha < 50) {
          transparentCount += 1
        }
        totalSamples += 1
      }
    }

    const ratio = totalSamples > 0 ? transparentCount / totalSamples : 0
    if (ratio >= 0.38) {
      triggerReveal()
    }
  }, [cleared, triggerReveal])

  // Accurately map touch/mouse screen coords to canvas coords regardless of card rotation & DPR
  const getLocalCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy

    const rad = (-card.rotation * Math.PI) / 180
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad)
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad)

    const w = canvas.offsetWidth || 280
    const h = canvas.offsetHeight || 220
    const localX = rx + w / 2
    const localY = ry + h / 2

    return { localX, localY }
  }

  const scratchAt = (clientX: number, clientY: number, isMove = false) => {
    const canvas = canvasRef.current
    if (!canvas || cleared) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const coords = getLocalCoords(clientX, clientY)
    if (!coords) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const px = coords.localX * dpr
    const py = coords.localY * dpr

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'destination-out'

    if (isMove && lastPointRef.current) {
      // Connect stroke from last point to current point for buttery smooth scratch on mobile
      ctx.beginPath()
      ctx.lineWidth = 48 * dpr
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
      ctx.lineTo(px, py)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(px, py, 24 * dpr, 0, Math.PI * 2)
      ctx.fill()
    }

    lastPointRef.current = { x: px, y: py }
    haptics.light()
  }

  // Native non-passive touch events for 100% reliable mobile phone scratching (prevents scroll hijacking)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || cleared) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && !cleared) {
        e.preventDefault()
        isScratching.current = true
        const touch = e.touches[0]
        if (touch) {
          scratchAt(touch.clientX, touch.clientY, false)
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (isScratching.current && e.touches.length === 1 && !cleared) {
        e.preventDefault()
        const touch = e.touches[0]
        if (touch) {
          scratchAt(touch.clientX, touch.clientY, true)
        }
      }
    }

    const onTouchEnd = () => {
      if (isScratching.current) {
        isScratching.current = false
        lastPointRef.current = null
        checkCoverage()
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [cleared, checkCoverage])

  return (
    <div
      className="paper relative mx-auto w-full max-w-[280px] rounded-2xl border-[3px] border-cocoa bg-milk p-6 shadow-md flex flex-col justify-between min-h-[220px] select-none"
      style={{ transform: `rotate(${card.rotation}deg)` }}
    >
      <Tape color={card.tapeColor} className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Real Text In DOM (always accessible underneath) */}
      <div className="relative my-auto flex items-center justify-center text-center">
        <p className="font-hand text-2xl text-cocoa leading-snug px-2">
          "{card.text}"
        </p>
      </div>

      {/* Pink Scratch Layer Overlay */}
      <AnimatePresence>
        {!cleared && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10 rounded-2xl overflow-hidden touch-none"
          >
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse') {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId)
                  } catch {}
                  isScratching.current = true
                  scratchAt(e.clientX, e.clientY, false)
                }
              }}
              onPointerMove={(e) => {
                if (isScratching.current && e.pointerType === 'mouse') {
                  scratchAt(e.clientX, e.clientY, true)
                }
              }}
              onPointerUp={(e) => {
                if (e.pointerType === 'mouse') {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId)
                  } catch {}
                  isScratching.current = false
                  lastPointRef.current = null
                  checkCoverage()
                }
              }}
              data-cursor="drag"
              className="w-full h-full cursor-pointer touch-none select-none block"
            />
            {/* Gentle hint overlay on canvas */}
            <div className="pointer-events-none absolute bottom-2 inset-x-0 text-center font-hand text-xs text-cocoa/60 font-bold select-none">
              scratch gently ♡
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility / Direct Reveal Button */}
      {!cleared && (
        <button
          type="button"
          onClick={triggerReveal}
          data-cursor="pop"
          className="relative z-20 mt-3 font-hand text-xs text-cocoa-soft/80 hover:text-cocoa text-center underline cursor-pointer"
        >
          {SCRATCH_CONFIG.revealAllBtn}
        </button>
      )}
    </div>
  )
}

export default function ScratchNotes() {
  return (
    <div className="mt-12 w-full">
      <div className="text-center">
        <p className="font-hand text-xl text-rose font-bold">
          {SCRATCH_CONFIG.heading} ♡
        </p>
        <p className="font-hand text-sm text-cocoa-soft mt-0.5">
          {SCRATCH_CONFIG.hint}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {SCRATCH_CONFIG.cards.map((card) => (
          <SingleScratchCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}
