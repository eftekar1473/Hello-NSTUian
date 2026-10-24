import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRouter from './modules/auth/auth.router.js';
import departmentRouter from './modules/departments/department.router.js';
import questionRouter from './modules/questions/question.router.js';
import uploadRouter from './modules/uploads/upload.router.js';
import correctionRouter from './modules/corrections/correction.router.js';
import adminRouter from './modules/admin/admin.router.js';

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Hello NSTUian API', timestamp: new Date() });
});

// 404 Handler
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
