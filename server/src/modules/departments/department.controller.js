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
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch departments.' });
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
