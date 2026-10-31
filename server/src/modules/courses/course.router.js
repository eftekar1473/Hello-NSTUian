import { Router } from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from './course.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/role.js';

const router = Router();

// Public / Scoped Course listing
router.get('/', (req, res, next) => {
  // Optional auth token to apply adminScope if present
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, () => {
      // If user is admin, attach adminScope
      const superAdminRole = req.user?.admin_permissions?.find((p) => p.role === 'SUPER_ADMIN');
      if (superAdminRole) {
        req.adminScope = { isSuperAdmin: true, departmentId: null };
      } else {
        const deptAdminRole = req.user?.admin_permissions?.find((p) => p.role === 'DEPARTMENT_ADMIN');
        if (deptAdminRole) {
          req.adminScope = { isSuperAdmin: false, departmentId: deptAdminRole.department_id };
        }
      }
      next();
    });
  }
  next();
}, getCourses);

// Public single course details
router.get('/:id', getCourseById);

// Admin-only course creation, editing, deletion
// Both SUPER_ADMIN and DEPARTMENT_ADMIN can perform these (scoped in controller)
router.post('/', authenticateToken, requireAdmin, createCourse);
router.patch('/:id', authenticateToken, requireAdmin, updateCourse);
router.delete('/:id', authenticateToken, requireAdmin, deleteCourse);

export default router;
