import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface Petal {
  id: number
  left: number // Percentage 4 to 96
  size: number // Width in px
  duration: number // Fall duration in seconds
  delay: number // Staggered delay (negative for immediate presence)
  swayDistance: number // Horizontal sway in px
  rotateStart: number
  opacity: number
  color: string
}

const PETAL_COLORS = ['#ffb5cd', '#fecdd3', '#ffa6c9', '#ffcfe0', '#f472b6']

export default function FallingPetals({ active = true }: { active?: boolean }) {
  const reduced = useReducedMotion()

  // Generate sparse, calm, non-distracting cherry blossom petals
  const petals = useMemo<Petal[]>(() => {
    const list: Petal[] = []
    const count = 13 // Sparse and serene

    for (let i = 0; i < count; i++) {
      // Deterministic spread across width
      const left = 5 + (i * 90) / (count - 1) + ((i * 7) % 6 - 3)
      const size = 15 + (i % 4) * 3 // 15px to 24px
      const duration = 10 + (i % 5) * 1.5 // 10s to 16s (very slow and gentle)
      const delay = -(i * 1.2) // Immediate presence upon scroll
      const swayDistance = 16 + (i % 3) * 10 // 16px to 36px gentle sway
      const rotateStart = (i * 37) % 360
      const opacity = 0.55 + ((i % 3) * 0.1) // 0.55 to 0.75 translucent
      const color = PETAL_COLORS[i % PETAL_COLORS.length]

      list.push({
        id: i,
        left,
        size,
        duration,
        delay,
        swayDistance,
        rotateStart,
        opacity,
        color,
      })
    }
    return list
  }, [])

  if (reduced || !active) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ zIndex: 15 }}
    >
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: -40,
            opacity: p.opacity,
          }}
          animate={{
            y: ['0vh', '115vh'],
            x: [0, p.swayDistance, -p.swayDistance, p.swayDistance * 0.6, 0],
            rotateZ: [p.rotateStart, p.rotateStart + 180, p.rotateStart + 360],
            rotateY: [0, 180, 360],
          }}
          transition={{
            y: {
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            },
            x: {
              duration: p.duration * 0.45,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: p.delay,
            },
            rotateZ: {
              duration: p.duration * 0.7,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            },
            rotateY: {
              duration: p.duration * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay,
            },
          }}
        >
          <svg
            width={p.size}
            height={p.size * 1.3}
            viewBox="0 0 24 32"
            fill="none"
            className="filter drop-shadow-[0_2px_4px_rgba(244,114,182,0.2)]"
          >
            <defs>
              <linearGradient id={`sakura-${p.id}`} x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#fff5f8" />
                <stop offset="50%" stopColor={p.color} />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
            {/* Cherry Blossom Petal Path */}
            <path
              d="M 12 1 C 15.5 0, 19 3, 20 7 C 22.5 17, 17 27, 12 31 C 7 27, 1.5 17, 4 7 C 5 3, 8.5 0, 12 1 Z"
              fill={`url(#sakura-${p.id})`}
            />
            {/* Center petal vein */}
            <path
              d="M 12 5 Q 12 16 12 25"
              stroke="#ffffff"
              strokeWidth="0.75"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}
