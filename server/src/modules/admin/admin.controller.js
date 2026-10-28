import bcrypt from 'bcryptjs';
import { prisma } from '../../services/prisma.js';
import { validateDepartmentScope } from '../../middleware/role.js';
import { moveToPublished } from '../../services/storage.js';
import { reviewRequestSchema, assignAdminSchema } from '../../validators/schemas.js';

export async function getAdminDashboardStats(req, res) {
  try {
    const isSuper = req.adminScope.isSuperAdmin;
    const deptId = req.adminScope.departmentId;

    const deptFilter = isSuper ? {} : { department_id: deptId };

    const [
      totalQuestions,
      flaggedUploadsCount,
      pendingCorrectionsCount,
      totalDepartments,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.questionPaper.count({
        where: { ...deptFilter, publication_status: 'published' },
      }),
      prisma.uploadRequest.count({
        where: { ...deptFilter, status: 'duplicate_flagged' },
      }),
      prisma.correctionRequest.count({
        where: isSuper
          ? { status: 'pending_review' }
          : { status: 'pending_review', question_paper: { department_id: deptId } },
      }),
      prisma.department.count({ where: { is_active: true } }),
      prisma.auditLog.findMany({
        where: deptFilter,
        take: 8,
        orderBy: { created_at: 'desc' },
        include: {
          actor: { select: { display_name: true, email: true } },
          department: { select: { name: true, department_code: true } },
        },
      }),
    ]);

    let assignedDepartment = null;
    if (deptId) {
      assignedDepartment = await prisma.department.findUnique({
        where: { id: deptId },
        select: { id: true, name: true, department_code: true, abbreviation: true },
      });
    }

    return res.json({
      role: isSuper ? 'SUPER_ADMIN' : 'DEPARTMENT_ADMIN',
      assignedDepartment,
      stats: {
        totalQuestions,
        flaggedUploadsCount,
        pendingCorrectionsCount,
        totalDepartments,
      },
      recentAuditLogs,
    });
  } catch (err) {
    console.error('getAdminDashboardStats error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to load dashboard statistics.' });
  }
}

export async function getReviewableUploads(req, res) {
  try {
    const isSuper = req.adminScope.isSuperAdmin;
    const deptId = req.adminScope.departmentId;

    const where = {
      status: { in: ['duplicate_flagged', 'pending_review'] },
      ...(isSuper ? {} : { department_id: deptId }),
    };

    const uploads = await prisma.uploadRequest.findMany({
      where,
      include: {
        department: true,
        course: true,
        exam_type: true,
        exam_session: true,
        submitter: { select: { display_name: true, email: true, student_id: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({ uploads });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch uploads queue.' });
  }
}

export async function reviewUpload(req, res) {
  try {
    const { id } = req.params;
    const { decision, rejectionReason, reviewNotes } = reviewRequestSchema.parse(req.body);

    const upload = await prisma.uploadRequest.findUnique({
      where: { id },
    });

    if (!upload) {
      return res.status(404).json({ error: 'Not Found', message: 'Upload record not found.' });
    }

    if (!validateDepartmentScope(upload.department_id, req, res)) return;

    if (decision === 'APPROVE') {
      // Publish the flagged question
      const publishedKey = await moveToPublished(upload.temporary_storage_key);

      const question = await prisma.questionPaper.create({
        data: {
          department_id: upload.department_id,
          course_id: upload.course_id,
          university_session_id: upload.university_session_id,
          exam_session_id: upload.exam_session_id,
          exam_type_id: upload.exam_type_id,
          ct_number: upload.ct_number,
          set_name: upload.set_name,
          publication_status: 'published',
          created_by: upload.submitted_by,
        },
      });

      const version = await prisma.questionPaperVersion.create({
        data: {
          question_paper_id: question.id,
          version_number: 1,
          storage_key: publishedKey,
          file_url: `/api/v1/questions/${question.id}/download`,
          original_filename: upload.original_filename,
          mime_type: upload.mime_type,
          file_size: upload.file_size,
          sha256_hash: upload.sha256_hash,
          created_by: upload.submitted_by,
          change_summary: `Approved by admin: ${reviewNotes || 'Approved flagged upload'}`,
        },
      });

      await prisma.questionPaper.update({
        where: { id: question.id },
        data: { current_version_id: version.id },
      });

      await prisma.uploadRequest.update({
        where: { id },
        data: {
          status: 'published',
          published_question_paper_id: question.id,
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          actor_user_id: req.user.id,
          action: 'UPLOAD_FLAG_APPROVED',
          entity_type: 'QUESTION_PAPER',
          entity_id: question.id,
          department_id: upload.department_id,
          details: JSON.stringify({ uploadRequestId: id, reviewNotes }),
        },
      });

      return res.json({ message: 'Upload approved and published successfully.', question });
    } else {
      // Reject
      await prisma.uploadRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          rejection_reason: rejectionReason || reviewNotes || 'Rejected by administrator',
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          actor_user_id: req.user.id,
          action: 'UPLOAD_FLAG_REJECTED',
          entity_type: 'UPLOAD_REQUEST',
          entity_id: id,
          department_id: upload.department_id,
          details: JSON.stringify({ rejectionReason }),
        },
      });

      return res.json({ message: 'Upload submission rejected.' });
    }
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    console.error('reviewUpload error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to process review.' });
  }
}

export async function getReviewableCorrections(req, res) {
  try {
    const isSuper = req.adminScope.isSuperAdmin;
    const deptId = req.adminScope.departmentId;

    const where = {
      status: 'pending_review',
      ...(isSuper ? {} : { question_paper: { department_id: deptId } }),
    };

    const corrections = await prisma.correctionRequest.findMany({
      where,
      include: {
        question_paper: {
          include: {
            department: true,
            course: true,
            exam_type: true,
            exam_session: true,
          },
        },
        requester: { select: { display_name: true, email: true, student_id: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({ corrections });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch corrections queue.' });
  }
}

export async function reviewCorrection(req, res) {
  try {
    const { id } = req.params;
    const { decision, reviewNotes } = reviewRequestSchema.parse(req.body);

    const correction = await prisma.correctionRequest.findUnique({
      where: { id },
      include: {
        question_paper: {
          include: {
            versions: { orderBy: { version_number: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!correction) {
      return res.status(404).json({ error: 'Not Found', message: 'Correction request not found.' });
    }

    if (!validateDepartmentScope(correction.question_paper.department_id, req, res)) return;

    if (decision === 'APPROVE') {
      let resultingVersionId = null;

      // If a replacement file was proposed, create version N+1
      if (correction.proposed_storage_key) {
        const publishedKey = await moveToPublished(correction.proposed_storage_key);
        const latestVersionNumber = correction.question_paper.versions[0]?.version_number || 1;

        const newVersion = await prisma.questionPaperVersion.create({
          data: {
            question_paper_id: correction.question_paper_id,
            version_number: latestVersionNumber + 1,
            storage_key: publishedKey,
            file_url: `/api/v1/questions/${correction.question_paper_id}/download`,
            original_filename: correction.proposed_filename || 'corrected-paper.pdf',
            mime_type: correction.proposed_mime_type || 'application/pdf',
            file_size: correction.proposed_file_size || 0,
            sha256_hash: correction.proposed_sha256_hash || 'hash',
            created_by: correction.requested_by,
            change_summary: `Correction approved: ${correction.description}. Notes: ${reviewNotes || 'Approved'}`,
          },
        });

        resultingVersionId = newVersion.id;

        await prisma.questionPaper.update({
          where: { id: correction.question_paper_id },
          data: {
            current_version_id: newVersion.id,
          },
        });
      }

      await prisma.correctionRequest.update({
        where: { id },
        data: {
          status: 'approved',
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
          review_notes: reviewNotes,
          resulting_version_id: resultingVersionId,
        },
      });

      await prisma.auditLog.create({
        data: {
          actor_user_id: req.user.id,
          action: 'CORRECTION_APPROVED',
          entity_type: 'CORRECTION_REQUEST',
          entity_id: id,
          department_id: correction.question_paper.department_id,
          details: JSON.stringify({ resultingVersionId, reviewNotes }),
        },
      });

      return res.json({ message: 'Correction request approved and new version activated.' });
    } else {
      // Reject
      await prisma.correctionRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
          review_notes: reviewNotes || 'Rejected by administrator',
        },
      });

      await prisma.auditLog.create({
        data: {
          actor_user_id: req.user.id,
          action: 'CORRECTION_REJECTED',
          entity_type: 'CORRECTION_REQUEST',
          entity_id: id,
          department_id: correction.question_paper.department_id,
          details: JSON.stringify({ reviewNotes }),
        },
      });

      return res.json({ message: 'Correction request rejected.' });
    }
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    console.error('reviewCorrection error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to process correction review.' });
  }
}

export async function archiveQuestionPaper(req, res) {
  try {
    const { id } = req.params;
    const question = await prisma.questionPaper.findUnique({ where: { id } });

    if (!question) {
      return res.status(404).json({ error: 'Not Found', message: 'Question paper not found.' });
    }

    if (!validateDepartmentScope(question.department_id, req, res)) return;

    await prisma.questionPaper.update({
      where: { id },
      data: { publication_status: 'archived' },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: req.user.id,
        action: 'QUESTION_ARCHIVED',
        entity_type: 'QUESTION_PAPER',
        entity_id: id,
        department_id: question.department_id,
      },
    });

    return res.json({ message: 'Question paper archived successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to archive question paper.' });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const isSuper = req.adminScope.isSuperAdmin;
    const deptId = req.adminScope.departmentId;

    const where = isSuper ? {} : { department_id: deptId };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { display_name: true, email: true } },
        department: { select: { name: true, department_code: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch audit logs.' });
  }
}

export async function assignAdminRole(req, res) {
  try {
    const { userId, role, departmentId } = assignAdminSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    }

    if (role === 'DEPARTMENT_ADMIN' && !departmentId) {
      return res.status(400).json({ error: 'Bad Request', message: 'departmentId is required for Department Admin.' });
    }

    const permission = await prisma.adminPermission.upsert({
      where: {
        user_id_role_department_id: {
          user_id: userId,
          role,
          department_id: departmentId || '',
        },
      },
      update: {},
      create: {
        user_id: userId,
        role,
        department_id: role === 'SUPER_ADMIN' ? null : departmentId,
        assigned_by: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: req.user.id,
        action: 'ADMIN_ROLE_ASSIGNED',
        entity_type: 'ADMIN_PERMISSION',
        entity_id: permission.id,
        department_id: departmentId || null,
        details: JSON.stringify({ targetUserEmail: targetUser.email, role, departmentId }),
      },
    });

    return res.status(201).json({ message: 'Admin role assigned successfully.', permission });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    console.error('assignAdminRole error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to assign admin role.' });
  }
}

export async function getAdminUsersList(req, res) {
  try {
    const users = await prisma.user.findMany({
      include: {
        admin_permissions: {
          include: { department: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const sanitized = users.map(({ password_hash, ...rest }) => rest);
    return res.json({ users: sanitized });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch users list.' });
  }
}

export async function createDeptAdmin(req, res) {
  try {
    const { departmentId, email, roll, password, displayName } = req.body;

    if (!departmentId || !email || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'Department, EduMail, and Password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return res.status(404).json({ error: 'Not Found', message: 'Department not found.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password_hash: passwordHash,
          student_id: roll ? roll.trim() : user.student_id,
          display_name: displayName ? displayName.trim() : user.display_name,
          email_verified_at: null, // Require verification by EduMail
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          password_hash: passwordHash,
          student_id: roll ? roll.trim() : null,
          display_name: displayName ? displayName.trim() : `${department.name} Admin`,
          email_verified_at: null, // Require verification by EduMail
          account_status: 'ACTIVE',
          auth_provider: 'LOCAL',
        },
      });
    }

    // Upsert admin permission for this department
    await prisma.adminPermission.upsert({
      where: {
        user_id_role_department_id: {
          user_id: user.id,
          role: 'DEPARTMENT_ADMIN',
          department_id: departmentId,
        },
      },
      update: {},
      create: {
        user_id: user.id,
        role: 'DEPARTMENT_ADMIN',
        department_id: departmentId,
        assigned_by: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: req.user.id,
        action: 'DEPT_ADMIN_ASSIGNED',
        entity_type: 'ADMIN_PERMISSION',
        entity_id: user.id,
        department_id: departmentId,
        details: JSON.stringify({ email: cleanEmail, roll, department: department.name, password }),
      },
    });

    return res.status(201).json({
      message: 'Department Admin configured successfully. Pending verification via their EduMail.',
      user: {
        id: user.id,
        email: user.email,
        student_id: user.student_id,
        display_name: user.display_name,
        password: password,
        is_verified: false,
      },
    });
  } catch (err) {
    console.error('createDeptAdmin error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to create department admin.' });
  }
}

export async function getDeptAdminsList(req, res) {
  try {
    const permissions = await prisma.adminPermission.findMany({
      where: { role: 'DEPARTMENT_ADMIN' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            display_name: true,
            student_id: true,
            email_verified_at: true,
            account_status: true,
            created_at: true,
          },
        },
        department: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Retrieve audit logs for DEPT_ADMIN_ASSIGNED to recover passwords configured by Super Admin
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'DEPT_ADMIN_ASSIGNED' },
      orderBy: { created_at: 'desc' },
    });

    const admins = permissions.map((p) => {
      let assignedPassword = null;
      const log = auditLogs.find(
        (l) => l.entity_id === p.user?.id || (l.details && l.details.includes(p.user?.email))
      );
      if (log && log.details) {
        try {
          const parsed = JSON.parse(log.details);
          assignedPassword = parsed.password || null;
        } catch {}
      }
      if (!assignedPassword && p.user?.email === 'iitadmin@nstu.edu.bd') {
        assignedPassword = 'NstuAdmin@2026';
      }

      return {
        id: p.id,
        user_id: p.user?.id,
        email: p.user?.email,
        display_name: p.user?.display_name,
        roll: p.user?.student_id,
        password: assignedPassword || 'NstuAdmin@2026',
        is_verified: !!p.user?.email_verified_at,
        email_verified_at: p.user?.email_verified_at,
        department: p.department,
        created_at: p.created_at,
      };
    });

    return res.json({ admins });
  } catch (err) {
    console.error('getDeptAdminsList error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch department admins.' });
  }
}

export async function verifyDeptAdmin(req, res) {
  try {
    const { email, roll } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'EduMail is required for verification.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { admin_permissions: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'No account registered with this EduMail.' });
    }

    const hasDeptRole = user.admin_permissions.some((p) => p.role === 'DEPARTMENT_ADMIN');
    if (!hasDeptRole) {
      return res.status(400).json({ error: 'Bad Request', message: 'This account is not designated as a Department Administrator.' });
    }

    if (roll && user.student_id && roll.trim().toLowerCase() !== user.student_id.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Bad Request', message: 'Student roll number does not match record.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email_verified_at: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: user.id,
        action: 'DEPT_ADMIN_VERIFIED',
        entity_type: 'USER',
        entity_id: user.id,
        details: JSON.stringify({ email: cleanEmail, roll: user.student_id }),
      },
    });

    return res.json({
      message: 'EduMail successfully verified! You can now log in using the password provided by Super Admin.',
      verified: true,
    });
  } catch (err) {
    console.error('verifyDeptAdmin error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Verification failed.' });
  }
}
