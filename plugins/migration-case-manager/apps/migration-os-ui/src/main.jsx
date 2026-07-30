import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const labels = {requirements: 'Route graph & source freshness', documents: 'Documents', actions: 'Readiness & consent queue', timeline: 'Timeline', appointments: 'Appointments', landing: 'Landing board', decisions: 'Decisions & consent'};
function Card({item, onAccept}) { return <article><h3>{item.id} · {item.title}</h3><dl>{Object.entries(item.fields).map(([key, value]) => <React.Fragment key={key}><dt>{key}</dt><dd>{value}</dd></React.Fragment>)}</dl>{item.id.startsWith('DEC-') && item.fields.Status === 'proposed' && <button onClick={() => onAccept(item)}>Accept this scoped decision</button>}</article> }
function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [objective, setObjective] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  useEffect(() => { fetch('/api/data').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(setData).catch(() => setError('Local session expired. Reopen Migration OS from the agent.')); }, []);
  if (error) return <main><h1>Migration OS</h1><p>{error}</p></main>;
  if (!data) return <main><h1>Migration OS</h1><p>Loading private case…</p></main>;
  const {case: current, collections} = data;
  const submit = async (event) => { event.preventDefault(); const response = await fetch('/api/requests', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({type:'agent_research', objective})}); setRequestStatus(response.ok ? 'Request queued. It does not authorize an external action.' : 'Could not queue request.'); if (response.ok) setObjective(''); };
  const accept = async (item) => { if (!window.confirm(`Accept this exact scope?\n\n${item.fields.Scope}`)) return; const response = await fetch('/api/decisions/accept', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:item.id, confirm:true})}); if (response.ok) setData(await response.json()); else setRequestStatus('Could not accept the decision.'); };
  return <main><header><p className="eyebrow">LOCAL · READ ONLY</p><h1>{current.case_id}</h1><p>{current.case_status} · {current.phase}</p></header><section><h2>Ask the agent</h2><form onSubmit={submit}><input value={objective} onChange={e=>setObjective(e.target.value)} minLength="3" maxLength="500" placeholder="e.g. Compare certified translators in Tbilisi"/><button disabled={!objective.trim()}>Queue request</button></form><p>{requestStatus || 'Requests prepare work only. Booking, payment, submission, and disclosure still need confirmation.'}</p></section><section><h2>Next safe step</h2><p>Use the agent to refresh sources, prepare work, or request a consent-safe external action.</p></section>{Object.entries(collections).map(([name, items]) => <section key={name}><h2>{labels[name]}</h2>{items.length ? items.map(item => <Card key={item.id} item={item} onAccept={accept}/>) : <p>No records.</p>}</section>)}<footer>Local session only. No cloud sync, forms, evidence files, or edit controls.</footer></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
