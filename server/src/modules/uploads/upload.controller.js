import path from 'path';
import { prisma } from '../../services/prisma.js';
import { calculateFileHash, checkForDuplicates } from '../../services/duplicateDetector.js';
import { moveToPublished, moveToProposals } from '../../services/storage.js';
import { uploadQuestionSchema } from '../../validators/schemas.js';

export async function submitUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Bad Request', message: 'Question paper file is required.' });
    }

    const validated = uploadQuestionSchema.parse(req.body);

    // Resolve Contributor User:
    // If authenticated, use req.user.
    // If unauthenticated guest/student, resolve or create user by contributorEmail.
    let contributorUser = req.user;
    if (!contributorUser) {
      const email = (validated.contributorEmail || 'student.contributor@nstu.edu.bd').toLowerCase();
      const displayName = validated.contributorName || 'NSTU Student Contributor';

      contributorUser = await prisma.user.upsert({
        where: { email },
        update: { display_name: displayName },
        create: {
          email,
          display_name: displayName,
          email_verified_at: new Date(),
          account_status: 'ACTIVE',
          auth_provider: 'PUBLIC_CONTRIBUTOR',
        },
      });
    }

    // Resolve Department (by UUID or department_code)
    const department = await prisma.department.findFirst({
      where: {
        OR: [{ id: validated.departmentId }, { department_code: validated.departmentId }],
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Not Found', message: 'Selected department not found.' });
    }

    // Resolve Course
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: validated.courseId }, { course_code: validated.courseId }],
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Not Found', message: 'Selected course not found.' });
    }

    // Resolve Exam Type (by UUID or code)
    const examType = await prisma.examType.findFirst({
      where: {
        OR: [{ id: validated.examTypeId }, { code: validated.examTypeId }],
      },
    });

    if (!examType) {
      return res.status(404).json({ error: 'Not Found', message: 'Selected exam type not found.' });
    }

    // Resolve Exam Session (by UUID or label)
    let examSession = await prisma.examSession.findFirst({
      where: {
        OR: [{ id: validated.examSessionId }, { label: validated.examSessionId }],
      },
    });

    if (!examSession) {
      // Create exam session on the fly if needed (e.g. 2025)
      examSession = await prisma.examSession.create({
        data: {
          label: validated.examSessionId,
          academic_year: validated.examSessionId,
        },
      });
    }

    // Resolve University Session if provided
    let uniSessionId = null;
    if (validated.universitySessionId) {
      const uniSession = await prisma.universitySession.findFirst({
        where: {
          OR: [{ id: validated.universitySessionId }, { session_label: validated.universitySessionId }],
        },
      });
      if (uniSession) uniSessionId = uniSession.id;
    }

    // Compute SHA-256 hash of the uploaded file
    const fileHash = await calculateFileHash(req.file.path);

    // Run duplicate detection rules
    const duplicateCheck = await checkForDuplicates({
      departmentId: department.id,
      courseId: course.id,
      examSessionId: examSession.id,
      examTypeId: examType.id,
      ctNumber: validated.ctNumber,
      setName: validated.setName,
      fileHash,
    });

    // 1. If flagged as duplicate: do NOT auto-publish, flag for admin moderation
    if (duplicateCheck.isDuplicate) {
      const proposalKey = await moveToProposals(req.file.filename, req.file.mimetype);

      const flaggedUpload = await prisma.uploadRequest.create({
        data: {
          submitted_by: contributorUser.id,
          department_id: department.id,
          course_id: course.id,
          university_session_id: uniSessionId,
          exam_session_id: examSession.id,
          exam_type_id: examType.id,
          ct_number: validated.ctNumber || null,
          set_name: validated.setName || null,
          temporary_storage_key: proposalKey,
          original_filename: req.file.originalname,
          mime_type: req.file.mimetype,
          file_size: req.file.size,
          sha256_hash: fileHash,
          status: 'duplicate_flagged',
          rejection_reason: duplicateCheck.reason,
        },
      });

      await prisma.auditLog.create({
        data: {
          actor_user_id: contributorUser.id,
          action: 'UPLOAD_FLAGGED_DUPLICATE',
          entity_type: 'UPLOAD_REQUEST',
          entity_id: flaggedUpload.id,
          department_id: department.id,
          details: JSON.stringify({ reason: duplicateCheck.reason, hash: fileHash }),
        },
      });

      return res.status(202).json({
        message: 'Submission flagged as possible duplicate and queued for administrator review.',
        status: 'duplicate_flagged',
        reason: duplicateCheck.reason,
        uploadRequestId: flaggedUpload.id,
      });
    }

    // 2. Genuinely new submission -> BR-03: Automatically publish!
    const publishedKey = await moveToPublished(req.file.filename, req.file.mimetype);

    const newQuestion = await prisma.questionPaper.create({
      data: {
        department_id: department.id,
        course_id: course.id,
        university_session_id: uniSessionId,
        exam_session_id: examSession.id,
        exam_type_id: examType.id,
        ct_number: validated.ctNumber || null,
        set_name: validated.setName || null,
        title: validated.title || `${course.course_code} ${examType.name}`,
        description: validated.description || null,
        publication_status: 'published',
        created_by: contributorUser.id,
      },
    });

    const newVersion = await prisma.questionPaperVersion.create({
      data: {
        question_paper_id: newQuestion.id,
        version_number: 1,
        storage_key: publishedKey,
        file_url: `/api/v1/questions/${newQuestion.id}/download`,
        original_filename: req.file.originalname,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        sha256_hash: fileHash,
        created_by: contributorUser.id,
        change_summary: 'Initial auto-publication upon submission.',
      },
    });

    await prisma.questionPaper.update({
      where: { id: newQuestion.id },
      data: { current_version_id: newVersion.id },
    });

    const uploadRecord = await prisma.uploadRequest.create({
      data: {
        submitted_by: contributorUser.id,
        department_id: department.id,
        course_id: course.id,
        university_session_id: uniSessionId,
        exam_session_id: examSession.id,
        exam_type_id: examType.id,
        ct_number: validated.ctNumber || null,
        set_name: validated.setName || null,
        temporary_storage_key: publishedKey,
        original_filename: req.file.originalname,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        sha256_hash: fileHash,
        status: 'published',
        published_question_paper_id: newQuestion.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: contributorUser.id,
        action: 'QUESTION_AUTO_PUBLISHED',
        entity_type: 'QUESTION_PAPER',
        entity_id: newQuestion.id,
        department_id: department.id,
        details: JSON.stringify({
          original_filename: req.file.originalname,
          hash: fileHash,
          version: 1,
        }),
      },
    });

    return res.status(201).json({
      message: 'Question paper verified and automatically published!',
      status: 'published',
      question: newQuestion,
      version: newVersion,
      uploadRequestId: uploadRecord.id,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    console.error('submitUpload error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to process question upload.' });
  }
}

export async function getMyUploads(req, res) {
  try {
    if (!req.user) {
      return res.json({ uploads: [] });
    }
    const uploads = await prisma.uploadRequest.findMany({
      where: { submitted_by: req.user.id },
      include: {
        department: true,
        course: true,
        exam_type: true,
        exam_session: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return res.json({ uploads });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch your uploads.' });
  }
}
