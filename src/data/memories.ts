import { config } from './config'

export interface Memory {
  id: number
  src: string
  alt: string
  caption: string
  date: string
}

/** Captions in order. Missing ones fall back to the last line below. Add or edit as you like. */
const captions: readonly string[] = [
  config.firstMemory.caption,
  'you, pretending you didn’t pose',
  'a good day. i don’t need a reason',
  'blurry but i kept it',
  'my favourite hand to hold',
  'billi mode: on',
  'sharing earphones with you',
  'ungrateful potato, caught on camera',
  'me trying to look normal',
  'one of my favourite moments with you',
  'my forever favourite person',
  'the next one isn’t here yet',
]

const fallbackCaption = 'one more for the pile'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export const memories: Memory[] = Array.from({ length: config.photoCount }, (_, i) => {
  const caption = i === 0 ? config.firstMemory.caption : (captions[i] ?? fallbackCaption)
  return {
    id: i + 1,
    src: `${config.photoDir}/photo-${pad(i + 1)}.${config.photoExt}`,
    alt: `photo ${i + 1}: ${caption}`,
    caption,
    date: i === 0 ? config.firstMemory.date : '',
  }
})
