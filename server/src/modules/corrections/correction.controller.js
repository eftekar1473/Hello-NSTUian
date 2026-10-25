import { prisma } from '../../services/prisma.js';
import { calculateFileHash } from '../../services/duplicateDetector.js';
import { moveToProposals } from '../../services/storage.js';
import { correctionRequestSchema } from '../../validators/schemas.js';

export async function submitCorrectionRequest(req, res) {
  try {
    const validated = correctionRequestSchema.parse(req.body);

    const question = await prisma.questionPaper.findUnique({
      where: { id: validated.questionPaperId },
    });

    if (!question) {
      return res.status(404).json({ error: 'Not Found', message: 'Question paper not found.' });
    }

    let contributorUser = req.user;
    if (!contributorUser) {
      const email = (validated.contributorEmail || 'student.contributor@student.nstu.edu.bd').toLowerCase();
      const displayName = validated.contributorName || 'NSTU Student';

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

    let proposedStorageKey = null;
    let proposedFilename = null;
    let proposedMimeType = null;
    let proposedFileSize = null;
    let proposedSha256Hash = null;

    if (req.file) {
      proposedSha256Hash = await calculateFileHash(req.file.path);
      proposedStorageKey = await moveToProposals(req.file.filename);
      proposedFilename = req.file.originalname;
      proposedMimeType = req.file.mimetype;
      proposedFileSize = req.file.size;
    }

    const correction = await prisma.correctionRequest.create({
      data: {
        question_paper_id: question.id,
        requested_by: contributorUser.id,
        description: validated.description,
        proposed_storage_key: proposedStorageKey,
        proposed_filename: proposedFilename,
        proposed_mime_type: proposedMimeType,
        proposed_file_size: proposedFileSize,
        proposed_sha256_hash: proposedSha256Hash,
        status: 'pending_review',
      },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: contributorUser.id,
        action: 'CORRECTION_REQUESTED',
        entity_type: 'CORRECTION_REQUEST',
        entity_id: correction.id,
        department_id: question.department_id,
        details: JSON.stringify({
          description: validated.description,
          has_replacement_file: !!req.file,
        }),
      },
    });

    return res.status(201).json({
      message: 'Correction request submitted successfully. It has been queued for administrator review.',
      correction,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    console.error('submitCorrectionRequest error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to submit correction request.' });
  }
}

export async function getMyCorrections(req, res) {
  try {
    if (!req.user) {
      return res.json({ corrections: [] });
    }
    const corrections = await prisma.correctionRequest.findMany({
      where: { requested_by: req.user.id },
      include: {
        question_paper: {
          include: {
            course: true,
            department: true,
            exam_type: true,
            exam_session: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return res.json({ corrections });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch correction requests.' });
  }
}
