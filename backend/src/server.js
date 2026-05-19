import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pool, { initDatabase, seedDatabase } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import { createCrudRouter } from './routes/crud.js';
import customViewsRouter from './routes/customViews.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Protected routes
app.use('/api/outbreaks', authenticateToken, createCrudRouter('disease_outbreaks', [
  'disease_name', 'location', 'region', 'severity', 'cases_reported', 'deaths',
  'status', 'start_date', 'end_date', 'description'
]));

app.use('/api/campaigns', authenticateToken, createCrudRouter('vaccination_campaigns', [
  'campaign_name', 'disease_target', 'region', 'start_date', 'end_date',
  'target_population', 'vaccinated_count', 'vaccine_type', 'status', 'budget', 'description'
]));

app.use('/api/risks', authenticateToken, createCrudRouter('regional_risks', [
  'region', 'country', 'risk_level', 'risk_score', 'population', 'healthcare_capacity',
  'primary_threats', 'last_outbreak_date', 'infrastructure_rating', 'notes'
]));

app.use('/api/reports', authenticateToken, createCrudRouter('surveillance_reports', [
  'report_title', 'disease', 'region', 'report_date', 'reporter', 'case_count',
  'trend', 'confidence_level', 'data_source', 'summary'
]));

app.use('/api/resources', authenticateToken, createCrudRouter('resource_allocations', [
  'resource_name', 'resource_type', 'allocated_to', 'region', 'quantity', 'unit',
  'status', 'priority', 'cost', 'allocation_date', 'notes'
]));

app.use('/api/alerts', authenticateToken, createCrudRouter('public_health_alerts', [
  'alert_title', 'alert_type', 'severity', 'region', 'disease', 'issued_date',
  'expiry_date', 'issued_by', 'status', 'message'
]));

app.use('/api/epidata', authenticateToken, createCrudRouter('epidemiological_data', [
  'disease', 'region', 'year', 'week_number', 'cases', 'deaths',
  'recovery_rate', 'transmission_rate', 'age_group', 'data_source'
]));

app.use('/api/inventory', authenticateToken, createCrudRouter('vaccine_inventory', [
  'vaccine_name', 'manufacturer', 'batch_number', 'quantity', 'storage_location',
  'storage_temp', 'manufacture_date', 'expiry_date', 'status', 'unit_cost', 'notes'
]));

app.use('/api/facilities', authenticateToken, createCrudRouter('healthcare_facilities', [
  'facility_name', 'facility_type', 'region', 'address', 'capacity',
  'current_occupancy', 'icu_beds', 'ventilators', 'staff_count', 'contact_number', 'status'
]));

app.use('/api/ai', authenticateToken, aiRoutes);

// Custom Views (Risk Gauge + Family History Tree)
app.use('/api/custom-views', customViewsRouter);

// Population analytics (delegating to AI router which handles the /disease-prevalence subroute)
app.use('/api/analytics', authenticateToken, aiRoutes);

// Alert subscriber routes
app.post('/api/alert-subscribers', authenticateToken, async (req, res) => {
  try {
    const { region, disease, min_severity, email } = req.body;
    const result = await pool.query(
      'INSERT INTO alert_subscribers (user_id, region, disease, min_severity, email) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user?.id, region, disease, min_severity || 'medium', email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alert-subscribers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM alert_subscribers WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dispatch alert to matching subscribers (simulate email send)
app.post('/api/public-health-alerts/:id/dispatch', authenticateToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const alertResult = await pool.query('SELECT * FROM public_health_alerts WHERE id = $1', [alertId]);
    if (alertResult.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });

    const alert = alertResult.rows[0];
    const severityOrder = ['low', 'moderate', 'medium', 'high', 'critical'];
    const alertSevIdx = severityOrder.indexOf(alert.severity);

    const subscribers = await pool.query(`
      SELECT * FROM alert_subscribers
      WHERE (region IS NULL OR region ILIKE $1)
        AND (disease IS NULL OR disease ILIKE $2)
    `, [`%${alert.region || ''}%`, `%${alert.disease || ''}%`]);

    const dispatched = [];
    for (const sub of subscribers.rows) {
      const minSevIdx = severityOrder.indexOf(sub.min_severity || 'medium');
      if (alertSevIdx >= minSevIdx) {
        const dispatch = await pool.query(
          'INSERT INTO alert_dispatches (alert_id, subscriber_id, channel) VALUES ($1,$2,$3) RETURNING *',
          [alertId, sub.id, 'email']
        );
        dispatched.push({ subscriber: sub.email, dispatch: dispatch.rows[0] });
      }
    }

    res.json({
      alert_id: alertId,
      dispatched_count: dispatched.length,
      dispatches: dispatched,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const pool = (await import('./db.js')).default;
    const [outbreaks, campaigns, alerts, facilities] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'active') as active FROM disease_outbreaks"),
      pool.query("SELECT COUNT(*) as total, SUM(vaccinated_count) as total_vaccinated FROM vaccination_campaigns"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'active') as active FROM public_health_alerts"),
      pool.query("SELECT COUNT(*) as total, SUM(capacity) as total_capacity, SUM(current_occupancy) as total_occupancy FROM healthcare_facilities"),
    ]);

    res.json({
      outbreaks: outbreaks.rows[0],
      campaigns: campaigns.rows[0],
      alerts: alerts.rows[0],
      facilities: facilities.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let server;

async function start() {
  try {
    await initDatabase();
    await seedDatabase();
// === Custom Feature Mounts (batch_06) ===
import('./routes/customFeat01_AgenticDiseaseSurveillance.js').then(m => app.use('/api/cf-agentic-disease-surveillance', m.default)).catch(()=>{});
import('./routes/customFeat02_IndividualRiskDashboard.js').then(m => app.use('/api/cf-individual-risk-dashboard', m.default)).catch(()=>{});
import('./routes/customFeat03_TreatmentEfficacyTracking.js').then(m => app.use('/api/cf-treatment-efficacy-tracking', m.default)).catch(()=>{});
import('./routes/customFeat04_OutbreakSimulation.js').then(m => app.use('/api/cf-outbreak-simulation', m.default)).catch(()=>{});
import('./routes/customFeat05_TravelHealthRisk.js').then(m => app.use('/api/cf-travel-health-risk', m.default)).catch(()=>{});


// === Batch 06 Gaps & Frontend Mounts (ESM dynamic imports) ===
import('./routes/gapFeat_patients_without_comorbidity.js').then(m => app.use('/api/gap-patients-without-comorbidity', m.default)).catch(()=>{});
import('./routes/gapFeat_trends_without_seasonality.js').then(m => app.use('/api/gap-trends-without-seasonality', m.default)).catch(()=>{});
import('./routes/gapFeat_backend_collapses_to_crud_js.js').then(m => app.use('/api/gap-backend-collapses-to-crud-js', m.default)).catch(()=>{});
import('./routes/gapFeat_no_public_health_database_integration_cdc_who.js').then(m => app.use('/api/gap-no-public-health-database-integration-cdc-who', m.default)).catch(()=>{});
import('./routes/gapFeat_no_case_management_workflows.js').then(m => app.use('/api/gap-no-case-management-workflows', m.default)).catch(()=>{});
import('./routes/gapFeat_no_contact_tracing.js').then(m => app.use('/api/gap-no-contact-tracing', m.default)).catch(()=>{});
import('./routes/gapFeat_limited_population_health_analytics.js').then(m => app.use('/api/gap-limited-population-health-analytics', m.default)).catch(()=>{});
import('./routes/gapFeat_no_ehr_integration.js').then(m => app.use('/api/gap-no-ehr-integration', m.default)).catch(()=>{});
import('./routes/gapFeat_no_notifications_module_grep_0.js').then(m => app.use('/api/gap-no-notifications-module-grep-0', m.default)).catch(()=>{});
import('./routes/gapFeat_no_webhooks_for_outbreak_alerts.js').then(m => app.use('/api/gap-no-webhooks-for-outbreak-alerts', m.default)).catch(()=>{});
import('./routes/gapFeat_no_integration_with_clinical_systems.js').then(m => app.use('/api/gap-no-integration-with-clinical-systems', m.default)).catch(()=>{});

server = app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Retrying in 2s...`);
        setTimeout(() => {
          server.close();
          server = app.listen(PORT);
        }, 2000);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown for nodemon restart
process.on('SIGTERM', () => {
  if (server) server.close();
});
process.on('SIGINT', () => {
  if (server) server.close();
  process.exit(0);
});

start();
