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

// Return *geocentric* ecliptic longitude in degrees for requested body.
function eclipticLongitude(bodyName, date){
  if (bodyName === 'Sun') {
    // Geocentric Sun longitude = Earth's heliocentric longitude + 180°
    const earthHelio = Astro.HeliocentricLongitude('Earth', date);
    return norm360(earthHelio + 180);
  }
  // Moon and planets are fine via the library helper
  return Astro.EclipticLongitude(bodyName, date);
}

}

// Approximate Lahiri ayanāṃśa (coarse but fine for v1)
export function lahiriAyanamsa(date = new Date()){
  const y = date.getUTCFullYear();
  const base = 24.102;                 // ~2025
  const driftPerYear = 50.290966/3600; // deg/year
  return base + (y - 2025) * driftPerYear;
}

// Return longitudes in chosen system
export function planetLongitudes(date = new Date(), system = 'sidereal'){
  const ay = system === 'sidereal' ? lahiriAyanamsa(date) : 0;
  const map = {};
  for (const p of PLANETS){
    const L = eclipticLongitude(p, date); // <-- pass the string, e.g. "Mars"
    map[p] = norm360(L - ay);
  }
  return map;
}


export function signFromLongitude(longDeg){
  const idx = Math.floor(norm360(longDeg) / 30);
  const degIn = norm360(longDeg) - idx * 30;
  return { sign: SIGNS[idx], index: idx, degreeInSign: degIn };
}

export function nakshatraFromSiderealLongitude(siderealLongDeg){
  const size = 13 + 20/60; // 13°20'
  const idx = Math.floor(norm360(siderealLongDeg) / size);
  const start = idx * size;
  const degIn = norm360(siderealLongDeg) - start;
  return { name: NAKSHATRAS[idx], index: idx, degreeInNak: degIn };
}
