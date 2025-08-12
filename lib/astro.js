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

function norm360(x){ return ((x % 360) + 360) % 360; }

// Equator(body, date, observer|undefined, ofdate:boolean, aberration:boolean)
function eclipticLongitude(body, date){
  // Neutral topocentric observer at the equator (lat 0, lon 0, elev 0).
  const obs = new Astro.Observer(0, 0, 0);
  const equ = Astro.Equator(body, date, obs, true, true);
  const ecl = Astro.Ecliptic(equ);
  return ((ecl.elon % 360) + 360) % 360;
}



// Approx Lahiri ayanamsa
export function lahiriAyanamsa(date = new Date()){
  const y = date.getUTCFullYear();
  const base = 24.102;                 // ~2025
  const driftPerYear = 50.290966/3600; // deg/year
  return base + (y - 2025) * driftPerYear;
}

export function planetLongitudes(date = new Date(), system = 'sidereal'){
  const ay = system === 'sidereal' ? lahiriAyanamsa(date) : 0;
  const map = {};
  for(const p of PLANETS){
    const L = eclipticLongitude(Astro.Body[p], date);
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
  const size = 13 + 20/60; // 13°20'
  const idx = Math.floor(norm360(siderealLongDeg)/size);
  const start = idx * size;
  const degIn = norm360(siderealLongDeg) - start;
  return { name: NAKSHATRAS[idx], index: idx, degreeInNak: degIn };
}
