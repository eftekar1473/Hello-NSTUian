import { z } from 'zod';
import { config } from '../config/index.js';

export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .refine(
      (email) => {
        const domain = email.split('@')[1]?.toLowerCase();
        return config.allowedEduMailDomains.some((d) => domain === d || domain?.endsWith(`.${d}`));
      },
      { message: `Email must belong to an eligible NSTU domain (${config.allowedEduMailDomains.join(', ')})` }
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  studentId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const uploadQuestionSchema = z.object({
  departmentId: z.string().uuid('Invalid Department ID'),
  courseId: z.string().uuid('Invalid Course ID'),
  universitySessionId: z.string().uuid('Invalid University Session ID').optional().nullable(),
  examSessionId: z.string().uuid('Invalid Exam Session ID'),
  examTypeId: z.string().uuid('Invalid Exam Type ID'),
  ctNumber: z.coerce.number().int().min(1).max(10).optional().nullable(),
  setName: z.string().max(20).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

export const correctionRequestSchema = z.object({
  questionPaperId: z.string().uuid('Invalid Question Paper ID'),
  description: z.string().min(10, 'Please describe what needs correction in detail (minimum 10 characters)'),
});

export const reviewRequestSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'NEEDS_CHANGES']),
  reviewNotes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

export const assignAdminSchema = z.object({
  userId: z.string().uuid('Invalid User ID'),
  role: z.enum(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']),
  departmentId: z.string().uuid('Invalid Department ID').optional().nullable(),
});
