import { Router } from 'express';
import { submitUpload, getMyUploads } from './upload.controller.js';
import { optionalAuth, authenticateToken } from '../../middleware/auth.js';
import { uploadMiddleware } from '../../services/storage.js';

const router = Router();

// ANY user can contribute questions! Optional auth captures profile if logged in
router.post(
  '/',
  optionalAuth,
  uploadMiddleware.single('file'),
  submitUpload
);

router.get('/my', authenticateToken, getMyUploads);

export default router;
