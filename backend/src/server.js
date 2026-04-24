import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { initDatabase, seedDatabase } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import { createCrudRouter } from './routes/crud.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
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
