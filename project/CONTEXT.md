# Project Execution Plan & Context Specification

## 1. Project Overview
ProjectHub is a modern project management platform inspired by Asana, Jira, and Linear. It is built as a Single Page Application (SPA) with a React frontend and an ASP.NET Core Web API backend using PostgreSQL and Entity Framework Core. The architecture emphasizes robust business rules, full-stack real-time collaboration via SignalR, role-based security, and aesthetic UI styling.

## 2. Core Architectural Principles
* **Backend:** ASP.NET Core Web API (.NET 9) with Clean Architecture principles.
* **Database & ORM:** PostgreSQL with Entity Framework Core, Code-First migrations, and Fluent API configurations.
* **Authentication & Authorization:** JWT Bearer tokens with custom claims (`id`, `email`, `role`). Strict RBAC enforced on endpoints and frontend routing.
* **Real-time Pipeline:** SignalR Hub for live board synchronization, task moves, assignments, and comment notifications.
* **Frontend:** React 18+ (TypeScript), Vite, Tailwind CSS, Lucide icons, `@hello-pangea/dnd` for Kanban drag-and-drop.

## 3. Core Business Rules
* **Rule 1 (Task Deletion Restriction):** A task can only be deleted if its status is `ToDo` or if the requesting user has the `Admin` role.
* **Rule 2 (Single Critical Task Constraint):** A user cannot be assigned more than one active task with `Critical` priority at the same time across the entire system.
* **Rule 3 (Restricted Project Creation):** Only users with the `Admin` role can create new projects and workspaces. Regular users may only create tasks and add comments.

## 4. Completed Stages
### [x] Stage 1-4: Analysis, Setup, Database Design, Logic Definition
* Domain model specifications, database schema diagrams, REST API endpoints, business validation rules.

### [x] Stage 5: Backend Core Implementation
- [x] EF Core setup, Fluent API, Migrations, BCrypt, JWT.
- [x] CRUD for Workspaces, Projects, Tasks, Comments.
- [x] Domain validation for Business Rules 1, 2, and 3.
- [x] MediatR pipeline for async background notifications on @mentions.
- [x] SignalR hub infrastructure for live board synchronization.
- [x] Automatic database seeder for Admin, User, Workspace, Project, Task, and Comment.

### [x] Stage 6: Frontend Core & Integration
- [x] Authentication flows (Sliding auth view, Axios interceptors).
- [x] Workspace & Project explorer views.
- [x] Kanban board with Drag & Drop (`@hello-pangea/dnd`).
- [x] SignalR client lifecycle integration.
- [x] Global toast notifications (`react-hot-toast`) replacing flashing error states.
- [x] Frontend RBAC decoding (Admin Panel, conditional action buttons, tabbed task details).

### [x] Stage 7: Polish & Architectural Clean-Up
- [x] Standardize code styling, remove redundant comments, and enforce professional single-line English documentation.
- [x] Patch SignalR WebSockets integration (JWT URL parsing, React strict mode mounting safeguards).
- [x] Refine Role-Based Access Control (RBAC) to allow global read access while strictly locking modifications to admins.
- [x] Implement robust user assignment via dedicated PATCH endpoint.
- [x] Implement Edit and Delete functionality for Workspaces and Projects.
- [x] Introduce `ThemeColor` enums internally stored as string, seamlessly mapped to UI ribbons and tags.

### [x] Stage 8: Feature Expansion & Soft Delete Architecture
- [x] **Soft Delete Architecture**: Implement `IsDeleted` / `DeletedAt` fields across major entities. Do not permanently delete database records; update global query filters to exclude deleted items on backend and frontend.
- [x] **My Tasks View**: Implement a dedicated view displaying all tasks assigned to the current user, featuring quick links traversing `Workspace -> Project -> Task` or a unified accessible interface.
- [x] **User Management**: Implement the Administration panel for managing users (Add, Edit, Soft Delete), explicitly including a password reset/override capability for forgotten passwords.
- [x] **Settings & Profile View**: Allow users to modify their profile details (First Name, Last Name, Avatar URL). Implement system-wide user preferences including App Theme Accent Color (overriding default fiery orange) and Language selection.
- [x] **Kanban & Comments Profile Integration**:
  - Replace static "AS" placeholder avatar with real assignee avatar preset and first name display on Kanban cards.
  - Display author avatar and full name on comments instead of raw user identifiers.
- [x] **End-to-End Localization (i18n)**:
  - Backend request localization via `Accept-Language` header, localized DTO validation errors, and bilingual service exception messages.
  - Comprehensive frontend translation dictionary across all modals, pages, tabs, toasts, and dynamic browser page titles.
- [ ] **Notifications & Messaging System (New Entity)**:
  - Users receive alerts for task assignments, mentions, or comments.
  - Users can send messages/support requests directly to Administrators.
  - Administrators have a dedicated Notifications view to read and manage messages received from users or mentions.

### [ ] Stage 9: Glassmorphism Redesign
- [ ] Overhaul the entire UI to a "Glassmorphism in shades of gray" design. Discard the basic layout in favor of a deeply polished, translucent grayscale esthetic (based on reference images to be provided) and set of animations / visual corrections.

### [ ] Stage 10: Quality Assurance & Deployment
- [ ] Minimum 5 unit tests isolating Domain/Service logic (Rules 1, 2, 3).
- [ ] Minimum 3 integration tests using `WebApplicationFactory` .
- [ ] Multi-stage Dockerfile and Docker Compose orchestration.
- [ ] Technical README.md documentation and video demonstration recording.

## 7. AI Guidelines
* **Code Style:** Clean architecture, DTOs for external boundaries, Fluent API for EF Core.
* **Comments:** Concise, module-specific comments in English ONLY.
* **Tone:** Objective, technical, candidate for Grade 5.0 evaluation.
* **Formatting:** Strictly NO emojis in code, documentation, or chat.

## 8. Recent Modifications & Reflections
* **Kanban & Comments Assignee / Author Integration:**
  - Extended `TaskItemResponse` with `AssigneeFirstName`, `AssigneeLastName`, and `AssigneeAvatarUrl`. Projected across `TaskItemService` queries and SignalR events.
  - Replaced the static "AS" badge on Kanban cards with the actual assignee `Avatar` component and their first name (leaving only the avatar if no first name is set; showing `?` if unassigned).
  - Extended `CommentResponse` with `AuthorFirstName`, `AuthorLastName`, and `AuthorAvatarUrl`. Updated `CommentService` to project these fields.
  - Replaced raw "User {id}" label in `TaskDetailsModal` with the author's avatar and full name.
* **Comprehensive Bilingual Localization (i18n):**
  - Backend: Added `app.UseRequestLocalization` supporting `en` and `pl`. Created `LocalizationMessages` for bilingual FluentValidation rules and service exception details based on `CultureInfo.CurrentUICulture`.
  - Frontend: Configured `axiosClient` to automatically attach `Accept-Language: localStorage.getItem('app_language') || 'en'` on every HTTP request.
  - Expanded `src/i18n` with full translations for all modals (`WorkspaceModal`, `ProjectModal`, `CreateTaskModal`, `TaskDetailsModal`, `UserModal`) and pages (`WorkspaceDetails`, `ProjectKanban`, `Auth`, `Dashboard`, `MyTasks`, `AdminPanel`, `Settings`).
  - Synced `LanguageContext` directly with the user profile on login and profile reload.
  - Unified dynamic browser tab titles (`usePageTitle`) across all views to update synchronously upon language toggle.
* **Database Seeder Scale-up:** Dynamic GUIDs simulate a realistic organizational structure with multiple workspaces, projects, users, tasks, and comments.
* **Soft Delete Architecture:** Integrated an EF Core `ISoftDeletable` system with query filters.
