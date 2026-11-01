/**
 * Astronomy Engine for "Our Sky".
 * Pure local math — no server, no fetch, no external dependencies.
 * All base coordinates are J2000.0 equatorial (Right Ascension & Declination).
 * Source: Yale Bright Star Catalogue (5th Revised Ed., Hoffleit & Jaschek 1991).
 */

/** Degrees → Radians */
export function rad(d: number): number {
  return (d * Math.PI) / 180
}

/** Radians → Degrees */
export function deg(r: number): number {
  return (r * 180) / Math.PI
}

/** Compute Julian Date from a JavaScript Date (UTC). */
export function toJD(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

/** Greenwich Mean Sidereal Time in degrees. */
export function gmstDeg(jd: number): number {
  const d = jd - 2451545.0
  const T = d / 36525.0
  const g =
    280.46061837 +
    360.98564736629 * d +
    T * T * (0.000387933 - T / 38710000)
  return ((g % 360) + 360) % 360
}

/**
 * Convert equatorial coordinates (RA in hours, Dec in deg) to horizontal (alt/az).
 *
 * @param ra   Right Ascension in hours (0..24)
 * @param dec  Declination in degrees (-90..+90)
 * @param lat  Observer latitude in degrees (N positive)
 * @param lon  Observer longitude in degrees (E positive)
 * @param date Observation date/time (UTC parsed from ISO)
 * @returns { alt, az } in degrees. Alt >= 0 means above horizon.
 * Azimuth from North clockwise (0=N, 90=E, 180=S, 270=W).
 */
export function raDecToAltAz(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  date: Date,
): { alt: number; az: number } {
  const jd = toJD(date)
  const localST = ((gmstDeg(jd) + lon) % 360 + 360) % 360

  // Hour angle in radians (LST - RA in degrees)
  const haDeg = ((localST - ra * 15) % 360 + 360) % 360
  const ha = rad(haDeg)
  const decR = rad(dec)
  const latR = rad(lat)

  // Altitude
  const sinAlt =
    Math.sin(decR) * Math.sin(latR) +
    Math.cos(decR) * Math.cos(latR) * Math.cos(ha)
  const altR = Math.asin(Math.max(-1, Math.min(1, sinAlt)))
  const alt = deg(altR)

  // Azimuth from North clockwise
  const cosAlt = Math.cos(altR)
  if (Math.abs(cosAlt) < 1e-9) {
    return { alt, az: 0 }
  }

  const sinAz = (-Math.cos(decR) * Math.sin(ha)) / cosAlt
  const cosAz =
    (Math.sin(decR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * cosAlt)

  let az = deg(Math.atan2(sinAz, cosAz))
  az = ((az % 360) + 360) % 360
  return { alt, az }
}

/**
 * Approximate Sun position in equatorial coordinates, then return altitude.
 * Low-precision solar position (< 1 arcmin error).
 */
export function getSunAltitude(lat: number, lon: number, date: Date): number {
  const jd = toJD(date)
  const d = jd - 2451545.0

  // Mean longitude of Sun
  const L = ((280.460 + 0.9856474 * d) % 360 + 360) % 360
  // Mean anomaly of Sun
  const g = rad(((357.528 + 0.9856003 * d) % 360 + 360) % 360)

  // Ecliptic longitude of Sun
  const lambdaDeg = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)
  const lambda = rad(lambdaDeg)

  // Obliquity of ecliptic
  const epsilon = rad(23.439 - 0.0000004 * d)

  // Convert ecliptic to equatorial
  const sinDec = Math.sin(epsilon) * Math.sin(lambda)
  const dec = deg(Math.asin(sinDec))

  const y = Math.cos(epsilon) * Math.sin(lambda)
  const x = Math.cos(lambda)
  let alpha = deg(Math.atan2(y, x))
  alpha = ((alpha % 360) + 360) % 360
  const raHours = alpha / 15

  return raDecToAltAz(raHours, dec, lat, lon, date).alt
}

/**
 * 2D Canvas projection for a sky dome:
 * Zenith is at the center (0.5, 0.5).
 * Horizon (alt = 0) is a circle of radius ~0.45.
 * Looking up at the sky: North is top, South is bottom, East is LEFT, West is RIGHT.
 *
 * @param alt Altitude in degrees
 * @param az  Azimuth in degrees (0=N, 90=E, 180=S, 270=W)
 */
export function altAzToSkyXY(alt: number, az: number): { x: number; y: number } {
  // Distance from center: zenith (alt=90) has r=0, horizon (alt=0) has r=0.45
  const r = Math.max(0, (90 - alt) / 90) * 0.45
  const azR = rad(az)
  // East on the left means negative X for positive sin(az)
  const x = 0.5 - r * Math.sin(azR)
  const y = 0.5 - r * Math.cos(azR)
  return { x, y }
}
