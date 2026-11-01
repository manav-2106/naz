# Happy Birthday, Naz 🎂 ♡

A handcrafted, interactive birthday scrapbook website made with love for Ms. Naz.

---

## 🌸 Features

### Core Scrapbook Experience
- **Secret Memory Lock**: Cute password gate protecting private photos (PIN: `0909`).
- **Dynamic Time-of-Day Sky**: Background shifts between sunrise pink, daytime blossom, golden dusk, and midnight starlight.
- **Perpetual Birthday Engine**: Dynamic countdown that seamlessly flips year after year (18th, 19th, and forever).
- **Interactive Birthday Cake**: Tap-blowable candles with realistic smoke puffs, relighting, and wish celebrations.
- **Billi Companion**: Animated cat friend that waves on section reveals, holds up a tiny sign in the letter section, and purrs when pet.
- **Secret Letter & Falling Petals**: Handwritten unfolding letter with slow, sparse cherry blossom petals.
- **Love Coupons & Origami Jar**: Redeemable vouchers and origami paper star notes.
- **Vintage Cassette Player**: Floating pastel mixtape deck with spinning spools and sound effects.
- **Soft Mobile Haptics**: Subtle tactile vibrations for taps, candle blowing, and heart bursts.
- **Last-Line Goodbye Screen**: "ok that’s everything. go eat cake." closing scene.

### "Our Sky" Romantic Upgrade
- **F1 The Real Night Sky**: Real astronomy engine rendering the actual stars and constellations above Delhi/NCR for both *the night we met* and *her birthday night*. Includes an interactive pulsing "you ♡" star.
- **F2 Locked Time Capsule**: A letter written to her 19-year-old self. Once sealed, server refuses to expose text until **13 Nov 2027**, featuring a live countdown envelope.
- **F3 Our Constellation**: An interactive celestial map connecting shared memory stars. Allows adding 1 memory star per day with butter-gold (Naz) or rose (Mr. Naz) sparkles.
- **F5 Billi Story Vignettes**: Contextual illustrated cat friend reacting across sections with handwritten speech bubbles.
- **F6 Purring Cat (Web Audio API)**: Real synthesized tactile purr generator with harmonic vibrations when holding or petting Billi.
- **F7 Scratch-to-Reveal Notes**: Real canvas coin-scratch effect revealing sweet memories with confetti bursts.
- **F8 Floating Mood Sheet**: Global floating paw button letting Naz pick her current mood with tailored comfort notes and instant palette shifts.
- **F10 Scroll-Driven Day Palette**: Warm ambient pastel lighting that gracefully transitions as you read down the page.
- **F11 Paper-Fold Section Dividers**: Origami and folded-paper physical transitions between scrapbook chapters.
- **F12 "Play Our Song" Interlude**: Vinyl turntable interlude with lyric lines and animated needle.
- **F13 Growing Jar of Reasons**: Origami paper notes with new reasons unlocking over time.

---

## 🗝️ Environment Variables (Vercel & Local)

Add these in **Vercel Settings → Environment Variables**:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `UPSTASH_REDIS_REST_URL` | `https://enabled-cheetah-218415.upstash.io` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | `gQAAAAAAA1UvAAIgcDE5NDM3MWQxZjgzYjc0OTExODMxYmU5YTY4ODQ0ZjE0NA` | Upstash Redis REST token |
| `NAZ_KEY` | `mine` | Naz's authentication key |
| `OWNER_KEY` | `yours` | Mr. Naz's admin vault key |
| `TEST_UNLOCK_OVERRIDE` | `false` | Set `true` only for early preview testing |

---

## 💌 Naz's Secret Birthday Link

Send Naz this private link on her birthday:
```text
https://msnaz.vercel.app/#k=mine
```
When she opens it:
1. The site silently reads `#k=mine`.
2. Her phone stores the authentication key in `localStorage`.
3. It immediately clears `#k=mine` from the URL bar so the link stays clean.
4. She can seal her time capsule and add stars to the sky!

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run dev server with live API middleware & Upstash Redis
npm run dev

# Run automated test suites
node scripts/test-api.js        # 12 backend security & limit tests
node scripts/test-astronomy.js  # Real star altitude/azimuth math tests

# Production build check
npm run build
```
