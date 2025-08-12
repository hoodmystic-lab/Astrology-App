export default function Home() {
  return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',fontFamily:'system-ui'}}>
      <div style={{textAlign:'center'}}>
        <h1>Next.js is live ✅</h1>
        <p>Home renders without server errors.</p>
        <p>API test: <a href="/api/insight">/api/insight</a></p>
      </div>
    </div>
  );
}
