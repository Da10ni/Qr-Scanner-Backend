import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import User from './models/User.js';
import feedbackRouter from './routes/feedback.js';
import authRouter from './routes/auth.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (/^https:\/\/qr-scanner-frontend.*\.vercel\.app$/.test(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '64kb' }));

app.get('/', (_req, res) => {
  res.json({
    name: 'QR Feedback API',
    status: 'ok',
    endpoints: {
      'GET  /api/health': 'health check',
      'POST /api/feedback': 'submit feedback (public)',
      'POST /api/auth/login': 'admin login → { token }',
      'GET  /api/feedback': 'list all (Bearer token)',
      'DELETE /api/feedback/:id': 'delete one (Bearer token)'
    },
    frontend: 'http://localhost:5173'
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/feedback', feedbackRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

async function ensureAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const existing = await User.findOne({ username });
  if (existing) return;
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  await User.create({ username, passwordHash, role: 'admin' });
  console.log(`✓ Default admin "${username}" created on first boot.`);
}

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    await ensureAdmin();
    app.listen(PORT, () => console.log(`✓ API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
})();
