import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/api';
import { authMiddleware } from './server/auth';
import { getDb } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Initialize DB and pre-seed
  getDb();

  // Basic production hardening. The app is same-origin; do not enable broad CORS.
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; script-src 'self'; connect-src 'self'");
    }
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Small in-process guard for credential endpoints. For horizontally scaled
  // production deployments this should be replaced by a shared edge/Redis
  // limiter, but it prevents unbounded brute force in the supplied server.
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  app.use('/api/auth', (req, res, next) => {
    if (!['/login', '/register', '/forgot-password', '/reset-password'].includes(req.path) || req.method !== 'POST') return next();
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = loginAttempts.get(key);
    if (!entry || entry.resetAt <= now) {
      loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
      return next();
    }
    entry.count += 1;
    if (entry.count > 20) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    }
    return next();
  });

  // Attach auth extraction
  app.use(authMiddleware);

  // Mount API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'MockMaster API', timestamp: new Date().toISOString() });
  });

  app.use('/api', (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API request failed:', err);
    if (res.headersSent) return;
    if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
      return res.status(400).json({ success: false, error: 'Request body must be valid JSON.' });
    }
    res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
  });

  if (!isProduction) {
    // Dev mode: use Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MockMaster server running locally at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
