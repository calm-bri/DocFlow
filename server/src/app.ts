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

const clientUrl = process.env.CLIENT_URL || '*';

app.use(
  cors({
    origin: clientUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRouter);

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

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`DocFlow HTTP & Socket.IO Server running at port ${port}`);
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
