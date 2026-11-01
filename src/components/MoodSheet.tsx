import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { MOODS_CONFIG, type MoodKey } from '../data/moods'
import { fire } from '../lib/confetti'
import { haptics } from '../lib/haptics'
import { sfx } from '../lib/sfx'
import { Heart, Potato, Tape } from './doodles'

export default function MoodSheet() {
  const [open, setOpen] = useState(false)
  const [currentMood, setCurrentMood] = useState<MoodKey | null>(null)

  // Track shown indices per mood to prevent repeats until exhausted
  const seenIndices = useRef<Record<MoodKey, number[]>>({
    happy: [],
    tired: [],
    annoyed: [],
    'missing you': [],
    stressed: [],
    sad: [],
  })

  const [activeReply, setActiveReply] = useState<string | null>(null)

  // Handle escape key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
        haptics.light()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const selectMood = (key: MoodKey) => {
    sfx.pop()
    haptics.tap()
    setCurrentMood(key)

    const moodObj = MOODS_CONFIG[key]
    const replies = moodObj.replies
    let seen = seenIndices.current[key]

    if (seen.length >= replies.length) {
      seen = []
    }

    // Pick an unseen reply
    const remaining = replies
      .map((_, idx) => idx)
      .filter((idx) => !seen.includes(idx))

    const nextIdx = remaining[Math.floor(Math.random() * remaining.length)] ?? 0
    seen.push(nextIdx)
    seenIndices.current[key] = seen
    setActiveReply(replies[nextIdx]!)

    // Trigger ritual actions
    if (key === 'happy') {
      void fire.hearts({ x: 0.5, y: 0.6 }, 14)
    } else if (key === 'annoyed') {
      haptics.doubleTap()
    } else if (key === 'missing you') {
      void fire.hearts({ x: 0.5, y: 0.7 }, 6)
    }
  }

  return (
    <>
      {/* Floating Mood Trigger Button (bottom-left, safe-area aware) */}
      <div className="fixed bottom-[max(20px,env(safe-area-inset-bottom,20px))] left-[max(20px,env(safe-area-inset-left,20px))] z-40">
        <motion.button
          type="button"
          onClick={() => {
            setOpen((o) => !o)
            haptics.light()
            sfx.pop()
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="How are you feeling today?"
          className="btn-sticker flex items-center gap-2 bg-milk border-2 border-cocoa text-cocoa shadow-md px-3.5 py-2 rounded-full font-hand text-base"
        >
          <span className="text-lg">💭</span>
          <span className="hidden sm:inline">how are you, billi?</span>
        </motion.button>
      </div>

      {/* Sheet Backdrop and Container */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/35 backdrop-blur-xs p-0 sm:p-4">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="paper relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-blob border-t-[3px] sm:border-[3px] border-cocoa bg-milk p-6 sm:p-8 shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <Tape color="petal" className="hidden sm:block absolute -top-3 left-1/2 -translate-x-1/2" />

              {/* Close Handle / Button */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-blush">
                <div>
                  <h3 className="font-display text-2xl text-cocoa">how are you today, billi?</h3>
                  <p className="font-hand text-xs text-cocoa-soft mt-0.5">this stays on your phone ♡</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 font-hand text-lg text-cocoa-soft hover:text-cocoa"
                >
                  ✕
                </button>
              </div>

              {/* Mood Buttons Grid */}
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                {(Object.keys(MOODS_CONFIG) as MoodKey[]).map((key) => {
                  const m = MOODS_CONFIG[key]
                  const isSelected = currentMood === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectMood(key)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-cocoa bg-gradient-to-b from-petal to-blush shadow-xs scale-102 font-bold'
                          : 'border-cocoa/20 bg-white/70 hover:border-rose/50 hover:bg-white text-cocoa-soft'
                      }`}
                    >
                      <span className="text-2xl">{m.emojiDoodle}</span>
                      <span className="font-hand text-sm mt-1 text-cocoa">{m.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Reply Card and Ritual Animation */}
              <AnimatePresence mode="wait">
                {currentMood && activeReply && (
                  <motion.div
                    key={activeReply}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 rounded-2xl border-2 border-petal bg-gradient-to-b from-white to-blush/40 p-5 text-center shadow-inner"
                  >
                    {/* Ritual Graphics */}
                    {currentMood === 'tired' && (
                      <div className="mb-3 flex justify-center">
                        <div className="relative h-12 w-8 rounded-b-lg border-2 border-cocoa bg-white/80 overflow-hidden">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: '75%' }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute bottom-0 inset-x-0 bg-blue-300/80"
                          />
                        </div>
                      </div>
                    )}

                    {currentMood === 'stressed' && (
                      <div className="mb-3 flex flex-col items-center">
                        <motion.div
                          animate={{ scale: [1, 1.35, 1.35, 1] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                          className="flex items-center justify-center"
                        >
                          <Heart className="w-10 h-10 text-rose" />
                        </motion.div>
                        <span className="font-hand text-xs text-cocoa-soft mt-1">
                          breathe with the heart... in... out...
                        </span>
                      </div>
                    )}

                    {currentMood === 'annoyed' && (
                      <div className="mb-3 flex justify-center">
                        <motion.div
                          animate={{ rotate: [-8, 8, -6, 6, 0], y: [0, -6, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <Potato className="w-10 h-10" />
                        </motion.div>
                      </div>
                    )}

                    {currentMood === 'missing you' && (
                      <div className="mb-3 flex justify-center">
                        <motion.div
                          animate={{ y: [-4, 4, -4], rotate: [-4, 4, -4] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          className="text-3xl"
                        >
                          ✈️ ♡
                        </motion.div>
                      </div>
                    )}

                    <p className="font-hand text-2xl text-cocoa leading-snug">
                      "{activeReply}"
                    </p>

                    {/* Gentle call hint under sad/stressed */}
                    {MOODS_CONFIG[currentMood].callHint && (
                      <p className="mt-3 font-hand text-xs text-rose font-bold">
                        {MOODS_CONFIG[currentMood].callHint}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => selectMood(currentMood)}
                      className="mt-4 font-hand text-sm text-cocoa-soft hover:text-cocoa underline"
                    >
                      another one? ♡
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
