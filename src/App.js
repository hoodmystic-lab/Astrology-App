import { useEffect, useState } from 'react';
export default function Home(){
  const [ready, setReady] = useState(false);
  useEffect(()=> setReady(true), []);
  if(!ready) return null; // avoid SSR/runtime issues
  // ...existing page code here...
}
