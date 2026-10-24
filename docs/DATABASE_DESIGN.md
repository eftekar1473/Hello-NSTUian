# Hello NSTUian — Database Design & Entity Relationship

Database Engine: **PostgreSQL** (with zero-config SQLite mode for local development).
ORM: **Prisma ORM**

---

## 1. Entity Relationship Overview

```
Department (1) ───< AcademicProgram (N) ───< Semester (N) ───< Course (N)
     │                                                             │
     ├────────────────────────────────────────┐                    │
     │                                        │                    │
     ▼                                        ▼                    ▼
AdminPermission (N)                     QuestionPaper (N) <────────┘
     ▲                                        │
     │                                        ├────< QuestionPaperVersion (N)
User (1) ─────────────────────────────────────┼────< CorrectionRequest (N)
     │                                        └────< UploadRequest (N)
     ▼
AuditLog (N)
```

---

## 2. Table Specifications

### `departments`
- `id`: String (UUID, PK)
- `department_code`: String (Unique, e.g., `"25"` for IIT)
- `name`: String (e.g., `"Institute of Information Technology"`)
- `abbreviation`: String? (e.g., `"IIT"`)
- `description`: String?
- `icon_url`: String?
- `is_active`: Boolean (default: true)
- `created_at`, `updated_at`: DateTime

### `academic_programs`
- `id`: String (UUID, PK)
- `department_id`: String (FK -> `departments.id`)
- `program_name`: String (e.g., `"Bachelor of Science in Information Technology"`)
- `program_code`: String (e.g., `"BSIT"`)
- `is_active`: Boolean (default: true)

### `semesters`
- `id`: String (UUID, PK)
- `program_id`: String (FK -> `academic_programs.id`)
- `semester_number`: Int (1–8)
- `semester_name`: String (e.g., `"Semester 1"`, `"Semester 3"`)
- Unique constraint: `[program_id, semester_number]`

### `courses`
- `id`: String (UUID, PK)
- `program_id`: String (FK -> `academic_programs.id`)
- `semester_id`: String (FK -> `semesters.id`)
- `course_code`: String (e.g., `"IIT 2101"`)
- `course_title`: String (e.g., `"Database Management Systems"`)
- `credit`: Float (default: 3.0)
- `is_active`: Boolean (default: true)
- Unique constraint: `[program_id, course_code]`

### `users`
- `id`: String (UUID, PK)
- `email`: String (Unique, institutional `@nstu.edu.bd`)
- `password_hash`: String
- `display_name`: String
- `student_id`: String? (e.g., `"ASH2325006M"`)
- `email_verified_at`: DateTime?
- `account_status`: String (`"ACTIVE"`, `"SUSPENDED"`, `"BLOCKED"`)

### `admin_permissions`
- `id`: String (UUID, PK)
- `user_id`: String (FK -> `users.id`)
- `role`: String (`"SUPER_ADMIN"`, `"DEPARTMENT_ADMIN"`)
- `department_id`: String? (FK -> `departments.id`, null for Super Admin)
- `assigned_by`: String?

### `question_papers`
- `id`: String (UUID, PK)
- `department_id`: String (FK -> `departments.id`)
- `course_id`: String (FK -> `courses.id`)
- `university_session_id`: String? (FK -> `university_sessions.id`)
- `exam_session_id`: String (FK -> `exam_sessions.id`)
- `exam_type_id`: String (FK -> `exam_types.id`)
- `ct_number`: Int? (1, 2, 3)
- `set_name`: String? (`"A"`, `"B"`, `"C"`)
- `title`: String?
- `publication_status`: String (`"published"`, `"archived"`)
- `current_version_id`: String?
- `created_by`: String (FK -> `users.id`)

### `question_paper_versions`
- `id`: String (UUID, PK)
- `question_paper_id`: String (FK -> `question_papers.id`)
- `version_number`: Int (1, 2, 3...)
- `storage_key`: String
- `original_filename`: String
- `mime_type`: String
- `file_size`: Int
- `sha256_hash`: String
- `change_summary`: String?

### `upload_requests`
- `id`: String (UUID, PK)
- `submitted_by`: String (FK -> `users.id`)
- `department_id`: String (FK -> `departments.id`)
- `course_id`: String (FK -> `courses.id`)
- `exam_type_id`: String (FK -> `exam_types.id`)
- `sha256_hash`: String
- `status`: String (`"pending_review"`, `"published"`, `"rejected"`, `"duplicate_flagged"`)

### `correction_requests`
- `id`: String (UUID, PK)
- `question_paper_id`: String (FK -> `question_papers.id`)
- `requested_by`: String (FK -> `users.id`)
- `description`: String
- `proposed_storage_key`: String?
- `status`: String (`"pending_review"`, `"approved"`, `"rejected"`)

### `audit_logs`
- `id`: String (UUID, PK)
- `actor_user_id`: String? (FK -> `users.id`)
- `action`: String
- `entity_type`: String
- `entity_id`: String
- `department_id`: String?
- `details`: String? (Structured JSON)
- `created_at`: DateTime
