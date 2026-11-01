import { motion } from 'framer-motion'
import { type ReactNode, useMemo } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface Props {
  children: ReactNode
  className?: string
}

export default function PaperFoldSection({ children, className }: Props) {
  const reducedMotion = useReducedMotion()

  const isLowEnd = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return (navigator.hardwareConcurrency ?? 8) <= 4
  }, [])

  if (reducedMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  if (isLowEnd) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div style={{ perspective: 1200 }} className="relative overflow-visible">
      <motion.div
        initial={{ rotateX: -14, opacity: 0.2 }}
        whileInView={{ rotateX: 0, opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{
          duration: 0.75,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          transformOrigin: '50% 0%',
          transformStyle: 'preserve-3d',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  )
}
