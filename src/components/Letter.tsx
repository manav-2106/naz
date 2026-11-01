import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { config } from '../data/config'
import { copy } from '../data/copy'
import { letter, type LetterLine } from '../data/letter'
import { getBirthdayInfo } from '../lib/birthday'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { fire } from '../lib/confetti'
import { haptics } from '../lib/haptics'
import { sfx } from '../lib/sfx'
import Billi from './Billi'
import { Blossom, Heart, Pen, Sparkle, TornEdge } from './doodles'
import Envelope from './Envelope'
import FallingPetals from './FallingPetals'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'

type Stage = 'closed' | 'cracked' | 'open' | 'paper'

const lineStyle: Record<LetterLine['kind'], string> = {
  greeting: 'text-[2.1rem] font-bold leading-[1.1]',
  aside: 'text-[1.45rem] text-cocoa-soft',
  body: 'text-[1.5rem]',
  sign: 'text-[2rem] font-bold leading-[1.15]',
  ps: 'text-[1.4rem] text-cocoa-soft -rotate-1',
}

function Words({ line, visible, reduced }: { line: LetterLine; visible: boolean; reduced: boolean }) {
  const bInfo = getBirthdayInfo()
  const formatted = line.text
    .replace(/\b18th\b/g, bInfo.targetAgeOrdinal)
    .replace(/\b18\b/g, String(bInfo.targetAge))
  const words = formatted.split(' ')
  return (
    <>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre-line"
          initial={false}
          animate={{ opacity: visible ? 1 : 0, y: visible || reduced ? 0 : 4 }}
          transition={{ duration: reduced ? 0 : 0.5, delay: visible && !reduced ? i * 0.045 : 0 }}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </>
  )
}

const lineMs = (line: LetterLine): number => line.text.split(' ').length * 45 + 520

export default function Letter() {
  const reduced = useReducedMotion()
  const [stage, setStage] = useState<Stage>('closed')
  const [shown, setShown] = useState(0)
  const [slide, setSlide] = useState(260)
  const [signTapped, setSignTapped] = useState(false)
  const envRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const handleBilliSignTap = (e: React.MouseEvent) => {
    sfx.pop()
    haptics.heart()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    void fire.hearts(
      {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      16
    )
    setSignTapped(true)
    const t = window.setTimeout(() => setSignTapped(false), 3500)
    timers.current.push(t)
  }

  const openIt = (): void => {
    if (stage !== 'closed') return
    haptics.doubleTap()
    sfx.pop()
    setSlide((envRef.current?.offsetHeight ?? 240) + 24)
    setStage('cracked')
    timers.current.push(
      window.setTimeout(() => setStage('open'), 550),
      window.setTimeout(() => setStage('paper'), 1400),
    )
  }

  useEffect(() => {
    if (stage !== 'paper') return
    if (reduced) {
      setShown(letter.length)
      return
    }
    let i = 0
    let t = 0
    const next = (): void => {
      i += 1
      setShown(i)
      const done = letter[i - 1]
      if (i < letter.length && done) t = window.setTimeout(next, lineMs(done))
    }
    t = window.setTimeout(next, 900)
    return () => window.clearTimeout(t)
  }, [stage, reduced])

  const writing = stage === 'paper' && shown > 0 && shown < letter.length

  return (
    <section id="letter" className="relative px-[var(--gutter)] pb-24 pt-16 sm:pt-24 overflow-hidden">
      {/* Soft, sparse cherry blossoms drifting gently in the letter section */}
      <FallingPetals active={true} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <Blossom className="absolute right-[5%] top-[7%] w-12 -rotate-12" />
        <Sparkle className="absolute right-[8%] top-[22%] w-7" fill="#FFEBA8" />
        <Heart className="absolute bottom-[8%] right-[6%] w-10 rotate-12" />
      </div>
      <div className="relative mx-auto max-w-[760px]">
        <Reveal className="text-left md:ml-[4%]">
          <SectionHeading text={copy.letter.heading} hand={copy.letter.headingHand} />
          <p className="sub-hand mt-3">{copy.letter.sub}</p>
        </Reveal>

        {/* Billi holding up her tiny secret sign */}
        <motion.div
          className="mx-auto mt-6 mb-2 flex flex-col items-center select-none"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="flex items-end justify-center gap-2 cursor-pointer"
            onClick={handleBilliSignTap}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            role="button"
            tabIndex={0}
            aria-label="Billi holding secret note"
          >
            {/* Billi sitting cutely */}
            <div className="relative">
              <Billi className="w-16 h-16 sm:w-20 sm:h-20" />
              <motion.span
                className="absolute -top-1.5 -right-1 text-sm pointer-events-none select-none"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              >
                🐾
              </motion.span>
            </div>

            {/* Tiny Signpost held by Billi */}
            <motion.div
              className="relative flex flex-col items-center pb-1"
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
            >
              {/* Paper Sign Plaque */}
              <div className="relative rounded-2xl border-2 border-cocoa bg-[#FFFDF5] px-3.5 py-1.5 shadow-md">
                {/* Washi tape at top */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-10 rotate-[-1.5deg] rounded-sm bg-[#FFD1DC]/95 border-x border-cocoa/20 shadow-2xs" />
                
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm">
                    {stage === 'closed' ? '💌' : '🥺'}
                  </span>
                  <p className="font-hand text-sm sm:text-base font-bold text-cocoa leading-tight whitespace-nowrap">
                    {stage === 'closed' ? 'for ms. naz only ♡' : 'written with all my heart ♡'}
                  </p>
                </div>
                <p className="font-hand text-[11px] sm:text-xs text-cocoa-soft text-center leading-none mt-0.5">
                  {stage === 'closed' ? '(top secret: tap to open 🤫)' : '(take your time, jannnnn... 🌸)'}
                </p>
              </div>

              {/* Wooden Stick */}
              <div className="h-5 w-1.5 rounded-b-full bg-[#B28451] border-x border-cocoa/40 shadow-xs" />
            </motion.div>
          </motion.div>

          {/* Interactive remark when sign is tapped */}
          <AnimatePresence>
            {signTapped && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-1 font-hand text-xs sm:text-sm text-rosedeep font-bold text-center"
              >
                Billi says: &ldquo;He poured his whole heart into every single line for you ♡&rdquo; 🐾✨
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mx-auto mt-4 w-full max-w-[460px] pt-[26%]">
          <div ref={envRef} className="relative z-20">
            {stage === 'closed' ? (
              <motion.button
                type="button"
                data-cursor="open"
                aria-label={config.ui.openLetter}
                onClick={openIt}
                className="block w-full border-0 bg-transparent p-0"
                whileHover={{ rotate: -1.5, scale: 1.02 }}
                whileTap={{ scaleX: 1.04, scaleY: 0.94 }}
                animate={{ rotate: [0, -1.2, 1.2, 0] }}
                transition={{ rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' }, type: 'spring', stiffness: 300, damping: 16 }}
              >
                <Envelope open={false} cracked={false} />
              </motion.button>
            ) : (
              <Envelope open={stage === 'open' || stage === 'paper'} cracked />
            )}
          </div>
          {stage === 'closed' && <p className="mt-4 text-center font-hand text-[1.6rem] text-cocoa">{copy.letter.hint}</p>}
        </div>

        {(stage === 'open' || stage === 'paper') && (
          <motion.article
            className="relative z-10 mx-auto mt-4 w-full max-w-[60ch]"
            initial={{ y: -slide, rotate: 0 }}
            animate={{ y: 0, rotate: -1.2 }}
            transition={{ type: 'spring', stiffness: 70, damping: 15, delay: stage === 'open' ? 0.35 : 0 }}
            aria-label={copy.letter.heading}
          >
            <TornEdge className="block h-3 w-full" fill="#FFFDFB" seed={21} flip />
            <div className="paper lined relative bg-milk px-6 pb-8 pt-4 sm:px-10">
              {letter.map((line, i) => (
                <p key={i} className={clsx('mb-[1.1rem] font-hand text-cocoa', lineStyle[line.kind])}>
                  <Words line={line} visible={i < shown} reduced={reduced} />
                  {writing && i === shown - 1 && <Pen className="ml-1 inline-block h-7 w-7 animate-bob align-middle" />}
                </p>
              ))}
            </div>
            <TornEdge className="block h-3 w-full" fill="#FFFDFB" seed={5} />
          </motion.article>
        )}
      </div>
    </section>
  )
}
