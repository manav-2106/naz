/**
 * Secret scratch-to-reveal notes (Feature F7).
 * Placed with the Notes section.
 */

export interface ScratchCardData {
  id: string
  rotation: number
  tapeColor: 'butter' | 'petal' | 'strawberry' | 'matcha' | 'lavender' | 'milk'
  text: string
}

export const SCRATCH_CONFIG = {
  heading: 'things i was too shy to say',
  headingHand: 'shy',
  sub: 'covered in pink foil. scratch gently to read ♡',
  hint: 'scratch gently. they bruise easy',
  revealAllBtn: 'just show me',
  uncoveredToast: 'secret revealed ♡',

  cards: [
    {
      id: 'scratch-1',
      rotation: -2.5,
      tapeColor: 'butter',
      text: 'Sometimes I open our chats just to read our old conversations.',
    },
    {
      id: 'scratch-2',
      rotation: 3.2,
      tapeColor: 'petal',
      text: 'obviousally my name at first.',
    },
    {
      id: 'scratch-3',
      rotation: -1.8,
      tapeColor: 'strawberry',
      text: 'I miss you even when we have just said goodbye.',
    },
    {
      id: 'scratch-4',
      rotation: 2.1,
      tapeColor: 'petal',
      text: 'i’d carry your bag. i’d complain. i’d carry it anyway.',
    },
  ] satisfies ScratchCardData[],
} as const
