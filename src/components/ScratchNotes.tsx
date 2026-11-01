import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
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

  // Initialize glitter pink scratch layer on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || cleared) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)
    const w = rect.width
    const h = rect.height

    // Pink foil base
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#FFB5CD')
    grad.addColorStop(0.5, '#FFCFE0')
    grad.addColorStop(1, '#FF8FB5')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Faint subtle heart pattern on the scratch foil
    ctx.fillStyle = 'rgba(255, 253, 251, 0.45)'
    ctx.font = '12px sans-serif'
    for (let x = 15; x < w; x += 32) {
      for (let y = 18; y < h; y += 32) {
        ctx.fillText('♡', x + (y % 64 === 0 ? 12 : 0), y)
      }
    }

    // Border stroke on foil
    ctx.strokeStyle = '#F2689A'
    ctx.lineWidth = 1.5
    ctx.strokeRect(2, 2, w - 4, h - 4)
  }, [cleared])

  // Check scratch percentage on a coarse 12x12 grid
  const checkCoverage = () => {
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
    if (ratio >= 0.52) {
      triggerReveal()
    }
  }

  const triggerReveal = () => {
    if (cleared) return
    setCleared(true)
    haptics.celebrate()
    sfx.chime()
    void fire.petals({ x: 0.5, y: 0.5 })
    toast(SCRATCH_CONFIG.uncoveredToast)
  }

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas || cleared) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    haptics.light()
  }

  return (
    <div
      className="paper relative mx-auto w-full max-w-[280px] rounded-2xl border-[3px] border-cocoa bg-milk p-6 shadow-md flex flex-col justify-between min-h-[220px]"
      style={{ transform: `rotate(${card.rotation}deg)` }}
    >
      <Tape color={card.tapeColor} className="absolute -top-3 left-1/2 -translate-x-1/2" />

      {/* Real Text In DOM (always accessible) */}
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
            className="absolute inset-0 z-10 rounded-2xl overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              onPointerDown={(e) => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                isScratching.current = true
                scratchAt(e.clientX, e.clientY)
              }}
              onPointerMove={(e) => {
                if (isScratching.current) {
                  e.preventDefault()
                  scratchAt(e.clientX, e.clientY)
                }
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId)
                isScratching.current = false
                checkCoverage()
              }}
              onPointerLeave={() => {
                if (isScratching.current) {
                  isScratching.current = false
                  checkCoverage()
                }
              }}
              className="w-full h-full cursor-pointer touch-none select-none"
            />
            {/* Gentle hint overlay on canvas */}
            <div className="pointer-events-none absolute bottom-2 inset-x-0 text-center font-hand text-xs text-cocoa/60 font-bold">
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
          className="relative z-20 mt-3 font-hand text-xs text-cocoa-soft/80 hover:text-cocoa text-center underline"
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
