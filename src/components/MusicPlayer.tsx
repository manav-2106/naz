import { AnimatePresence, motion } from 'framer-motion'
import { Disc3, Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { useState } from 'react'
import { useMusic } from '../hooks/useMusic'
import { haptics } from '../lib/haptics'
import { isSfx, setSfx, sfx } from '../lib/sfx'
import { Tape } from './doodles'

/** Floating vintage cassette mixtape player. Tap to toggle play/pause or expand vintage tape deck. */
export default function MusicPlayer() {
  const music = useMusic()
  const [open, setOpen] = useState(false)
  const [sounds, setSounds] = useState(isSfx())

  return (
    <div
      className="fixed z-[80] flex flex-col items-end gap-2"
      style={{ bottom: 'calc(var(--safe-bottom) + 14px)', right: 'calc(var(--safe-right) + 14px)' }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="cassette-deck"
            className="paper w-[min(90vw,310px)] rounded-2xl border-[3px] border-cocoa bg-gradient-to-b from-milk to-blush p-4 shadow-xl"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          >
            <Tape color="butter" className="absolute -top-3 left-[15%] rotate-[-4deg]" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 p-1 text-cocoa-soft hover:text-cocoa"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Vintage Pastel Cassette Tape */}
            <div className="relative mt-2 rounded-xl border-2 border-cocoa bg-[#ffd3e2] p-3 shadow-inner">
              {/* Cassette Top Label */}
              <div className="rounded-md border border-cocoa/30 bg-white/90 px-3 py-1 text-center shadow-xs">
                <span className="font-hand text-sm font-bold text-cocoa">
                  Ms. Naz • Side A: our song ♡
                </span>
              </div>

              {/* Tape Window with Dual Spinning Spools */}
              <div className="mt-2.5 h-12 rounded-lg border-2 border-cocoa/40 bg-cocoa/10 flex items-center justify-around px-4">
                {/* Left Spool */}
                <motion.div
                  animate={music.playing && !music.muted ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="h-8 w-8 rounded-full border-2 border-dashed border-cocoa bg-white/90 flex items-center justify-center shadow-xs"
                >
                  <div className="h-2 w-2 rounded-full bg-cocoa" />
                </motion.div>

                {/* Animated Equalizer Waveform */}
                <div className="flex items-center gap-1">
                  {[12, 18, 10, 22, 15].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={
                        music.playing && !music.muted
                          ? { height: [h * 0.4, h, h * 0.5] }
                          : { height: 4 }
                      }
                      transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1 rounded-full bg-rose"
                      style={{ height: h }}
                    />
                  ))}
                </div>

                {/* Right Spool */}
                <motion.div
                  animate={music.playing && !music.muted ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="h-8 w-8 rounded-full border-2 border-dashed border-cocoa bg-white/90 flex items-center justify-center shadow-xs"
                >
                  <div className="h-2 w-2 rounded-full bg-cocoa" />
                </motion.div>
              </div>
            </div>

            {/* Volume & Playback Controls */}
            <div className="mt-3 flex items-center justify-between gap-3 px-1">
              <button
                type="button"
                onClick={() => {
                  haptics.light()
                  music.toggle()
                }}
                data-cursor="open"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-cocoa bg-rose text-white shadow-sm hover:scale-105 active:scale-95"
              >
                {music.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.light()
                  music.toggleMute()
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cocoa/30 bg-petal text-cocoa"
              >
                {music.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={music.muted ? 0 : music.volume}
                onChange={(e) => music.setVolume(Number(e.target.value))}
                className="h-2 min-w-0 flex-1 accent-[#C0386A]"
              />
            </div>

            {/* Tiny SFX Toggle */}
            <button
              type="button"
              onClick={() => {
                haptics.light()
                const next = !sounds
                setSfx(next)
                setSounds(next)
                if (next) sfx.pop()
              }}
              className="mt-2.5 w-full text-center font-hand text-xs text-cocoa-soft hover:text-cocoa"
            >
              tiny sound effects: <span className="font-bold">{sounds ? 'on ♡' : 'off'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Corner Vinyl Button */}
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          data-cursor="open"
          onClick={() => {
            haptics.light()
            setOpen((o) => !o)
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-cocoa bg-petal shadow-md"
        >
          <motion.div
            animate={music.playing && !music.muted ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <Disc3 className="h-7 w-7 text-cocoa" />
          </motion.div>
          {music.playing && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose text-[9px] text-white">
              ♥
            </span>
          )}
        </motion.button>
      </div>
    </div>
  )
}
