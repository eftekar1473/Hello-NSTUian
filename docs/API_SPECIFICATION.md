# Hello NSTUian — REST API Specification

Base URL: `/api/v1`

---

## 1. Public Endpoints

### `GET /departments`
Returns an alphabetical (A–Z) list of active NSTU departments with course and paper counts.

### `GET /departments/:id`
Returns full department details, curriculum programs, 8 semesters, and associated courses. `id` can be either the UUID or `department_code` (e.g. `25` for IIT).

### `GET /departments/:id/sessions`
Returns university admission sessions (e.g. 2020-2021, 2021-2022, 2022-2023, 2023-2024).

### `GET /courses/:courseId/questions`
Query parameters:
- `examTypeId` (optional)
- `examSessionId` (optional)
Returns published question papers for the course, including CT-1, CT-2, CT-3 (Sets A, B, C...) and Semester Finals.

### `GET /questions/:id`
Returns full question paper metadata, active version info, uploader details, and version history.

### `GET /questions/:id/download`
Delivers the official published document with appropriate `Content-Disposition` and MIME headers.

### `GET /search`
Query parameters:
- `q`: search keyword
- `departmentId`: filter by department
- `semesterNumber`: filter by semester 1–8
- `examTypeId`: filter by exam type
Returns matching departments, courses, and question papers.

---

## 2. Authentication Endpoints

### `POST /auth/register`
Body:
- `email`: string (must end with `@nstu.edu.bd`)
- `password`: string (min 6 characters)
- `displayName`: string
- `studentId`: string (optional, e.g. `ABC0011222M`)
Returns JWT bearer token and user profile.

### `POST /auth/login`
Body:
- `email`: string
- `password`: string
Returns JWT bearer token, user profile, and administrative roles.

### `GET /auth/me`
Requires `Authorization: Bearer <token>`.
Returns current authenticated user and assigned permissions.

---

## 3. Contributor Endpoints

Requires `Authorization: Bearer <token>` and verified EduMail.

### `POST /uploads` (Multipart Form)
Fields:
- `departmentId`: UUID
- `courseId`: UUID
- `universitySessionId`: UUID (optional)
- `examSessionId`: string (Year)
- `examTypeId`: string
- `ctNumber`: integer 1–3 (if CT)
- `setName`: string (if CT, e.g. 'A', 'B')
- `title`: string (optional)
- `description`: string (optional)
- `file`: binary file (PDF, PNG, JPG, WebP, DOCX)

**Behavior:**
- Automatically checks for duplicates (SHA-256 hash & academic metadata).
- If genuinely new: **Automatically publishes** (Status: `published`, HTTP 201).
- If potential duplicate: **Queues for admin review** (Status: `duplicate_flagged`, HTTP 202).

### `GET /uploads/my`
Returns the contributor's upload history and review status.

### `POST /correction-requests` (Multipart Form)
Fields:
- `questionPaperId`: UUID
- `description`: string (min 10 characters)
- `file`: binary file (optional proposed replacement)

**Behavior:**
- Leaves original live question paper published and untouched.
- Places proposal in admin review queue.

### `GET /correction-requests/my`
Returns the contributor's submitted correction requests.

---

## 4. Administration Endpoints

Requires `Authorization: Bearer <token>` and `SUPER_ADMIN` or `DEPARTMENT_ADMIN` role.

### `GET /admin/dashboard`
Returns live statistics (questions count, flagged reviews, pending corrections, assigned department scope).

### `GET /admin/uploads`
Returns flagged submissions in the review queue (scoped to admin's department).

### `POST /admin/uploads/:id/review`
Body:
- `decision`: `'APPROVE'` | `'REJECT'`
- `rejectionReason`: string (if rejected)
- `reviewNotes`: string (optional)

### `GET /admin/correction-requests`
Returns pending correction requests.

### `POST /admin/correction-requests/:id/review`
Body:
- `decision`: `'APPROVE'` | `'REJECT'`
- `reviewNotes`: string (optional)
Approving creates Version N+1 in `question_paper_versions` and updates the live question pointer.

### `GET /admin/audit-logs`
Returns the immutable audit trail of administrative actions.

### `GET /admin/users` (Super Admin Only)
Returns list of all accounts.

### `POST /admin/assign-role` (Super Admin Only)
Body:
- `userId`: UUID
- `role`: `'SUPER_ADMIN'` | `'DEPARTMENT_ADMIN'`
- `departmentId`: UUID (required for Department Admin)
