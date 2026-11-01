import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { config } from '../data/config'

interface MusicApi {
  playing: boolean
  muted: boolean
  volume: number
  failed: boolean
  audioElement: HTMLAudioElement | null
  /** Call from a tap or click only. Browsers block audio otherwise. */
  start: () => Promise<void>
  toggle: () => void
  toggleMute: () => void
  setVolume: (v: number) => void
}

const MusicContext = createContext<MusicApi | null>(null)

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolumeState] = useState(0.6)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const audio = new Audio()
    audio.loop = true
    audio.preload = 'none'
    audio.volume = 0.6
    audio.src = config.musicSrc
    const onPlay = (): void => setPlaying(true)
    const onPause = (): void => setPlaying(false)
    const onError = (): void => {
      setFailed(true)
      setPlaying(false)
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.removeAttribute('src')
      audioRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      await audio.play()
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void start()
    else audio.pause()
  }, [start])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setMuted(audio.muted)
  }, [])

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current
    const next = Math.min(1, Math.max(0, v))
    if (audio) {
      audio.volume = next
      if (next > 0 && audio.muted) {
        audio.muted = false
        setMuted(false)
      }
    }
    setVolumeState(next)
  }, [])

  const value = useMemo<MusicApi>(
    () => ({ playing, muted, volume, failed, audioElement: audioRef.current, start, toggle, toggleMute, setVolume }),
    [playing, muted, volume, failed, start, toggle, toggleMute, setVolume],
  )

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

export function useMusic(): MusicApi {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used inside MusicProvider')
  return ctx
}
