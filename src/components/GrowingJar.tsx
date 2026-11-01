import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { INITIAL_JAR_REASONS, JAR_CONFIG, type JarSlip } from '../data/jar'
import { api } from '../lib/api'
import { fire } from '../lib/confetti'
import { haptics } from '../lib/haptics'
import { sfx } from '../lib/sfx'
import { toast } from '../lib/toast'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { Bow, Tape } from './doodles'

export default function GrowingJar() {
  const [slips, setSlips] = useState<JarSlip[]>(INITIAL_JAR_REASONS)
  const [activeSlip, setActiveSlip] = useState<JarSlip | null>(null)
  const [jarBounce, setJarBounce] = useState(false)
  const [lockedShakeId, setLockedShakeId] = useState<string | null>(null)

  // Owner Form state (hidden from Naz)
  const [showOwnerForm, setShowOwnerForm] = useState(false)
  const [ownerKey, setOwnerKey] = useState('')
  const [newReasonText, setNewReasonText] = useState('')
  const [newUnlockDate, setNewUnlockDate] = useState('2027-02-13T00:00:00+05:30')
  const [ownerSubmitting, setOwnerSubmitting] = useState(false)

  // Fetch server reasons and merge
  useEffect(() => {
    let active = true
    api.getReasons().then((data) => {
      if (!active || !data) return
      if (data.unlocked && data.unlocked.length > 0) {
        setSlips((prev) => {
          const merged = [...prev]
          for (const s of data.unlocked) {
            if (!merged.some((m) => m.id === s.id)) {
              merged.push({
                id: s.id,
                index: merged.length + 1,
                text: s.text,
                unlockAt: s.unlockAt,
                isLocked: false,
              })
            }
          }
          return merged
        })
      }
    })
    return () => {
      active = false
    }
  }, [])

  const handleTapJar = () => {
    sfx.pop()
    haptics.tap()
    setJarBounce(true)
    setTimeout(() => setJarBounce(false), 450)

    // Pull an unlocked slip in cyclic/random order
    const unlocked = slips.filter((s) => !s.isLocked)
    if (unlocked.length === 0) return

    const random = unlocked[Math.floor(Math.random() * unlocked.length)]!
    setActiveSlip(random)
    haptics.heart()
    void fire.hearts({ x: 0.5, y: 0.55 }, 10)
  }

  const handleTapSlip = (slip: JarSlip) => {
    if (slip.isLocked) {
      sfx.pop()
      haptics.doubleTap()
      setLockedShakeId(slip.id)
      setTimeout(() => setLockedShakeId(null), 500)
      toast(`${slip.label || 'opens soon'}. no peeking yet! ♡`)
    } else {
      sfx.pop()
      haptics.heart()
      setActiveSlip(slip)
      void fire.hearts({ x: 0.5, y: 0.55 }, 10)
    }
  }

  const handleOwnerAdd = async () => {
    if (!newReasonText.trim() || !ownerKey.trim()) return
    setOwnerSubmitting(true)
    const res = await api.addReason(newReasonText, newUnlockDate, ownerKey)
    setOwnerSubmitting(false)

    if (res.success) {
      toast('new monthly reason saved to vault ♡')
      setShowOwnerForm(false)
      setNewReasonText('')
      // Re-fetch
      const refreshed = await api.getReasons()
      if (refreshed?.unlocked) {
        setSlips((prev) => {
          const formatted: JarSlip[] = refreshed.unlocked.map((u, i) => ({
            id: u.id,
            index: prev.length + i + 1,
            text: u.text,
            unlockAt: u.unlockAt,
            isLocked: false,
          }))
          return [...prev, ...formatted]
        })
      }
    } else {
      toast(res.error || 'could not add reason')
    }
  }

  const unlockedCount = slips.filter((s) => !s.isLocked).length

  return (
    <section id="growing-jar" className="relative px-[var(--gutter)] py-20 overflow-hidden">
      <div className="relative mx-auto max-w-[800px] text-center">
        <Reveal>
          <SectionHeading text={JAR_CONFIG.heading} hand={JAR_CONFIG.headingHand} />
          <p className="sub-hand mt-2">{JAR_CONFIG.sub}</p>
          <p className="font-hand text-base text-rose font-bold mt-1">
            {unlockedCount} reasons so far. more on the way ♡
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-8 flex flex-col items-center">
          <div className="paper relative mx-auto w-full max-w-[580px] rounded-blob border-[3px] border-cocoa bg-gradient-to-b from-milk to-blush p-6 sm:p-10 shadow-lg flex flex-col items-center">
            <Tape color="butter" className="absolute -top-3 left-[18%] rotate-[-4deg]" />
            <Tape color="petal" className="absolute -top-3 right-[18%] rotate-[5deg]" />

            {/* Hand-drawn SVG Glass Jar */}
            <motion.div
              onClick={handleTapJar}
              data-cursor="open"
              animate={
                jarBounce
                  ? { scale: [1, 1.1, 0.94, 1.05, 1], rotate: [-2, 2, -1, 1, 0] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.45 }}
              className="relative cursor-pointer flex flex-col items-center select-none"
            >
              {/* Heart-shaped Lid with Bow */}
              <div className="relative flex flex-col items-center z-10">
                <Bow className="w-10 h-7 text-rose -mb-1" />
                <div className="h-5 w-28 rounded-full border-[3px] border-cocoa bg-gradient-to-r from-petal via-strawberry to-petal shadow-sm flex items-center justify-center">
                  <span className="h-1.5 w-16 rounded-full bg-white/70" />
                </div>
                {/* Neck */}
                <div className="h-3 w-32 border-x-[3px] border-cocoa bg-white/50" />
              </div>

              {/* Glass Jar Body */}
              <div className="relative h-60 w-56 rounded-[40px] border-[3px] border-cocoa bg-gradient-to-b from-white/70 via-blush/60 to-petal/70 backdrop-blur-xs shadow-inner flex flex-col items-center justify-end pb-5 overflow-hidden">
                {/* Glass reflection highlight */}
                <div className="absolute top-4 left-4 h-48 w-3 rounded-full bg-white/60 blur-[0.5px]" />

                {/* Folded paper slips inside the jar */}
                <div className="flex flex-wrap justify-center items-end gap-1.5 px-4 mb-2 z-[2]">
                  {slips.slice(0, 16).map((slip, i) => {
                    const isShaking = lockedShakeId === slip.id
                    return (
                      <motion.button
                        key={slip.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTapSlip(slip)
                        }}
                        animate={
                          isShaking
                            ? { x: [-4, 4, -3, 3, 0] }
                            : { y: [0, -2, 0] }
                        }
                        transition={{
                          y: { duration: 2 + (i % 3) * 0.4, repeat: Infinity, ease: 'easeInOut' },
                          x: { duration: 0.4 },
                        }}
                        className={`relative rounded-md border-2 border-cocoa px-2 py-1 text-xs font-hand font-bold shadow-xs transition-transform hover:scale-110 active:scale-95 ${
                          slip.isLocked
                            ? 'bg-petal text-cocoa-soft opacity-85'
                            : 'bg-white text-cocoa'
                        }`}
                      >
                        {slip.isLocked ? (
                          <span className="flex items-center gap-0.5">
                            🔒 {slip.label || 'soon'}
                          </span>
                        ) : (
                          <span>#{slip.index} ♡</span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Tap Hint Badge */}
                <div className="font-hand text-sm font-bold text-cocoa/80 bg-white/80 px-4 py-0.5 rounded-full border border-cocoa/20 shadow-xs">
                  {JAR_CONFIG.hint}
                </div>
              </div>
            </motion.div>
          </div>
        </Reveal>

        {/* Unfolded 3D Paper Slip Modal */}
        <AnimatePresence>
          {activeSlip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotateX: -25 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                exit={{ scale: 0.8, opacity: 0, rotateX: 20 }}
                transition={{ type: 'spring', damping: 18 }}
                style={{ perspective: 800 }}
                className="paper relative max-w-md w-full rounded-blob border-[3px] border-cocoa bg-milk p-6 sm:p-8 shadow-2xl text-center"
              >
                <Tape color="butter" className="absolute -top-3 left-1/2 -translate-x-1/2" />
                <span className="font-hand text-sm font-bold text-rose">
                  reason #{activeSlip.index}
                </span>

                <div className="mt-4 rounded-2xl border-2 border-dashed border-petal bg-[#FFFDFB] p-5 shadow-inner">
                  <p className="font-hand text-2xl sm:text-3xl text-cocoa leading-relaxed">
                    "{activeSlip.text}"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSlip(null)}
                  className="btn-sticker mt-6 bg-rose text-white hover:brightness-105 active:scale-95 py-2 px-6"
                >
                  tuck back in jar ♡
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Subtle owner toggle (press with Shift + J or tap footer link) */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowOwnerForm((p) => !p)}
            className="font-hand text-xs text-cocoa-soft/40 hover:text-cocoa-soft transition-colors"
          >
            {showOwnerForm ? 'hide owner options' : 'mr. naz: add slip'}
          </button>
        </div>

        {/* Owner Add Form */}
        <AnimatePresence>
          {showOwnerForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="paper mt-4 mx-auto max-w-md rounded-2xl border-2 border-cocoa bg-milk p-5 text-left shadow-md"
            >
              <h5 className="font-display text-lg text-cocoa">Add Monthly Reason (Owner)</h5>
              <input
                type="password"
                placeholder="Owner Secret Key"
                value={ownerKey}
                onChange={(e) => setOwnerKey(e.target.value)}
                className="mt-2 w-full rounded-xl border border-petal p-2 font-hand text-sm"
              />
              <textarea
                placeholder="New reason text..."
                value={newReasonText}
                onChange={(e) => setNewReasonText(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-petal p-2 font-hand text-base"
              />
              <input
                type="text"
                placeholder="Unlock Date ISO (e.g. 2027-02-13T00:00:00+05:30)"
                value={newUnlockDate}
                onChange={(e) => setNewUnlockDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-petal p-2 font-hand text-xs"
              />
              <button
                type="button"
                onClick={handleOwnerAdd}
                disabled={ownerSubmitting}
                className="btn-sticker mt-3 w-full bg-rose text-white py-1.5"
              >
                {ownerSubmitting ? 'Saving...' : 'Save to Vault'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
