/**
 * Original lines for the "Play our song" interlude (Feature F12).
 * Mr. Naz's original words only — no real song lyrics.
 */

export interface SongLine {
  at: number // timestamp in seconds
  text: string
}

export const SONG_LINES: SongLine[] = [
  { at: 2, text: 'i don’t know how to say this nicely.' },
  { at: 7, text: 'so i’ll say it badly and mean it.' },
  { at: 12, text: 'you’re the person i tell things to first.' },
  { at: 17, text: 'even the boring days sound better with you in them.' },
  { at: 22, text: 'the silly conversations that last till 2 am...' },
  { at: 27, text: 'and the comfortable quiet when words run out.' },
  { at: 32, text: 'i’m not good at big speeches. i’m good at tomorrow.' },
  { at: 37, text: 'tomorrow, then the day after that.' },
  { at: 42, text: 'happy 18th birthday, ms. naz.' },
]

export const SONG_INTERLUDE_COPY = {
  heading: 'play our song',
  headingHand: 'song',
  sub: 'turn the volume up a little. just my quiet thoughts set to our tune.',
  playBtn: 'play our song',
  playingBadge: 'now spinning...',
  closingLine: 'that’s all i have. the song does the rest.',
  replayBtn: 'listen again',
} as const
