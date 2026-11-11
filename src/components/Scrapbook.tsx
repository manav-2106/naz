import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { lazy, Suspense, useRef, useState, type RefObject } from 'react'
import clsx from 'clsx'
import { config } from '../data/config'
import { copy } from '../data/copy'
import { memories, type Memory } from '../data/memories'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { mulberry32, pick, range } from '../lib/seed'
import { Arrow, Blossom, Heart, PressedFlower, Sparkle, Squiggle, Star, Tape, type TapeColor } from './doodles'
import { haptics } from '../lib/haptics'
import Photo from './Photo'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'

const Lightbox = lazy(() => import('./Lightbox'))

interface Look {
  rot: number
  dy: number
  dx: number
  aspect: string
  tape: TapeColor
  tapeRot: number
}

const looks: Look[] = (() => {
  const rnd = mulberry32(913)
  const aspects = ['aspect-[4/5]', 'aspect-[1/1]', 'aspect-[5/6]', 'aspect-[4/5]']
  const tapes: TapeColor[] = ['butter', 'petal', 'strawberry', 'butter']
  return memories.map(() => ({
    rot: range(rnd, -4, 4),
    dy: Math.round(range(rnd, 0, 44)),
    dx: Math.round(range(rnd, -10, 10)),
    aspect: pick(rnd, aspects),
    tape: pick(rnd, tapes),
    tapeRot: range(rnd, -8, 8),
  }))
})()

interface PolaroidProps {
  m: Memory
  look: Look
  className?: string
  eager?: boolean
}

function Polaroid({ m, look, className, eager }: PolaroidProps) {
  return (
    <div className={clsx('paper relative rounded-[5px] p-2.5 pb-14', className)}>
      <Tape color={look.tape} className="absolute -top-3 left-1/2 z-10 -translate-x-1/2" style={{ rotate: `${look.tapeRot}deg` }} />
      <motion.div layoutId={`mem-${m.id}`} className={clsx('relative w-full overflow-hidden rounded-[3px]', look.aspect)}>
        <Photo memory={m} eager={eager} />
      </motion.div>
      <p className="absolute inset-x-3 bottom-2 font-hand text-[1.35rem] leading-[1.05] text-cocoa">{m.caption}</p>
    </div>
  )
}

function CollageItem({ m, look, boardRef, top, onFront, onOpen }: {
  m: Memory
  look: Look
  boardRef: RefObject<HTMLDivElement>
  top: number
  onFront: (id: number) => void
  onOpen: (id: number) => void
}) {
  return (
    <motion.li
      className="relative list-none"
      style={{ marginTop: look.dy, left: look.dx, rotate: look.rot, zIndex: top === m.id ? 40 : (m.id % 5) + 1 }}
      initial={{ opacity: 0, scale: 0.85, y: 24 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
    >
      <motion.div
        data-cursor="drag"
        drag
        dragConstraints={boardRef}
        dragElastic={0.15}
        dragMomentum={false}
        whileDrag={{ scale: 1.05, rotate: 0 }}
        whileHover={{ scale: 1.02 }}
        onDragStart={() => {
          haptics.light()
          onFront(m.id)
        }}
        onTap={() => {
          haptics.tap()
          onFront(m.id)
          onOpen(m.id)
        }}
        style={{ touchAction: 'none' }}
        role="button"
        tabIndex={0}
        aria-label={m.caption}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            haptics.tap()
            onOpen(m.id)
          }
        }}
      >
        <Polaroid m={m} look={look} eager />
      </motion.div>
    </motion.li>
  )
}

/** Phone view 1: a stack of photos. Swipe the top one away. */
function Stack({ onOpen }: { onOpen: (id: number) => void }) {
  const [index, setIndex] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14])
  const total = memories.length

  const fling = (dir: number): void => {
    haptics.light()
    void animate(x, dir * 520, {
      duration: 0.26,
      onComplete: () => {
        setIndex((i) => (i + 1) % total)
        x.set(0)
      },
    })
  }

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], tap }) => {
      const current = memories[index]
      if (tap && current) {
        haptics.tap()
        onOpen(current.id)
        return
      }
      if (down) {
        x.set(mx)
        return
      }
      if (Math.abs(mx) > 90 || (vx > 0.6 && Math.abs(mx) > 30)) fling(mx > 0 ? 1 : -1)
      else void animate(x, 0, { type: 'spring', stiffness: 320, damping: 22 })
    },
    { filterTaps: true, axis: 'x' },
  )

  const visible = [0, 1, 2]
    .map((o) => ({ o, m: memories[(index + o) % total], look: looks[(index + o) % total] }))
    .filter((v): v is { o: number; m: Memory; look: Look } => Boolean(v.m && v.look))

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="relative mx-auto h-[min(118vw,520px)] w-[82%]">
        {[...visible].reverse().map(({ o, m, look }) =>
          o === 0 ? (
            <div key={m.id} {...bind()} data-cursor="drag" className="absolute inset-0 z-30" style={{ touchAction: 'pan-y' }}>
              <motion.div className="h-full" style={{ x, rotate }}>
                <Polaroid m={m} look={{ ...look, aspect: 'aspect-[4/5]' }} eager className="h-full" />
              </motion.div>
            </div>
          ) : (
            <div
              key={m.id}
              className="pointer-events-none absolute inset-0"
              style={{ zIndex: 30 - o, transform: `translateY(${o * 12}px) rotate(${look.rot * (o + 1) * 0.8}deg) scale(${1 - o * 0.05})` }}
              aria-hidden="true"
            >
              <Polaroid m={m} look={{ ...look, aspect: 'aspect-[4/5]' }} eager className="h-full" />
            </div>
          ),
        )}
      </div>
      <div className="mt-10 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={config.ui.prev}
          onClick={() => setIndex((i) => (i - 1 + total) % total)}
          className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-cocoa bg-milk shadow-sticker-sm"
        >
          <ChevronLeft aria-hidden="true" className="h-6 w-6" />
        </button>
        <p className="min-w-[4.5rem] text-center font-ui text-lg font-medium text-cocoa-soft" aria-live="polite">
          {index + 1} / {total}
        </p>
        <button
          type="button"
          aria-label={config.ui.next}
          onClick={() => setIndex((i) => (i + 1) % total)}
          className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-cocoa bg-milk shadow-sticker-sm"
        >
          <ChevronRight aria-hidden="true" className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}

/** Phone view 2: a vertical timeline. */
function Timeline({ onOpen }: { onOpen: (id: number) => void }) {
  return (
    <ol className="relative m-0 flex list-none flex-col gap-8 p-0 pl-8">
      <span aria-hidden="true" className="absolute bottom-0 left-[10px] top-2 w-0 border-l-[3px] border-dashed border-strawberry" />
      {memories.map((m, i) => {
        const look = looks[i]
        if (!look) return null
        return (
          <li key={m.id} className="relative list-none" style={{ marginLeft: i % 2 === 0 ? 0 : 14 }}>
            <Heart className="absolute -left-[31px] top-4 w-5" />
            <Reveal>
              <button
                type="button"
                onClick={() => onOpen(m.id)}
                className="block w-[88%] border-0 bg-transparent p-0 text-left"
                style={{ transform: `rotate(${look.rot}deg)` }}
                aria-label={m.caption}
              >
                <Polaroid m={m} look={look} eager />
              </button>
            </Reveal>
          </li>
        )
      })}
    </ol>
  )
}

export default function Scrapbook() {
  const vp = useBreakpoint()
  const boardRef = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(0)
  const [openId, setOpenId] = useState<number | null>(null)
  const [view, setView] = useState<'swipe' | 'scroll'>('swipe')
  const openIndex = openId === null ? -1 : memories.findIndex((m) => m.id === openId)

  return (
    <section id="memories" className="relative px-[var(--gutter)] pb-24 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <PressedFlower className="absolute right-[4%] top-[3%] w-12 rotate-[16deg] opacity-90" />
        <Squiggle className="absolute left-[3%] top-[12%] w-24 rotate-6" />
        <Sparkle className="absolute left-[10%] top-[70%] w-7" fill="#FFEBA8" />
      </div>
      <div className="relative mx-auto max-w-[1180px]">
        <Reveal>
          <SectionHeading text={copy.scrapbook.heading} hand={copy.scrapbook.headingHand} variant="underline" />
          <p className="sub-hand mt-3 flex items-center gap-2">
            {copy.scrapbook.hint}
            <Arrow className="hidden w-14 rotate-[30deg] sm:block" />
          </p>
        </Reveal>

        {vp.isMobile ? (
          <div className="mt-10">
            <div className="mb-8 flex justify-center gap-2" role="group">
              {(['swipe', 'scroll'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => {
                    haptics.light()
                    setView(v)
                  }}
                  className={clsx(
                    'min-h-[48px] rounded-full border-[3px] border-cocoa px-6 font-ui text-lg font-semibold text-cocoa shadow-sticker-sm',
                    view === v ? 'bg-strawberry' : 'bg-milk',
                  )}
                >
                  {v === 'swipe' ? config.ui.swipeView : config.ui.scrollView}
                </button>
              ))}
            </div>
            {view === 'swipe' ? <Stack onOpen={setOpenId} /> : <Timeline onOpen={setOpenId} />}
          </div>
        ) : (
          <div ref={boardRef} className="relative mt-14 pb-10">
            <ul className="m-0 grid list-none grid-cols-3 gap-x-6 gap-y-6 p-0 lg:grid-cols-4 lg:gap-x-8">
              {memories.map((m, i) => {
                const look = looks[i]
                return look ? (
                  <CollageItem
                    key={m.id}
                    m={m}
                    look={look}
                    boardRef={boardRef}
                    top={top}
                    onFront={setTop}
                    onOpen={setOpenId}
                  />
                ) : null
              })}
            </ul>
            <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
              <Star className="absolute left-[23%] top-[28%] z-[45] w-9 rotate-12" />
              <Heart className="absolute left-[48%] top-[31%] z-[45] w-8 -rotate-12" />
              <Arrow className="absolute left-[70%] top-[58%] z-[45] w-16 rotate-[20deg]" />
              <Blossom className="absolute left-[24%] top-[62%] z-[45] w-12 rotate-6" />
              <Sparkle className="absolute left-[74%] top-[24%] z-[45] w-8" fill="#FFEBA8" />
              <PressedFlower className="absolute left-[46%] top-[86%] z-[45] w-10 -rotate-12" />
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <AnimatePresence>
          {openIndex >= 0 && (
            <Lightbox
              key="lightbox"
              items={memories}
              index={openIndex}
              onClose={() => setOpenId(null)}
              onIndex={(i) => setOpenId(memories[i]?.id ?? null)}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </section>
  )
}
