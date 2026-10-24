import crypto from 'crypto';
import fs from 'fs';
import { prisma } from './prisma.js';

/**
 * Calculates SHA-256 hash of a file on disk
 */
export function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Check if the submission duplicates an existing question paper or pending upload
 * Returns { isDuplicate: boolean, reason: string | null, matchedPaperId: string | null }
 */
export async function checkForDuplicates({
  departmentId,
  courseId,
  examSessionId,
  examTypeId,
  ctNumber,
  setName,
  fileHash,
}) {
  // 1. Check for identical SHA-256 hash in existing versions
  const existingVersion = await prisma.questionPaperVersion.findFirst({
    where: { sha256_hash: fileHash },
    include: {
      question_paper: {
        include: {
          course: true,
          department: true,
        },
      },
    },
  });

  if (existingVersion) {
    return {
      isDuplicate: true,
      reason: `Identical file already exists for course ${existingVersion.question_paper.course.course_code} (${existingVersion.original_filename})`,
      matchedPaperId: existingVersion.question_paper_id,
      exactHashMatch: true,
    };
  }

  // 2. Check for identical academic metadata match
  const metadataMatch = await prisma.questionPaper.findFirst({
    where: {
      department_id: departmentId,
      course_id: courseId,
      exam_session_id: examSessionId,
      exam_type_id: examTypeId,
      ct_number: ctNumber || null,
      set_name: setName || null,
      publication_status: 'published',
    },
    include: {
      course: true,
    },
  });

  if (metadataMatch) {
    return {
      isDuplicate: true,
      reason: `A question paper for this course and exam set already exists. If this is a correction or replacement, please use "Request Correction" instead of uploading a new entry.`,
      matchedPaperId: metadataMatch.id,
      exactHashMatch: false,
    };
  }

  return {
    isDuplicate: false,
    reason: null,
    matchedPaperId: null,
    exactHashMatch: false,
  };
}
