import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRouter from './modules/auth/auth.router.js';
import departmentRouter from './modules/departments/department.router.js';
import questionRouter from './modules/questions/question.router.js';
import uploadRouter from './modules/uploads/upload.router.js';
import correctionRouter from './modules/corrections/correction.router.js';
import adminRouter from './modules/admin/admin.router.js';
import { prisma } from './services/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

export const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for sensitive operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too Many Requests', message: 'Too many requests, please try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Too Many Requests', message: 'Upload rate limit exceeded. Please wait before uploading again.' },
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/departments', departmentRouter);
app.use('/api/v1', questionRouter);
app.use('/api/v1/uploads', uploadLimiter, uploadRouter);
app.use('/api/v1/correction-requests', correctionRouter);
app.use('/api/v1/admin', adminRouter);

// Serve uploaded storage files & public assets
app.use('/storage', express.static(path.resolve(__dirname, '../storage/uploads')));
app.use(express.static(path.resolve(__dirname, '../../client/public')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
    dbError = err.message;
  }
  res.json({
    status: 'ok',
    service: 'Hello NSTUian API',
    version: '1.0.2',
    db: {
      status: dbStatus,
      error: dbError,
      has_database_url: Boolean(process.env.DATABASE_URL),
    },
    timestamp: new Date(),
  });
});

// Serve frontend static assets if client build exists
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Client-side SPA routing fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Friendly root route when backend is visited directly without client build
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Hello NSTUian API',
      message: 'Hello NSTUian Academic Question Bank API is live and operational.',
      version: '1.0.2',
      endpoints: {
        health: '/api/health',
        departments: '/api/v1/departments',
        auth: '/api/v1/auth',
        uploads: '/api/v1/uploads',
        admin: '/api/v1/admin',
      },
    });
  });
}

// 404 Handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});
