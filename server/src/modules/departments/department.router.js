import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getDepartments,
  getDepartmentById,
  getDepartmentSessions,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './department.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireSuperAdmin } from '../../middleware/role.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), 'storage/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `dept_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  },
});
const upload = multer({ storage });

const router = Router();

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.get('/:id/sessions', getDepartmentSessions);

// Super Admin only department creation, update & deletion
router.post('/', authenticateToken, requireSuperAdmin, upload.single('logo'), createDepartment);
router.patch('/:id', authenticateToken, requireSuperAdmin, upload.single('logo'), updateDepartment);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteDepartment);

export default router;
