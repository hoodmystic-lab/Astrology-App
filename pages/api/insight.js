// pages/api/insight.js
import {
  planetLongitudes,
  signFromLongitude,
  lahiriAyanamsa,
  nakshatraFromSiderealLongitude,
  PLANETS
} from '../../lib/astro';

// Use Node runtime; define this ONCE.
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  try {
    const now = new Date();
    const longs = planetLongitudes(now, 'sidereal');

    const lines = PLANETS
      .map(p => {
        const Lsid = longs[p];
        const sign = signFromLongitude(Lsid);
        const nak = nakshatraFromSiderealLongitude(Lsid);
        return `${p}: ${sign.sign} ${sign.degreeInSign.toFixed(1)}°, ${nak.name}`;
      })
      .join('; ');

    const baseMsg = `Today (sidereal): ${lines}.`;

    // If you haven't set OPENAI_API_KEY in Vercel → Project Settings → Environment Variables,
    // return the non‑AI summary.
    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(200)
        .json({ message: `${baseMsg} (Add OPENAI_API_KEY for AI insight.)` });
    }

    // Minimal call to OpenAI (no SDK)
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
    // Return a friendly message instead of crashing the function.
    return res.status(200).json({ message: `Insight error: ${err.message}` });
  }
}
