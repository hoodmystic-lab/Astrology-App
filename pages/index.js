import { useEffect, useMemo, useState } from 'react';
import { PLANETS, planetLongitudes, signFromLongitude, lahiriAyanamsa, nakshatraFromSiderealLongitude } from '../lib/astro';

export default function Home(){
  const [system, setSystem] = useState('sidereal'); // 'sidereal' | 'tropical'
  const [now, setNow] = useState(new Date());
  const [feed, setFeed] = useState([]);

  // compute positions
  const data = useMemo(()=>{
    const longs = planetLongitudes(now, system);
    const ay = lahiriAyanamsa(now);
    const rows = PLANETS.map(p=>{
      const Lsys = longs[p];
      const sign = signFromLongitude(Lsys);

      // Nakshatra always from sidereal long:
      // If we are already sidereal, use Lsys; if tropical, convert first.
      const siderealL = system === 'sidereal' ? Lsys : ((Lsys - lahiriAyanamsa(now)) + 360) % 360;
      const nak = nakshatraFromSiderealLongitude(siderealL);

      return {
        planet: p,
        longitude: Lsys,
        sign,
        nakshatra: nak
      };
    });
    return rows;
  }, [now, system]);

  useEffect(()=>{
    const raw = localStorage.getItem('feed') || '[]';
    setFeed(JSON.parse(raw));
  }, []);

  function addPost(){
    const text = prompt('Write a short insight to share:');
    if(!text) return;
    const color = prompt('Pick a background hex (e.g. #223355) or leave blank:', '') || '';
    const post = {
      id: Date.now(),
      text,
      color,
      ts: new Date().toISOString(),
      likes: 0
    };
    const next = [post, ...feed];
    setFeed(next);
    localStorage.setItem('feed', JSON.stringify(next));
  }

  function like(id){
    const next = feed.map(p => p.id===id ? {...p, likes: p.likes+1} : p);
    setFeed(next);
    localStorage.setItem('feed', JSON.stringify(next));
  }

  async function getAIInsight(){
    try{
      const res = await fetch('/api/insight', {method:'POST'});
      const json = await res.json();
      alert(json.message || 'No message');
    }catch(e){
      alert('Insight error: ' + e.message);
    }
  }

  return (
    <div style={{minHeight:'100vh', background:'#0a0b10', color:'#ecf0ff', fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Inter'}}>
      <div style={{maxWidth:1100, margin:'0 auto', padding:24}}>
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <h1 style={{fontSize:20, margin:0}}>Astro Patterns — Sidereal/Tropical + Nakshatras</h1>
          <div>
            <select value={system} onChange={e=>setSystem(e.target.value)} style={sel}>
              <option value="sidereal">Sidereal (Lahiri)</option>
              <option value="tropical">Tropical</option>
            </select>
            <button onClick={()=>setNow(new Date())} style={btn}>Refresh Now</button>
            <button onClick={getAIInsight} style={btn}>Daily AI Insight</button>
            <button onClick={addPost} style={btnPrimary}>Share Insight</button>
          </div>
        </header>

        <div style={card}>
          <h3 style={{marginTop:0}}>Today’s Positions ({system})</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
            {data.map(row=>(
              <div key={row.planet} style={miniCard}>
                <div style={{opacity:.75, fontSize:12}}>{row.planet}</div>
                <div style={{fontSize:16}}>
                  {row.sign.sign} <span style={{opacity:.75}}>{row.sign.degreeInSign.toFixed(2)}°</span>
                </div>
                <div style={{fontSize:13, opacity:.9}}>Nakshatra: <b>{row.nakshatra.name}</b> ({row.nakshatra.degreeInNak.toFixed(2)}°)</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10, fontSize:12, opacity:.7}}>
            * Nakshatras computed from sidereal longitude using an approximate Lahiri ayanāṃśa for v1.
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16}}>
          <div style={card}>
            <h3 style={{marginTop:0}}>Pattern‑Style Feed (local)</h3>
            <div style={{display:'grid', gap:12}}>
              {feed.length === 0 && <div style={{opacity:.7}}>No posts yet. Click “Share Insight”.</div>}
              {feed.map(p=>(
                <div key={p.id} style={{
                  border:'1px solid #1b2230', borderRadius:12, padding:14,
                  background: p.color ? `linear-gradient(180deg, ${p.color}, #0a0b10)` : '#0b0e15'
                }}>
                  <div style={{fontSize:14, lineHeight:1.4}}>{p.text}</div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:12, opacity:.75, marginTop:8}}>
                    <span>{new Date(p.ts).toLocaleString()}</span>
                    <span>
                      <button onClick={()=>like(p.id)} style={chip}>♥ {p.likes}</button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10, fontSize:12, opacity:.7}}>
              For real multi‑user likes/replies later, we’ll connect Supabase.
            </div>
          </div>

          <div style={card}>
            <h3 style={{marginTop:0}}>What’s Next</h3>
            <ul style={{marginTop:8, lineHeight:1.6}}>
              <li>Birth data input → personal lensing</li>
              <li>Supabase tables: posts, likes, replies, profiles</li>
              <li>Moderation + image gradient generator</li>
              <li>Citations + correspondences browser from your canon</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const btn = { marginLeft:8, background:'#102243', border:'1px solid #1b3b7a', color:'#ecf0ff', padding:'8px 12px', borderRadius:8, cursor:'pointer' };
const btnPrimary = { ...btn, background:'#0b2a6b', border:'1px solid #1b56c7' };
const sel = { ...btn, padding:'8px 10px' };
const card = { background:'linear-gradient(180deg,#0d1018,#0b0e15)', border:'1px solid #1b2230', borderRadius:12, padding:16 };
const miniCard = { background:'#0c1220', border:'1px solid #182133', borderRadius:10, padding:12 };
const chip = { background:'#0d1424', border:'1px solid #1e2b45', color:'#ecf0ff', padding:'6px 10px', borderRadius:999, cursor:'pointer' };

}
/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
const App = dynamic(() => import('../src/App'), { ssr: false });
export default function Index(){ return <App/>; }

// Prevent static optimization so Next.js doesn't prerender or export this page.
export async function getServerSideProps() {
  return { props: {} };
}


