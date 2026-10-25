import path from 'path';
import fs from 'fs';
import { prisma } from '../../services/prisma.js';
import { getStorageFilePath, getStoragePublicUrl } from '../../services/storage.js';

export async function getQuestionsByCourse(req, res) {
  try {
    const { courseId } = req.params;
    const { examTypeId, universitySessionId, examSessionId } = req.query;

    const where = {
      course_id: courseId,
      publication_status: 'published',
    };

    if (examTypeId) where.exam_type_id = examTypeId;
    if (universitySessionId) where.university_session_id = universitySessionId;
    if (examSessionId) where.exam_session_id = examSessionId;

    const questions = await prisma.questionPaper.findMany({
      where,
      include: {
        exam_type: true,
        exam_session: true,
        university_session: true,
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ exam_session: { label: 'desc' } }, { ct_number: 'asc' }],
    });

    return res.json({ questions });
  } catch (err) {
    console.error('getQuestionsByCourse error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch questions.' });
  }
}

export async function getQuestionById(req, res) {
  try {
    const { id } = req.params;
    const question = await prisma.questionPaper.findUnique({
      where: { id },
      include: {
        department: true,
        course: {
          include: {
            semester: true,
          },
        },
        exam_type: true,
        exam_session: true,
        university_session: true,
        creator: {
          select: {
            id: true,
            display_name: true,
            student_id: true,
          },
        },
        versions: {
          orderBy: { version_number: 'desc' },
        },
      },
    });

    if (!question || question.publication_status !== 'published') {
      return res.status(404).json({ error: 'Not Found', message: 'Question paper not found or not published.' });
    }

    return res.json({ question });
  } catch (err) {
    console.error('getQuestionById error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch question details.' });
  }
}

export async function downloadQuestionFile(req, res) {
  try {
    const { id } = req.params;
    const question = await prisma.questionPaper.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
        },
      },
    });

    if (!question || question.publication_status !== 'published') {
      return res.status(404).json({ error: 'Not Found', message: 'Question paper not available for download.' });
    }

    const latestVersion = question.versions[0];
    if (!latestVersion) {
      return res.status(404).json({ error: 'Not Found', message: 'File version record not found.' });
    }

    // Check if hosted on Supabase Storage
    const publicUrl = getStoragePublicUrl(latestVersion.storage_key);
    if (publicUrl) {
      return res.redirect(publicUrl);
    }

    // Check storage locations
    const uploadsPath = path.resolve(process.cwd(), 'storage/uploads', path.basename(latestVersion.storage_key));
    const clientPublicPath = path.resolve(process.cwd(), '../client/public', latestVersion.storage_key.replace(/^samples\//, ''));
    const directClientPublic = path.resolve(process.cwd(), '../client/public', path.basename(latestVersion.original_filename));
    const clientRootPublic = path.resolve(process.cwd(), '../client/public', path.basename(latestVersion.storage_key));

    let resolvedPath = null;
    if (fs.existsSync(uploadsPath)) {
      resolvedPath = uploadsPath;
    } else if (fs.existsSync(clientRootPublic)) {
      resolvedPath = clientRootPublic;
    } else if (fs.existsSync(clientPublicPath)) {
      resolvedPath = clientPublicPath;
    } else if (fs.existsSync(directClientPublic)) {
      resolvedPath = directClientPublic;
    } else {
      const fullPath = getStorageFilePath(latestVersion.storage_key);
      if (fs.existsSync(fullPath)) resolvedPath = fullPath;
    }

    if (!resolvedPath) {
      const fallbackSample = path.resolve(process.cwd(), '../client/public/samples/sample-exam-paper.pdf');
      if (fs.existsSync(fallbackSample)) resolvedPath = fallbackSample;
    }

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'Not Found', message: 'Physical file not found on server.' });
    }

    res.setHeader('Content-Type', latestVersion.mime_type || 'application/octet-stream');
    return res.sendFile(path.resolve(resolvedPath));
  } catch (err) {
    console.error('downloadQuestionFile error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Download failed.' });
  }
}

export async function searchQuestions(req, res) {
  try {
    const { q, departmentId, semesterNumber, examTypeId, session } = req.query;

    const queryStr = (q || '').trim();

    // Find departments matching query
    const departments = await prisma.department.findMany({
      where: {
        is_active: true,
        OR: [
          { name: { contains: queryStr } },
          { department_code: { contains: queryStr } },
          { abbreviation: { contains: queryStr } },
        ],
      },
      take: 10,
    });

    // Find courses matching query
    const courses = await prisma.course.findMany({
      where: {
        is_active: true,
        OR: [
          { course_code: { contains: queryStr } },
          { course_title: { contains: queryStr } },
        ],
      },
      include: {
        program: {
          include: {
            department: true,
          },
        },
        semester: true,
      },
      take: 15,
    });

    // Find question papers
    const questionWhere = {
      publication_status: 'published',
    };

    if (queryStr) {
      questionWhere.OR = [
        { title: { contains: queryStr } },
        { description: { contains: queryStr } },
        { course: { course_code: { contains: queryStr } } },
        { course: { course_title: { contains: queryStr } } },
      ];
    }

    if (departmentId) questionWhere.department_id = departmentId;
    if (examTypeId) questionWhere.exam_type_id = examTypeId;
    if (session) {
      questionWhere.university_session = { session_label: session };
    }
    if (semesterNumber) {
      questionWhere.course = {
        ...questionWhere.course,
        semester: { semester_number: parseInt(semesterNumber, 10) },
      };
    }

    const questionPapers = await prisma.questionPaper.findMany({
      where: questionWhere,
      include: {
        department: true,
        course: {
          include: {
            semester: true,
          },
        },
        exam_type: true,
        exam_session: true,
        university_session: true,
        versions: {
          take: 1,
          orderBy: { version_number: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return res.json({
      departments,
      courses,
      questions: questionPapers,
    });
  } catch (err) {
    console.error('searchQuestions error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Search operation failed.' });
  }
}
