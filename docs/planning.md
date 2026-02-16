# Secure Task Management System - Implementation Plan

## Project Context

**Assessment:** TurboVets Full Stack Coding Challenge
**Objective:** Build a Secure Task Management System with role-based access control (RBAC) in a modular NX monorepo.
**Time Limit:** ~8 hours (full completion not expected — focus on correctness, security, and clear reasoning)
**Submission:** Via Google Form + up to 10-min video walkthrough

### Tech Stack
- **Monorepo:** NX 22.5
- **Backend:** NestJS + SQLite Cloud (sqlitecloud.io) via `@sqlitecloud/drivers` (replaced TypeORM)
- **Frontend:** Angular 21 + TailwindCSS
- **Auth:** JWT (real, not mocked) via `@nestjs/passport` + `passport-jwt` + `bcrypt`
- **Shared Libs:** `@kprajapati/data` (interfaces/DTOs), `@kprajapati/auth` (RBAC logic)

### Key Requirements
- 3 roles: Owner > Admin > Viewer (with inheritance)
- 2-level organization hierarchy (parent → child)
- Task CRUD scoped by role and organization
- Audit logging (Owner/Admin only)
- Responsive UI with drag-and-drop
- Jest tests for backend and frontend
- Comprehensive README (ERD, API docs, architecture, future considerations)

### Seed Users (all password: `password123`)
| Email              | Role   | Organization      |
|--------------------|--------|-------------------|
| owner@acme.com     | Owner  | Acme Corp (parent)|
| admin@acme.com     | Admin  | Acme Engineering  |
| viewer@acme.com    | Viewer | Acme Engineering  |

---

## Phase 1: NX Workspace Setup [DONE]

- Created NX monorepo with `apps` preset
- Generated NestJS backend app (`apps/api`)
- Generated Angular frontend app (`apps/dashboard`) with routing
- Generated shared libraries (`libs/data`, `libs/auth`)
- Configured TailwindCSS for dashboard
- Installed core backend deps (TypeORM, JWT, Passport, bcrypt, class-validator)
- Created `.env.example` for API config
- Added npm scripts: `start`, `start:api`, `start:dashboard`, `build`
- Fixed Angular tsconfig overrides for `composite`/`emitDeclarationOnly`/`dom` lib

---

## Phase 2: Shared Data Models (`libs/data`) [DONE]

Created in `libs/data/src/lib/`:
- **Enums:** `Role` (Owner/Admin/Viewer), `TaskStatus` (Todo/InProgress/Done), `TaskCategory` (Work/Personal), `AuditAction`
- **Interfaces:** `IUser`, `IUserPublic`, `IOrganization`, `ITask`, `IAuditLog`
- **DTOs:** `LoginDto`, `RegisterDto`, `AuthResponseDto`, `CreateTaskDto`, `UpdateTaskDto`
- Used `export type` for interfaces (required by `isolatedModules`)

---

## Phase 3: Auth Library (`libs/auth`) [DONE]

Created in `libs/auth/src/lib/`:
- **permissions.ts** — `Permission` enum (CreateTask, ReadTask, UpdateTask, DeleteTask, ViewAuditLog, ManageUsers)
- **role-hierarchy.ts** — `getRoleRank()`, `isRoleAtLeast()` — Owner(3) > Admin(2) > Viewer(1)
- **role-permissions.ts** — role-to-permission mapping, `hasPermission()`, `getPermissionsForRole()`
- **org-access.ts** — `canAccessOrganization()` — same org always allowed, Owner can access child orgs
- Added `@kprajapati/data` as dependency of auth lib

---

## Phase 4: Backend - Database & Entities (`apps/api`) [DONE]

Created in `apps/api/src/app/`:
- **entities/** — `Organization`, `User`, `Task`, `AuditLog` with full TypeORM relations
  - Organization: self-referencing parent/children for 2-level hierarchy
  - User: belongs to Organization, has many Tasks (assigned + created) and AuditLogs
  - Task: belongs to User (assignee + creator) and Organization
  - AuditLog: belongs to User
- **database/database.module.ts** — TypeORM config with SQLite, auto-sync enabled
- **database/seed.service.ts** — Seeds 2 orgs + 3 users on first run (OnModuleInit)
- Updated `AppModule` to import `DatabaseModule`
- SQLite Cloud database via `SQLITECLOUD_URL`

---

## Phase 5: Backend - Authentication [DONE]

- AuthModule with JWT strategy (`@nestjs/passport` + `passport-jwt`)
- `POST /auth/register` — hash password with bcrypt, create user
  - added org existence check (returns 400 if org not found)
- `POST /auth/login` — validate credentials, return JWT
- JwtAuthGuard — protect all task/audit endpoints (added guard, not yet applied)
- JWT payload: `{ sub: userId, role, organizationId }`
- JWT config centralized in `jwt.constants.ts`
- `.env` loading enabled via `dotenv/config`
- Added global ValidationPipe (`whitelist` + `forbidNonWhitelisted`)
- Install ran; tests attempted but Nx daemon/plugin errors (see notes below)

**Testing note:** `npx nx test api` failed due to Nx daemon socket EPERM; `NX_DAEMON=false` still failed to load Nx plugins. Pending investigation or a pinned Node/Nx config.

---

## Phase 6: Backend - RBAC Guards & Decorators [DONE]

- `@Roles()` decorator to annotate endpoints
- `@Permissions()` decorator to annotate endpoints
- RolesGuard — checks user role against required roles (hierarchy aware)
- PermissionsGuard — checks role-permission mapping
- Ownership/org scoping to be enforced in Phase 7 (task queries + guards)

---

## Phase 7: Backend - Task CRUD API [DONE]

- `POST /tasks` — create task (permission-guarded; Admin/Owner by default)
- `GET /tasks` — list tasks scoped by role/org (Owner sees child orgs)
- `PUT /tasks/:id` — edit task (Admin/Owner, or creator if role permissions allow)
- `DELETE /tasks/:id` — delete task (Admin/Owner)
- Request validation with `class-validator`
- Auto audit logging on every mutation

---

## Phase 8: Backend - Audit Log [DONE]

- AuditLog service to log actions
- `GET /audit-log` — permission-guarded (Owner/Admin by default)

---

## Phase 9: Backend - Tests

- Auth service tests (register, login, JWT)
- RBAC guard tests (role checks, org scoping)
- Task controller tests (CRUD + permission enforcement)

---

## Phase 10: Frontend - Auth UI [DONE]

- Login page with form (email + password)
- Auth service: call `/auth/login`, store JWT in localStorage
- HTTP interceptor to attach `Authorization: Bearer <token>`
- Auth guard on routes (redirect to login if unauthenticated)

---

## Phase 11: Frontend - Task Dashboard [DONE]

- Task list component with filter/category controls + search
- Create/edit task modal/dialog
- Delete with confirmation
- Drag-and-drop for status changes (HTML5 DnD)
- Responsive layout with TailwindCSS (mobile-first)

---

## Phase 12: Frontend - State Management [DONE]

- Use Angular signals for task state
- Centralized task service managing CRUD operations + local state

---

## Phase 13: Frontend - Audit Log View [DONE]

- Audit log page (visible only to Owner/Admin)
- Table showing action, user, resource, timestamp

---

## Phase 14: Frontend - Tests

- Component tests for login, task list, task form
- Service tests for auth and task services

---

## Phase 15: Bonus Features (if time permits)

- Dark/light mode toggle (Tailwind `dark:` classes)
- Task completion bar chart (simple CSS or lightweight chart lib)
- Keyboard shortcuts (Ctrl+N for new task, Delete key, etc.)

---

## Phase 16: Documentation

- Update README with:
  - Architecture overview + NX rationale
  - ERD / data model diagram (ASCII or Mermaid)
  - API endpoint docs with sample requests/responses
  - Access control explanation
  - Future considerations (refresh tokens, CSRF, RBAC caching, scaling)
