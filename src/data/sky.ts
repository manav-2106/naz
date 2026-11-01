/**
 * Astronomy configuration for "Our Sky" (Feature F1).
 * Edit places, times, or star facts here.
 */

export interface SkyMoment {
  id: 'meet' | 'birthday'
  label: string
  sublabel: string
  /** Observer latitude (N positive). Default: 28.6139 (Delhi) */
  lat: number
  /** Observer longitude (E positive). Default: 77.2090 (Delhi) */
  lon: number
  city: string
  /** ISO timestamp with timezone offset */
  localTime: string
  tzLabel: string
  /** Name of the special star designated as "you" */
  specialStar: string
}

export const SKY_CONFIG = {
  // TODO: Mr. Naz can change city/lat/lon or exact meeting time if preferred
  meet: {
    id: 'meet',
    label: 'the night we met',
    sublabel: '9 sept 2026 · 10:30 pm',
    lat: 28.6139,
    lon: 77.2090,
    city: 'New Delhi',
    localTime: '2026-09-09T22:30:00+05:30',
    tzLabel: 'IST',
    specialStar: 'Vega',
  } satisfies SkyMoment,

  birthday: {
    id: 'birthday',
    label: 'your birthday night',
    sublabel: '13 nov 2026 · 12:00 am',
    lat: 28.6139,
    lon: 77.2090,
    city: 'New Delhi',
    localTime: '2026-11-13T00:00:00+05:30',
    tzLabel: 'IST',
    specialStar: 'Capella',
  } satisfies SkyMoment,

  /** Sweet facts shown when tapping or hovering named bright stars */
  starFacts: {
    Vega: 'The brightest star in Lyra. Pure white and impossible to miss, kind of like you.',
    Sirius: 'The brightest star in our entire night sky. Shines twice as bright as anything else.',
    Betelgeuse: 'A warm, glowing ruby giant sitting on Orion’s shoulder. Sweet and dramatic.',
    Polaris: 'The North Star. Never drifts away, always steady in the exact same spot.',
    Capella: 'A golden-yellow twin star. The brightest point overhead on your birthday.',
    Rigel: 'A brilliant sapphire star lighting up the bottom of Orion.',
    Arcturus: 'An ancient honey-gold star that follows the Great Bear across the sky.',
    Aldebaran: 'The glowing eye of Taurus. Fiery and a tiny bit stubborn (sound familiar?).',
  } as Record<string, string>,
} as const
