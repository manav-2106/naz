import { motion, useAnimationControls, type MotionStyle } from 'framer-motion'
import { useEffect, useRef, useState, type ComponentType, type RefObject } from 'react'
import { copy } from '../data/copy'
import { reasons } from '../data/reasons'
import { getBirthdayInfo } from '../lib/birthday'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { mulberry32, pick, range } from '../lib/seed'
import { haptics } from '../lib/haptics'
import { sfx } from '../lib/sfx'
import { Arrow, Blossom, Bow, CakeSlice, Clip, Heart, MilkCarton, Paw, Pin, Potato, Sparkle, Star, Tape, type DoodleProps, type TapeColor } from './doodles'
import Reveal from './Reveal'
import ScratchNotes from './ScratchNotes'
import SectionHeading from './SectionHeading'

type Icon = ComponentType<DoodleProps>
type TapeKind = 'washi' | 'pin' | 'clip' | 'corner'

interface NoteSpec {
  id: number
  text: string
  rot: number
  height: number
  dx: number
  dy: number
  widthPct: number
  align: 'start' | 'center' | 'end'
  paper: string
  tape: TapeKind
  tapeColor: TapeColor
  Icon: Icon
}

const papers = ['#FFEBA8', '#FFCFE0', '#FFE3EC', '#FFFDFB', '#FFB5CD', '#FFE3EC', '#FFFDFB', '#FFEBA8']
/** matcha and lavender are tiny accents: two notes only */
const accent: Record<number, string> = { 6: '#D3EBCB', 12: '#E8DCFF' }
const icons: Icon[] = [Heart, Star, Paw, Bow, Blossom, Potato, CakeSlice, MilkCarton, Sparkle]
const tapeKinds: TapeKind[] = ['washi', 'pin', 'clip', 'corner', 'washi', 'pin']
const tapeColors: TapeColor[] = ['butter', 'petal', 'strawberry', 'matcha', 'lavender', 'milk']
const heights = [196, 222, 248]

const specs: NoteSpec[] = (() => {
  const rnd = mulberry32(1311)
  return reasons.map((text, i) => ({
    id: i + 1,
    text,
    rot: range(rnd, -4, 4),
    height: pick(rnd, heights),
    dx: Math.round(range(rnd, -16, 16)),
    dy: Math.round(range(rnd, 0, 40)),
    widthPct: Math.round(range(rnd, 84, 100)),
    align: pick(rnd, ['start', 'center', 'end'] as const),
    paper: accent[i] ?? papers[i % papers.length] ?? '#FFFDFB',
    tape: pick(rnd, tapeKinds),
    tapeColor: i === 6 ? 'matcha' : i === 12 ? 'lavender' : pick(rnd, tapeColors.slice(0, 3)),
    Icon: pick(rnd, icons),
  }))
})()

function Decor({ spec }: { spec: NoteSpec }) {
  if (spec.tape === 'pin') return <Pin className="absolute -top-3 left-1/2 z-10 w-6 -translate-x-1/2" />
  if (spec.tape === 'clip') return <Clip className="absolute -top-5 left-5 z-10 w-5 rotate-[8deg]" />
  if (spec.tape === 'corner')
    return (
      <>
        <Tape color={spec.tapeColor} className="absolute -left-5 -top-1 z-10 rotate-[-38deg] scale-[0.7]" />
        <Tape color={spec.tapeColor} className="absolute -right-5 -top-1 z-10 rotate-[38deg] scale-[0.7]" />
      </>
    )
  return <Tape color={spec.tapeColor} className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rotate-[-3deg]" />
}

interface CardProps {
  spec: NoteSpec
  mode: 'mobile' | 'board'
  boardRef: RefObject<HTMLDivElement>
  top: number
  onFront: (id: number) => void
}

function NoteCard({ spec, mode, boardRef, top, onFront }: CardProps) {
  const [flipped, setFlipped] = useState(false)
  const controls = useAnimationControls()
  const first = useRef(true)
  const Icon = spec.Icon

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    void controls.start({
      rotateY: flipped ? 180 : 0,
      rotateX: [0, -12, 0],
      scale: [1, 1.07, 1],
      transition: {
        rotateY: { type: 'spring', stiffness: 170, damping: 15 },
        rotateX: { duration: 0.6 },
        scale: { duration: 0.6 },
      },
    })
  }, [flipped, controls])

  const flip = (): void => {
    haptics.light()
    sfx.pop()
    onFront(spec.id)
    setFlipped((f) => !f)
  }

  const mobile = mode === 'mobile'
  const bInfo = getBirthdayInfo()
  const displayText = spec.text
    .replace(/\b18th\b/g, bInfo.targetAgeOrdinal)
    .replace(/\b18\b/g, String(bInfo.targetAge))
  const wrapStyle: MotionStyle = mobile
    ? { width: '84%', alignSelf: spec.id % 2 === 0 ? 'flex-end' : 'flex-start', marginTop: spec.id === 1 ? 0 : -14, rotate: spec.rot }
    : {
        width: `${spec.widthPct}%`,
        justifySelf: spec.align,
        marginTop: spec.dy,
        left: spec.dx,
        rotate: spec.rot,
      }

  return (
    <motion.li
      className="relative list-none"
      style={{ ...wrapStyle, position: 'relative', zIndex: top === spec.id ? 40 : (spec.id % 6) + 1 }}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
    >
      <motion.div
        data-cursor="flip"
        className="relative"
        style={{ height: spec.height, perspective: 900, touchAction: mobile ? 'pan-y' : 'none' }}
        drag={mobile ? 'x' : true}
        dragConstraints={mobile ? { left: 0, right: 0 } : boardRef}
        dragSnapToOrigin={mobile}
        dragElastic={mobile ? 0.5 : 0.18}
        dragMomentum={false}
        onDragStart={() => onFront(spec.id)}
        onDragEnd={(_, info) => {
          if (mobile && Math.abs(info.offset.x) > 70) flip()
        }}
        onTap={flip}
        whileDrag={{ scale: 1.04 }}
      >
        <Decor spec={spec} />
        <motion.div
          role="button"
          tabIndex={0}
          aria-label={`${copy.notes.heading}: ${spec.id}`}
          aria-pressed={flipped}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              flip()
            }
          }}
          animate={controls}
          whileHover={mobile ? undefined : { rotate: 1.5 }}
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-cocoa/80 shadow-soft"
            style={{ background: spec.paper, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <span className="display text-[4.4rem] font-extrabold italic leading-none text-cocoa">{spec.id}</span>
            <Icon className="w-11" />
          </div>
          <div
            className="absolute inset-0 flex flex-col justify-center rounded-[10px] border-2 border-cocoa/80 px-6 py-5 shadow-soft"
            style={{ background: spec.paper, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <p className="font-hand text-[1.4rem] leading-[1.12] text-cocoa">{displayText}</p>
            <Heart className="absolute bottom-3 right-4 w-5 rotate-12" fill="#FF8FB5" />
          </div>
        </motion.div>
      </motion.div>
    </motion.li>
  )
}

export default function Notes() {
  const vp = useBreakpoint()
  const boardRef = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(0)
  const mobile = vp.isMobile

  return (
    <section id="notes" className="relative px-[var(--gutter)] pb-24 pt-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden" aria-hidden="true">
        <Blossom className="absolute -right-4 top-[6%] w-20 rotate-[14deg] opacity-90" />
        <Paw className="absolute left-[3%] top-[40%] w-8 -rotate-12 opacity-70" />
        <Star className="absolute bottom-[6%] right-[8%] w-9 rotate-6" />
      </div>
      <div className="relative mx-auto max-w-[1180px]">
        <Reveal>
          <SectionHeading text={copy.notes.heading} hand={copy.notes.headingHand} />
          <p className="sub-hand relative mt-3 flex items-center gap-2">
            {copy.notes.sub}
            <Arrow className="hidden w-14 rotate-[40deg] sm:block" />
          </p>
        </Reveal>

        <div ref={boardRef} className="relative mt-12 pb-10">
          <ul
            className={
              mobile
                ? 'm-0 flex list-none flex-col p-0'
                : 'm-0 grid list-none grid-cols-2 gap-x-6 gap-y-3 p-0 lg:grid-cols-3 lg:gap-x-8'
            }
          >
            {specs.map((spec) => (
              <NoteCard key={spec.id} spec={spec} mode={mobile ? 'mobile' : 'board'} boardRef={boardRef} top={top} onFront={setTop} />
            ))}
          </ul>
        </div>

        <ScratchNotes />
      </div>
    </section>
  )
}
