/**
 * Everything you might want to edit lives in /src/data.
 * Names, dates, photo count, surprise text, extra microcopy and the confetti/canvas palette are all here.
 * (CSS colours live in tailwind.config.ts and src/styles/index.css.)
 */
export const config = {
  herName: 'Ms. Naz',
  herShort: 'Naz',
  myName: 'Mr. Naz',
  nicknames: ['Billi', 'jaannnn', 'Ungrateful Potato'],

  /** Absolute timestamps in IST (UTC+5:30), so they are right wherever she opens the page. */
  birthdayISO: '2026-11-13T00:00:00+05:30',
  metISO: '2026-09-09T00:00:00+05:30',

  /** Hero title pieces */
  title: { happy: 'Happy', age: '18th', birthday: 'Birthday,', name: 'Ms.', nameItalic: 'Naz' },
  heroPrefix: 'for my',

  /** Photos: /public/photos/photo-01.webp ... photo-NN.webp. Change the count and add files, that's it. */
  photoCount: 12,
  photoDir: '/photos',
  photoExt: 'webp',
  musicSrc: '/music/song.mp3',

  /** Text on the card that springs out of the gift box */
  surpriseText: 'ok the real gift is in person. you owe me a hug first.',

  /** First memory is always this one */
  firstMemory: { date: '9 Sept 2026', caption: '9 sept 2026. the day we met' },

  units: { days: 'days', hours: 'hours', minutes: 'mins', seconds: 'secs' },

  wishes: [
    'wish: more cake',
    'wish: a very long hug',
    'wish: no exams today',
    'wish: billi gets snacks',
    'wish: she laughs loudly',
    'wish: nothing goes wrong',
    'wish: she texts first',
    'wish: extra milk',
  ],

  ui: {
    start: 'start',
    again: 'play again',
    score: 'score',
    best: 'best',
    time: 'time',
    combo: 'combo',
    slow: 'slow-mo',
    wow: 'combo!',
    giftOpened: 'it opened!',
    swipeView: 'swipe',
    scrollView: 'scroll',
    close: 'close',
    next: 'next',
    prev: 'previous',
    musicOn: 'play music',
    musicOff: 'pause music',
    volume: 'volume',
    soundsOn: 'tiny sounds: on',
    soundsOff: 'tiny sounds: off',
    placeholder: 'photo goes here (billi is guarding it)',
    refresh: 'refresh',
    openLetter: 'open the letter',
    openGift: 'open the gift box',
    flipNote: 'flip note',
    petsBilli: 'pet billi',
    gameCanvas: 'catch the falling milkcakes by moving billi left and right',
    scrollProgress: 'how far down the page you are',
  },

  /** Colours used by canvas and confetti code */
  palette: {
    blush: '#FFE3EC',
    petal: '#FFCFE0',
    strawberry: '#FFB5CD',
    bubblegum: '#FF8FB5',
    rose: '#F2689A',
    butter: '#FFEBA8',
    cocoa: '#5B2A3E',
    milk: '#FFFDFB',
  },
} as const
