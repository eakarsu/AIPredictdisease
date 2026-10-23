'use strict';
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
import test from 'node:test'; import assert from 'node:assert/strict';
import { createRequire } from 'module'; const require2 = createRequire(import.meta.url); const fp = require2('../src/featurePackCore.cjs'); fp.DISCLAIMER_UNDER_TEST = 'Operational planning only. This is not a diagnosis, clinical assessment, or medical advice; consult qualified public-health and clinical professionals.';
test('tasks create/list/update with owner isolation and title validation', () => {
  const s = fp.createTaskStore();
  const t = s.create('u1', { title: 'Alpha', status: 'open', priority: 'high', completed: false, value: 0 });
  assert.equal(t.completed, false); assert.equal(t.value, 0);
  assert.equal(s.list('u1', {}).length, 1); assert.equal(s.list('u2', {}).length, 0);
  assert.throws(() => s.create('u1', {}), /title_required/);
  const u = s.update('u1', t.id, { status: 'done' }); assert.equal(u.status, 'done');
  assert.equal(s.update('u2', t.id, { status: 'x' }), null);
});
test('search/filter on main list', () => {
  const rows = [{title:'Pump check',status:'open',priority:'high'},{title:'Filter wash',status:'done',priority:'low'}];
  assert.equal(fp.filterRecords(rows, {q:'pump'}).length, 1);
  assert.equal(fp.filterRecords(rows, {status:'done'}).length, 1);
  assert.equal(fp.filterRecords(rows, {q:''}).length, 2);
});
test('CSV/JSON export preserves false/0/empty', () => {
  const rows = [{id:'1',title:'',status:'open',completed:false,value:0}];
  const csv = fp.exportRecords(rows,'csv'); assert.match(csv.contentType,/csv/); assert.match(csv.body,/false/); assert.match(csv.body,/,0/);
  const js = JSON.parse(fp.exportRecords(rows,'json').body); assert.equal(js[0].completed,false); assert.equal(js[0].value,0); assert.equal(js[0].title,'');
  assert.equal(fp.exportRecords([],'csv').body.split('\n')[0].includes('title'), true);
});
test('AI fallback labelled, no provider call without key, preserves 0/empty', async () => {
  let called=false; const fetchImpl=async()=>{called=true; throw new Error('should not call');};
  const out = await fp.runAi({feature:'x',label:'X',records:[],env:{},fetchImpl, disclaimer: fp.DISCLAIMER_UNDER_TEST, buildFallback:()=>fp.fallbackResult('x','X',[],[],fp.DISCLAIMER_UNDER_TEST)});
  assert.equal(out.aiGenerated,false); assert.equal(out.provider,'deterministic-fallback'); assert.equal(called,false);
  assert.equal(out.metrics.total,0); assert.equal(out.sections.find(s=>s.label==='Total records').value,0);
  assert.deepEqual(out.sections.find(s=>s.label==='Records').value, []);
  assert.match(out.disclaimer, /not a diagnosis/); assert.doesNotMatch(JSON.stringify(out), /diagnos(is|e) (is|confirmed)/i);
});
test('AI provider path only with key and fake fetch', async () => {
  const fetchImpl=async()=>({ok:true,json:async()=>({choices:[{message:{content:'ok summary'}}]})});
  const out = await fp.runAi({feature:'x',label:'X',records:[{title:'a'}],env:{OPENROUTER_API_KEY:'test-key'},fetchImpl, buildFallback:()=>fp.fallbackResult('x','X',[{title:'a'}])});
  assert.equal(out.aiGenerated,true); assert.equal(out.provider,'openrouter');
});
