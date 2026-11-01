/**
 * Configuration and seed stars for "Our Constellation" (Feature F3).
 */

export interface ConstellationStar {
  id: string
  author: 'naz' | 'mr. naz'
  text: string
  date: string
  /** Normalized coordinate offsets in spiral layout */
  index: number
}

export const CONSTELLATION_CONFIG = {
  heading: 'our constellation',
  headingHand: 'constellation',
  sub: 'a living map of moments we keep building together.',
  addBtn: 'add a star',
  prompt: 'what should this star remember?',
  inputPlaceholder: 'a sweet memory, a silly joke, or a little promise...',
  limitMessage: 'one star a day. the sky needs time to breathe',
  emptySlotHint: 'next star goes here',
  authorOptions: [
    { id: 'naz', label: 'naz ⭐ (butter-gold)' },
    { id: 'mr. naz', label: 'mr. naz 🌸 (rose)' },
  ],

  // 6 starter stars shipping in the bundle
  seedStars: [
    {
      id: 'star-1',
      author: 'mr. naz',
      text: '9 september: the universe got infinitely sweeter when you walked into it.',
      date: '2026-09-09',
      index: 0,
    },
    {
      id: 'star-2',
      author: 'naz',
      text: 'pretending to be tough while listening to your voice notes on repeat.',
      date: '2026-09-18',
      index: 1,
    },
    {
      id: 'star-3',
      author: 'mr. naz',
      text: 'the first time you called me a pagal and laughed so hard you snorted.',
      date: '2026-10-02',
      index: 2,
    },
    {
      id: 'star-4',
      author: 'naz',
      text: 'saving every silly meme because you are the only one who gets it.',
      date: '2026-10-15',
      index: 3,
    },
    {
      id: 'star-5',
      author: 'mr. naz',
      text: 'promising to bring you warm milkcake whenever you have a hard day.',
      date: '2026-11-01',
      index: 4,
    },
    {
      id: 'star-6',
      author: 'mr. naz',
      text: 'happy 18th birthday, billiard. the brightest point in my sky.',
      date: '2026-11-13',
      index: 5,
    },
  ] satisfies ConstellationStar[],
} as const

/**
 * Compute balanced golden-angle spiral positions (in [0.15, 0.85] canvas space)
 * with gentle stable deterministic jitter based on index.
 */
export function getConstellationPosition(index: number): { x: number; y: number } {
  const goldenAngle = 137.507764 * (Math.PI / 180)
  // Distance grows with square root of index for uniform density
  const r = 0.08 + Math.sqrt(index + 1) * 0.095
  const theta = index * goldenAngle
  // Small seeded jitter
  const jitterX = Math.sin(index * 7.9) * 0.02
  const jitterY = Math.cos(index * 5.3) * 0.02

  const x = Math.max(0.12, Math.min(0.88, 0.5 + r * Math.cos(theta) + jitterX))
  const y = Math.max(0.12, Math.min(0.88, 0.5 + r * Math.sin(theta) + jitterY))
  return { x, y }
}
