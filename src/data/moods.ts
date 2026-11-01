/**
 * Mood tracker and caring replies from Mr. Naz (Feature F8).
 * Purely local, private and client-side ("this stays on your phone").
 */

export type MoodKey = 'happy' | 'tired' | 'annoyed' | 'missing you' | 'stressed' | 'sad'

export interface MoodInfo {
  key: MoodKey
  label: string
  emojiDoodle: string
  ritualType: 'confetti' | 'water' | 'bonk' | 'plane' | 'breathing' | 'lean'
  callHint?: string
  replies: string[]
}

export const MOODS_CONFIG: Record<MoodKey, MoodInfo> = {
  happy: {
    key: 'happy',
    label: 'happy',
    emojiDoodle: '🌸',
    ritualType: 'confetti',
    replies: [
      'tell me everything. start from the funniest part.',
      'keep smiling like that. you have no idea how pretty it is.',
      'quick, bottle up 10% of this energy for when exams start.',
      'billi just did a celebratory roll on the rug because you’re happy.',
      'see? good things happen to good potatoes.',
      'i am taking full credit for at least 2% of this happiness.',
    ],
  },
  tired: {
    key: 'tired',
    label: 'tired',
    emojiDoodle: '💤',
    ritualType: 'water',
    replies: [
      'drink water first. then complain to me. i’m listening.',
      'close your eyes for 10 minutes. the world won’t end, i promise.',
      'put your phone down, pull the blanket up, and rest that heavy head.',
      'today asked too much of you. tomorrow will be gentler.',
      'if i were there i’d turn off all the lights and tuck you in properly.',
      'you did enough today. seriously. go to sleep, potato.',
    ],
  },
  annoyed: {
    key: 'annoyed',
    label: 'annoyed',
    emojiDoodle: '😾',
    ritualType: 'bonk',
    replies: [
      'i’m on your side. even if it’s me. especially if it’s me.',
      'who annoyed my girl? point them out, i’ll write them a strongly worded letter.',
      'bonk. there. take out your anger on this digital potato.',
      'take a deep breath. they’re not worth your pretty energy.',
      'give me the full rant. bullet points, dramatic pauses, everything.',
      'you’re cute even when you’re irritated, but let’s get you a snack first.',
    ],
  },
  'missing you': {
    key: 'missing you',
    label: 'missing you',
    emojiDoodle: '💌',
    ritualType: 'plane',
    replies: [
      'same. i’m just better at pretending in public.',
      'counting down the hours till i get to hear your voice again.',
      'check your pocket. (nothing there, but imagine a warm hand squeeze).',
      'i looked at your photo three times today already. you win.',
      'sending a very long imaginary hug right this second.',
      'distance is stupid. but missing you is proof of how good having you is.',
    ],
  },
  stressed: {
    key: 'stressed',
    label: 'stressed',
    emojiDoodle: '☁️',
    ritualType: 'breathing',
    callHint: 'one call away if you want to vent or just hear breathing on the line ♡',
    replies: [
      'one small thing at a time. i’ll hold the rest.',
      'breathe with the heart on screen. in... out... you’re going to be fine.',
      'stop thinking five steps ahead. just finish the next ten minutes.',
      'you are so much stronger and smarter than whatever is bothering you.',
      'let your shoulders drop. unclench your jaw. you’re safe.',
      'even on your most overwhelming day, you’re still my favourite person.',
    ],
  },
  sad: {
    key: 'sad',
    label: 'sad',
    emojiDoodle: '🌧️',
    ritualType: 'lean',
    callHint: 'i’m one call away. anytime, day or night ♡',
    replies: [
      'you don’t have to be okay for me. just be here.',
      'billi is leaning right against your side so you don’t feel alone.',
      'it’s okay to have a quiet day. i’m not going anywhere.',
      'here is your reminder that you are cherished beyond words.',
      'cry if you need to. soft hearts get heavy sometimes.',
      'nothing that happened today changes how proud i am of you.',
    ],
  },
}
