import { reasons } from './reasons'

export interface JarSlip {
  id: string
  index: number
  text?: string
  unlockAt: string // ISO timestamp
  isLocked: boolean
  label?: string
}

/** Initial seed reasons from the bundle. */
export const INITIAL_JAR_REASONS: JarSlip[] = [
  ...reasons.map((text, idx) => ({
    id: `base-${idx + 1}`,
    index: idx + 1,
    text,
    unlockAt: '2026-11-13T00:00:00+05:30',
    isLocked: false,
  })),
  // Upcoming monthly slips scheduled in advance
  {
    id: 'monthly-1',
    index: 19,
    text: 'December reminder: you survived another month of me being annoying, and you looked cute doing it.',
    unlockAt: '2026-12-13T00:00:00+05:30',
    isLocked: new Date() < new Date('2026-12-13T00:00:00+05:30'),
    label: 'opens 13 dec',
  },
  {
    id: 'monthly-2',
    index: 20,
    text: 'January reminder: starting a new year with you is the only resolution i care about.',
    unlockAt: '2027-01-13T00:00:00+05:30',
    isLocked: new Date() < new Date('2027-01-13T00:00:00+05:30'),
    label: 'opens 13 jan',
  },
]

export const JAR_CONFIG = {
  heading: 'the jar of reasons',
  headingHand: 'jar',
  sub: 'i’ll keep adding. tap it on a bad day.',
  hint: 'tap the jar to pull out a folded note ♡',
  newTag: 'new',
  lockedSlipPrefix: 'opens',
  ownerAddBtn: 'add a new reason (owner)',
} as const
