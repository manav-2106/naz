/**
 * WebAudio cat purr synthesizer (Feature F6).
 * Pure synthesis — zero external audio files.
 * Generates low ~25 Hz amplitude-modulated rumble with gentle filtered pinkish noise.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (Ctx) {
      audioCtx = new Ctx()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

interface PurrInstance {
  stop: () => void
}

let activePurr: PurrInstance | null = null

export function startPurr(onDuck?: (duck: boolean) => void): () => void {
  // If already purring, return stop
  if (activePurr) {
    return () => activePurr?.stop()
  }

  const ctx = getAudioContext()
  if (!ctx) return () => {}

  if (onDuck) onDuck(true)

  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
  masterGain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.3)
  masterGain.connect(ctx.destination)

  // 1. Low frequency rumble (25 Hz sine oscillator)
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(25, ctx.currentTime)

  // 2. Amplitude modulation (purr breath cadence ~22 Hz)
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(22, ctx.currentTime)

  const lfoGain = ctx.createGain()
  lfoGain.gain.setValueAtTime(0.4, ctx.currentTime)

  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(0.6, ctx.currentTime)

  lfo.connect(lfoGain)
  lfoGain.connect(oscGain.gain)
  osc.connect(oscGain)
  oscGain.connect(masterGain)

  // 3. Filtered noise component (soft throat vibration)
  const bufferSize = ctx.sampleRate * 2
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1
  }

  const whiteNoise = ctx.createBufferSource()
  whiteNoise.buffer = noiseBuffer
  whiteNoise.loop = true

  // Lowpass filter ~110 Hz
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(110, ctx.currentTime)

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.08, ctx.currentTime)

  whiteNoise.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(masterGain)

  // Start audio nodes
  osc.start()
  lfo.start()
  whiteNoise.start()

  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    if (onDuck) onDuck(false)

    try {
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime)
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      setTimeout(() => {
        try {
          osc.stop()
          lfo.stop()
          whiteNoise.stop()
          osc.disconnect()
          lfo.disconnect()
          whiteNoise.disconnect()
          masterGain.disconnect()
        } catch {
          // ignore
        }
      }, 300)
    } catch {
      // ignore
    }
    if (activePurr?.stop === stop) {
      activePurr = null
    }
  }

  activePurr = { stop }
  return stop
}
