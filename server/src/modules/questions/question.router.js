import { Router } from 'express';
import {
  getQuestionsByCourse,
  getQuestionById,
  downloadQuestionFile,
  searchQuestions,
} from './question.controller.js';

const router = Router();

router.get('/courses/:courseId/questions', getQuestionsByCourse);
router.get('/questions/:id', getQuestionById);
router.get('/questions/:id/download', downloadQuestionFile);
router.get('/search', searchQuestions);

export default router;
