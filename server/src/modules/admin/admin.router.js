import { Router } from 'express';
import {
  getAdminDashboardStats,
  getReviewableUploads,
  reviewUpload,
  getReviewableCorrections,
  reviewCorrection,
  archiveQuestionPaper,
  getAuditLogs,
  assignAdminRole,
  getAdminUsersList,
  createDeptAdmin,
  getDeptAdminsList,
  verifyDeptAdmin,
} from './admin.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/role.js';

const router = Router();

// Public verification for Dept Admins
router.post('/verify-dept-admin', verifyDeptAdmin);

// Apply auth and requireAdmin to all subsequent admin endpoints
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getAdminDashboardStats);
router.get('/uploads', getReviewableUploads);
router.post('/uploads/:id/review', reviewUpload);
router.get('/correction-requests', getReviewableCorrections);
router.post('/correction-requests/:id/review', reviewCorrection);
router.post('/questions/:id/archive', archiveQuestionPaper);
router.get('/audit-logs', getAuditLogs);

// Super Admin Only
router.get('/users', requireSuperAdmin, getAdminUsersList);
router.post('/assign-role', requireSuperAdmin, assignAdminRole);
router.get('/dept-admins', requireSuperAdmin, getDeptAdminsList);
router.post('/dept-admins', requireSuperAdmin, createDeptAdmin);

export default router;
