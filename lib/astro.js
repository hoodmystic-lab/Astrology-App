// lib/astro.js
import * as Astro from 'astronomy-engine';

/** Explicit map so we never pass an undefined body to Equator() */
const BODY = {
  Sun: Astro.Body.Sun,
  Moon: Astro.Body.Moon,
  Mercury: Astro.Body.Mercury,
  Venus: Astro.Body.Venus,
  Mars: Astro.Body.Mars,
  Jupiter: Astro.Body.Jupiter,
  Saturn: Astro.Body.Saturn
};

export const PLANETS = Object.keys(BODY); // ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']

export const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

export const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha',
  'Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana',
  'Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];

function norm360(x){ return ((x % 360) + 360) % 360; }

/** Geocentric ecliptic longitude for a named body. */
function eclipticLongitude(bodyName, date){
  const bodyEnum = BODY[bodyName];
  if (!bodyEnum) throw new Error(`Unknown body: ${bodyName}`);
  // neutral observer; swap for user lat/lon later
  const obs = new Astro.Observer(0, 0, 0);
  // Equator(bodyEnum, date, observer, ofDate, aberration)
  const equ = Astro.Equator(bodyEnum, date, obs, true, true);
  const ecl = Astro.Ecliptic(equ);
  const elon = ecl?.elon;
  if (!Number.isFinite(elon)) {
    throw new Error(`Non-finite longitude for ${bodyName}`);
  }
  return norm360(elon);
}

/** Approximate Lahiri ayanāṃśa (coarse but OK for v1) */
export function lahiriAyanamsa(date = new Date()){
  const y = date.getUTCFullYear();
  const base = 24.102;                 // ≈ around 2025
  const driftPerYear = 50.290966/3600; // deg/year
  return base + (y - 2025) * driftPerYear;
}

/** Planet longitudes in chosen system ('sidereal' or 'tropical') */
export function planetLongitudes(date = new Date(), system = 'sidereal'){
  const ay = system === 'sidereal' ? lahiriAyanamsa(date) : 0;
  const out = {};
  for (const name of PLANETS){
    const trop = eclipticLongitude(name, date);
    out[name] = norm360(trop - ay);
  }
  return out;
}

export function signFromLongitude(longDeg){
  const idx = Math.floor(norm360(longDeg)/30);
  const degIn = norm360(longDeg) - idx*30;
  return { sign: SIGNS[idx], index: idx, degreeInSign: degIn };
}

export function nakshatraFromSiderealLongitude(siderealLongDeg){
  const size = 13 + 20/60; // 13°20' = 13.333...
  const idx = Math.floor(norm360(siderealLongDeg)/size);
  const start = idx * size;
  const degIn = norm360(siderealLongDeg) - start;
  return { name: NAKSHATRAS[idx], index: idx, degreeInNak: degIn };
}
