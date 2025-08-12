# Astro Patterns (Sidereal/Tropical + Nakshatras)

- Next.js (pages/)
- Astronomy Engine to compute longitudes/signs
- Nakshatras (Lahiri, approximate)
- API `/api/insight` returns a short daily note (uses OPENAI_API_KEY if present)

## Deploy
1. Push to GitHub (via web editor is fine).
2. In Vercel, import this repo. Framework: **Next.js**. No special build settings.
3. Add Environment Variable (Project Settings → Env Vars):
   - `OPENAI_API_KEY` = `sk-...` (optional; without it you still get a non-AI summary)

## Notes
- Feed is local-only (saved in the browser). To make it social, connect Supabase next.
