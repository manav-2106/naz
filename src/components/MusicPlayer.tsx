import { AnimatePresence, motion } from 'framer-motion'
import { Disc3, Loader2, Pause, Play, RotateCcw, RotateCw, Volume1, Volume2, VolumeX, X } from 'lucide-react'
import { useState } from 'react'
import { useMusic } from '../hooks/useMusic'
import { haptics } from '../lib/haptics'
import { isSfx, setSfx, sfx } from '../lib/sfx'
import { Tape } from './doodles'

function formatTime(sec: number): string {
  if (isNaN(sec) || !isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Floating vintage cassette mixtape player with pill-shaped sliders, volume fading, and full 0-100 controls. */
export default function MusicPlayer() {
  const music = useMusic()
  const [open, setOpen] = useState(false)
  const [sounds, setSounds] = useState(isSfx())

  // Scrubber drag state so dragging doesn't jump while audio is ticking
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [scrubTime, setScrubTime] = useState(0)

  const activeTime = isScrubbing ? scrubTime : music.currentTime
  const duration = music.duration > 0 ? music.duration : 0
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (activeTime / duration) * 100)) : 0
  const volumePercent = music.muted ? 0 : Math.round(music.volume * 100)

  return (
    <div
      className="fixed z-[80] flex flex-col items-end gap-2"
      style={{ bottom: 'calc(var(--safe-bottom) + 14px)', right: 'calc(var(--safe-right) + 14px)' }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="cassette-deck"
            className="paper w-[min(92vw,340px)] rounded-[28px] border-[3px] border-cocoa bg-gradient-to-b from-milk to-blush p-4 shadow-xl select-none"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          >
            <Tape color="butter" className="absolute -top-3 left-[15%] rotate-[-4deg]" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              data-cursor="pop"
              className="absolute top-2.5 right-2.5 p-1 text-cocoa-soft hover:text-cocoa transition-colors"
              aria-label="Close music player"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Vintage Pastel Cassette Tape */}
            <div className="relative mt-2 rounded-[22px] border-2 border-cocoa bg-[#ffd3e2] p-3 shadow-inner">
              {/* Cassette Top Pill Label */}
              <div className="rounded-full border border-cocoa/30 bg-white/95 px-3 py-1.5 text-center shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-cocoa/60 uppercase px-1">
                  <span>SIDE A</span>
                  <span>STEREO • DOLBY</span>
                </div>
                <div className="font-hand text-base font-bold text-cocoa leading-tight mt-0.5">
                  Ms. Naz • Noor Mahal ♡
                </div>
              </div>

              {/* Tape Window with Dual Spinning Spools */}
              <div className="relative mt-2.5 h-14 rounded-2xl border-2 border-cocoa/40 bg-cocoa/10 flex items-center justify-between px-5 overflow-hidden">
                {/* Center tape bridge visual */}
                <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-4 border-y border-cocoa/20 bg-cocoa/5 pointer-events-none" />

                {/* Left Spool */}
                <motion.div
                  animate={music.playing && !music.muted ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="relative z-10 h-9 w-9 rounded-full border-2 border-dashed border-cocoa bg-white/95 flex items-center justify-center shadow-xs"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-cocoa" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-7 w-0.5 bg-cocoa/30 rotate-0" />
                    <div className="h-7 w-0.5 bg-cocoa/30 rotate-60" />
                    <div className="h-7 w-0.5 bg-cocoa/30 -rotate-60" />
                  </div>
                </motion.div>

                {/* Animated Equalizer Waveform & Status */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 h-6">
                    {[10, 18, 14, 22, 16, 20, 12].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={
                          music.playing && !music.muted
                            ? { height: [h * 0.35, h, h * 0.45] }
                            : { height: 4 }
                        }
                        transition={{ duration: 0.5 + (i % 3) * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1 rounded-full bg-rose shadow-2xs"
                        style={{ height: music.playing && !music.muted ? h : 4 }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-cocoa/70 tracking-tighter">
                    {music.isFading ? 'fading in gently... ♡' : music.playing ? (music.muted ? 'muted' : 'playing') : 'paused'}
                  </span>
                </div>

                {/* Right Spool */}
                <motion.div
                  animate={music.playing && !music.muted ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="relative z-10 h-9 w-9 rounded-full border-2 border-dashed border-cocoa bg-white/95 flex items-center justify-center shadow-xs"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-cocoa" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-7 w-0.5 bg-cocoa/30 rotate-0" />
                    <div className="h-7 w-0.5 bg-cocoa/30 rotate-60" />
                    <div className="h-7 w-0.5 bg-cocoa/30 -rotate-60" />
                  </div>
                </motion.div>
              </div>

              {/* Pill-Shaped Track Timeline Scrubber */}
              <div className="mt-3 px-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-cocoa font-medium mb-1">
                  <span className="rounded-full bg-white/80 border border-cocoa/20 px-2 py-0.5 shadow-2xs">
                    {formatTime(activeTime)}
                  </span>
                  <span className="rounded-full bg-white/80 border border-cocoa/20 px-2 py-0.5 shadow-2xs">
                    {duration > 0 ? formatTime(duration) : '--:--'}
                  </span>
                </div>

                <div className="relative flex items-center h-6 select-none">
                  {/* Visual Pill Track */}
                  <div className="w-full h-2.5 rounded-full bg-cocoa/15 border border-cocoa/25 overflow-hidden relative pointer-events-none">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose to-rosedeep"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Floating Bead Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform"
                    style={{ left: `${progressPercent}%` }}
                  >
                    <div className="h-4 w-4 rounded-full bg-white border-2 border-cocoa shadow-md flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose" />
                    </div>
                  </div>

                  {/* Range Input on Top */}
                  <input
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 100}
                    step={0.5}
                    value={activeTime}
                    onMouseDown={() => setIsScrubbing(true)}
                    onTouchStart={() => setIsScrubbing(true)}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setScrubTime(val)
                      if (!isScrubbing) music.seek(val)
                    }}
                    onInput={(e) => {
                      const val = Number((e.target as HTMLInputElement).value)
                      setScrubTime(val)
                      if (!isScrubbing) music.seek(val)
                    }}
                    onMouseUp={() => {
                      setIsScrubbing(false)
                      music.seek(scrubTime)
                    }}
                    onTouchEnd={() => {
                      setIsScrubbing(false)
                      music.seek(scrubTime)
                    }}
                    data-cursor="drag"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Song seek slider"
                  />
                </div>
              </div>
            </div>

            {/* Playback Controls Bar (Pill Buttons) */}
            <div className="mt-3 flex items-center justify-center gap-3">
              {/* Skip Back 10s */}
              <button
                type="button"
                onClick={() => {
                  haptics.light()
                  music.skip(-10)
                }}
                data-cursor="pop"
                title="Rewind 10 seconds"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cocoa/30 bg-milk text-cocoa hover:bg-petal hover:border-cocoa transition-transform active:scale-90 shadow-2xs"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                type="button"
                onClick={() => {
                  haptics.light()
                  music.toggle()
                }}
                data-cursor="pop"
                title={music.playing ? 'Pause' : 'Play'}
                className="flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-cocoa bg-rose text-white shadow-md hover:scale-105 active:scale-95 transition-transform"
              >
                {music.isBuffering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : music.playing ? (
                  <Pause className="h-5 w-5 fill-white" />
                ) : (
                  <Play className="h-5 w-5 fill-white ml-0.5" />
                )}
              </button>

              {/* Skip Forward 10s */}
              <button
                type="button"
                onClick={() => {
                  haptics.light()
                  music.skip(10)
                }}
                data-cursor="pop"
                title="Fast forward 10 seconds"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cocoa/30 bg-milk text-cocoa hover:bg-petal hover:border-cocoa transition-transform active:scale-90 shadow-2xs"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            {/* Pill-Shaped Volume Control (0% to 100%) */}
            <div className="mt-3 flex items-center gap-2.5 rounded-full border-2 border-cocoa/25 bg-milk/90 px-3 py-1.5 shadow-sm">
              {/* Mute/Unmute Pill Button */}
              <button
                type="button"
                onClick={() => {
                  haptics.light()
                  music.toggleMute()
                }}
                data-cursor="pop"
                title={music.muted || music.volume === 0 ? 'Unmute' : 'Mute'}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cocoa/25 bg-petal/80 text-cocoa hover:bg-petal active:scale-90 transition-all cursor-pointer shadow-2xs"
              >
                {music.muted || music.volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-cocoa" />
                ) : music.volume < 0.4 ? (
                  <Volume1 className="h-3.5 w-3.5 text-cocoa" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-cocoa" />
                )}
              </button>

              {/* Pill Slider Track (0 to 100) */}
              <div className="relative flex-1 flex items-center h-7 select-none">
                {/* Visual Pill Track */}
                <div className="w-full h-3 rounded-full bg-cocoa/10 border border-cocoa/20 overflow-hidden relative pointer-events-none">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose to-rosedeep transition-all duration-75"
                    style={{ width: `${volumePercent}%` }}
                  />
                </div>

                {/* Floating Bead Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-75"
                  style={{ left: `${volumePercent}%` }}
                >
                  <div className="h-4 w-4 rounded-full bg-white border-2 border-cocoa shadow-md flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose" />
                  </div>
                </div>

                {/* Invisible Full-Hit Range Input (0 to 100) */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={music.muted ? 0 : volumePercent}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    music.setVolume(val / 100)
                  }}
                  onInput={(e) => {
                    const val = Number((e.target as HTMLInputElement).value)
                    music.setVolume(val / 100)
                  }}
                  data-cursor="drag"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Volume slider 0 to 100 percent"
                />
              </div>

              {/* Pill Percentage Badge */}
              <div className="shrink-0 rounded-full bg-petal/60 border border-cocoa/20 px-2 py-0.5 text-center min-w-[42px]">
                <span className="font-mono text-[11px] font-bold text-cocoa">
                  {volumePercent}%
                </span>
              </div>
            </div>

            {/* Tiny SFX Toggle (Pill Badge) */}
            <div className="mt-2.5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  haptics.light()
                  const next = !sounds
                  setSfx(next)
                  setSounds(next)
                  if (next) sfx.pop()
                }}
                data-cursor="pop"
                className="rounded-full border border-cocoa/20 bg-milk/70 px-3 py-1 text-center font-hand text-xs text-cocoa-soft hover:text-cocoa transition-colors shadow-2xs"
              >
                tiny sound effects: <span className="font-bold">{sounds ? 'on ♡' : 'off'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Corner Vinyl Button */}
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          data-cursor="pop"
          onClick={() => {
            haptics.light()
            setOpen((o) => !o)
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          title={open ? 'Close cassette deck' : 'Open cassette deck'}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-cocoa bg-petal shadow-md cursor-pointer"
        >
          <motion.div
            animate={music.playing && !music.muted ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <Disc3 className="h-7 w-7 text-cocoa" />
          </motion.div>
          {music.playing && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose text-[9px] text-white shadow-2xs">
              ♥
            </span>
          )}
        </motion.button>
      </div>
    </div>
  )
}
