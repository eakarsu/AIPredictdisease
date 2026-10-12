import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = String(process.env.JWT_SECRET || '');
if (JWT_SECRET.length < 32 || /replace|change|example|generate|secret-key-2024/i.test(JWT_SECRET)) {
  throw new Error('JWT_SECRET must be a non-placeholder value of at least 32 characters.');
}

router.get('/demo-credentials', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found' });
  const address = req.socket.remoteAddress;
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return res.status(403).json({ error: 'Demo login is available only in the local workspace.' });
  const email = process.env.DEMO_EMAIL || process.env.PROVISION_ADMIN_EMAIL || process.env.DEFAULT_EMAIL;
  const password = process.env.DEMO_PASSWORD || process.env.PROVISION_ADMIN_PASSWORD || process.env.DEFAULT_PASSWORD;
  if (!email || !password) return res.status(503).json({ error: 'Demo credentials are not configured.' });
  res.set('Cache-Control', 'no-store');
  return res.json({ email, password });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Session user no longer exists' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Unable to verify persisted session' });
  }
});

export default router;
