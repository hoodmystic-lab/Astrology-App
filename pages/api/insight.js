// pages/api/insight.js
import {
  planetLongitudes,
  signFromLongitude,
  nakshatraFromSiderealLongitude,
  PLANETS
} from '../../lib/astro';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  try {
    const system = (req.query.system === 'tropical') ? 'tropical' : 'sidereal';
    const debug = req.query.debug === '1';

    const now = new Date();
    const longs = planetLongitudes(now, system);

    // Build per-planet lines + optional debug payload
    const lines = [];
    const debugData = {};
    for (const p of PLANETS) {
      const L = longs[p];
      if (!Number.isFinite(L)) {
        throw new Error(`NaN/inf for ${p} (system=${system})`);
      }
      const s = signFromLongitude(L);
      const n = system === 'sidereal' ? nakshatraFromSiderealLongitude(L) : null;

      lines.push(`${p}: ${s.sign} ${s.degreeInSign.toFixed(1)}°${n ? `, ${n.name}` : ''}`);
      debugData[p] = { longitude: L, sign: s, nakshatra: n };
    }

    const baseMsg = `Today (${system}): ${lines.join('; ')}.`;

    // Debug mode: return raw numbers to help diagnose
    if (debug) {
      return res.status(200).json({
        message: baseMsg,
        system,
        data: debugData
      });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(200).json({
        message: `${baseMsg} (No OPENAI_API_KEY set; showing summary only.)`
      });
    }

    const prompt = `Write a gentle, Pattern-style 2–3 sentence reflection based on: ${baseMsg}
Avoid predictions. Use present-focused language.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* leave as text */ }

    if (!response.ok) {
      const detail = data?.error?.message || data?.message || text?.slice(0, 200) || 'unknown error';
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
