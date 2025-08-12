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

// Normalize 0..360
function norm360(x){ return ((x % 360) + 360) % 360; }

// ~Lahiri ayanamsa (deg). Good enough for v1; can swap for precise tables later.
export function lahiriAyanamsa(date = new Date()){
  const y = date.getUTCFullYear();
  const base = 24.102; // ~2025
  const driftPerYear = 50.290966/3600; // deg/year
  return base + (y - 2025) * driftPerYear;
}

// Apparent ecliptic longitude (deg)
export function eclipticLongitude(body, date){
  const ecl = Astro.Ecliptic(
    Astro.Equator(body, date, Astro.EquatorEpoch.OfDate, Astro.Aberration.Correct)
  );
  return norm360(ecl.elon);
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

// Helper: for a given system, compute sign; for nakshatra, always use sidereal base
export function describePlanet(date = new Date(), system = 'sidereal', planet){
  const ay = lahiriAyanamsa(date);
  const body = Astro.Body[planet];
  const L_trop = eclipticLongitude(body, date);
  const L_sys = system === 'sidereal' ? norm360(L_trop - ay) : L_trop;

  const sign = signFromLongitude(L_sys);
  const siderealL = norm360(L_trop - ay);
  const nak = nakshatraFromSiderealLongitude(siderealL);

  return { planet, longitude: L_sys, sign, nakshatra: nak };
}
