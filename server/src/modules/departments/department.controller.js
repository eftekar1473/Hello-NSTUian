import { prisma } from '../../services/prisma.js';

export async function getDepartments(req, res) {
  try {
    const departments = await prisma.department.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            question_papers: {
              where: { publication_status: 'published' },
            },
          },
        },
        programs: {
          select: {
            id: true,
            program_name: true,
            program_code: true,
            _count: {
              select: { courses: true },
            },
          },
        },
      },
    });

    const formatted = departments.map((d) => ({
      id: d.id,
      department_code: d.department_code,
      name: d.name,
      abbreviation: d.abbreviation,
      description: d.description,
      icon_url: d.icon_url,
      programs: d.programs,
      total_courses: d.programs.reduce((acc, p) => acc + p._count.courses, 0),
      total_questions: d._count.question_papers,
    }));

    return res.json({ departments: formatted });
  } catch (err) {
    console.error('getDepartments error:', err);
    return res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch departments.',
      details: err.message,
    });
  }
}

export async function getDepartmentById(req, res) {
  try {
    const { id } = req.params;
    const department = await prisma.department.findFirst({
      where: {
        OR: [{ id }, { department_code: id }],
        is_active: true,
      },
      include: {
        programs: {
          include: {
            semesters: {
              orderBy: { semester_number: 'asc' },
              include: {
                courses: {
                  where: { is_active: true },
                  orderBy: { course_code: 'asc' },
                  include: {
                    _count: {
                      select: {
                        question_papers: {
                          where: { publication_status: 'published' },
                        },
                      },
                    },
                  },
                },
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
    });

    if (!department) {
      return res.status(404).json({ error: 'Not Found', message: 'Department not found.' });
    }

    return res.json({ department });
  } catch (err) {
    console.error('getDepartmentById error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch department details.' });
  }
}

export async function getDepartmentSessions(req, res) {
  try {
    const sessions = await prisma.universitySession.findMany({
      where: { is_active: true },
      orderBy: { start_year: 'desc' },
    });
    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch sessions.' });
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, department_code, abbreviation, description } = req.body;
    let icon_url = req.body.icon_url;

    if (req.file) {
      icon_url = `/storage/${req.file.filename}`;
    }

    if (!icon_url || !icon_url.trim()) {
      icon_url = '/nstu-logo.png';
    }

    if (!name || !department_code) {
      return res.status(400).json({ error: 'Bad Request', message: 'Department name and department code are required.' });
    }

    const existing = await prisma.department.findUnique({
      where: { department_code: department_code.trim() },
    });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: `Department code ${department_code} already exists.` });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        department_code: department_code.trim(),
        abbreviation: abbreviation ? abbreviation.trim().toUpperCase() : null,
        description: description ? description.trim() : null,
        icon_url: icon_url.trim(),
      },
    });

    // Create default Academic Program & 8 Semesters for convenient course additions
    const progCode = abbreviation ? abbreviation.trim().toUpperCase() : department_code.trim();
    const program = await prisma.academicProgram.create({
      data: {
        department_id: department.id,
        program_name: `Bachelor of Science in ${department.name}`,
        program_code: `BS-${progCode}`,
      },
    });

    for (let i = 1; i <= 8; i++) {
      await prisma.semester.create({
        data: {
          program_id: program.id,
          semester_number: i,
          semester_name: `Semester ${i}`,
        },
      });
    }

    return res.status(201).json({ message: 'Department created successfully.', department });
  } catch (err) {
    console.error('createDepartment error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to create department.' });
  }
}

export async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, abbreviation, description } = req.body;
    let icon_url = req.body.icon_url;

    if (req.file) {
      icon_url = `/storage/${req.file.filename}`;
    }

    const data = {};
    if (name) data.name = name.trim();
    if (abbreviation) data.abbreviation = abbreviation.trim().toUpperCase();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (icon_url !== undefined) {
      data.icon_url = icon_url ? icon_url.trim() : '/nstu-logo.png';
    }

    const updated = await prisma.department.update({
      where: { id },
      data,
    });

    return res.json({ message: 'Department updated successfully.', department: updated });
  } catch (err) {
    console.error('updateDepartment error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update department.' });
  }
}
