import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/case').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(setData).catch(() => setError('Local session expired. Reopen Migration OS from the agent.')); }, []);
  if (error) return <main><h1>Migration OS</h1><p>{error}</p></main>;
  if (!data) return <main><h1>Migration OS</h1><p>Loading private case…</p></main>;
  return <main><header><p className="eyebrow">LOCAL · READ ONLY</p><h1>{data.case_id}</h1><p>{data.case_status} · {data.phase}</p></header><section><h2>Case location</h2><p>{data.case_path}</p></section><section><h2>Next safe step</h2><p>Use the agent to refresh sources, prepare work, or request a consent-safe external action.</p></section><footer>Local session only. No cloud sync, forms, evidence files, or edit controls.</footer></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
