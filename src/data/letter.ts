export type LetterKind = 'greeting' | 'aside' | 'body' | 'sign' | 'ps'

export interface LetterLine {
  kind: LetterKind
  text: string
}

/** The letter, word for word. Each entry appears as its own handwritten line. */
export const letter: readonly LetterLine[] = [
  { kind: 'greeting', text: 'To my girl, my favourite person, ❤️' },
  { kind: 'greeting', text: 'Happy 18th Birthday, my love!' },
  {
    kind: 'body',
    text: "Okay, so this is my first-ever love letter, and honestly, I don't even know where to begin. I've never written something like this before, but there are so many things I want to tell you, so many feelings I don't always know how to express, and so many little moments that I want you to know I'll always remember.",
  },
  {
    kind: 'body',
    text: 'Sometimes I think about how everything started. Those Instagram conversations around 2–3 September, when we barely knew each other. And then came 9 September, the day we finally met.',
  },
  {
    kind: 'body',
    text: "I was genuinely SO nervous that day. I don't think you even realise how nervous I actually was. I had so many thoughts running through my head, but somehow we ended up talking almost the entire day. And the best part was how comfortable you made me feel. I don't know if you realised it, but that meant a lot to me.",
  },
  {
    kind: 'body',
    text: 'Then, after leaving college, you called me, and we kept talking. Slowly, those calls became something I started looking forward to every day. I wanted to know how your day went, what you were doing, what happened and even the smallest random things about your life.',
  },
  {
    kind: 'body',
    text: "But there's one moment that will always stay close to my heart. That night when we were on call and you got emotional and shared a vulnerable side of yourself with me. I don't know if you remember every detail of that conversation, but I remember how much it meant to me that you trusted me enough to open up.",
  },
  {
    kind: 'body',
    text: "I know it wasn't easy for you to share those feelings and everything you had been through. I never wanted you to feel that you had to hide any part of yourself from me. I just wanted you to know that you could talk to me without being judged or feeling that I would look at you differently.",
  },
  {
    kind: 'body',
    text: "I hope you always remember that you don't have to pretend to be okay around me. You can share your happiest moments, your fears, your tears and even the things you find difficult to explain. I might not always have the perfect words, but I'll always want to listen and understand.",
  },
  {
    kind: 'body',
    text: "And then came all our little adventures around college. Visiting different restaurants, spending time together, eating, talking and making random memories. Honestly, I don't think it was ever about the places we visited. It was always about being with you. Even the simplest moments became special just because you were there.",
  },
  {
    kind: 'aside',
    text: 'And how can I forget our first kiss?',
  },
  {
    kind: 'body',
    text: "I still remember telling you that I love you after that. And honestly, for a second, I was worried that I might have ruined the moment by saying it. But then you said it back, and I can't explain how happy that made me. It's such a small moment, but it's one I wish I could relive a thousand times.",
  },
  {
    kind: 'body',
    text: "Then came our hand-holding, our meetings, our hugs, our endless conversations and those calls. Sometimes we wouldn't even have anything important to discuss, but i don't wanted to hang up. I don't know why, but having you there, even through a phone call, always felt so comforting.",
  },
  {
    kind: 'body',
    text: "I love your smile. I genuinely wish you could see yourself through my eyes once. And your childish nature, your silly reactions, your random talks and all those little things you do without even realising them. I hope you never lose that side of yourself because it's one of my favourite things about you.",
  },
  {
    kind: 'body',
    text: "You have made me feel loved and happy in ways I probably haven't expressed enough. And I hope I make you feel the same. I know I'm not perfect, and I won't always get everything right, but I want to keep learning how to love you better, understand you better and make you feel appreciated.",
  },
  {
    kind: 'body',
    text: "I want to be someone you can share everything with. Someone you can laugh with over the stupidest things, cry with on difficult nights, celebrate your smallest achievements with and simply be yourself around. I want us to grow together, support each other's dreams and keep making beautiful memories.",
  },
  {
    kind: 'body',
    text: "And now you're turning 18! I honestly hope this new chapter of your life brings you endless happiness, success, confidence and everything you've ever wished for. Never doubt yourself, never stop dreaming and never let anything take away that beautiful smile of yours. You deserve so many good things in life.",
  },
  {
    kind: 'body',
    text: "I hope I get to celebrate many more birthdays with you. I hope we have countless more random outings, restaurant visits, silly fights, long calls, hugs, kisses and memories that we'll laugh about years later.",
  },
  {
    kind: 'body',
    text: "I don't know what the future holds, but if I could go back to those first Instagram conversations in September, knowing everything that would happen afterwards, I would still choose to start that conversation with you.",
  },
  {
    kind: 'body',
    text: "Thank you for coming into my life. Thank you for trusting me, making me comfortable, sharing your little world with me and giving me so many memories that I never want to forget.",
  },
  {
    kind: 'body',
    text: 'Happy 18th Birthdayyyyyyyyy, my jann, my princesssss, my babyyyy, my toddlerrrrr ❤️',
  },
  {
    kind: 'body',
    text: "Keep smiling, keep being your childish, and never forget how special you are to me.",
  },
  {
    kind: 'body',
    text: "I love you so so sooooooo much. And I'm really, really glad that it's you.",
  },
  { kind: 'sign', text: 'Yours, always. ❤️' },
]
