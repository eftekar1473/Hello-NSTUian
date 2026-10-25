# Hello NSTUian — Academic Question Bank 🎓

> **A modern, mobile-first academic question archive for Noakhali Science and Technology University (NSTU).**
> Built with **React + Vite + Tailwind CSS**, **Node.js + Express**, **Prisma ORM**, and **PostgreSQL** (with local zero-config SQLite development mode).

---

## 📸 Design & Visual Style

Designed following the **Futuristic IIT Glassmorphism** specification:
- Frosted glass cards with high-depth `backdrop-blur` and luminous cyan/blue neon border highlights.
- Ambient radial lighting over a deep space-blue backdrop.
- Official Institute of Information Technology (IIT) emblem integrated into cards and badges.
- Smooth responsive touch layouts optimized for smartphones, tablets, and desktops.

---

## 🚀 Key Features & Business Rules

* **Public Browsing (BR-01):** Anyone can browse departments, sessions, semesters (1–8), and courses, and download or preview published questions without logging in.
* **Verified EduMail Contributions (BR-02):** Question uploads and correction requests require an active, verified account with an `@nstu.edu.bd` email.
* **Auto-Publication (BR-03):** Genuinely new, non-duplicate question papers submitted by verified contributors are **automatically published** to the question bank.
* **Duplicate Detection (BR-05):** Multi-factor duplicate matching using department, course, exam type, CT set, year, and **SHA-256 file hashing**. Flagged submissions are quarantined for admin review.
* **Controlled Correction Workflow (BR-04 & BR-12):** Verified students can request corrections or propose replacement files. Live question papers remain published and untouched while proposals enter the review queue.
* **Role-Based Scoped Administration (BR-06, BR-07, BR-08):**
  * **Super Admin:** Global authority across all departments, system settings, user management, and full audit trail access.
  * **Department Admin:** Scoped strictly to their assigned department (e.g., IIT = Dept Code `25`). Cannot modify another department's records.
* **Full Audit Logging (BR-11):** Every publication, approval, rejection, and role assignment is permanently recorded in the `audit_logs` table.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + Vite | Tailwind CSS, Lucide Icons, Glassmorphic UI, React Router v7 |
| **Backend** | Node.js + Express.js | REST API (/api/v1), Helmet, CORS, Morgan, Rate Limiting |
| **ORM & Database** | Prisma ORM | PostgreSQL (production) / SQLite (`dev.db` for zero-config local dev) |
| **Validation** | Zod | Server-side metadata and input schema validation |
| **Security & Auth** | JWT + bcryptjs | NSTU EduMail domain enforcement, role authorization middleware |
| **Testing** | Vitest + Supertest | Automated test coverage for APIs, security rules, and workflows |

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- Node.js (v18+ or v24+)
- npm (v9+)

### 2. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm run install:all
```

### 3. Initialize & Seed Database
```bash
# Push schema and seed NSTU departments (including IIT ID 25), courses, and initial papers
npm run prisma:push --prefix server
npm run prisma:seed --prefix server
```

### 4. Run Development Servers
In two separate terminals (or with your preferred task runner):

**Terminal 1 (Backend API):**
```bash
npm run dev --prefix server
# API running at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev --prefix client
# Vite app accessible at http://localhost:5173
```

---

## 🧪 Running Automated Tests

Run the backend test suite verifying authentication, RBAC, duplicate hashing, auto-publishing, and API contracts:

```bash
npm test --prefix server
```

All 16 tests execute and pass out-of-the-box.

---


## 📂 Project Structure

```text
Hello NSTUian/
├── client/                     # React + Vite Frontend
│   ├── public/                 # Static assets (iit-crest.jpeg, sample PDF)
│   ├── src/
│   │   ├── components/         # DepartmentCard, Navbar, Footer, SearchModal, Viewer
│   │   ├── context/            # AuthContext (JWT, user state, roles)
│   │   ├── pages/              # Home, Departments, DepartmentDetail, CourseDetail, Contribute, Login, Admin
│   │   ├── services/           # API fetch client
│   │   └── styles/             # Tailwind & Glassmorphism styles
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Active Prisma schema (SQLite dev / PostgreSQL prod)
│   │   ├── schema.postgresql.prisma # Dedicated PostgreSQL schema for production
│   │   └── seed.js             # Seeding departments, programs, courses, exam papers, users
│   ├── src/
│   │   ├── config/             # Environment configs & constants
│   │   ├── middleware/         # auth (JWT, EduMail) & role (Super vs Dept Admin)
│   │   ├── modules/            # auth, departments, questions, uploads, corrections, admin
│   │   ├── services/           # duplicate detector (SHA-256), storage manager
│   │   ├── validators/         # Zod schemas
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/                  # Vitest API test suite
│   └── package.json
├── docs/                       # Architecture & API specifications
├── .env.example                # Example environment variables
└── README.md
```

---

## 📜 Academic Hierarchy & ID Convention

```text
Department (A–Z) ──> Admission Session ──> Semester (1–8) ──> Course ──> Exam Session ──> Exam Paper
```

**Student ID Segment Format (e.g., `ASH2325006M`):**
- `ASH`: Hall identifier
- `23`: University admission session (2022–2023)
- `25`: Department ID (**25 = Institute of Information Technology**)
- `006`: Student roll number
- `M`: Gender identifier
