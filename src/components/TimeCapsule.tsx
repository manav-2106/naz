import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CAPSULE_CONFIG } from '../data/capsule'
import { api, type CapsuleStatus } from '../lib/api'
import { fire } from '../lib/confetti'
import { haptics } from '../lib/haptics'
import { sfx } from '../lib/sfx'
import { toast } from '../lib/toast'
import Envelope from './Envelope'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { Heart, Tape } from './doodles'

const DRAFT_KEY = 'naz_capsule_draft'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isReady: boolean
}

function calculateTimeLeft(targetISO: string): TimeLeft {
  const diff = Math.max(0, new Date(targetISO).getTime() - Date.now())
  const isReady = diff <= 0
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds, isReady }
}

export default function TimeCapsule() {
  const [draft, setDraft] = useState(() => {
    try {
      return sessionStorage.getItem(DRAFT_KEY) || ''
    } catch {
      return ''
    }
  })

  const [status, setStatus] = useState<CapsuleStatus | null>(null)
  const [mrNazStatus, setMrNazStatus] = useState<CapsuleStatus | null>(null)
  const [sealing, setSealing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(CAPSULE_CONFIG.unlockISO),
  )

  // Save draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, draft)
    } catch {
      // ignore
    }
  }, [draft])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(CAPSULE_CONFIG.unlockISO))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch status on mount
  useEffect(() => {
    let active = true
    api
      .getCapsule()
      .then((res) => {
        if (!active) return
        if (res) {
          if (res.naz) setStatus(res.naz)
          if (res.mrNaz) setMrNazStatus(res.mrNaz)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const handleSealConfirm = async () => {
    setShowConfirm(false)
    setSealing(true)
    haptics.heartbeat()
    sfx.chime()

    // Trigger seal animation
    setTimeout(async () => {
      const res = await api.sealCapsule('naz', draft)
      setSealing(false)

      if (res.success) {
        setStatus({
          author: 'naz',
          sealedAt: new Date().toISOString(),
          unlockAt: CAPSULE_CONFIG.unlockISO,
          locked: true,
        })
        try {
          sessionStorage.removeItem(DRAFT_KEY)
        } catch {
          // ignore
        }
        haptics.celebrate()
        void fire.hearts({ x: 0.5, y: 0.5 }, 18)
        toast(CAPSULE_CONFIG.copy.toastSealed)
      } else if (res.error?.includes('already sealed')) {
        api.getCapsule().then((latest) => {
          if (latest?.naz) setStatus(latest.naz)
        })
        try {
          sessionStorage.removeItem(DRAFT_KEY)
        } catch {
          // ignore
        }
        haptics.celebrate()
        void fire.hearts({ x: 0.5, y: 0.5 }, 18)
        toast(CAPSULE_CONFIG.copy.toastSealed)
      } else {
        setOfflineMessage(res.error || CAPSULE_CONFIG.copy.offlineNotice)
        haptics.doubleTap()
      }
    }, 1200)
  }

  const isSealed = Boolean(status)
  const canUnlockNow = isSealed && (timeLeft.isReady || !status?.locked)

  return (
    <section id="capsule" className="relative px-[var(--gutter)] py-20 overflow-hidden">
      <div className="relative mx-auto max-w-[820px]">
        <Reveal className="text-center">
          <SectionHeading text={CAPSULE_CONFIG.copy.heading} hand={CAPSULE_CONFIG.copy.headingHand} />
          <p className="sub-hand mt-2 max-w-lg mx-auto">{CAPSULE_CONFIG.copy.sub}</p>
        </Reveal>

        {offlineMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 mx-auto max-w-md rounded-2xl border-2 border-rose bg-blush/90 p-4 text-center text-sm font-hand text-cocoa shadow-sm"
          >
            {offlineMessage}
          </motion.div>
        )}

        <div className="mt-10">
          {!isSealed ? (
            /* Compose Note Mode */
            <Reveal delay={0.1}>
              <div className="paper relative mx-auto max-w-[620px] rounded-blob border-[3px] border-cocoa bg-milk p-6 sm:p-10 shadow-lg">
                <Tape color="butter" className="absolute -top-3 left-[18%] rotate-[-3deg]" />
                <Tape color="petal" className="absolute -top-3 right-[18%] rotate-[4deg]" />

                {/* Lined Paper Container */}
                <div className="relative rounded-2xl border-2 border-dashed border-petal bg-[#FFFDFB] p-5 sm:p-7 shadow-inner">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-blush font-hand text-lg text-cocoa-soft">
                    <span>to 19-year-old billi ♡</span>
                    <span className="text-sm font-body text-cocoa-soft/80">
                      {draft.length} / {CAPSULE_CONFIG.maxChars}
                    </span>
                  </div>

                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, CAPSULE_CONFIG.maxChars))}
                    placeholder={CAPSULE_CONFIG.copy.placeholder}
                    rows={8}
                    className="w-full resize-none border-none bg-transparent pt-4 font-hand text-xl sm:text-2xl leading-relaxed text-cocoa placeholder:text-cocoa/30 focus:outline-none focus:ring-0"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, #FFE3EC 36px)',
                      lineHeight: '36px',
                    }}
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="font-hand text-sm text-cocoa-soft text-center sm:text-left">
                    draft saves automatically. once sealed, it stays locked until 2027.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (!draft.trim()) {
                        toast('write a little something first ♡')
                        return
                      }
                      setShowConfirm(true)
                    }}
                    disabled={sealing || !draft.trim()}
                    className="btn-sticker bg-gradient-to-r from-strawberry to-rose text-white hover:brightness-105 active:scale-95 disabled:opacity-50"
                  >
                    {sealing ? 'sealing...' : CAPSULE_CONFIG.copy.sealBtn} 💌
                  </button>
                </div>
              </div>
            </Reveal>
          ) : (
            /* Sealed Envelope & Countdown View */
            <Reveal delay={0.1}>
              <div className="paper relative mx-auto max-w-[640px] rounded-blob border-[3px] border-cocoa bg-gradient-to-b from-milk to-blush p-6 sm:p-10 shadow-lg text-center">
                <Tape color="butter" className="absolute -top-3 left-1/2 -translate-x-1/2" />

                <div className="mx-auto max-w-[340px] py-4">
                  <Envelope open={canUnlockNow && revealed} cracked={canUnlockNow && revealed} />
                </div>

                <h3 className="font-display text-2xl text-cocoa mt-2">
                  {canUnlockNow ? 'the capsule is ready to open!' : CAPSULE_CONFIG.copy.lockedState}
                </h3>
                <p className="font-hand text-lg text-cocoa-soft mt-1">
                  {canUnlockNow
                    ? 'tap below to unfold what was sealed away for you ♡'
                    : CAPSULE_CONFIG.copy.lockedNote}
                </p>

                {/* Live Countdown Box */}
                {!canUnlockNow && (
                  <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                    {[
                      { val: timeLeft.days, label: 'days' },
                      { val: timeLeft.hours, label: 'hours' },
                      { val: timeLeft.minutes, label: 'mins' },
                      { val: timeLeft.seconds, label: 'secs' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border-2 border-cocoa/20 bg-white/80 p-3 shadow-xs"
                      >
                        <div className="font-display text-2xl sm:text-3xl font-bold text-rose">
                          {item.val}
                        </div>
                        <div className="font-hand text-sm text-cocoa-soft">{item.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unlocked Message Display */}
                {canUnlockNow && (
                  <div className="mt-6">
                    {!revealed ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRevealed(true)
                          haptics.celebrate()
                          sfx.chime()
                          void fire.hearts({ x: 0.5, y: 0.5 }, 15)
                        }}
                        className="btn-sticker bg-rose text-white hover:scale-105 active:scale-95"
                      >
                        unseal and read ♡
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 rounded-2xl border-2 border-petal bg-white p-6 text-left font-hand text-xl text-cocoa whitespace-pre-wrap leading-relaxed shadow-inner"
                      >
                        {status?.text || draft || '(message unsealed)'}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Mr. Naz's sealed envelope indication */}
                {mrNazStatus && (
                  <div className="mt-8 pt-6 border-t-2 border-dashed border-petal/60 flex items-center justify-center gap-3">
                    <Heart className="w-5 h-5 text-rose" />
                    <span className="font-hand text-base text-cocoa">
                      {CAPSULE_CONFIG.copy.ownerEnvelopeTitle} · {CAPSULE_CONFIG.copy.ownerEnvelopeLocked}
                    </span>
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="paper relative max-w-sm w-full rounded-blob border-[3px] border-cocoa bg-milk p-6 shadow-2xl text-center"
            >
              <Tape color="petal" className="absolute -top-3 left-1/2 -translate-x-1/2" />
              <h4 className="font-display text-2xl text-cocoa">{CAPSULE_CONFIG.copy.confirmModal.title}</h4>
              <p className="font-hand text-lg text-cocoa-soft mt-3 leading-snug">
                {CAPSULE_CONFIG.copy.confirmModal.body}
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSealConfirm}
                  className="btn-sticker bg-rose text-white hover:brightness-105 active:scale-95 py-2.5"
                >
                  {CAPSULE_CONFIG.copy.confirmModal.yes}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="font-hand text-base text-cocoa-soft hover:text-cocoa py-1.5"
                >
                  {CAPSULE_CONFIG.copy.confirmModal.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
