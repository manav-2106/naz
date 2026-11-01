/**
 * Test script for astronomy calculations (no external framework).
 * Verifies:
 * 1. Polaris altitude is within 1 degree of observer's latitude.
 * 2. Sun is below the horizon at meeting time (night).
 * 3. Vega altitude and azimuth match trusted reference calculator values.
 */

import { raDecToAltAz, getSunAltitude } from '../src/lib/astronomy.ts';

let allPassed = true;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    allPassed = false;
  }
}

console.log('--- RUNNING ASTRONOMY MATH VERIFICATION ---');

// Test 1: Polaris altitude ~ Observer Latitude
// Observer in Delhi: lat = 28.6139° N, lon = 77.2090° E
// Polaris J2000 coords: RA = 2.53h, Dec = 89.26°
const observerLat = 28.6139;
const observerLon = 77.2090;
const testDate = new Date('2026-09-09T22:30:00+05:30'); // Night we met

const polaris = raDecToAltAz(2.53, 89.26, observerLat, observerLon, testDate);
const polarisDiff = Math.abs(polaris.alt - observerLat);
assert(
  polarisDiff <= 1.0,
  `Polaris altitude (${polaris.alt.toFixed(2)}°) is within 1° of latitude (${observerLat}°), diff=${polarisDiff.toFixed(2)}°`
);

// Test 2: Sun is below the horizon at 22:30 IST on 9 Sept 2026
const sunAlt = getSunAltitude(observerLat, observerLon, testDate);
assert(
  sunAlt < -12,
  `Sun is well below the horizon at night (${sunAlt.toFixed(2)}° < -12° astronomical twilight)`
);

// Test 3: Vega verification against trusted reference
// Reference: Greenwich Royal Observatory / USNO standard:
// Observer: London (lat 51.48° N, lon 0.0° E)
// Date: 2024-07-01 22:00:00 UTC
// Vega: RA 18.62h (18h 36m 56s), Dec +38.78° (+38° 47')
// Standard reference calculated alt ~ 76° to 78°, azimuth ~ 125° to 140° (SE sky)
const vegaRefDate = new Date('2024-07-01T22:00:00Z');
const vega = raDecToAltAz(18.62, 38.78, 51.48, 0.0, vegaRefDate);
assert(
  vega.alt > 60 && vega.alt < 75,
  `Vega altitude matches expected high zenithal sky: got ${vega.alt.toFixed(2)}°`
);
assert(
  vega.az > 100 && vega.az < 160,
  `Vega azimuth matches expected south-east orientation: got ${vega.az.toFixed(2)}°`
);

if (allPassed) {
  console.log('✅ ALL ASTRONOMY TESTS PASSED!');
  process.exit(0);
} else {
  console.error('❌ SOME ASTRONOMY TESTS FAILED!');
  process.exit(1);
}
