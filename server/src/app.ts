import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { initSocketServer } from './socket';

dotenv.config({ path: '../.env' });
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Dynamic CORS origin handler supporting Vercel previews, production, and custom CLIENT_URL
export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // Server-to-server, health check, Postman, etc.
  const cleanOrigin = origin.replace(/\/$/, '');

  const rawClientUrl = process.env.CLIENT_URL || '';
  if (rawClientUrl === '*') return true;
  if (rawClientUrl) {
    const origins = rawClientUrl.split(',').map((u) => u.trim().replace(/\/$/, ''));
    if (origins.includes(cleanOrigin)) return true;
  }

  // Permit any Vercel deployment (previews + production) and local development
  if (
    /^https:\/\/.*\.vercel\.app$/.test(cleanOrigin) ||
    /^http:\/\/localhost(:\d+)?$/.test(cleanOrigin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)
  ) {
    return true;
  }

  return true; // Permissive fallback for public demo API
};

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'x-user-id'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRouter);

// Root status endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'DocFlow API Server',
    status: 'online',
    health: '/health',
    api: '/api',
    endpoints: {
      users: '/api/users',
      documents: '/api/documents',
      health: '/health',
    },
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.IO real-time server
export const io = initSocketServer(server);

export default app;
export { server };

import { bootstrapDatabase } from './services/dbBootstrap';

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, async () => {
    console.log(`DocFlow HTTP & Socket.IO Server running at port ${port}`);
    // Run self-healing schema creation & seed check
    await bootstrapDatabase();
  });

  // Graceful Shutdown Handling
  const shutdown = () => {
    console.log('SIGTERM/SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
