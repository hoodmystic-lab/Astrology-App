// Serverless endpoint: summarizes today's sky + (optionally) calls OpenAI for a Pattern-like note.
// Set OPENAI_API_KEY in your Vercel Project Settings > Environment Variables.
export const config = { runtime: 'nodejs' };

import { planetLongitudes, signFromLongitude, lahiriAyanamsa, nakshatraFromSiderealLongitude, PLANETS } from '../../lib/astro';

export default async function handler(req, res){
  try{
    const now = new Date();
    const longs = planetLongitudes(now, 'sidereal'); // base summary in sidereal
    const ay = lahiriAyanamsa(now);

    const lines = PLANETS.map(p=>{
      const Lsid = longs[p];
      const sign = signFromLongitude(Lsid);
      const nak = nakshatraFromSiderealLongitude(Lsid);
      return `${p}: ${sign.sign} ${sign.degreeInSign.toFixed(1)}°, ${nak.name}`;
    }).join('; ');

    const baseMsg = `Today (sidereal): ${lines}.`;

    const hasKey = !!process.env.OPENAI_API_KEY;
    if(!hasKey){
      return res.status(200).json({
        message: `${baseMsg} (Add OPENAI_API_KEY for AI-generated insight.)`
      });
    }

    // Minimal OpenAI fetch (no SDK)
    const prompt = `Write a gentle, Pattern-style 2–3 sentence reflection based on: ${baseMsg}
Avoid predictions. Use present-focused language.`;

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{role:"user", content: prompt}],
        temperature: 0.7
      })
    }).then(r=>r.json());

    const ai = completion?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ message: ai || baseMsg });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
}
export const config = { runtime: 'nodejs' };  // <- ensure Node runtime

import { planetLongitudes, signFromLongitude, lahiriAyanamsa,
         nakshatraFromSiderealLongitude, PLANETS } from '../../lib/astro';

export default async function handler(req, res){
  try{
    const now = new Date();
    const longs = planetLongitudes(now, 'sidereal');
    const lines = PLANETS.map(p=>{
      const Lsid = longs[p];
      const sign = signFromLongitude(Lsid);
      const nak = nakshatraFromSiderealLongitude(Lsid);
      return `${p}: ${sign.sign} ${sign.degreeInSign.toFixed(1)}°, ${nak.name}`;
    }).join('; ');

    const baseMsg = `Today (sidereal): ${lines}.`;

    if(!process.env.OPENAI_API_KEY){
      return res.status(200).json({ message: `${baseMsg} (Add OPENAI_API_KEY for AI insight.)` });
    }

    const prompt = `Write a gentle, Pattern-style 2–3 sentence reflection based on: ${baseMsg}
Avoid predictions. Use present-focused language.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{role:"user", content: prompt}], temperature: 0.7 })
    });
    const j = await r.json();
    return res.status(200).json({ message: j?.choices?.[0]?.message?.content?.trim() || baseMsg });
  }catch(err){
    return res.status(500).json({ error: err.message });
  }
}

