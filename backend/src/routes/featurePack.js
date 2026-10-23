import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fp = require('../featurePackCore.cjs');
const DISCLAIMER = "Operational planning only. This is not a diagnosis, clinical assessment, or medical advice; consult qualified public-health and clinical professionals.";
function createFeaturePackRouter() {
  const router = express.Router(); const store = fp.createTaskStore();
  const userId = (req) => (req.user && (req.user.id ?? req.user.userId)) ?? '';
  router.get('/tasks', (req,res) => res.json({ data: store.list(userId(req), req.query), total: store.list(userId(req), req.query).length }));
  router.get('/tasks/export', (req,res) => { const out = fp.exportRecords(store.list(userId(req), req.query), req.query.format || 'json'); res.setHeader('Content-Type', out.contentType); res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`); res.send(out.body); });
  router.get('/search', (req,res) => res.json({ data: store.list(userId(req), req.query) }));
  router.post('/tasks', (req,res) => { try { res.status(201).json(store.create(userId(req), req.body || {})); } catch(e) { res.status(400).json({ error: e.code || 'title_required' }); } });
  router.put('/tasks/:id', (req,res) => { try { const t = store.update(userId(req), req.params.id, req.body || {}); if (!t) return res.status(404).json({ error: 'task_not_found' }); res.json(t); } catch(e) { res.status(400).json({ error: e.code || 'title_required' }); } });
  router.post('/ai/outbreak-operations-summary', async (req,res) => { const records = Array.isArray(req.body && req.body.records) ? req.body.records : store.all(userId(req)); const out = await fp.runAi({ feature:'outbreak-operations-summary', label:'Outbreak operations summary', records, disclaimer: DISCLAIMER, buildFallback: () => fp.fallbackResult('outbreak-operations-summary','Outbreak operations summary', records, [{ label:'Focus field', value:'status' }], DISCLAIMER) }); res.json(out); });
  router.post('/ai/resource-allocation-priorities', async (req,res) => { const records = Array.isArray(req.body && req.body.records) ? req.body.records : store.all(userId(req)); const out = await fp.runAi({ feature:'resource-allocation-priorities', label:'Resource allocation priorities', records, disclaimer: DISCLAIMER, buildFallback: () => fp.fallbackResult('resource-allocation-priorities','Resource allocation priorities', records, [{ label:'Focus field', value:'priority' }], DISCLAIMER) }); res.json(out); });
  router.post('/ai/surveillance-completeness-check', async (req,res) => { const records = Array.isArray(req.body && req.body.records) ? req.body.records : store.all(userId(req)); const out = await fp.runAi({ feature:'surveillance-completeness-check', label:'Surveillance completeness check', records, disclaimer: DISCLAIMER, buildFallback: () => fp.fallbackResult('surveillance-completeness-check','Surveillance completeness check', records, [{ label:'Focus field', value:'status' }], DISCLAIMER) }); res.json(out); });
  return router;
}
export default createFeaturePackRouter;
