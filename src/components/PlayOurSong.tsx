import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SONG_INTERLUDE_COPY, SONG_LINES, type SongLine } from '../data/songLines'
import { useMusic } from '../hooks/useMusic'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { fire } from '../lib/confetti'
import { haptics } from '../lib/haptics'
import { sfx } from '../lib/sfx'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { Heart, Tape } from './doodles'

export default function PlayOurSong() {
  const { audioElement, start, volume, setVolume } = useMusic()
  const reducedMotion = useReducedMotion()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLineIndex, setCurrentLineIndex] = useState(-1)
  const [isFinished, setIsFinished] = useState(false)
  const prevVolume = useRef(volume)
  const fallbackTimeRef = useRef(0)

  const startInterlude = async () => {
    sfx.pop()
    haptics.heartbeat()
    setIsPlaying(true)
    setIsFinished(false)
    setCurrentLineIndex(0)
    fallbackTimeRef.current = 0

    // Lower music volume for lyrics intimacy
    prevVolume.current = volume
    setVolume(Math.min(volume, 0.38))

    if (audioElement) {
      try {
        audioElement.currentTime = 0
        await start()
      } catch {
        // fallback timer handles it
      }
    }
  }

  const stopOrFinish = useCallback(() => {
    setIsPlaying(false)
    setIsFinished(true)
    // Restore music volume smoothly
    setVolume(prevVolume.current)
    haptics.celebrate()
    void fire.hearts({ x: 0.5, y: 0.5 }, 16)
  }, [setVolume])

  // Audio sync or fallback timer loop
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      let t = fallbackTimeRef.current
      if (audioElement && !audioElement.paused && !isNaN(audioElement.currentTime)) {
        t = audioElement.currentTime
      } else {
        fallbackTimeRef.current += 0.5
        t = fallbackTimeRef.current
      }

      // Find current active line
      let activeIdx = -1
      for (let i = 0; i < SONG_LINES.length; i++) {
        if (t >= SONG_LINES[i]!.at) {
          activeIdx = i
        }
      }

      if (activeIdx !== currentLineIndex && activeIdx >= 0) {
        setCurrentLineIndex(activeIdx)
        haptics.heartTick()
      }

      // Check if finished (past last line + 6 seconds)
      const lastLine = SONG_LINES[SONG_LINES.length - 1]!
      if (t > lastLine.at + 6) {
        stopOrFinish()
      }
    }, 400)

    return () => clearInterval(interval)
  }, [isPlaying, currentLineIndex, audioElement, stopOrFinish])

  const activeLine: SongLine | undefined = SONG_LINES[currentLineIndex]

  return (
    <section id="play-our-song" className="relative px-[var(--gutter)] py-20 overflow-hidden">
      <div className="relative mx-auto max-w-[800px] text-center">
        <Reveal>
          <SectionHeading text={SONG_INTERLUDE_COPY.heading} hand={SONG_INTERLUDE_COPY.headingHand} />
          <p className="sub-hand mt-2 max-w-md mx-auto">{SONG_INTERLUDE_COPY.sub}</p>
        </Reveal>

        <Reveal delay={0.15} className="mt-8">
          <div className="paper relative mx-auto max-w-[620px] rounded-blob border-[3px] border-cocoa bg-milk p-6 sm:p-10 shadow-lg flex flex-col items-center">
            <Tape color="butter" className="absolute -top-3 left-[18%] rotate-[-4deg]" />
            <Tape color="petal" className="absolute -top-3 right-[18%] rotate-[5deg]" />

            {/* Spinning Vinyl Illustration */}
            <div className="relative my-4 flex items-center justify-center">
              <motion.div
                animate={
                  isPlaying && !reducedMotion
                    ? { rotate: 360 }
                    : { rotate: 0 }
                }
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: 'linear',
                }}
                className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full border-[4px] border-cocoa bg-[#261822] shadow-xl flex items-center justify-center"
              >
                {/* Vinyl Grooves */}
                <div className="absolute inset-3 rounded-full border border-white/10" />
                <div className="absolute inset-7 rounded-full border border-white/10" />
                <div className="absolute inset-12 rounded-full border border-white/10" />

                {/* Center Label */}
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-cocoa bg-gradient-to-tr from-petal via-blush to-strawberry flex flex-col items-center justify-center p-2 text-center shadow-inner">
                  <Heart className="w-5 h-5 text-rose" />
                  <span className="font-hand text-[10px] sm:text-xs text-cocoa font-bold leading-none mt-1">
                    our song
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Karaoke Line Card */}
            <div
              aria-live="polite"
              className="mt-6 w-full min-h-[140px] rounded-2xl border-2 border-dashed border-petal bg-gradient-to-b from-[#FFFDFB] to-blush/30 p-6 flex flex-col items-center justify-center text-center shadow-inner"
            >
              <AnimatePresence mode="wait">
                {isPlaying && activeLine ? (
                  <motion.div
                    key={activeLine.text}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="font-hand text-2xl sm:text-3xl md:text-4xl text-cocoa leading-relaxed"
                  >
                    "{activeLine.text}"
                  </motion.div>
                ) : isFinished ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <Heart className="w-7 h-7 text-rose" />
                    <p className="font-hand text-2xl sm:text-3xl text-cocoa">
                      {SONG_INTERLUDE_COPY.closingLine}
                    </p>
                  </motion.div>
                ) : (
                  <p className="font-hand text-xl sm:text-2xl text-cocoa-soft">
                    tap below whenever you want to listen together ♡
                  </p>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              {!isPlaying ? (
                <button
                  type="button"
                  onClick={startInterlude}
                  className="btn-sticker bg-gradient-to-r from-rose to-strawberry text-white hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 py-2.5 px-6"
                >
                  <span>▶</span>
                  <span>{isFinished ? SONG_INTERLUDE_COPY.replayBtn : SONG_INTERLUDE_COPY.playBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopOrFinish}
                  className="btn-sticker bg-milk text-cocoa border-cocoa hover:bg-petal/50 active:scale-95 py-2 px-5 font-hand text-base"
                >
                  pause song moment
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
