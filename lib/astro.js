// lib/astro.js
import * as Astro from 'astronomy-engine';

// ---- Config / constants ----
export const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
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

// JS API uses booleans, not enums:
// Equator(body, date, observer|null, ofdate:boolean, aberration:boolean)
function eclipticLongitude(body, date){
  const equ = Astro.Equator(body, date, /*observer*/ null, /*ofdate*/ true, /*aberration*/ true);
  const ecl = Astro.Ecliptic(equ);
  return norm360(ecl.elon);
}

// ~Lahiri ayanāṃśa (approx) — good for v1; can swap for precise tables later.
export function lahiriAyanamsa(date = new Date()){
  const y = date.getUTCFullYear();
  const base = 24.102;                 // ≈ degrees around year 2025
  const driftPerYear = 50.290966/3600; // deg/year
  return base + (y - 2025) * driftPerYear;
}

// Tropical or Sidereal (Lahiri) longitudes for 7 visible planets
export function planetLongitudes(date = new Date(), system = 'sidereal'){
  const ay = system === 'sidereal' ? lahiriAyanamsa(date) : 0;
  const map = {};
  for(const p of PLANETS){
    const body = Astro.Body[p];
    const L = eclipticLongitude(body, date);
    map[p] = norm360(L - ay);
  }
  return map;
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
