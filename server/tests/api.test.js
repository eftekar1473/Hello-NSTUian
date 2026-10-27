import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Hello NSTUian API Test Suite', () => {
  let superAdminToken = '';
  let deptAdminToken = '';
  let studentToken = '';

  beforeAll(async () => {
    // Login as Super Admin
    const superRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@nstu.edu.bd', password: 'NstuAdmin@2026' });
    superAdminToken = superRes.body.token;

    // Login as IIT Admin
    const deptRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'iitadmin@nstu.edu.bd', password: 'NstuAdmin@2026' });
    deptAdminToken = deptRes.body.token;

    // Login as Student Contributor
    const studentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ash2325006m@nstu.edu.bd', password: 'Student@2026' });
    studentToken = studentRes.body.token;
  });

  describe('Public Browsing & Discovery', () => {
    it('GET / returns 200 OK or index', async () => {
      const res = await request(app).get('/');
      expect([200, 304]).toContain(res.status);
    });

    it('GET /api/health returns 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /api/v1/departments returns A-Z list of active departments', async () => {
      const res = await request(app).get('/api/v1/departments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.departments)).toBe(true);
      expect(res.body.departments.length).toBeGreaterThan(0);

      // Verify A-Z ordering
      const names = res.body.departments.map((d) => d.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);

      // Check IIT existence
      const iit = res.body.departments.find((d) => d.department_code === '25');
      expect(iit).toBeDefined();
      expect(iit.abbreviation).toBe('IIT');
    });

    it('GET /api/v1/departments/:id returns department details with semesters & courses', async () => {
      const res = await request(app).get('/api/v1/departments/25');
      expect(res.status).toBe(200);
      expect(res.body.department.name).toBe('Institute of Information Technology');
      expect(res.body.department.programs.length).toBeGreaterThan(0);
      expect(res.body.department.programs[0].semesters.length).toBe(8);
    });

    it('GET /api/v1/search returns search results', async () => {
      const res = await request(app).get('/api/v1/search?q=IIT');
      expect(res.status).toBe(200);
      expect(res.body.departments).toBeDefined();
      expect(res.body.courses).toBeDefined();
    });
  });

  describe('Authentication & EduMail Verification Rules', () => {
    it('Rejects registration with non-NSTU email (BR-02)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'attacker@gmail.com',
        password: 'Password123!',
        displayName: 'Attacker User',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('Accepts registration with valid NSTU EduMail', async () => {
      const testEmail = `student${Date.now()}@nstu.edu.bd`;
      const res = await request(app).post('/api/v1/auth/register').send({
        email: testEmail,
        password: 'ValidPassword123',
        displayName: 'Test NSTU Student',
        studentId: 'ASH2325999M',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.token).toBeDefined();
    });

    it('Rejects login with invalid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'superadmin@nstu.edu.bd',
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Role-Based Access Control (BR-06, BR-07, BR-08)', () => {
    it('Forbids regular contributor from accessing Admin Dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('Allows Super Admin global dashboard access', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('SUPER_ADMIN');
      expect(res.body.stats).toBeDefined();
    });

    it('Allows Department Admin scoped dashboard access', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${deptAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('DEPARTMENT_ADMIN');
      expect(res.body.assignedDepartment).toBeDefined();
      expect(res.body.assignedDepartment.department_code).toBe('25');
    });

    it('Forbids Department Admin from viewing Super Admin user assignments', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${deptAdminToken}`);
      expect(res.status).toBe(403);
    });

    it('Allows Super Admin to view users list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe('Upload, Auto-Publish, and Duplicate Workflow (BR-03, BR-05)', () => {
    let deptId = '';
    let courseId = '';
    let examTypeId = '';
    let examSessionId = '';
    let publishedQuestionId = '';

    beforeAll(async () => {
      // Get IIT department and course ID
      const deptRes = await request(app).get('/api/v1/departments/25');
      deptId = deptRes.body.department.id;
      
      // Get IIT 2101 from Sem 3
      const sem3Courses = deptRes.body.department.programs[0].semesters[2].courses;
      const dbmsCourse = sem3Courses.find((c) => c.course_code === 'IIT 2101');
      courseId = dbmsCourse.id;

      // Get questions to find examTypeId & examSessionId
      const qRes = await request(app).get(`/api/v1/courses/${courseId}/questions`);
      if (qRes.body.questions?.length > 0) {
        examTypeId = qRes.body.questions[0].exam_type_id;
        examSessionId = qRes.body.questions[0].exam_session_id;
      }
    });

    it('Automatically publishes valid new question paper (BR-03)', async () => {
      const uniqueContent = `%PDF-1.4 Unique Exam Content ${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('departmentId', deptId)
        .field('courseId', courseId)
        .field('examSessionId', examSessionId)
        .field('examTypeId', examTypeId)
        .field('ctNumber', 3)
        .field('setName', 'Z')
        .field('title', 'Automated Test Unique CT Paper')
        .attach('file', Buffer.from(uniqueContent), 'Unique_CT3_SetZ.pdf');

      expect([201, 202]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.status).toBe('published');
        expect(res.body.question).toBeDefined();
        publishedQuestionId = res.body.question.id;
      }
    });

    it('Flags duplicate upload for admin review rather than publishing (BR-05)', async () => {
      // Re-upload same course, CT number, set, and exam session
      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('departmentId', deptId)
        .field('courseId', courseId)
        .field('examSessionId', examSessionId)
        .field('examTypeId', examTypeId)
        .field('ctNumber', 3)
        .field('setName', 'Z')
        .attach('file', Buffer.from('%PDF-1.4 duplicate test'), 'duplicate.pdf');

      expect(res.status).toBe(202);
      expect(res.body.status).toBe('duplicate_flagged');
      expect(res.body.reason).toBeDefined();
    });

    it('Allows any public student/user to contribute questions without authentication', async () => {
      const uniquePdf = `%PDF-1.4 Public Contributor Paper ${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/uploads')
        .field('departmentId', deptId)
        .field('courseId', courseId)
        .field('examSessionId', '2025')
        .field('examTypeId', 'CT')
        .field('ctNumber', 2)
        .field('setName', 'PublicTest')
        .field('title', 'Guest Student Contributed Paper')
        .field('contributorName', 'Open NSTU Contributor')
        .field('contributorEmail', 'guest.contributor@nstu.edu.bd')
        .attach('file', Buffer.from(uniquePdf), 'Guest_CT2_SetPublic.pdf');

      expect([201, 202]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.status).toBe('published');
        expect(res.body.question).toBeDefined();
      }
    });

    it('Allows student to submit correction request for an existing question (BR-04)', async () => {
      // Find a published question
      const deptRes = await request(app).get('/api/v1/departments/25');
      const courses = deptRes.body.department.programs[0].semesters[2].courses;
      const targetCourse = courses.find((c) => c.course_code === 'IIT 2101');

      const qRes = await request(app).get(`/api/v1/courses/${targetCourse.id}/questions`);
      const targetQuestion = qRes.body.questions[0];

      const res = await request(app)
        .post('/api/v1/correction-requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('questionPaperId', targetQuestion.id)
        .field('description', 'Page 1 has a typo in question 2 where Relational Algebra symbol is obscured.');

      expect(res.status).toBe(201);
      expect(res.body.correction.status).toBe('pending_review');
    });

    it('Records operations in the Audit Log (BR-11)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });
  });
});
