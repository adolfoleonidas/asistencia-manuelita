import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import path from 'path';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for inline scripts in frontend HTML
  })
);

// HTTP request logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => (req as any).url === '/api/health' } }));

// Global rate limiter: 100 requests per 15 minutes per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas solicitudes, intenta más tarde' },
  })
);

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.resolve(__dirname, '../../frontend')));

// API routes
app.use('/api', apiRoutes);

// Fallback: serve frontend HTML for non-API routes
app.get('/admin', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../../frontend/admin.html'));
});

app.get('/marcar', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../../frontend/marcar.html'));
});

// Error handler
app.use(errorHandler);

export default app;
