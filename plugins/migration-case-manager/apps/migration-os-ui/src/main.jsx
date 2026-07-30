import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const labels = {requirements: 'Route graph & source freshness', documents: 'Documents', actions: 'Readiness & consent queue', timeline: 'Timeline', appointments: 'Appointments', landing: 'Landing board'};
function Card({item}) { return <article><h3>{item.id} · {item.title}</h3><dl>{Object.entries(item.fields).map(([key, value]) => <React.Fragment key={key}><dt>{key}</dt><dd>{value}</dd></React.Fragment>)}</dl></article> }
function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/data').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(setData).catch(() => setError('Local session expired. Reopen Migration OS from the agent.')); }, []);
  if (error) return <main><h1>Migration OS</h1><p>{error}</p></main>;
  if (!data) return <main><h1>Migration OS</h1><p>Loading private case…</p></main>;
  const {case: current, collections} = data;
  return <main><header><p className="eyebrow">LOCAL · READ ONLY</p><h1>{current.case_id}</h1><p>{current.case_status} · {current.phase}</p></header><section><h2>Next safe step</h2><p>Use the agent to refresh sources, prepare work, or request a consent-safe external action.</p></section>{Object.entries(collections).map(([name, items]) => <section key={name}><h2>{labels[name]}</h2>{items.length ? items.map(item => <Card key={item.id} item={item}/>) : <p>No records.</p>}</section>)}<footer>Local session only. No cloud sync, forms, evidence files, or edit controls.</footer></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
