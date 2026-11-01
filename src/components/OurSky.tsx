import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONSTELLATION_CONFIG, getConstellationPosition, type ConstellationStar } from '../data/constellation'
import { SKY_CONFIG } from '../data/sky'
import constellationData from '../data/constellations.json'
import rawStars from '../data/stars.json'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { api } from '../lib/api'
import { altAzToSkyXY, raDecToAltAz } from '../lib/astronomy'
import { fire } from '../lib/confetti'
import { haptics } from '../lib/haptics'
import { sfx } from '../lib/sfx'
import { toast } from '../lib/toast'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { Sparkle, Tape } from './doodles'

type SkyTab = 'meet' | 'birthday' | 'constellation'

interface StarRender {
  name: string
  mag: number
  bv: number
  x: number // 0..1
  y: number // 0..1
  isSpecial: boolean
}

interface ConstellationLineRender {
  name: string
  lines: Array<[number, number, number, number]> // [x1, y1, x2, y2]
  labelX: number
  labelY: number
}

export default function OurSky() {
  const [tab, setTab] = useState<SkyTab>('meet')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()
  const { isDesktop } = useBreakpoint()

  // Selected star popup
  const [selectedStar, setSelectedStar] = useState<{
    name: string
    fact: string
    x: number
    y: number
  } | null>(null)

  // Selected constellation star
  const [selectedMemory, setSelectedMemory] = useState<ConstellationStar | null>(null)

  // Live added stars from API
  const [addedStars, setAddedStars] = useState<ConstellationStar[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStarAuthor, setNewStarAuthor] = useState<'naz' | 'mr. naz'>('naz')
  const [newStarText, setNewStarText] = useState('')
  const [isSubmittingStar, setIsSubmittingStar] = useState(false)

  // Rotation angle for desktop
  const rotationRef = useRef(0)

  // Fetch live stars
  useEffect(() => {
    let active = true
    api.getStars().then((stars) => {
      if (active && stars && stars.length > 0) {
        setAddedStars(stars)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // Combine seed and added stars
  const allConstellationStars: ConstellationStar[] = useMemo(
    () => [...CONSTELLATION_CONFIG.seedStars, ...addedStars],
    [addedStars],
  )

  // Compute projected astronomy stars
  const getProjectedStars = useCallback((mode: 'meet' | 'birthday'): {
    stars: StarRender[]
    lines: ConstellationLineRender[]
  } => {
    const moment = SKY_CONFIG[mode]
    const date = new Date(moment.localTime)
    const projected: StarRender[] = []

    // 1. Project bright stars
    for (const s of rawStars as Array<[number, number, number, string, number]>) {
      const [ra, dec, mag, name, bv] = s
      const { alt, az } = raDecToAltAz(ra, dec, moment.lat, moment.lon, date)
      if (alt >= 0) {
        const { x, y } = altAzToSkyXY(alt, az)
        projected.push({
          name,
          mag,
          bv,
          x,
          y,
          isSpecial: name === moment.specialStar,
        })
      }
    }

    // 2. Project constellation lines
    const projectedConstellations: ConstellationLineRender[] = []
    for (const c of constellationData) {
      const validLines: Array<[number, number, number, number]> = []
      let avgX = 0
      let avgY = 0
      let count = 0

      for (const line of c.lines) {
        const [ra1, dec1] = line[0] as [number, number]
        const [ra2, dec2] = line[1] as [number, number]

        const p1 = raDecToAltAz(ra1, dec1, moment.lat, moment.lon, date)
        const p2 = raDecToAltAz(ra2, dec2, moment.lat, moment.lon, date)

        if (p1.alt >= -2 && p2.alt >= -2) {
          const xy1 = altAzToSkyXY(Math.max(0, p1.alt), p1.az)
          const xy2 = altAzToSkyXY(Math.max(0, p2.alt), p2.az)
          validLines.push([xy1.x, xy1.y, xy2.x, xy2.y])
          avgX += (xy1.x + xy2.x) / 2
          avgY += (xy1.y + xy2.y) / 2
          count += 1
        }
      }

      if (validLines.length > 0 && count > 0) {
        projectedConstellations.push({
          name: c.name,
          lines: validLines,
          labelX: avgX / count,
          labelY: avgY / count,
        })
      }
    }

    return { stars: projected, lines: projectedConstellations }
  }, [])

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let lastTime = performance.now()

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time

      // Slow rotation on desktop: 1 rev per 600s (0.6 deg/sec)
      if (isDesktop && !reducedMotion && tab !== 'constellation') {
        rotationRef.current += (dt * (2 * Math.PI)) / 600
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const size = Math.min(w, h)

      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr
        canvas.height = size * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2
      const radius = size * 0.46

      // Clip inside celestial circle
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()

      // Subtle celestial vignette inside (warm cream-rose background)
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius)
      grad.addColorStop(0, '#FFFDFB')
      grad.addColorStop(0.7, '#FFF3F7')
      grad.addColorStop(1, '#FFE3EC')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, size, size)

      if (tab === 'constellation') {
        // --- OUR CONSTELLATION MODE ---
        const stars = allConstellationStars
        const points = stars.map((s) => {
          const pos = getConstellationPosition(s.index)
          return {
            x: cx + (pos.x - 0.5) * (radius * 1.8),
            y: cy + (pos.y - 0.5) * (radius * 1.8),
            star: s,
          }
        })

        // Draw connecting dashed line
        if (points.length > 1) {
          ctx.beginPath()
          ctx.setLineDash([4, 5])
          ctx.strokeStyle = '#F2689A'
          ctx.lineWidth = 1.6
          for (let i = 0; i < points.length; i++) {
            const p = points[i]!
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          }
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Draw each memory star
        for (const p of points) {
          const isNaz = p.star.author === 'naz'
          const starColor = isNaz ? '#FFEBA8' : '#FF8FB5' // Naz: butter-gold, Mr. Naz: rose
          const glowColor = isNaz ? 'rgba(255, 235, 168, 0.4)' : 'rgba(255, 143, 181, 0.4)'

          // Outer halo
          ctx.beginPath()
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
          ctx.fillStyle = glowColor
          ctx.fill()

          // Four-point sparkle
          drawSparkle(ctx, p.x, p.y, 6.5, starColor, '#5B2A3E')
        }
      } else {
        // --- REAL ASTRONOMY MODE ---
        ctx.save()
        // Center rotation
        ctx.translate(cx, cy)
        ctx.rotate(rotationRef.current)
        ctx.translate(-cx, -cy)

        const { stars, lines } = getProjectedStars(tab)

        // Draw constellation lines
        ctx.beginPath()
        ctx.setLineDash([3, 4])
        ctx.strokeStyle = 'rgba(242, 104, 154, 0.35)'
        ctx.lineWidth = 1.2
        for (const c of lines) {
          for (const [x1, y1, x2, y2] of c.lines) {
            ctx.moveTo(x1 * size, y1 * size)
            ctx.lineTo(x2 * size, y2 * size)
          }
        }
        ctx.stroke()
        ctx.setLineDash([])

        // Draw stars
        for (const s of stars) {
          const sx = s.x * size
          const sy = s.y * size

          // Star size by magnitude: mag 0 -> ~5px, mag 4 -> ~1.8px
          const rSize = Math.max(1.8, (4.6 - s.mag) * 0.95 + 1.2)
          let starFill = '#FFFDFB'
          if (s.bv > 0.8) starFill = '#FFEBA8' // Butter tint for warm stars
          if (s.bv < 0.1) starFill = '#FFFFFF' // Pure white for hot stars
          if (s.isSpecial) starFill = '#FF8FB5' // Pink for "you" star

          if (s.isSpecial) {
            // Pulsing halo for special star
            const pulse = 10 + Math.sin(time / 300) * 3
            ctx.beginPath()
            ctx.arc(sx, sy, pulse, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(242, 104, 154, 0.25)'
            ctx.fill()
          }

          drawSparkle(ctx, sx, sy, s.isSpecial ? 7 : rSize, starFill, '#5B2A3E')

          // Label special "you" star
          if (s.isSpecial) {
            ctx.font = 'bold 13px "Caveat Variable", cursive'
            ctx.fillStyle = '#C0386A'
            ctx.fillText('you ♡', sx + 10, sy - 8)
          }
        }

        ctx.restore()
      }

      ctx.restore() // End clip

      // Border: hand-drawn feeling rose circle
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = '#F2689A'
      ctx.lineWidth = 3.2
      ctx.stroke()

      // Cardinal direction marks (N, E, S, W)
      ctx.font = 'bold 15px "Caveat Variable", cursive'
      ctx.fillStyle = '#8B5468'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N', cx, cy - radius + 15)
      ctx.fillText('S', cx, cy + radius - 15)
      ctx.fillText('E', cx - radius + 15, cy) // East is on the LEFT on sky charts
      ctx.fillText('W', cx + radius - 15, cy)

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [tab, getProjectedStars, allConstellationStars, isDesktop, reducedMotion])

  // Four-point sparkle drawing helper
  function drawSparkle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    fill: string,
    stroke: string,
  ) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, y - r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.quadraticCurveTo(x, y, x, y + r)
    ctx.quadraticCurveTo(x, y, x - r, y)
    ctx.quadraticCurveTo(x, y, x, y - r)
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = 0.8
    ctx.stroke()
    ctx.restore()
  }

  // Handle canvas clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) / rect.width
    const clickY = (e.clientY - rect.top) / rect.height

    if (tab === 'constellation') {
      // Find nearest constellation star
      const cx = 0.5
      const cy = 0.5
      let closest: ConstellationStar | null = null
      let minDist = 0.08

      for (const s of allConstellationStars) {
        const pos = getConstellationPosition(s.index)
        const sx = cx + (pos.x - 0.5) * 0.92
        const sy = cy + (pos.y - 0.5) * 0.92
        const d = Math.hypot(clickX - sx, clickY - sy)
        if (d < minDist) {
          minDist = d
          closest = s
        }
      }

      if (closest) {
        haptics.heart()
        sfx.pop()
        setSelectedMemory(closest)
      }
    } else {
      // Find nearest astronomy star
      const { stars } = getProjectedStars(tab)
      let closest: StarRender | null = null
      let minDist = 0.06

      for (const s of stars) {
        const d = Math.hypot(clickX - s.x, clickY - s.y)
        if (d < minDist) {
          minDist = d
          closest = s
        }
      }

      if (closest) {
        if (closest.isSpecial) {
          haptics.celebrate()
          sfx.chime()
          void fire.hearts({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }, 14)
          toast('that one’s you. obviously. ♡')
        } else if (closest.name && SKY_CONFIG.starFacts[closest.name]) {
          haptics.light()
          sfx.pop()
          setSelectedStar({
            name: closest.name,
            fact: SKY_CONFIG.starFacts[closest.name]!,
            x: clickX,
            y: clickY,
          })
        }
      }
    }
  }

  const handleAddStar = async () => {
    if (!newStarText.trim()) return
    setIsSubmittingStar(true)

    const res = await api.addStar(newStarAuthor, newStarText)
    setIsSubmittingStar(false)

    if (res.success && res.star) {
      const createdStar = res.star
      setAddedStars((prev) => [...prev, createdStar])
      setShowAddModal(false)
      setNewStarText('')
      haptics.celebrate()
      sfx.chime()
      void fire.hearts({ x: 0.5, y: 0.5 }, 12)
      toast('your star took its place in our sky ♡')
    } else {
      toast(res.error || 'could not add star right now')
      haptics.doubleTap()
    }
  }

  return (
    <section id="our-sky" className="relative px-[var(--gutter)] py-20 overflow-hidden">
      <div className="relative mx-auto max-w-[840px] text-center">
        <Reveal>
          <SectionHeading text="the sky the night we met" hand="sky" />
          <p className="sub-hand mt-2">
            this is what was above us. i checked. (billi checked too)
          </p>
        </Reveal>

        {/* 3-Way Sticker Pill Switch */}
        <Reveal delay={0.1} className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border-2 border-cocoa bg-milk p-1.5 shadow-sm">
            {[
              { id: 'meet', label: 'the night we met' },
              { id: 'birthday', label: 'your birthday night' },
              { id: 'constellation', label: 'our stars' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id as SkyTab)
                  setSelectedStar(null)
                  setSelectedMemory(null)
                  haptics.light()
                }}
                className={`rounded-full px-4 py-2 font-hand text-base sm:text-lg transition-all ${
                  tab === item.id
                    ? 'bg-rose text-white shadow-xs scale-102 font-bold'
                    : 'text-cocoa-soft hover:text-cocoa'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Subtitle Info */}
        <p className="mt-3 font-hand text-sm text-cocoa-soft">
          {tab === 'meet' && `${SKY_CONFIG.meet.sublabel} · above ${SKY_CONFIG.meet.city}`}
          {tab === 'birthday' && `${SKY_CONFIG.birthday.sublabel} · above ${SKY_CONFIG.birthday.city}`}
          {tab === 'constellation' && CONSTELLATION_CONFIG.sub}
        </p>

        {/* Circular Sky Chart */}
        <Reveal delay={0.15} className="mt-8 relative flex justify-center">
          <div className="paper relative aspect-square w-full max-w-[540px] rounded-full p-4 shadow-xl flex items-center justify-center bg-gradient-to-b from-milk to-blush">
            <Tape color="butter" className="absolute -top-3 left-[20%] rotate-[-6deg]" />
            <Tape color="petal" className="absolute -top-3 right-[20%] rotate-[6deg]" />

            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              aria-label={`the sky over ${SKY_CONFIG.meet.city} at chosen moment`}
              className="w-full h-full cursor-pointer touch-none"
            />

            {/* Named Star Popover */}
            <AnimatePresence>
              {selectedStar && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="paper absolute z-20 max-w-[240px] rounded-2xl border-2 border-cocoa bg-milk p-3 text-left shadow-lg pointer-events-auto"
                  style={{
                    left: `${Math.min(70, Math.max(15, selectedStar.x * 100))}%`,
                    top: `${Math.min(70, Math.max(15, selectedStar.y * 100))}%`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-bold text-rose">
                      {selectedStar.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedStar(null)}
                      className="font-hand text-xs text-cocoa-soft hover:text-cocoa"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="font-hand text-xs text-cocoa mt-1 leading-snug">
                    {selectedStar.fact}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Constellation Memory Popup */}
        <AnimatePresence>
          {selectedMemory && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="paper relative mx-auto mt-6 max-w-md rounded-blob border-[3px] border-cocoa bg-milk p-5 shadow-lg text-left"
            >
              <Tape color={selectedMemory.author === 'naz' ? 'butter' : 'petal'} className="absolute -top-3 left-10" />
              <div className="flex items-center justify-between">
                <span className="font-hand text-sm font-bold text-rose">
                  {selectedMemory.author === 'naz' ? 'Naz ⭐' : 'Mr. Naz 🌸'} · {selectedMemory.date}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMemory(null)}
                  className="font-hand text-sm text-cocoa-soft hover:text-cocoa"
                >
                  close
                </button>
              </div>
              <p className="font-hand text-xl text-cocoa mt-2 leading-relaxed">
                "{selectedMemory.text}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Constellation: Add a Star Floating Button */}
        {tab === 'constellation' && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-sticker bg-gradient-to-r from-butter to-petal text-cocoa border-cocoa hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
            >
              <Sparkle className="w-4 h-4 text-rose" />
              {CONSTELLATION_CONFIG.addBtn}
            </button>
          </div>
        )}
      </div>

      {/* Add Star Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="paper relative max-w-sm w-full rounded-blob border-[3px] border-cocoa bg-milk p-6 shadow-2xl text-left"
            >
              <Tape color="butter" className="absolute -top-3 left-1/2 -translate-x-1/2" />
              <h4 className="font-display text-2xl text-cocoa text-center">
                {CONSTELLATION_CONFIG.prompt}
              </h4>

              {/* Author Selector */}
              <div className="mt-4 flex gap-2">
                {CONSTELLATION_CONFIG.authorOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewStarAuthor(opt.id as 'naz' | 'mr. naz')}
                    className={`flex-1 rounded-xl border-2 border-cocoa p-2 font-hand text-sm text-center transition-all ${
                      newStarAuthor === opt.id ? 'bg-petal font-bold shadow-xs' : 'bg-white text-cocoa-soft'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Text Area */}
              <textarea
                value={newStarText}
                onChange={(e) => setNewStarText(e.target.value.slice(0, 90))}
                placeholder={CONSTELLATION_CONFIG.inputPlaceholder}
                rows={3}
                className="mt-4 w-full rounded-xl border-2 border-petal p-3 font-hand text-lg text-cocoa placeholder:text-cocoa/30 focus:outline-none focus:border-rose bg-white shadow-inner"
              />
              <div className="text-right font-hand text-xs text-cocoa-soft mt-1">
                {newStarText.length} / 90
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleAddStar}
                  disabled={isSubmittingStar || !newStarText.trim()}
                  className="btn-sticker flex-1 bg-rose text-white hover:brightness-105 active:scale-95 disabled:opacity-50 py-2"
                >
                  {isSubmittingStar ? 'placing star...' : 'place star in sky ⭐'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="font-hand text-sm text-cocoa-soft hover:text-cocoa px-3"
                >
                  cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
