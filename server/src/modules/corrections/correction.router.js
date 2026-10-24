import { Router } from 'express';
import { submitCorrectionRequest, getMyCorrections } from './correction.controller.js';
import { authenticateToken, requireEduMail } from '../../middleware/auth.js';
import { uploadMiddleware } from '../../services/storage.js';

const router = Router();

router.post(
  '/',
  authenticateToken,
  requireEduMail,
  uploadMiddleware.single('file'),
  submitCorrectionRequest
);

router.get('/my', authenticateToken, getMyCorrections);

export default router;
