// pages/api/insight.js
// pages/api/insight.js
import {
  planetLongitudes,
  signFromLongitude,
  lahiriAyanamsa,               // <- this now exists
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
      const n = system === 'sidereal'
        ? `, ${nakshatraFromSiderealLongitude(L).name}`
        : '';
      return `${p}: ${s.sign} ${s.degreeInSign.toFixed(1)}°${n}`;
    }).join('; ');

    const baseMsg = `Today (${system}): ${lines}.`;

    // If there is no key, just return the summary (no errors).
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(200).json({
        message: `${baseMsg} (No OPENAI_API_KEY set; showing summary only.)`
      });
    }

    // Call OpenAI with strong error handling
    const prompt = `Write a gentle, Pattern-style 2–3 sentence reflection based on: ${baseMsg}
Avoid predictions. Use present-focused language.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Try a modern model first; fall back if your account/model isn't enabled.
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* leave as text */ }

    if (!response.ok) {
      const detail =
        data?.error?.message ||
        data?.message ||
        text?.slice(0, 200) ||
        'unknown error';
      return res.status(200).json({
        message: `${baseMsg} (AI error ${response.status}: ${detail})`
      });
    }

    const ai = data?.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ message: ai || baseMsg });
  } catch (e) {
    const desc = (e && typeof e === 'object' && 'message' in e) ? e.message : String(e);
    return res.status(200).json({ message: `Insight error: ${desc}` });
  }
}
