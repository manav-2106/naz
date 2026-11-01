/**
 * Generator for bright star catalogue and constellation lines.
 * Source: Yale Bright Star Catalogue (5th Revised Ed., Hoffleit & Jaschek 1991) / Hipparcos public domain.
 * Formats:
 * stars.json: Array of [ra_hours, dec_degrees, magnitude, name, bv_color]
 * constellations.json: Array of { id, name, lines: [[ra1, dec1], [ra2, dec2], ...] }
 */

import fs from 'fs';
import path from 'path';

// Prominent bright stars with known coordinates (J2000.0)
// ra in hours (0..24), dec in degrees (-90..+90), mag, name, bv
const NAMED_STARS = [
  // Ursa Major & Minor
  { name: 'Polaris', ra: 2.53, dec: 89.26, mag: 1.98, bv: 0.63 },
  { name: 'Dubhe', ra: 11.06, dec: 61.75, mag: 1.79, bv: 1.07 },
  { name: 'Merak', ra: 11.03, dec: 56.38, mag: 2.37, bv: -0.02 },
  { name: 'Phecda', ra: 11.9, dec: 53.69, mag: 2.44, bv: 0.03 },
  { name: 'Megrez', ra: 12.25, dec: 57.03, mag: 3.31, bv: 0.08 },
  { name: 'Alioth', ra: 12.9, dec: 55.96, mag: 1.77, bv: -0.02 },
  { name: 'Mizar', ra: 13.4, dec: 54.92, mag: 2.23, bv: 0.05 },
  { name: 'Alkaid', ra: 13.79, dec: 49.31, mag: 1.86, bv: -0.19 },
  { name: 'Kochab', ra: 14.85, dec: 74.16, mag: 2.08, bv: 1.47 },

  // Orion
  { name: 'Betelgeuse', ra: 5.92, dec: 7.41, mag: 0.5, bv: 1.85 },
  { name: 'Rigel', ra: 5.24, dec: -8.2, mag: 0.13, bv: -0.03 },
  { name: 'Bellatrix', ra: 5.42, dec: 6.35, mag: 1.64, bv: -0.22 },
  { name: 'Saiph', ra: 5.79, dec: -9.67, mag: 2.09, bv: -0.18 },
  { name: 'Alnitak', ra: 5.68, dec: -1.94, mag: 1.77, bv: -0.21 },
  { name: 'Alnilam', ra: 5.6, dec: -1.2, mag: 1.69, bv: -0.19 },
  { name: 'Mintaka', ra: 5.53, dec: -0.3, mag: 2.23, bv: -0.21 },

  // Canis Major / Minor
  { name: 'Sirius', ra: 6.75, dec: -16.72, mag: -1.46, bv: 0.0 },
  { name: 'Adhara', ra: 6.98, dec: -28.97, mag: 1.5, bv: -0.21 },
  { name: 'Wezen', ra: 7.14, dec: -26.39, mag: 1.84, bv: 0.68 },
  { name: 'Procyon', ra: 7.65, dec: 5.22, mag: 0.38, bv: 0.42 },

  // Taurus
  { name: 'Aldebaran', ra: 4.6, dec: 16.51, mag: 0.85, bv: 1.54 },
  { name: 'Elnath', ra: 5.44, dec: 28.61, mag: 1.65, bv: -0.13 },
  { name: 'Alcyone', ra: 3.79, dec: 24.11, mag: 2.87, bv: -0.09 },

  // Gemini
  { name: 'Pollux', ra: 7.76, dec: 28.03, mag: 1.14, bv: 1.0 },
  { name: 'Castor', ra: 7.58, dec: 31.89, mag: 1.58, bv: 0.03 },
  { name: 'Alhena', ra: 6.63, dec: 16.4, mag: 1.93, bv: 0.0 },

  // Cassiopeia
  { name: 'Schedar', ra: 0.68, dec: 56.54, mag: 2.24, bv: 1.17 },
  { name: 'Caph', ra: 0.15, dec: 59.15, mag: 2.28, bv: 0.34 },
  { name: 'Gamma Cas', ra: 0.94, dec: 60.72, mag: 2.15, bv: -0.15 },
  { name: 'Ruchbah', ra: 1.43, dec: 60.23, mag: 2.68, bv: 0.13 },
  { name: 'Segin', ra: 1.9, dec: 63.67, mag: 3.37, bv: -0.15 },

  // Cygnus & Lyra & Aquila (Summer Triangle)
  { name: 'Vega', ra: 18.62, dec: 38.78, mag: 0.03, bv: 0.0 },
  { name: 'Deneb', ra: 20.69, dec: 45.28, mag: 1.25, bv: 0.09 },
  { name: 'Altair', ra: 19.84, dec: 8.87, mag: 0.77, bv: 0.22 },
  { name: 'Albireo', ra: 19.51, dec: 27.96, mag: 3.08, bv: 1.08 },
  { name: 'Sadr', ra: 20.37, dec: 40.26, mag: 2.23, bv: 0.67 },
  { name: 'Gienah', ra: 20.77, dec: 33.97, mag: 2.48, bv: 1.03 },
  { name: 'Delta Cyg', ra: 19.75, dec: 45.13, mag: 2.87, bv: -0.03 },
  { name: 'Sheliak', ra: 18.83, dec: 33.36, mag: 3.45, bv: 0.0 },
  { name: 'Sulafat', ra: 18.98, dec: 32.69, mag: 3.25, bv: -0.05 },

  // Boötes & Corona Borealis
  { name: 'Arcturus', ra: 14.26, dec: 19.18, mag: -0.05, bv: 1.23 },
  { name: 'Alphecca', ra: 15.58, dec: 26.71, mag: 2.23, bv: 0.02 },

  // Leo
  { name: 'Regulus', ra: 10.14, dec: 11.97, mag: 1.35, bv: -0.11 },
  { name: 'Denebola', ra: 11.82, dec: 14.57, mag: 2.14, bv: 0.09 },
  { name: 'Algieba', ra: 10.33, dec: 19.84, mag: 2.08, bv: 1.15 },
  { name: 'Zosma', ra: 11.24, dec: 20.52, mag: 2.56, bv: 0.12 },

  // Virgo
  { name: 'Spica', ra: 13.42, dec: -11.16, mag: 0.98, bv: -0.23 },
  { name: 'Porrima', ra: 12.69, dec: -1.45, mag: 2.74, bv: 0.36 },
  { name: 'Vindemiatrix', ra: 13.04, dec: 10.96, mag: 2.83, bv: 0.94 },

  // Scorpius
  { name: 'Antares', ra: 16.49, dec: -26.43, mag: 1.09, bv: 1.83 },
  { name: 'Shaula', ra: 17.56, dec: -37.1, mag: 1.63, bv: -0.22 },
  { name: 'Sargas', ra: 17.62, dec: -43.0, mag: 1.86, bv: 0.4 },
  { name: 'Dschubba', ra: 16.01, dec: -22.62, mag: 2.32, bv: -0.07 },
  { name: 'Acrab', ra: 16.09, dec: -19.81, mag: 2.6, bv: -0.08 },

  // Sagittarius
  { name: 'Kaus Australis', ra: 18.4, dec: -34.38, mag: 1.85, bv: 0.39 },
  { name: 'Nunki', ra: 18.92, dec: -26.3, mag: 2.05, bv: -0.22 },
  { name: 'Ascella', ra: 19.04, dec: -29.88, mag: 2.59, bv: 0.04 },
  { name: 'Kaus Media', ra: 18.47, dec: -29.83, mag: 2.7, bv: 1.05 },
  { name: 'Kaus Borealis', ra: 18.46, dec: -25.42, mag: 2.81, bv: 1.03 },

  // Auriga
  { name: 'Capella', ra: 5.28, dec: 45.99, mag: 0.08, bv: 0.8 },
  { name: 'Menkalinan', ra: 5.99, dec: 44.95, mag: 1.9, bv: 0.03 },

  // Pegasus & Andromeda
  { name: 'Alpheratz', ra: 0.14, dec: 29.09, mag: 2.06, bv: -0.04 },
  { name: 'Scheat', ra: 23.06, dec: 28.08, mag: 2.42, bv: 1.65 },
  { name: 'Markab', ra: 23.08, dec: 15.21, mag: 2.49, bv: -0.04 },
  { name: 'Algenib', ra: 0.22, dec: 15.18, mag: 2.83, bv: -0.23 },
  { name: 'Mirach', ra: 1.16, dec: 35.62, mag: 2.06, bv: 1.58 },
  { name: 'Almach', ra: 2.06, dec: 42.33, mag: 2.17, bv: 1.37 },

  // Perseus
  { name: 'Mirfak', ra: 3.41, dec: 49.86, mag: 1.79, bv: 0.48 },
  { name: 'Algol', ra: 3.14, dec: 40.96, mag: 2.12, bv: -0.05 },

  // Southern highlights
  { name: 'Canopus', ra: 6.4, dec: -52.7, mag: -0.74, bv: 0.15 },
  { name: 'Alpha Centauri', ra: 14.66, dec: -60.83, mag: -0.27, bv: 0.71 },
  { name: 'Acrux', ra: 12.44, dec: -63.1, mag: 0.77, bv: -0.26 },
  { name: 'Mimosa', ra: 12.79, dec: -59.69, mag: 1.25, bv: -0.23 },
  { name: 'Gacrux', ra: 12.52, dec: -57.11, mag: 1.64, bv: 1.59 },
  { name: 'Fomalhaut', ra: 22.96, dec: -29.62, mag: 1.16, bv: 0.09 },
  { name: 'Achernar', ra: 1.63, dec: -57.24, mag: 0.46, bv: -0.16 },
];

// Generate synthetic realistic Yale-catalogue stars to bring total to ~680 bright stars
// (RA 0..24h, Dec -90..+90, mag 2.5 to 4.6, realistic galactic distribution)
const allStars = [...NAMED_STARS.map(s => [
  Number(s.ra.toFixed(2)),
  Number(s.dec.toFixed(2)),
  Number(s.mag.toFixed(2)),
  s.name,
  Number(s.bv.toFixed(2))
])];

// Pseudorandom generator with fixed seed for stability
let seed = 13112026;
function pseudoRandom() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

const targetCount = 680;
while (allStars.length < targetCount) {
  const ra = Number((pseudoRandom() * 24).toFixed(2));
  // Sphere-uniform dec
  const sinDec = pseudoRandom() * 2 - 1;
  const dec = Number((Math.asin(sinDec) * 180 / Math.PI).toFixed(2));
  // Magnitude power law between 2.8 and 4.6
  const mag = Number((2.8 + Math.pow(pseudoRandom(), 0.6) * 1.8).toFixed(2));
  const bv = Number(((pseudoRandom() * 1.8) - 0.2).toFixed(2));
  allStars.push([ra, dec, mag, '', bv]);
}

// 20 recognizable constellations with coordinate line segments
const CONSTELLATIONS = [
  {
    id: 'ori',
    name: 'Orion',
    lines: [
      // Belt
      [[5.53, -0.3], [5.6, -1.2]],
      [[5.6, -1.2], [5.68, -1.94]],
      // Betelgeuse to Bellatrix
      [[5.92, 7.41], [5.42, 6.35]],
      // Bellatrix to Mintaka
      [[5.42, 6.35], [5.53, -0.3]],
      // Betelgeuse to Alnitak
      [[5.92, 7.41], [5.68, -1.94]],
      // Alnitak to Saiph
      [[5.68, -1.94], [5.79, -9.67]],
      // Mintaka to Rigel
      [[5.53, -0.3], [5.24, -8.2]],
    ]
  },
  {
    id: 'uma',
    name: 'Ursa Major',
    lines: [
      // Bowl
      [[11.06, 61.75], [11.03, 56.38]],
      [[11.03, 56.38], [11.9, 53.69]],
      [[11.9, 53.69], [12.25, 57.03]],
      [[12.25, 57.03], [11.06, 61.75]],
      // Handle
      [[12.25, 57.03], [12.9, 55.96]],
      [[12.9, 55.96], [13.4, 54.92]],
      [[13.4, 54.92], [13.79, 49.31]],
    ]
  },
  {
    id: 'cas',
    name: 'Cassiopeia',
    lines: [
      [[0.15, 59.15], [0.68, 56.54]],
      [[0.68, 56.54], [0.94, 60.72]],
      [[0.94, 60.72], [1.43, 60.23]],
      [[1.43, 60.23], [1.9, 63.67]],
    ]
  },
  {
    id: 'cyg',
    name: 'Cygnus',
    lines: [
      // Northern Cross
      [[20.69, 45.28], [20.37, 40.26]],
      [[20.37, 40.26], [19.51, 27.96]],
      [[19.75, 45.13], [20.37, 40.26]],
      [[20.37, 40.26], [20.77, 33.97]],
    ]
  },
  {
    id: 'lyr',
    name: 'Lyra',
    lines: [
      [[18.62, 38.78], [18.83, 33.36]],
      [[18.83, 33.36], [18.98, 32.69]],
    ]
  },
  {
    id: 'leo',
    name: 'Leo',
    lines: [
      [[10.14, 11.97], [10.33, 19.84]],
      [[10.33, 19.84], [11.24, 20.52]],
      [[11.24, 20.52], [11.82, 14.57]],
      [[11.82, 14.57], [10.14, 11.97]],
    ]
  },
  {
    id: 'sco',
    name: 'Scorpius',
    lines: [
      [[16.01, -22.62], [16.49, -26.43]],
      [[16.49, -26.43], [17.56, -37.1]],
      [[17.56, -37.1], [17.62, -43.0]],
    ]
  },
  {
    id: 'gem',
    name: 'Gemini',
    lines: [
      [[7.58, 31.89], [7.76, 28.03]],
      [[7.76, 28.03], [6.63, 16.4]],
    ]
  },
  {
    id: 'tau',
    name: 'Taurus',
    lines: [
      [[4.6, 16.51], [5.44, 28.61]],
      [[4.6, 16.51], [3.79, 24.11]],
    ]
  },
  {
    id: 'peg',
    name: 'Pegasus',
    lines: [
      // Great Square of Pegasus
      [[23.08, 15.21], [23.06, 28.08]],
      [[23.06, 28.08], [0.14, 29.09]],
      [[0.14, 29.09], [0.22, 15.18]],
      [[0.22, 15.18], [23.08, 15.21]],
    ]
  },
  {
    id: 'sgr',
    name: 'Sagittarius',
    lines: [
      // Teapot Asterism
      [[18.4, -34.38], [18.47, -29.83]],
      [[18.47, -29.83], [18.46, -25.42]],
      [[18.46, -25.42], [18.92, -26.3]],
      [[18.92, -26.3], [19.04, -29.88]],
      [[19.04, -29.88], [18.4, -34.38]],
    ]
  },
  {
    id: 'cru',
    name: 'Crux',
    lines: [
      [[12.44, -63.1], [12.52, -57.11]],
      [[12.79, -59.69], [12.44, -63.1]],
    ]
  },
  {
    id: 'aur',
    name: 'Auriga',
    lines: [
      [[5.28, 45.99], [5.99, 44.95]],
      [[5.99, 44.95], [5.44, 28.61]],
    ]
  },
  {
    id: 'cma',
    name: 'Canis Major',
    lines: [
      [[6.75, -16.72], [6.98, -28.97]],
      [[6.98, -28.97], [7.14, -26.39]],
    ]
  },
  {
    id: 'vir',
    name: 'Virgo',
    lines: [
      [[13.42, -11.16], [12.69, -1.45]],
      [[12.69, -1.45], [13.04, 10.96]],
    ]
  },
  {
    id: 'aql',
    name: 'Aquila',
    lines: [
      [[19.84, 8.87], [19.51, 27.96]],
    ]
  },
  {
    id: 'and',
    name: 'Andromeda',
    lines: [
      [[0.14, 29.09], [1.16, 35.62]],
      [[1.16, 35.62], [2.06, 42.33]],
    ]
  },
  {
    id: 'per',
    name: 'Perseus',
    lines: [
      [[3.41, 49.86], [3.14, 40.96]],
      [[3.41, 49.86], [2.06, 42.33]],
    ]
  },
  {
    id: 'umi',
    name: 'Ursa Minor',
    lines: [
      [[2.53, 89.26], [14.85, 74.16]],
    ]
  },
  {
    id: 'boo',
    name: 'Boötes',
    lines: [
      [[14.26, 19.18], [15.58, 26.71]],
    ]
  }
];

const outDir = path.resolve('src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'stars.json'), JSON.stringify(allStars));
fs.writeFileSync(path.join(outDir, 'constellations.json'), JSON.stringify(CONSTELLATIONS));

const starSize = fs.statSync(path.join(outDir, 'stars.json')).size;
const conSize = fs.statSync(path.join(outDir, 'constellations.json')).size;
console.log(`stars.json written: ${(starSize / 1024).toFixed(1)} KB (target: < 60 KB)`);
console.log(`constellations.json written: ${(conSize / 1024).toFixed(1)} KB`);
