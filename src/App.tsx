import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import BilliCompanion from './components/BilliCompanion'
import BirthdayCake from './components/BirthdayCake'
import Countdown from './components/Countdown'
import Cursor from './components/Cursor'
import DaySkyBackground from './components/DaySkyBackground'
import EasterEggs from './components/EasterEggs'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import Gate from './components/Gate'
import GiftBox from './components/GiftBox'
import Hero from './components/Hero'
import LastLineGoodbye from './components/LastLineGoodbye'
import Letter from './components/Letter'
import Loader from './components/Loader'
import LoveCoupons from './components/LoveCoupons'
import MoodSheet from './components/MoodSheet'
import MusicPlayer from './components/MusicPlayer'
import Notes from './components/Notes'
import PaperFoldSection from './components/PaperFoldSection'
import Scrapbook from './components/Scrapbook'
import ScrollRibbon from './components/ScrollRibbon'
import Sparkles from './components/Sparkles'
import ThemeToggle from './components/ThemeToggle'
import Timeline from './components/Timeline'
import Toaster from './components/Toaster'
import { WavyDivider } from './components/doodles'
import { lockScroll, useLenis } from './hooks/useLenis'
import { MusicProvider } from './hooks/useMusic'
import { initAuthKey } from './lib/api'
import { getBirthdayInfo } from './lib/birthday'

// Code-split heavy interactive sections with React.lazy
const GrowingJar = lazy(() => import('./components/GrowingJar'))
const PlayOurSong = lazy(() => import('./components/PlayOurSong'))
const LoveHeart = lazy(() => import('./components/LoveHeart'))
const TimeCapsule = lazy(() => import('./components/TimeCapsule'))
const OurSky = lazy(() => import('./components/OurSky'))
const MilkcakeGame = lazy(() => import('./components/MilkcakeGame'))

/** Mounts children only once the placeholder is near the viewport, so chunks load on approach. */
function NearView({ children, minHeight }: { children: ReactNode; minHeight: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '700px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ minHeight: near ? undefined : minHeight }}>
      {near ? children : null}
    </div>
  )
}

function Safe({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

function Divider() {
  return <WavyDivider className="mx-auto block h-8 w-[min(92%,1100px)]" />
}

export default function App() {
  const [opened, setOpened] = useState(false)
  useLenis()

  useEffect(() => {
    initAuthKey()
    const bInfo = getBirthdayInfo()
    document.title = `happy ${bInfo.targetAgeOrdinal} birthday, naz 🎂`
  }, [])

  useEffect(() => {
    lockScroll(!opened)
  }, [opened])

  return (
    <MusicProvider>
      <DaySkyBackground />

      <ErrorBoundary silent>
        <Cursor />
      </ErrorBoundary>
      <ErrorBoundary silent>
        <Sparkles />
      </ErrorBoundary>
      <ErrorBoundary silent>
        <EasterEggs />
      </ErrorBoundary>
      <ErrorBoundary silent>
        <Toaster />
      </ErrorBoundary>

      {opened && (
        <>
          <ErrorBoundary silent>
            <ThemeToggle />
          </ErrorBoundary>
          <ErrorBoundary silent>
            <ScrollRibbon />
          </ErrorBoundary>
          <ErrorBoundary silent>
            <BilliCompanion />
          </ErrorBoundary>
          <ErrorBoundary silent>
            <MoodSheet />
          </ErrorBoundary>
        </>
      )}

      <main>
        {/* 1. Hero */}
        <Safe>
          <Hero ready={opened} />
        </Safe>

        {/* 2. Countdown */}
        <Safe>
          <PaperFoldSection>
            <Countdown />
          </PaperFoldSection>
        </Safe>

        {/* 3. Birthday Cake */}
        <Safe>
          <PaperFoldSection>
            <BirthdayCake />
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 4. Timeline */}
        <Safe>
          <PaperFoldSection>
            <Timeline />
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 5. Notes (with F7 Scratch Notes) */}
        <Safe>
          <PaperFoldSection>
            <Notes />
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 6. Jar of reasons that keeps growing (F13) */}
        <Safe>
          <PaperFoldSection>
            <NearView minHeight="70dvh">
              <GrowingJar />
            </NearView>
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 7. Scrapbook & Coupons */}
        <Safe>
          <PaperFoldSection>
            <Scrapbook />
          </PaperFoldSection>
        </Safe>

        <Divider />

        <Safe>
          <PaperFoldSection>
            <LoveCoupons />
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 8. Letter */}
        <Safe>
          <PaperFoldSection>
            <Letter />
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 9. Play our song interlude (F12) */}
        <Safe>
          <PaperFoldSection>
            <NearView minHeight="65dvh">
              <PlayOurSong />
            </NearView>
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 10. LoveHeart interactive formation */}
        <Safe>
          <PaperFoldSection>
            <NearView minHeight="90dvh">
              <LoveHeart />
            </NearView>
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 11. Time capsule for 19-year-old self (F2) */}
        <Safe>
          <PaperFoldSection>
            <NearView minHeight="75dvh">
              <TimeCapsule />
            </NearView>
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 12. Our Sky: Astronomy & Constellation (F1 + F3) */}
        <Safe>
          <PaperFoldSection>
            <NearView minHeight="85dvh">
              <OurSky />
            </NearView>
          </PaperFoldSection>
        </Safe>

        <Divider />

        {/* 13. Milkcake Catch Game */}
        <Safe>
          <PaperFoldSection>
            <NearView minHeight="90dvh">
              <MilkcakeGame />
            </NearView>
          </PaperFoldSection>
        </Safe>

        {/* 14. Gift Box Surprise */}
        <Safe>
          <PaperFoldSection>
            <GiftBox />
          </PaperFoldSection>
        </Safe>
      </main>

      {/* 15. Footer & Last Line Goodbye */}
      <Safe>
        <Footer />
      </Safe>
      <Safe>
        <LastLineGoodbye />
      </Safe>

      <ErrorBoundary silent>
        <MusicPlayer />
      </ErrorBoundary>

      {!opened && (
        <ErrorBoundary>
          <Gate onOpened={() => setOpened(true)} />
        </ErrorBoundary>
      )}
    </MusicProvider>
  )
}
