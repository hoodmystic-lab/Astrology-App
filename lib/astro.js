// lib/astro.js
import * as Astro from 'astronomy-engine';

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

// lib/astro.js (only the helper below needs to change)

function norm360(x){ return ((x % 360) + 360) % 360; }

// Geocentric ecliptic longitude for a given body name and Date.
function eclipticLongitude(bodyName, date){
  // Use a neutral topocentric observer at (lat 0, lon 0, elev 0).
  // This avoids the “Observer must be an instance” errors and works for Sun/Moon/planets.
  const obs = new Astro.Observer(0, 0, 0);

  // Equator(bodyName, date, observer, ofdate:boolean, aberration:boolean)
  const equ = Astro.Equator(bodyName, date, obs, true, true);

  // Convert equatorial (RA/Dec) to ecliptic (elon/lat)
  const ecl = Astro.Ecliptic(equ);

  return norm360(ecl.elon);
}

export function planetLongitudes(date = new Date(), system = 'sidereal'){
  const ay = system === 'sidereal' ? lahiriAyanamsa(date) : 0;
  const map = {};
  for (const p of PLANETS){
    const L = eclipticLongitude(p, date);   // pass "Sun", "Moon", "Mars", ...
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
