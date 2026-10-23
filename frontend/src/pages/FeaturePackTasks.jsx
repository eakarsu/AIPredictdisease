import React, { useCallback, useEffect, useState } from 'react';

const AI_FEATURES = [
  { path: 'outbreak-operations-summary', label: 'Outbreak operations summary' },
  { path: 'resource-allocation-priorities', label: 'Resource allocation priorities' },
  { path: 'surveillance-completeness-check', label: 'Surveillance completeness check' },
];
const DISCLAIMER = 'Operational planning only. This is not a diagnosis, clinical assessment, or medical advice; consult qualified public-health and clinical professionals.';

function fmt(v) {
  if (v === false) return 'false';
  if (v === 0) return '0';
  if (v === '' || v === null || v === undefined) return '(empty)';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

async function fpFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/feature-pack${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : res.text();
}

export default function FeaturePackTasks() {
  const [tasks, setTasks] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      const out = await fpFetch(`/tasks?${params.toString()}`);
      setTasks(Array.isArray(out.data) ? out.data : []);
      setError('');
    } catch (e) { setError(String(e.message || e)); }
  }, [q, status]);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    try { await fpFetch('/tasks', { method: 'POST', body: JSON.stringify({ title }) }); setTitle(''); await load(); }
    catch (err) { setError(String(err.message || err)); }
  };

  const toggle = async (t) => {
    try { await fpFetch(`/tasks/${t.id}`, { method: 'PUT', body: JSON.stringify({ status: t.status === 'done' ? 'open' : 'done', completed: t.status !== 'done' }) }); await load(); }
    catch (err) { setError(String(err.message || err)); }
  };

  const download = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/feature-pack/tasks/export?format=${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `export.${format}`; a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) { setError(String(err.message || err)); }
  };

  const runAi = async (f) => {
    try { setAiResult(await fpFetch(`/ai/${f.path}`, { method: 'POST', body: JSON.stringify({}) })); }
    catch (err) { setError(String(err.message || err)); }
  };

  return (
    <div>
      <h2>Operations tasks</h2>
      {DISCLAIMER ? <p>{DISCLAIMER}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <section aria-label="Search and filter">
        <h3>Search and filter</h3>
        <label>Search <input aria-label="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label>Status <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option><option value="open">open</option><option value="done">done</option>
        </select></label>
      </section>
      <section aria-label="Tasks">
        <h3>Tasks</h3>
        {tasks.length === 0 ? <p>No tasks found.</p> : (
          <ul>{tasks.map((t) => (
            <li key={t.id}>
              <span>Title: {fmt(t.title)}</span>{' '}
              <span>Status: {fmt(t.status)}</span>{' '}
              <span>Priority: {fmt(t.priority)}</span>{' '}
              <span>Completed: {fmt(t.completed)}</span>{' '}
              <span>Value: {fmt(t.value)}</span>{' '}
              <button type="button" onClick={() => toggle(t)}>{t.status === 'done' ? 'Reopen' : 'Mark done'}</button>
            </li>))}
          </ul>)}
      </section>
      <section aria-label="Create task">
        <h3>Create task</h3>
        <form onSubmit={create}>
          <label>Title <input aria-label="New task title" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <button type="submit">Create task</button>
        </form>
      </section>
      <section aria-label="Export">
        <h3>Export</h3>
        <button type="button" onClick={() => download('csv')}>Export CSV</button>
        <button type="button" onClick={() => download('json')}>Export JSON</button>
      </section>
      <section aria-label="AI features">
        <h3>AI features</h3>
        {AI_FEATURES.map((f) => <button key={f.path} type="button" onClick={() => runAi(f)}>{f.label}</button>)}
        {aiResult ? (
          <div>
            <p>Feature: {fmt(aiResult.feature)}</p>
            <p>AI generated: {fmt(aiResult.aiGenerated)}</p>
            <p>Provider: {fmt(aiResult.provider)}</p>
            {aiResult.disclaimer ? <p>Disclaimer: {fmt(aiResult.disclaimer)}</p> : null}
            {(aiResult.sections || []).map((s) => (
              <section key={s.label}><h4>{s.label}</h4><pre>{fmt(s.value)}</pre></section>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
