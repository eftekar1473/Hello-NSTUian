import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Hello NSTUian database...');

  // 1. Exam Types
  const ctType = await prisma.examType.upsert({
    where: { code: 'CT' },
    update: {},
    create: {
      code: 'CT',
      name: 'Continuous Assessment (CT)',
      requires_ct_number: true,
      is_active: true,
    },
  });

  const finalType = await prisma.examType.upsert({
    where: { code: 'SEMESTER_FINAL' },
    update: {},
    create: {
      code: 'SEMESTER_FINAL',
      name: 'Semester Final Examination',
      requires_ct_number: false,
      is_active: true,
    },
  });

  const midtermType = await prisma.examType.upsert({
    where: { code: 'MIDTERM' },
    update: {},
    create: {
      code: 'MIDTERM',
      name: 'Midterm Examination',
      requires_ct_number: false,
      is_active: true,
    },
  });

  // 2. University Sessions
  const sessionsData = [
    { session_label: '2020-2021', start_year: 2020, end_year: 2021 },
    { session_label: '2021-2022', start_year: 2021, end_year: 2022 },
    { session_label: '2022-2023', start_year: 2022, end_year: 2023 },
    { session_label: '2023-2024', start_year: 2023, end_year: 2024 },
    { session_label: '2024-2025', start_year: 2024, end_year: 2025 },
  ];

  const sessions = {};
  for (const s of sessionsData) {
    const record = await prisma.universitySession.upsert({
      where: { session_label: s.session_label },
      update: {},
      create: s,
    });
    sessions[s.session_label] = record;
  }

  // 3. Exam Sessions
  const examYears = ['2022', '2023', '2024', '2025'];
  const examSessions = {};
  for (const year of examYears) {
    const record = await prisma.examSession.upsert({
      where: { label: year },
      update: {},
      create: { label: year, academic_year: year },
    });
    examSessions[year] = record;
  }

  // 4. Departments (Explicitly ensuring Bangla, Math, English, Physics, Chemistry, and IIT)
  const departmentsData = [
    {
      department_code: '04',
      name: 'Bangla',
      abbreviation: 'BAN',
      description: 'Department of Bangla Language and Literature at NSTU.',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '02',
      name: 'Mathematics',
      abbreviation: 'MATH',
      description: 'Department of Mathematics at NSTU.',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '14',
      name: 'English',
      abbreviation: 'ENG',
      description: 'Department of English Language & Literature at NSTU.',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '03',
      name: 'Physics',
      abbreviation: 'PHY',
      description: 'Department of Physics at NSTU.',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '06',
      name: 'Chemistry',
      abbreviation: 'CHEM',
      description: 'Department of Chemistry at NSTU.',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '25',
      name: 'Institute of Information Technology',
      abbreviation: 'IIT',
      description: 'Premier institute providing high-standard education in Information Technology and Software Engineering at NSTU.',
      icon_url: '/iit-card.jpg',
    },
    {
      department_code: '01',
      name: 'Applied Chemistry & Chemical Engineering',
      abbreviation: 'ACCE',
      description: 'Department of Applied Chemistry & Chemical Engineering',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '05',
      name: 'Biotechnology and Genetic Engineering',
      abbreviation: 'BGE',
      description: 'Department of Biotechnology and Genetic Engineering',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '11',
      name: 'Computer Science & Telecommunication Engineering',
      abbreviation: 'CSTE',
      description: 'Department of Computer Science & Telecommunication Engineering',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '12',
      name: 'Electrical & Electronic Engineering',
      abbreviation: 'EEE',
      description: 'Department of Electrical & Electronic Engineering',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '15',
      name: 'Fisheries & Marine Science',
      abbreviation: 'FIMS',
      description: 'Department of Fisheries & Marine Science',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '26',
      name: 'Microbiology',
      abbreviation: 'MICRO',
      description: 'Department of Microbiology',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '28',
      name: 'Pharmacy',
      abbreviation: 'PHARM',
      description: 'Department of Pharmacy',
      icon_url: '/nstu-logo.png',
    },
    {
      department_code: '30',
      name: 'Software Engineering',
      abbreviation: 'SE',
      description: 'Department of Software Engineering',
      icon_url: '/nstu-logo.png',
    },
  ];

  const departments = {};
  for (const dept of departmentsData) {
    const record = await prisma.department.upsert({
      where: { department_code: dept.department_code },
      update: dept,
      create: dept,
    });
    departments[dept.department_code] = record;
  }

  const iit = departments['25'];

  // Helper to setup academic programs, 8 semesters, and sample courses
  async function setupDepartmentCurriculum(dept, programCode, programName, sampleCoursesList) {
    const prog = await prisma.academicProgram.upsert({
      where: { id: `prog-${dept.department_code}` },
      update: {},
      create: {
        id: `prog-${dept.department_code}`,
        department_id: dept.id,
        program_name: programName,
        program_code: programCode,
      },
    });

    const sems = {};
    for (let i = 1; i <= 8; i++) {
      sems[i] = await prisma.semester.upsert({
        where: {
          program_id_semester_number: {
            program_id: prog.id,
            semester_number: i,
          },
        },
        update: {},
        create: {
          program_id: prog.id,
          semester_number: i,
          semester_name: `Semester ${i}`,
        },
      });
    }

    const createdCourses = {};
    for (const c of sampleCoursesList) {
      const crs = await prisma.course.upsert({
        where: {
          program_id_course_code: {
            program_id: prog.id,
            course_code: c.course_code,
          },
        },
        update: {},
        create: {
          program_id: prog.id,
          semester_id: sems[c.semester].id,
          course_code: c.course_code,
          course_title: c.course_title,
          credit: c.credit || 3.0,
        },
      });
      createdCourses[c.course_code] = crs;
    }

    return { program: prog, semesters: sems, courses: createdCourses };
  }

  // Setup curriculum for Bangla, Math, English, Physics, Chemistry
  await setupDepartmentCurriculum(
    departments['04'],
    'BA-BAN',
    'Bachelor of Arts in Bangla',
    [
      { semester: 1, course_code: 'BAN 1101', course_title: 'History of Bangla Literature (Ancient & Medieval)' },
      { semester: 1, course_code: 'BAN 1102', course_title: 'Bangla Poetry & Drama' },
      { semester: 2, course_code: 'BAN 1201', course_title: 'Bangla Novel and Short Story' },
      { semester: 3, course_code: 'BAN 2101', course_title: 'Bengali Linguistics & Phonetics' },
      { semester: 4, course_code: 'BAN 2201', course_title: 'Bangla Essays & Literary Criticism' },
    ]
  );

  await setupDepartmentCurriculum(
    departments['02'],
    'BS-MATH',
    'Bachelor of Science in Mathematics',
    [
      { semester: 1, course_code: 'MATH 1101', course_title: 'Calculus I & Analytical Geometry' },
      { semester: 1, course_code: 'MATH 1102', course_title: 'Fundamental Mathematics & Algebra' },
      { semester: 2, course_code: 'MATH 1201', course_title: 'Linear Algebra & Vector Analysis' },
      { semester: 3, course_code: 'MATH 2101', course_title: 'Ordinary Differential Equations' },
      { semester: 4, course_code: 'MATH 2201', course_title: 'Numerical Analysis & Programming' },
    ]
  );

  await setupDepartmentCurriculum(
    departments['14'],
    'BA-ENG',
    'Bachelor of Arts in English',
    [
      { semester: 1, course_code: 'ENG 1101', course_title: 'Introduction to Poetry and Drama' },
      { semester: 1, course_code: 'ENG 1102', course_title: 'English Reading and Writing Skills' },
      { semester: 2, course_code: 'ENG 1201', course_title: '16th and 17th Century Literature' },
      { semester: 3, course_code: 'ENG 2101', course_title: 'Romantic and Victorian Literature' },
      { semester: 4, course_code: 'ENG 2201', course_title: 'Modern and Contemporary English Literature' },
    ]
  );

  await setupDepartmentCurriculum(
    departments['03'],
    'BS-PHY',
    'Bachelor of Science in Physics',
    [
      { semester: 1, course_code: 'PHY 1101', course_title: 'Mechanics, Properties of Matter & Waves' },
      { semester: 1, course_code: 'PHY 1102', course_title: 'Thermal Physics and Thermodynamics' },
      { semester: 2, course_code: 'PHY 1201', course_title: 'Electricity, Magnetism and Optics' },
      { semester: 3, course_code: 'PHY 2101', course_title: 'Modern Physics & Quantum Mechanics' },
      { semester: 4, course_code: 'PHY 2201', course_title: 'Solid State Physics & Electronics' },
    ]
  );

  await setupDepartmentCurriculum(
    departments['06'],
    'BS-CHEM',
    'Bachelor of Science in Chemistry',
    [
      { semester: 1, course_code: 'CHEM 1101', course_title: 'General & Inorganic Chemistry I' },
      { semester: 1, course_code: 'CHEM 1102', course_title: 'Physical Chemistry I' },
      { semester: 2, course_code: 'CHEM 1201', course_title: 'Organic Chemistry I' },
      { semester: 3, course_code: 'CHEM 2101', course_title: 'Inorganic Chemistry II & Coordination Chemistry' },
      { semester: 4, course_code: 'CHEM 2201', course_title: 'Analytical Chemistry & Spectroscopy' },
    ]
  );

  // 5. Academic Program for IIT
  const bsitProgram = await prisma.academicProgram.upsert({
    where: { id: 'bsit-program-iit' },
    update: {},
    create: {
      id: 'bsit-program-iit',
      department_id: iit.id,
      program_name: 'Bachelor of Science in Information Technology (BSIT)',
      program_code: 'BSIT',
    },
  });

  // 6. Semesters for IIT (1 to 8)
  const semesters = {};
  for (let i = 1; i <= 8; i++) {
    const sem = await prisma.semester.upsert({
      where: {
        program_id_semester_number: {
          program_id: bsitProgram.id,
          semester_number: i,
        },
      },
      update: {},
      create: {
        program_id: bsitProgram.id,
        semester_number: i,
        semester_name: `Semester ${i}`,
      },
    });
    semesters[i] = sem;
  }

  // 7. Key Courses for IIT
  const coursesData = [
    // Sem 1
    { semester: 1, course_code: 'IIT 1101', course_title: 'Introduction to Information Technology', credit: 3.0 },
    { semester: 1, course_code: 'IIT 1102', course_title: 'Structured Programming Language', credit: 3.0 },
    { semester: 1, course_code: 'IIT 1103', course_title: 'Discrete Mathematics', credit: 3.0 },
    // Sem 2
    { semester: 2, course_code: 'IIT 1201', course_title: 'Object Oriented Programming', credit: 3.0 },
    { semester: 2, course_code: 'IIT 1202', course_title: 'Data Structures and Algorithms I', credit: 3.0 },
    { semester: 2, course_code: 'IIT 1203', course_title: 'Digital Logic Design', credit: 3.0 },
    // Sem 3
    { semester: 3, course_code: 'IIT 2101', course_title: 'Database Management Systems', credit: 3.0 },
    { semester: 3, course_code: 'IIT 2102', course_title: 'Design and Analysis of Algorithms', credit: 3.0 },
    { semester: 3, course_code: 'IIT 2103', course_title: 'Computer Architecture and Organization', credit: 3.0 },
    // Sem 4
    { semester: 4, course_code: 'IIT 2201', course_title: 'Web Engineering', credit: 3.0 },
    { semester: 4, course_code: 'IIT 2202', course_title: 'Operating Systems', credit: 3.0 },
    { semester: 4, course_code: 'IIT 2203', course_title: 'Data Communication & Networking', credit: 3.0 },
    // Sem 5
    { semester: 5, course_code: 'IIT 3101', course_title: 'Software Engineering & Design Patterns', credit: 3.0 },
    { semester: 5, course_code: 'IIT 3102', course_title: 'Information and Cyber Security', credit: 3.0 },
    // Sem 6
    { semester: 6, course_code: 'IIT 3201', course_title: 'Artificial Intelligence', credit: 3.0 },
    { semester: 6, course_code: 'IIT 3202', course_title: 'Mobile Application Development', credit: 3.0 },
    // Sem 7
    { semester: 7, course_code: 'IIT 4101', course_title: 'Cloud Computing & DevOps', credit: 3.0 },
    { semester: 7, course_code: 'IIT 4102', course_title: 'Machine Learning', credit: 3.0 },
    // Sem 8
    { semester: 8, course_code: 'IIT 4201', course_title: 'IT Project & Thesis', credit: 6.0 },
    { semester: 8, course_code: 'IIT 4202', course_title: 'Software Project Management', credit: 3.0 },
  ];

  const courses = {};
  for (const c of coursesData) {
    const course = await prisma.course.upsert({
      where: {
        program_id_course_code: {
          program_id: bsitProgram.id,
          course_code: c.course_code,
        },
      },
      update: {},
      create: {
        program_id: bsitProgram.id,
        semester_id: semesters[c.semester].id,
        course_code: c.course_code,
        course_title: c.course_title,
        credit: c.credit,
      },
    });
    courses[c.course_code] = course;
  }

  // 8. Users & Roles
  const passwordHash = await bcrypt.hash('NstuAdmin@2026', 10);
  const studentPasswordHash = await bcrypt.hash('Student@2026', 10);

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@nstu.edu.bd' },
    update: {},
    create: {
      email: 'superadmin@nstu.edu.bd',
      display_name: 'NSTU Super Administrator',
      password_hash: passwordHash,
      email_verified_at: new Date(),
      account_status: 'ACTIVE',
      auth_provider: 'LOCAL',
    },
  });

  await prisma.adminPermission.upsert({
    where: {
      user_id_role_department_id: {
        user_id: superAdmin.id,
        role: 'SUPER_ADMIN',
        department_id: '',
      },
    },
    update: {},
    create: {
      user_id: superAdmin.id,
      role: 'SUPER_ADMIN',
      department_id: null,
      assigned_by: 'SYSTEM_INIT',
    },
  });

  // Department Admin for IIT
  const iitAdmin = await prisma.user.upsert({
    where: { email: 'iitadmin@nstu.edu.bd' },
    update: {},
    create: {
      email: 'iitadmin@nstu.edu.bd',
      display_name: 'IIT Department Admin',
      password_hash: passwordHash,
      email_verified_at: new Date(),
      account_status: 'ACTIVE',
      auth_provider: 'LOCAL',
    },
  });

  await prisma.adminPermission.upsert({
    where: {
      user_id_role_department_id: {
        user_id: iitAdmin.id,
        role: 'DEPARTMENT_ADMIN',
        department_id: iit.id,
      },
    },
    update: {},
    create: {
      user_id: iitAdmin.id,
      role: 'DEPARTMENT_ADMIN',
      department_id: iit.id,
      assigned_by: superAdmin.id,
    },
  });

  // Student Contributor (ABC0011222M / @student.nstu.edu.bd)
  const student = await prisma.user.upsert({
    where: { email: 'abc0011222m@student.nstu.edu.bd' },
    update: {
      student_id: 'ABC0011222M',
      display_name: 'NSTU Contributor (ABC0011222M)',
    },
    create: {
      email: 'abc0011222m@student.nstu.edu.bd',
      display_name: 'NSTU Contributor (ABC0011222M)',
      student_id: 'ABC0011222M',
      password_hash: studentPasswordHash,
      email_verified_at: new Date(),
      account_status: 'ACTIVE',
      auth_provider: 'LOCAL',
    },
  });

  // Also maintain alias for test backward compatibility
  await prisma.user.upsert({
    where: { email: 'ash2325006m@nstu.edu.bd' },
    update: { student_id: 'ABC0011222M' },
    create: {
      email: 'ash2325006m@nstu.edu.bd',
      display_name: 'NSTU Contributor (ABC0011222M)',
      student_id: 'ABC0011222M',
      password_hash: studentPasswordHash,
      email_verified_at: new Date(),
      account_status: 'ACTIVE',
      auth_provider: 'LOCAL',
    },
  });

  // 9. Sample Question Papers & Initial Versions
  const dbmsCourse = courses['IIT 2101'];
  const seCourse = courses['IIT 3101'];
  const session2223 = sessions['2022-2023'];
  const session2324 = sessions['2023-2024'];
  const examYear2024 = examSessions['2024'];

  // CT-1 Set A Question Paper (DBMS)
  const qp1 = await prisma.questionPaper.upsert({
    where: { id: 'qp-iit-dbms-ct1' },
    update: {},
    create: {
      id: 'qp-iit-dbms-ct1',
      department_id: iit.id,
      course_id: dbmsCourse.id,
      university_session_id: session2223.id,
      exam_session_id: examYear2024.id,
      exam_type_id: ctType.id,
      ct_number: 1,
      set_name: 'A',
      title: 'Database Management Systems - CT 1 (Set A)',
      description: 'Covers Relational Algebra, ER Modeling, and Basic SQL.',
      publication_status: 'published',
      created_by: student.id,
    },
  });

  const v1 = await prisma.questionPaperVersion.upsert({
    where: { id: 'ver-iit-dbms-ct1' },
    update: {},
    create: {
      id: 'ver-iit-dbms-ct1',
      question_paper_id: qp1.id,
      version_number: 1,
      storage_key: 'samples/iit_2101_ct1_setA_2024.pdf',
      file_url: '/samples/sample-exam-paper.pdf',
      original_filename: 'IIT2101_DBMS_CT1_SetA_2024.pdf',
      mime_type: 'application/pdf',
      file_size: 148520,
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      created_by: student.id,
      change_summary: 'Initial publication',
    },
  });

  await prisma.questionPaper.update({
    where: { id: qp1.id },
    data: { current_version_id: v1.id },
  });

  // REQUIREMENT 4: Use 3rd image as a ques paper and create a full set for Institute of Information Technology
  const qpIIT_CT1 = await prisma.questionPaper.upsert({
    where: { id: 'qp-iit-se-ct1-fullset' },
    update: {},
    create: {
      id: 'qp-iit-se-ct1-fullset',
      department_id: iit.id,
      course_id: seCourse.id,
      university_session_id: session2324.id,
      exam_session_id: examYear2024.id,
      exam_type_id: ctType.id,
      ct_number: 1,
      set_name: 'Full Set',
      title: 'Software Engineering - CT 1 (Full Set: Software Metrics)',
      description: `CT-1 Full Examination Set:
1. Define software metrics and describe their importance in evaluating the quality and progress of a software development project with examples.
2. Why is measurement essential in software engineering? Discuss how it helps project managers and developers in making decisions.
3. What do you understand by the Maintainability Index and Cyclomatic Complexity? Explain how they contribute to evaluating the quality of software code.
4. What is measurement theory in the context of software engineering? Explain its importance.
5. Differentiate between direct and derived measurements in software engineering. Explain how they are applied in practice.
6. Why are measures of central tendency (mean, median, mode) and variability (range, variance, standard deviation) important in software metrics? Give examples of how they can be applied in evaluating software quality.`,
      publication_status: 'published',
      created_by: student.id,
    },
  });

  const vIIT_CT1 = await prisma.questionPaperVersion.upsert({
    where: { id: 'ver-iit-se-ct1-fullset' },
    update: {},
    create: {
      id: 'ver-iit-se-ct1-fullset',
      question_paper_id: qpIIT_CT1.id,
      version_number: 1,
      storage_key: 'uploads/iit-se-ct1-question.jpg',
      file_url: '/iit-se-ct1-question.jpg',
      original_filename: 'IIT3101_SoftwareEngineering_CT1_FullSet.jpg',
      mime_type: 'image/jpeg',
      file_size: 154200,
      sha256_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      created_by: student.id,
      change_summary: 'CT-1 Full Set with complete software metrics questions',
    },
  });

  await prisma.questionPaper.update({
    where: { id: qpIIT_CT1.id },
    data: { current_version_id: vIIT_CT1.id },
  });

  // Semester Final Question Paper
  const qp2 = await prisma.questionPaper.upsert({
    where: { id: 'qp-iit-dbms-final' },
    update: {},
    create: {
      id: 'qp-iit-dbms-final',
      department_id: iit.id,
      course_id: dbmsCourse.id,
      university_session_id: session2223.id,
      exam_session_id: examYear2024.id,
      exam_type_id: finalType.id,
      title: 'Database Management Systems - Semester Final Examination',
      description: 'Comprehensive 70-mark semester final question paper.',
      publication_status: 'published',
      created_by: student.id,
    },
  });

  const v2 = await prisma.questionPaperVersion.upsert({
    where: { id: 'ver-iit-dbms-final' },
    update: {},
    create: {
      id: 'ver-iit-dbms-final',
      question_paper_id: qp2.id,
      version_number: 1,
      storage_key: 'samples/iit_2101_final_2024.pdf',
      file_url: '/samples/sample-exam-paper.pdf',
      original_filename: 'IIT2101_DBMS_Final_2024.pdf',
      mime_type: 'application/pdf',
      file_size: 324100,
      sha256_hash: 'cca7084a7977da3e028bcdd0f340f1a4e15640236a9cf1c26027a42ec34c1111',
      created_by: student.id,
      change_summary: 'Initial publication',
    },
  });

  await prisma.questionPaper.update({
    where: { id: qp2.id },
    data: { current_version_id: v2.id },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
