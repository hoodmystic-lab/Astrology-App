// pages/index.js
import { useState, useEffect } from 'react';

export default function Home() {
  const [data, setData] = useState(null);
  const [system, setSystem] = useState('sidereal');

  useEffect(() => {
    fetch(`/api/insight?system=${system}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error(err));
  }, [system]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Astrology App 🌌</h1>

      <label>
        System:
        <select
          value={system}
          onChange={e => setSystem(e.target.value)}
          style={{ marginLeft: '0.5rem' }}
        >
          <option value="sidereal">Sidereal</option>
          <option value="tropical">Tropical</option>
        </select>
      </label>

      {data ? (
        <div style={{ marginTop: '2rem' }}>
          {Object.entries(data).map(([planet, details]) => (
            <div key={planet}>
              <strong>{planet}</strong>: {details.sign} – {details.degreeInSign.toFixed(2)}°
              {details.nakshatra && (
                <> – Nakshatra: {details.nakshatra}</>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
