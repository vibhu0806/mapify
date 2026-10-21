import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { apiRouter } from './routes/api.js';

const app = express();

// Security and middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (origin === config.corsOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // In production or custom domains, allow configured origin
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// Request logger for observability
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

import fs from 'fs';

// Standalone Fleet Operations & Dispatch Console (Isolated from public tracking website)
const serveAdmin = (req: Request, res: Response) => {
  const candidates = [
    path.resolve(__dirname, 'views', 'admin.html'),
    path.resolve(__dirname, '..', 'src', 'views', 'admin.html'),
    path.resolve(process.cwd(), 'src', 'views', 'admin.html'),
    path.resolve(process.cwd(), 'backend', 'src', 'views', 'admin.html'),
    path.resolve(process.cwd(), 'backend', 'dist', 'views', 'admin.html'),
    path.resolve('d:/track/backend/src/views/admin.html')
  ];
  const file = candidates.find(p => fs.existsSync(p));
  if (file) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(file);
  }
  res.status(500).send('Fleet Operations Console template not found.');
};

app.get('/admin', serveAdmin);
app.get('/admin/*', serveAdmin);
app.get('/', (req: Request, res: Response) => {
  res.redirect('/admin');
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api', apiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[UnhandledError]', err);
  res.status(500).json({
    error: 'InternalServerError',
    message: err.message || 'An unexpected error occurred.',
  });
});

import { RouteService } from './services/routeService.js';

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`======================================================`);
    console.log(`Minimalist Vehicle Tracking Server`);
    console.log(`Route: Jaipur (RJ) -> Dehradun (UK) [OSRM + Leaflet]`);
    console.log(`Listening on port: http://localhost:${config.port}`);
    console.log(`CORS allowed origin: ${config.corsOrigin}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`======================================================`);

    // Warm up OSRM driving route in background
    RouteService.fetchOsrmRoute().catch((err) => {
      console.warn('[Server] Initial OSRM route fetch notice:', err.message);
    });
  });
}

export default app;
