// pages/api/insight.js
import {
  planetLongitudes,
  signFromLongitude,
  lahiriAyanamsa,
  nakshatraFromSiderealLongitude,
  PLANETS
} from '../../lib/astro';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  try {
    const system = (req.query.system === 'tropical') ? 'tropical' : 'sidereal';
    const now = new Date();
    const longs = planetLongitudes(now, system);

    const lines = PLANETS.map(p => {
      const L = longs[p];
      const s = signFromLongitude(L);
      // Nakshatras only make sense for sidereal
      const n = system === 'sidereal'
        ? `, ${nakshatraFromSiderealLongitude(L).name}`
        : '';
      return `${p}: ${s.sign} ${s.degreeInSign.toFixed(1)}°${n}`;
    }).join('; ');

    const baseMsg = `Today (${system}): ${lines}.`;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        message: `${baseMsg} (Add OPENAI_API_KEY in Vercel → Settings → Environment Variables for AI insight.)`
      });
    }

    const prompt = `Write a gentle, Pattern-style 2–3 sentence reflection based on: ${baseMsg}
Avoid predictions. Use present-focused language.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const j = await r.json();
    const ai = j?.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ message: ai || baseMsg });
  } catch (err) {
    return res.status(200).json({ message: `Insight error: ${err.message}` });
  }
}
