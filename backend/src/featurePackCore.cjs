'use strict';
// Feature-pack core: tasks store, search/filter, export, deterministic AI fallback.
// Provider is used ONLY when OPENROUTER_API_KEY or OPENAI_API_KEY is set; otherwise
// a labelled deterministic fallback is returned with aiGenerated:false.
function hasProviderKey(env = process.env) { return Boolean(env.OPENROUTER_API_KEY || env.OPENAI_API_KEY); }
function normaliseTask(input = {}, userId) {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) { const e = new Error('title_required'); e.code = 'title_required'; throw e; }
  const now = new Date().toISOString();
  return { id: input.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ownerId: String(userId ?? ''), title,
    description: input.description ?? '', status: input.status ?? 'open', priority: input.priority ?? 'medium',
    category: input.category ?? '', dueDate: input.dueDate ?? null, completed: input.completed ?? false,
    value: input.value ?? 0, createdAt: input.createdAt || now, updatedAt: now };
}
function createTaskStore() { const byId = new Map();
  return {
    create(userId, input) { const t = normaliseTask(input, userId); byId.set(t.id, t); return { ...t }; },
    list(userId, query = {}) { return filterRecords([...byId.values()].filter(t => t.ownerId === String(userId ?? '')), query).map(t => ({ ...t })); },
    update(userId, id, patch = {}) { const t = byId.get(String(id)); if (!t || t.ownerId !== String(userId ?? '')) return null;
      const next = { ...t, ...patch, id: t.id, ownerId: t.ownerId, updatedAt: new Date().toISOString() };
      if (patch.title !== undefined && !String(patch.title).trim()) { const e = new Error('title_required'); e.code = 'title_required'; throw e; }
      byId.set(t.id, next); return { ...next }; },
    all(userId) { return [...byId.values()].filter(t => t.ownerId === String(userId ?? '')).map(t => ({ ...t })); } };
}
function filterRecords(records = [], query = {}) {
  const q = String(query.q || query.search || '').trim().toLowerCase();
  return records.filter(r => {
    if (q && !JSON.stringify(r).toLowerCase().includes(q)) return false;
    if (query.status && String(r.status ?? '') !== String(query.status)) return false;
    if (query.priority && String(r.priority ?? '') !== String(query.priority)) return false;
    if (query.category && String(r.category ?? '') !== String(query.category)) return false;
    return true; });
}
function csvCell(v) { if (v === null || v === undefined) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function toCSV(records = []) { if (!records.length) return 'id,title,description,status,priority,category,completed,value\n';
  const keys = Object.keys(records[0]); return [keys.join(','), ...records.map(r => keys.map(k => csvCell(r[k])).join(','))].join('\n') + '\n'; }
function exportRecords(records = [], format = 'json') {
  if (String(format).toLowerCase() === 'csv') return { contentType: 'text/csv', filename: 'export.csv', body: toCSV(records) };
  return { contentType: 'application/json', filename: 'export.json', body: JSON.stringify(records, null, 2) }; }
function countBy(records = [], field) { const out = {}; for (const r of records) { const k = String(r[field] ?? ''); out[k] = (out[k] || 0) + 1; } return out; }
function fallbackResult(feature, label, records = [], extraSections = [], disclaimer) {
  const total = records.length;
  const completed = records.filter(r => ['done', 'completed', 'closed'].includes(String(r.status || '').toLowerCase()) || r.completed === true).length;
  const result = { feature, label, aiGenerated: false, provider: 'deterministic-fallback',
    sections: [ { label: 'Total records', value: total }, { label: 'Completed records', value: completed },
      { label: 'Open records', value: total - completed }, { label: 'Records', value: records },
      { label: 'Status breakdown', value: countBy(records, 'status') }, ...extraSections ],
    metrics: { total, completed, open: total - completed } };
  if (disclaimer) result.disclaimer = disclaimer;
  return result; }
async function runAi({ feature, label, records = [], env = process.env, fetchImpl, buildFallback, disclaimer }) {
  const fallback = buildFallback();
  if (!hasProviderKey(env)) return fallback;
  try {
    const useOpenRouter = Boolean(env.OPENROUTER_API_KEY);
    const url = useOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const key = useOpenRouter ? env.OPENROUTER_API_KEY : env.OPENAI_API_KEY;
    const model = env.OPENROUTER_MODEL || env.OPENAI_MODEL || (useOpenRouter ? 'anthropic/claude-haiku-4.5' : 'gpt-4o-mini');
    const doFetch = fetchImpl || globalThis.fetch;
    if (typeof doFetch !== 'function') return fallback;
    const res = await doFetch(url, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: `${label}: analyse these operational records (no diagnosis claims): ${JSON.stringify(records).slice(0, 4000)}` }], max_tokens: 600 }) });
    const data = await res.json(); const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!res.ok || !text) return fallback;
    const out = { feature, label, aiGenerated: true, provider: useOpenRouter ? 'openrouter' : 'openai',
      sections: [{ label: 'AI summary', value: String(text) }, { label: 'Total records', value: records.length }, { label: 'Records', value: records }],
      metrics: fallback.metrics }; if (disclaimer) out.disclaimer = disclaimer; return out;
  } catch { return fallback; } }
module.exports = { hasProviderKey, createTaskStore, filterRecords, toCSV, exportRecords, countBy, fallbackResult, runAi };
