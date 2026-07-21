import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pool, { initDatabase, seedDatabase } from './db.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '../../.env') });

async function run() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true' || process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('set ALLOW_DESTRUCTIVE_SEED=true and ALLOW_DEMO_SEED=true to seed demo data explicitly');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('demo seeding is prohibited in production');
  }
  await initDatabase();
  await seedDatabase();
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error('Seed failed:', error.message);
    await pool.end().catch(() => {});
    process.exitCode = 1;
  });
