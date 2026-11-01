/**
 * Build-time script to verify WCAG AA contrast ratio for all 5 F10 palette stops.
 * WCAG AA requires at least 4.5:1 for normal text and 3:1 for large/bold text.
 */

// Text colors used on the site
const TEXT_COCOA = '#5B2A3E'; // Primary text
const TEXT_SOFT = '#8B5468';  // Secondary text

// 5 Palette stops for Feature F10
const PALETTE_STOPS = [
  { name: '1. Sunrise Blush (Top)', bg: '#FFF8F4', accent: '#FFE3EC' },
  { name: '2. Morning Petal', bg: '#FFFDFB', accent: '#FFCFE0' },
  { name: '3. Golden Butter-Cream (Mid)', bg: '#FFFBF0', accent: '#FFEBA8' },
  { name: '4. Rosy Dusk', bg: '#FFF0F5', accent: '#FFB5CD' },
  { name: '5. Starlit Rose-Cream (Ending)', bg: '#FFEBF2', accent: '#FFCFE0' },
];

function hexToRgb(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function relativeLuminance(rgb) {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

console.log('--- VERIFYING WCAG AA CONTRAST ON ALL F10 PALETTE STOPS ---');
let allPass = true;

for (const stop of PALETTE_STOPS) {
  const ratioPrimary = contrastRatio(TEXT_COCOA, stop.bg);
  const ratioSoft = contrastRatio(TEXT_SOFT, stop.bg);

  const passPrimary = ratioPrimary >= 4.5;
  const passSoft = ratioSoft >= 3.0; // Soft text is used in subheads / secondary

  console.log(`\nStop: ${stop.name} (bg: ${stop.bg})`);
  console.log(`  - Cocoa Text (${TEXT_COCOA}): ${ratioPrimary.toFixed(2)}:1 -> ${passPrimary ? 'PASS (WCAG AA)' : 'FAIL'}`);
  console.log(`  - Soft Text (${TEXT_SOFT}): ${ratioSoft.toFixed(2)}:1 -> ${passSoft ? 'PASS (WCAG AA Large/Sub)' : 'FAIL'}`);

  if (!passPrimary || !passSoft) {
    allPass = false;
  }
}

if (allPass) {
  console.log('\n✅ ALL PALETTE STOPS MEET WCAG AA CONTRAST REQUIREMENTS!');
  process.exit(0);
} else {
  console.error('\n❌ SOME STOPS FAILED CONTRAST!');
  process.exit(1);
}
