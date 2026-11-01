import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getBirthdayInfo } from '../lib/birthday'
import { getTimeOfDayInfo } from '../lib/timeOfDay'
import { sfx } from '../lib/sfx'
import Billi from './Billi'

const SECTION_REACTIONS: Record<string, string> = {
  hero: 'Hiii Ms. Naz! 🐾 Happy birthday, you pretty potato! Welcome to your magical day ♡',
  countdown: 'Billi is counting down every second until your birthday, Jannnnn! ⏳💖',
  cake: 'Ooh your birthday cake! Tap the candles to blow them out and make a big wish! 🎂🕯️',
  timeline: 'Aww look at our lovely journey! Every single moment with you is precious 📖✨',
  notes: 'Sweet little love notes written straight from his heart to yours 📝♡',
  scrapbook: "Look at all your gorgeous photos! Billi's favorite cutie in the whole universe 📸🌸",
  memories: "Look at all your gorgeous photos! Billi's favorite cutie in the whole universe 📸🌸",
  coupons: 'Look at all your love coupons! You can redeem them whenever you want ♡ 🎟️',
  letter: '🤫 Psst... look at the tiny sign I am holding for you above the envelope! Open it gently 💌🐾',
  jar: 'Reasons why you are loved endlessly! Pick a lucky note from the jar 🫙✨',
  'growing-jar': 'Reasons why you are loved endlessly! Pick a lucky note from the jar 🫙✨',
  'play-our-song': 'Our song! Watch the little spinning vinyl and sing along ♡ 🎵✨',
  heart: 'A big glowing heart beating only for you, Jannnnn 💖✨',
  game: "Let's catch the treats together! If you score high, I get to wear my party hat! 🎮🧁",
  gift: 'A special surprise box waiting just for you! Open it, open it! 🎁✨',
  goodbye: 'Sleepy time now... happy birthday, Ms. Naz! Go eat lots of cake! 🍰🐾😴',
  sky: 'Look at our real night sky! The actual stars that shone above us 🌟✨',
  'our-sky': 'Look at our real night sky! The actual stars that shone above us 🌟✨',
  capsule: 'Your precious time capsule to future you! Seal it with love 💌🌙',
}

export default function BilliCompanion() {
  const bInfo = getBirthdayInfo()
  const tod = getTimeOfDayInfo()

  const chattyRemarks = useMemo(
    () => [
      tod.period === 'midnight'
        ? 'Still awake, Ms. Naz? Midnight hours are quiet and thinking of you ♡'
        : tod.period === 'dawn'
          ? 'Good morning, sweet Naz! The sun is up and you look adorable today ☀️'
          : tod.period === 'sunset'
            ? 'Look at the sky right now, dusk is glowing almost as pretty as you ✨'
            : 'Did you smile today, Ms. Naz? You look prettiest when you smile! ♡',
      tod.whisper,
      'Mr. Naz wrote every single word here just for you.',
      'Billi officially rates you 100/10 favorite human.',
      'Remember to make a big birthday wish today! ✨',
      'You are not just my jannnnn, you are my whole world ♡',
      'I am watching you scroll... keep smiling! 🐾',
      `Happy ${bInfo.targetAgeOrdinal} birthday to our favorite potato!`,
    ],
    [bInfo.targetAgeOrdinal, tod.period, tod.whisper]
  )

  const [remarkIndex, setRemarkIndex] = useState(0)
  const [activeMessage, setActiveMessage] = useState<string | null>(null)
  const [showBubble, setShowBubble] = useState(true)
  const [bounce, setBounce] = useState(false)
  const [waving, setWaving] = useState(false)
  const waveTimer = useRef<number>(0)
  const [hasPartyHat, setHasPartyHat] = useState(() => {
    try {
      return localStorage.getItem('naz_billi_party_hat') === 'true'
    } catch {
      return false
    }
  })

  // Listen for high score in the game
  useEffect(() => {
    const onPartyHat = () => {
      setHasPartyHat(true)
      setActiveMessage('🎉 OMG! You got a high score! Look at my party hat! 🥳🎂✨')
      setShowBubble(true)
      setWaving(true)
      if (waveTimer.current) window.clearTimeout(waveTimer.current)
      waveTimer.current = window.setTimeout(() => setWaving(false), 4500)
    }
    window.addEventListener('billi_party_hat', onPartyHat)
    return () => window.removeEventListener('billi_party_hat', onPartyHat)
  }, [])

  // Section observer: Billi waves and greets whenever each section enters the screen
  useEffect(() => {
    let lastSectionId = ''
    const observed = new Set<Element>()

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.2)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible && visible.target.id && visible.target.id !== lastSectionId) {
          lastSectionId = visible.target.id
          const reaction = SECTION_REACTIONS[lastSectionId]
          if (reaction) {
            setActiveMessage(reaction)
            setShowBubble(true)
            setWaving(true)
            sfx.pop()
            if (waveTimer.current) window.clearTimeout(waveTimer.current)
            waveTimer.current = window.setTimeout(() => setWaving(false), 3800)
          }
        }
      },
      {
        threshold: [0.2, 0.4, 0.6],
      }
    )

    const scanAndObserve = () => {
      const sections = document.querySelectorAll<HTMLElement>('section[id], header[id]')
      sections.forEach((sec) => {
        if (!observed.has(sec)) {
          observed.add(sec)
          observer.observe(sec)
        }
      })
    }

    scanAndObserve()
    const scanInterval = window.setInterval(scanAndObserve, 1500)

    return () => {
      observer.disconnect()
      window.clearInterval(scanInterval)
      if (waveTimer.current) window.clearTimeout(waveTimer.current)
    }
  }, [])

  // Periodically cycle default chatty remarks if no section reaction is active
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveMessage(null)
      setRemarkIndex((prev) => (prev + 1) % chattyRemarks.length)
      setShowBubble(true)
    }, 13000)
    return () => window.clearInterval(interval)
  }, [chattyRemarks.length])

  const handleBilliTap = () => {
    sfx.pop()
    setBounce(true)
    setTimeout(() => setBounce(false), 300)
    setWaving(true)
    if (waveTimer.current) window.clearTimeout(waveTimer.current)
    waveTimer.current = window.setTimeout(() => setWaving(false), 3000)
    setActiveMessage(null)
    setRemarkIndex((prev) => (prev + 1) % chattyRemarks.length)
    setShowBubble(true)
  }

  const currentText = activeMessage || chattyRemarks[remarkIndex % chattyRemarks.length]

  return (
    <div
      className="fixed z-[75] flex items-end gap-2 pointer-events-none select-none"
      style={{ bottom: 'calc(var(--safe-bottom) + 14px)', left: 'calc(var(--safe-left) + 14px)' }}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            key={currentText}
            initial={{ opacity: 0, y: 10, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            className="paper pointer-events-auto relative max-w-[210px] sm:max-w-[240px] rounded-2xl border-2 border-cocoa bg-white/95 p-3 shadow-md mb-2"
          >
            <p className="font-hand text-sm font-bold text-cocoa leading-tight">
              {currentText}
            </p>
            {/* Speech triangle */}
            <div className="absolute -bottom-2 left-6 h-3 w-3 rotate-45 border-b-2 border-r-2 border-cocoa bg-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tappable Billi Pet with Waving & Party Hat */}
      <motion.button
        type="button"
        data-cursor="open"
        onClick={handleBilliTap}
        animate={
          waving
            ? { rotate: [0, -18, 14, -14, 10, -5, 0], y: [0, -10, 0, -6, 0], scale: [1, 1.12, 1] }
            : bounce
              ? { scale: [1, 1.2, 0.9, 1] }
              : { scale: 1 }
        }
        transition={waving ? { duration: 1.4, repeat: 1, ease: 'easeInOut' } : { duration: 0.25 }}
        whileHover={{ scale: 1.1 }}
        className="pointer-events-auto relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-[3px] border-cocoa bg-milk shadow-md focus:outline-none"
      >
        {/* Animated waving badge floating over Billi */}
        <AnimatePresence>
          {waving && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.6 }}
              animate={{ opacity: 1, y: -6, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.6 }}
              className="pointer-events-none absolute -top-7 right-0 flex items-center gap-1 rounded-full border border-cocoa/40 bg-white/95 px-2 py-0.5 shadow-sm text-xs font-hand font-bold text-rosedeep whitespace-nowrap"
            >
              <motion.span
                animate={{ rotate: [0, 24, -14, 24, 0] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
              >
                🐾👋
              </motion.span>
              <span>wave!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Billi
          waving={waving}
          partyHat={hasPartyHat}
          className="h-11 w-11 sm:h-13 sm:w-13 -mt-0.5"
        />
      </motion.button>
    </div>
  )
}
