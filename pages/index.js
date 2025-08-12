// pages/index.js
import { useEffect, useState } from 'react';

export default function Home() {
  const [system, setSystem] = useState('sidereal');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setLoading(true);
      setErr('');
      const res = await fetch(`/api/insight?system=${system}`);
      const j = await res.json();
      setMessage(j?.message ?? '(no message)');
    } catch (e) {
      console.error(e);
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [system]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 800, margin: '0 auto' }}>
      <h1>Astrology App 🌌</h1>

      <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        System:
        <select value={system} onChange={e => setSystem(e.target.value)}>
          <option value="sidereal">Sidereal</option>
          <option value="tropical">Tropical</option>
        </select>
      </label>

      <button
        onClick={load}
        style={{ marginLeft: 12, padding: '6px 12px', cursor: 'pointer' }}
        disabled={loading}
      >
        {loading ? 'Loading…' : 'Refresh'}
      </button>

      {err && <p style={{ color: 'crimson', marginTop: 16 }}>Error: {err}</p>}

      <div style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.06))'
      }}>
        {loading ? <p>Loading…</p> : <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>}
      </div>

      <p style={{ marginTop: 16 }}>
        API: <a href={`/api/insight?system=${system}`}>/api/insight?system={system}</a>
      </p>
    </main>
  );
}
