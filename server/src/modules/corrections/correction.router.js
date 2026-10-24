import { Router } from 'express';
import { submitCorrectionRequest, getMyCorrections } from './correction.controller.js';
import { optionalAuth, authenticateToken } from '../../middleware/auth.js';
import { uploadMiddleware } from '../../services/storage.js';

const router = Router();

// ANY user can request corrections! Optional auth captures profile if logged in
router.post(
  '/',
  optionalAuth,
  uploadMiddleware.single('file'),
  submitCorrectionRequest
);

router.get('/my', authenticateToken, getMyCorrections);

export default router;
