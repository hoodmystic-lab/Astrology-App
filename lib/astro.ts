// lib/astro.ts
import * as Astro from 'astronomy-engine';

// ---- Config ----
export type CoordSystem = 'tropical' | 'sidereal';
export const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'] as const;
export type Planet = typeof PLANETS[number];

export const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
] as const;

export const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha',
  'Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana',
  'Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
] as const;

// Simple Lahiri ayanāṃśa approximation (deg) for "today".
// Good enough for v1; we can swap in a precise table later.
export function lahiriAyanamsa(date: Date): number {
  // ~24.1° near 2025; drift ~50.3" per year.
  const y = date.getUTCFullYear();
  const base = 24.102; // degrees (approx around 2025)
  const driftPerYear = 50.290966/3600; // deg/year
  return base + (y - 2025) * driftPerYear;
}

// Normalize 0..360
function norm360(x: number) { return ((x % 360) + 360) % 360; }

// Ecliptic longitude (apparent) in degrees
export function eclipticLongitude(body: Astro.Body, date: Date): number {
  const ecl = Astro.Ecliptic(Astro.Equator(body, date, Astro.EquatorEpoch.OfDate, Astro.Aberration.Correct));
  return norm360(ecl.elon);
}

export type BodyMap = Record<Planet, number>;

export function planetLongitudes(date = new Date(), system: CoordSystem = 'sidereal'): BodyMap {
  const longs: Partial<BodyMap> = {};
  const ay = system === 'sidereal' ? lahiriAyanamsa(date) : 0;

  (PLANETS as Planet[]).forEach((p) => {
    const L = eclipticLongitude(Astro.Body[p as any], date);
    longs[p] = norm360(L - ay);
  });

  return longs as BodyMap;
}

export function signFromLongitude(longDeg: number): { sign: typeof SIGNS[number], degreeInSign: number, index: number } {
  const idx = Math.floor(norm360(longDeg) / 30);
  const degIn = norm360(longDeg) - idx * 30;
  return { sign: SIGNS[idx], degreeInSign: degIn, index: idx };
}

export function nakshatraFromLongitude(siderealLongDeg: number) {
  const size = 13 + 20/60; // 13°20' = 13.333...
  const idx = Math.floor(norm360(siderealLongDeg) / size);
  const start = idx * size;
  const degIn = norm360(siderealLongDeg) - start;
  return { name: NAKSHATRAS[idx], index: idx, degreeInNak: degIn };
}

// Summary for UI + AI prompt
export function summarize(date = new Date(), system: CoordSystem = 'sidereal') {
  const longs = planetLongitudes(date, system);
  const ay = lahiriAyanamsa(date);
  const lines: string[] = [];

  for (const p of PLANETS) {
    const L = longs[p];
    const s = signFromLongitude(L);
    // For nakshatra we need sidereal longitude:
    const siderealL = system === 'sidereal' ? L : norm360(eclipticLongitude(Astro.Body[p as any], date) - ay);
    const n = nakshatraFromLongitude(siderealL);

    lines.push(`${p}: ${s.sign} ${s.degreeInSign.toFixed
