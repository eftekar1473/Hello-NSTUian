import { prisma } from '../../services/prisma.js';

/**
 * Get courses list with optional department and semester filtering
 */
export async function getCourses(req, res) {
  try {
    const isSuper = req.adminScope ? req.adminScope.isSuperAdmin : true;
    const adminDeptId = req.adminScope ? req.adminScope.departmentId : null;

    let targetDeptId = req.query.departmentId;

    // Department admin is restricted to their assigned department
    if (req.adminScope && !isSuper) {
      targetDeptId = adminDeptId;
    }

    const { semesterNumber, search } = req.query;

    const where = {
      is_active: true,
      ...(targetDeptId
        ? {
            program: {
              OR: [
                { department_id: targetDeptId },
                { department: { department_code: targetDeptId } },
              ],
            },
          }
        : {}),
      ...(semesterNumber ? { semester: { semester_number: parseInt(semesterNumber, 10) } } : {}),
      ...(search
        ? {
            OR: [
              { course_code: { contains: search, mode: 'insensitive' } },
              { course_title: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const courses = await prisma.course.findMany({
      where,
      include: {
        semester: true,
        program: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                department_code: true,
                abbreviation: true,
              },
            },
          },
        },
        _count: {
          select: {
            question_papers: {
              where: { publication_status: 'published' },
            },
          },
        },
      },
      orderBy: [{ semester: { semester_number: 'asc' } }, { course_code: 'asc' }],
    });

    const formatted = courses.map((c) => ({
      id: c.id,
      course_code: c.course_code,
      course_title: c.course_title,
      credit: c.credit,
      description: c.description,
      is_active: c.is_active,
      semester_number: c.semester?.semester_number,
      semester_name: c.semester?.semester_name,
      department: c.program?.department,
      total_questions: c._count.question_papers,
    }));

    return res.json({ courses: formatted });
  } catch (err) {
    console.error('getCourses error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch courses.' });
  }
}

/**
 * Create a new academic course
 * Allowed for:
 * - SUPER_ADMIN (for any department)
 * - DEPARTMENT_ADMIN (for their assigned department only)
 */
export async function createCourse(req, res) {
  try {
    const isSuper = req.adminScope.isSuperAdmin;
    const adminDeptId = req.adminScope.departmentId;

    const { departmentId, semesterNumber, courseCode, courseTitle, credit, description } = req.body;

    if (!courseCode || !courseTitle || !semesterNumber) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Course code, course title, and semester number are required.',
      });
    }

    const semNum = parseInt(semesterNumber, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Academic semester must be an integer between 1 and 8.',
      });
    }

    // Determine target department
    let targetDeptIdentifier = departmentId;
    if (!isSuper) {
      if (departmentId) {
        const requestedDept = await prisma.department.findFirst({
          where: {
            OR: [{ id: departmentId }, { department_code: departmentId }],
          },
        });
        if (!requestedDept || requestedDept.id !== adminDeptId) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'You are only authorized to create courses for your assigned department.',
          });
        }
      }
      targetDeptIdentifier = adminDeptId;
    } else if (!targetDeptIdentifier) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'departmentId is required when creating a course as Super Admin.',
      });
    }

    // Resolve department
    const department = await prisma.department.findFirst({
      where: {
        OR: [{ id: targetDeptIdentifier }, { department_code: targetDeptIdentifier }],
        is_active: true,
      },
      include: {
        programs: {
          include: {
            semesters: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Not Found', message: 'Target department not found.' });
    }

    // Dept admin scope verification
    if (!isSuper && department.id !== adminDeptId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only create courses for your assigned department.',
      });
    }

    // Resolve or create academic program
    let program = department.programs?.[0];
    if (!program) {
      const progCode = department.abbreviation || department.department_code;
      program = await prisma.academicProgram.create({
        data: {
          department_id: department.id,
          program_name: `Bachelor of Science in ${department.name}`,
          program_code: `BS-${progCode}`,
        },
        include: { semesters: true },
      });
    }

    // Resolve or create target semester (1 through 8)
    let semester = program.semesters?.find((s) => s.semester_number === semNum);
    if (!semester) {
      semester = await prisma.semester.create({
        data: {
          program_id: program.id,
          semester_number: semNum,
          semester_name: `Semester ${semNum}`,
        },
      });
    }

    const cleanCourseCode = courseCode.trim().toUpperCase();

    // Check for duplicate course_code in program
    const existingCourse = await prisma.course.findFirst({
      where: {
        program_id: program.id,
        course_code: cleanCourseCode,
      },
    });

    if (existingCourse) {
      if (existingCourse.is_active) {
        return res.status(409).json({
          error: 'Conflict',
          message: `Course with code "${cleanCourseCode}" already exists in this department (${existingCourse.course_title}).`,
        });
      } else {
        // Reactivate soft-deleted course with new details
        const reactivated = await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            semester_id: semester.id,
            course_title: courseTitle.trim(),
            credit: credit !== undefined && credit !== '' ? parseFloat(credit) : 3.0,
            description: description ? description.trim() : null,
            is_active: true,
          },
          include: { semester: true, program: true },
        });

        await prisma.auditLog.create({
          data: {
            actor_user_id: req.user.id,
            action: 'COURSE_REACTIVATED',
            entity_type: 'COURSE',
            entity_id: reactivated.id,
            department_id: department.id,
            details: JSON.stringify({
              course_code: cleanCourseCode,
              course_title: courseTitle.trim(),
              semester: semNum,
            }),
          },
        });

        return res.status(201).json({
          message: 'Course reactivated and updated successfully.',
          course: reactivated,
        });
      }
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        program_id: program.id,
        semester_id: semester.id,
        course_code: cleanCourseCode,
        course_title: courseTitle.trim(),
        credit: credit !== undefined && credit !== '' ? parseFloat(credit) : 3.0,
        description: description ? description.trim() : null,
        is_active: true,
      },
      include: {
        semester: true,
        program: {
          include: {
            department: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: req.user.id,
        action: 'COURSE_CREATED',
        entity_type: 'COURSE',
        entity_id: course.id,
        department_id: department.id,
        details: JSON.stringify({
          course_code: cleanCourseCode,
          course_title: courseTitle.trim(),
          semester: semNum,
        }),
      },
    });

    return res.status(201).json({
      message: 'Course created successfully.',
      course: {
        id: course.id,
        course_code: course.course_code,
        course_title: course.course_title,
        credit: course.credit,
        description: course.description,
        semester_number: course.semester?.semester_number,
        semester_name: course.semester?.semester_name,
        department: course.program?.department,
      },
    });
  } catch (err) {
    console.error('createCourse error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to create course.' });
  }
}

/**
 * Edit an existing course
 * Allowed for:
 * - SUPER_ADMIN (for any course)
 * - DEPARTMENT_ADMIN (for courses in their assigned department only)
 */
export async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const isSuper = req.adminScope.isSuperAdmin;
    const adminDeptId = req.adminScope.departmentId;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        program: {
          include: {
            department: true,
            semesters: true,
          },
        },
        semester: true,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Not Found', message: 'Course not found.' });
    }

    // Validate scope
    if (!isSuper && course.program.department_id !== adminDeptId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to edit courses outside your assigned department.',
      });
    }

    const { courseCode, courseTitle, credit, description, semesterNumber } = req.body;

    const data = {};

    if (courseCode && courseCode.trim().toUpperCase() !== course.course_code) {
      const cleanCode = courseCode.trim().toUpperCase();
      const codeCheck = await prisma.course.findFirst({
        where: {
          program_id: course.program_id,
          course_code: cleanCode,
          id: { not: course.id },
          is_active: true,
        },
      });
      if (codeCheck) {
        return res.status(409).json({
          error: 'Conflict',
          message: `Course code "${cleanCode}" is already used by ${codeCheck.course_title}.`,
        });
      }
      data.course_code = cleanCode;
    }

    if (courseTitle) {
      data.course_title = courseTitle.trim();
    }

    if (credit !== undefined && credit !== '') {
      data.credit = parseFloat(credit);
    }

    if (description !== undefined) {
      data.description = description ? description.trim() : null;
    }

    if (semesterNumber !== undefined && semesterNumber !== '') {
      const semNum = parseInt(semesterNumber, 10);
      if (semNum >= 1 && semNum <= 8) {
        let semester = course.program.semesters?.find((s) => s.semester_number === semNum);
        if (!semester) {
          semester = await prisma.semester.create({
            data: {
              program_id: course.program_id,
              semester_number: semNum,
              semester_name: `Semester ${semNum}`,
            },
          });
        }
        data.semester_id = semester.id;
      }
    }

    const updated = await prisma.course.update({
      where: { id: course.id },
      data,
      include: {
        semester: true,
        program: {
          include: { department: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: req.user.id,
        action: 'COURSE_UPDATED',
        entity_type: 'COURSE',
        entity_id: course.id,
        department_id: course.program.department_id,
        details: JSON.stringify({
          course_code: updated.course_code,
          course_title: updated.course_title,
          updatedFields: Object.keys(data),
        }),
      },
    });

    return res.json({
      message: 'Course updated successfully.',
      course: {
        id: updated.id,
        course_code: updated.course_code,
        course_title: updated.course_title,
        credit: updated.credit,
        description: updated.description,
        semester_number: updated.semester?.semester_number,
        semester_name: updated.semester?.semester_name,
        department: updated.program?.department,
      },
    });
  } catch (err) {
    console.error('updateCourse error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update course.' });
  }
}

/**
 * Delete or deactivate an existing course
 * Allowed for:
 * - SUPER_ADMIN (for any course)
 * - DEPARTMENT_ADMIN (for courses in their assigned department only)
 */
export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;
    const isSuper = req.adminScope.isSuperAdmin;
    const adminDeptId = req.adminScope.departmentId;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        program: true,
        _count: {
          select: {
            question_papers: true,
            upload_requests: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Not Found', message: 'Course not found.' });
    }

    // Validate scope
    if (!isSuper && course.program.department_id !== adminDeptId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to delete courses outside your assigned department.',
      });
    }

    // If question papers or upload requests exist, soft delete
    if (course._count.question_papers > 0 || course._count.upload_requests > 0) {
      const deactivated = await prisma.course.update({
        where: { id: course.id },
        data: { is_active: false },
      });

      await prisma.auditLog.create({
        data: {
          actor_user_id: req.user.id,
          action: 'COURSE_DEACTIVATED',
          entity_type: 'COURSE',
          entity_id: course.id,
          department_id: course.program.department_id,
          details: JSON.stringify({
            course_code: course.course_code,
            reason: 'Deactivated due to existing question archives',
          }),
        },
      });

      return res.json({
        message: 'Course deactivated successfully as questions are archived under this course.',
        course: deactivated,
      });
    }

    // Otherwise, hard delete
    await prisma.course.delete({ where: { id: course.id } });

    await prisma.auditLog.create({
      data: {
        actor_user_id: req.user.id,
        action: 'COURSE_DELETED',
        entity_type: 'COURSE',
        entity_id: course.id,
        department_id: course.program.department_id,
        details: JSON.stringify({ course_code: course.course_code }),
      },
    });

    return res.json({ message: 'Course deleted successfully.' });
  } catch (err) {
    console.error('deleteCourse error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to delete course.' });
  }
}
