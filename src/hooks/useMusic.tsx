import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { config } from '../data/config'

export interface MusicApi {
  playing: boolean
  muted: boolean
  volume: number
  targetVolume: number
  currentTime: number
  duration: number
  isBuffering: boolean
  isFading: boolean
  failed: boolean
  audioElement: HTMLAudioElement | null
  /** Call from a tap or click only. Browsers block audio otherwise. */
  start: (options?: { fadeIn?: boolean; duration?: number }) => Promise<void>
  toggle: () => void
  toggleMute: () => void
  setVolume: (v: number) => void
  seek: (time: number) => void
  skip: (seconds: number) => void
}

const MusicContext = createContext<MusicApi | null>(null)

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolumeState] = useState(0.6)
  const [targetVolume, setTargetVolumeState] = useState(0.6)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [failed, setFailed] = useState(false)

  const targetVolRef = useRef(0.6)
  const prevVolumeRef = useRef(0.6)
  const fadeAnimRef = useRef<number | null>(null)

  const cancelFade = useCallback(() => {
    if (fadeAnimRef.current !== null) {
      cancelAnimationFrame(fadeAnimRef.current)
      fadeAnimRef.current = null
    }
    setIsFading(false)
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audio.loop = true
    audio.preload = 'metadata'
    audio.volume = targetVolRef.current
    audio.src = config.musicSrc

    const onPlay = (): void => setPlaying(true)
    const onPause = (): void => {
      setPlaying(false)
      setIsBuffering(false)
    }
    const onWaiting = (): void => setIsBuffering(true)
    const onPlaying = (): void => {
      setPlaying(true)
      setIsBuffering(false)
    }
    const onCanPlay = (): void => setIsBuffering(false)
    const onLoadedMetadata = (): void => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onDurationChange = (): void => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onTimeUpdate = (): void => {
      setCurrentTime(audio.currentTime)
    }
    const onError = (): void => {
      setFailed(true)
      setPlaying(false)
      setIsBuffering(false)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('error', onError)
    audioRef.current = audio

    return () => {
      cancelFade()
      audio.pause()
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('error', onError)
      audio.removeAttribute('src')
      audioRef.current = null
    }
  }, [cancelFade])

  const start = useCallback(
    async (options?: { fadeIn?: boolean; duration?: number }): Promise<void> => {
      const audio = audioRef.current
      if (!audio) return

      const shouldFade = options?.fadeIn ?? true
      const fadeDuration = options?.duration ?? 4000 // 4 seconds gradual fade-in
      const finalTarget = Math.max(0.08, targetVolRef.current)

      cancelFade()

      if (shouldFade) {
        // Start gently at 0.02
        const startVol = 0.02
        audio.volume = startVol
        setVolumeState(startVol)
        setIsFading(true)

        try {
          await audio.play()
          setFailed(false)
        } catch {
          setFailed(true)
          setIsFading(false)
          return
        }

        const startTime = performance.now()
        const animateFade = (now: number) => {
          const elapsed = now - startTime
          const progress = Math.min(1, elapsed / fadeDuration)
          // Smoothstep ease curve
          const ease = progress * progress * (3 - 2 * progress)
          const currentVol = startVol + (finalTarget - startVol) * ease

          if (audioRef.current && !audioRef.current.muted) {
            audioRef.current.volume = currentVol
            setVolumeState(currentVol)
          }

          if (progress < 1) {
            fadeAnimRef.current = requestAnimationFrame(animateFade)
          } else {
            fadeAnimRef.current = null
            setIsFading(false)
            if (audioRef.current && !audioRef.current.muted) {
              audioRef.current.volume = finalTarget
              setVolumeState(finalTarget)
            }
          }
        }
        fadeAnimRef.current = requestAnimationFrame(animateFade)
      } else {
        audio.volume = finalTarget
        setVolumeState(finalTarget)
        try {
          await audio.play()
          setFailed(false)
        } catch {
          setFailed(true)
        }
      }
    },
    [cancelFade],
  )

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void start({ fadeIn: true })
    } else {
      cancelFade()
      audio.pause()
    }
  }, [cancelFade, start])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    cancelFade()

    setMuted((isCurrentlyMuted) => {
      const nextMuted = !isCurrentlyMuted
      audio.muted = nextMuted

      if (nextMuted) {
        // Save current volume before muting
        if (audio.volume > 0) {
          prevVolumeRef.current = audio.volume
        }
        audio.volume = 0
        setVolumeState(0)
      } else {
        // Unmute and restore previous volume
        const restore = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.6
        audio.volume = restore
        setVolumeState(restore)
        targetVolRef.current = restore
        setTargetVolumeState(restore)
      }

      return nextMuted
    })
  }, [cancelFade])

  const setVolume = useCallback(
    (v: number) => {
      cancelFade()
      const next = Math.min(1, Math.max(0, v))
      targetVolRef.current = next
      setTargetVolumeState(next)

      if (next > 0) {
        prevVolumeRef.current = next
      }

      const audio = audioRef.current
      if (audio) {
        audio.volume = next
        if (next > 0) {
          audio.muted = false
          setMuted(false)
        } else {
          audio.muted = true
          setMuted(true)
        }
      }
      setVolumeState(next)
    },
    [cancelFade],
  )

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
    const clamped = Math.max(0, Math.min(max, time))
    audio.currentTime = clamped
    setCurrentTime(clamped)
  }, [])

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
    const nextTime = Math.max(0, Math.min(max, (audio.currentTime || 0) + delta))
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  const value = useMemo<MusicApi>(
    () => ({
      playing,
      muted,
      volume,
      targetVolume,
      currentTime,
      duration,
      isBuffering,
      isFading,
      failed,
      audioElement: audioRef.current,
      start,
      toggle,
      toggleMute,
      setVolume,
      seek,
      skip,
    }),
    [
      playing,
      muted,
      volume,
      targetVolume,
      currentTime,
      duration,
      isBuffering,
      isFading,
      failed,
      start,
      toggle,
      toggleMute,
      setVolume,
      seek,
      skip,
    ],
  )

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

export function useMusic(): MusicApi {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used inside MusicProvider')
  return ctx
}
