import { Router } from 'express';
import { getDepartments, getDepartmentById, getDepartmentSessions } from './department.controller.js';

const router = Router();

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.get('/:id/sessions', getDepartmentSessions);

export default router;
