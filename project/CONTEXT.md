# ProjectHub - AI Developer Context
**Author:** Kacper Gumulak (Index: 151872)
**Status:** In Progress (Transitioning to Stage 7 Feature Expansion)
**Goal:** Deliver a fully functional Jira-like task management system meeting strict academic requirements for the "Zaawansowane Technologie Programowania Aplikacji Internetowych" course (Grade 5.0 target).

## 1. Tech Stack
* **Backend:** ASP.NET Core Web API (.NET 9), C#, Entity Framework Core (Fluent API).
* **Database:** PostgreSQL (Dockerized container).
* **Frontend:** React + TypeScript (Vite).
* **Architecture:** N-Tier, REST API, DTO pattern. Strict separation of business logic from HTTP request handling.
* **Security:** JWT Authentication, BCrypt password hashing, Role-based Authorization (USER, ADMIN).

## 2. Business Domain & Database (ERD)
Strictly 6 entities required and mapped:
1. `User` (Id, Email, PasswordHash, Role, CreatedAt, FirstName, LastName, AvatarUrl, Language, AccentColor)
2. `Workspace` (Id, Name, ThemeColor, OwnerId, CreatedAt, IsDeleted, DeletedAt)
3. `Project` (Id, Name, Description, ThemeColor, WorkspaceId, CreatedAt, IsDeleted, DeletedAt)
4. `TaskItem` (Id, Title, Description, Status, Priority, ProjectId, AssigneeId, CreatedAt, UpdatedAt, IsDeleted, DeletedAt)
5. `Comment` (Id, Content, TaskItemId, AuthorId, CreatedAt, IsDeleted, DeletedAt)
6. `Notification` (Id, UserId, Content, Type, IsRead, CreatedAt) // NEW ENTITY

## 3. Strict Business Rules
Implemented in the domain/service layer:
1. **Task Completion Constraint:** A task cannot change its status to "Done" (`ProjectTaskStatus.Done`) if it does not have an active assignee attached.
2. **Admin Assignee Constraint:** Changing a task's assigned user (`AssigneeId`) can ONLY be performed by a user with `ADMIN` privileges.
3. **Project Deletion Lock:** A project cannot be deleted (or archived) as long as it contains unresolved tasks (status other than Done) with a "Critical" priority (`TaskPriority.Critical`).

## 4. Academic Grading Requirements Matrix
* **Grade 3.0:** Working backend, DB connection, 3 entities, CRUD, HTTP methods, layer separation, DTO pattern, input validation, global error handling, 1 business rule, persistent data, proper HTTP status codes.
* **Grade 4.0:** All 3.0 + Authentication, Authorization (2 roles), role-based endpoint restriction, pagination, searching or filtering of data, Swagger/OpenAPI, 5 unit tests (business logic), 3 integration tests (API), DB migrations, config management, no raw secrets in repo.
* **Grade 5.0:** All 4.0 + 5 entities (expanded to 6), 3 business rules, frontend communicating with API, login/auth on frontend, frontend handling of listing/adding/editing/deleting/API errors, async mechanism (MediatR/Events), logic tests, Docker Compose (Backend + DB), detailed README, and one extended element (SignalR WebSockets).

## 5. Formal Deliverables Requirement
* **README.md:** Project overview, architecture, run instructions, ERD diagram, API documentation.
* **Demo Video (3-5 min):** Explanation of architecture, request flow, auth/roles, and live demonstration of business rules.

## 6. Roadmap & Progress Checklist

### [x] Stages 1-5: Backend Core, Domain Logic, Async & WebSockets
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

### [~] Stage 8: Feature Expansion & Soft Delete Architecture
- [x] **Soft Delete Architecture**: Implement `IsDeleted` / `DeletedAt` fields across major entities. Do not permanently delete database records; update global query filters to exclude deleted items on backend and frontend.
- [x] **My Tasks View**: Implement a dedicated view displaying all tasks assigned to the current user, featuring quick links traversing `Workspace -> Project -> Task` or a unified accessible interface.
- [ ] **User Management**: Implement the Administration panel for managing users (Add, Edit, Soft Delete), explicitly including a password reset/override capability for forgotten passwords.
- [ ] **Settings & Profile View**: Allow users to modify their profile details (First Name, Last Name, Avatar URL). Implement system-wide user preferences including App Theme Accent Color (overriding default fiery orange) and Language selection.
- [ ] **Notifications & Messaging System (New Entity)**:
  - Users receive alerts for task assignments, mentions, or comments.
  - Users can send messages/support requests directly to Administrators.
  - Administrators have a dedicated Notifications view to read and manage messages received from users or mentions.

### [ ] Stage 9: Glassmorphism Redesign
- [ ] Overhaul the entire UI to a "Glassmorphism in shades of gray" design. Discard the basic layout in favor of a deeply polished, translucent grayscale esthetic (based on reference images to be provided) and set of animations / visual corrections.

### [ ] Stage 10: Quality Assurance & Deployment
- [ ] Minimum 5 unit tests isolating Domain/Service logic (Rules 1, 2, 3).
- [ ] Minimum 3 integration tests using `WebApplicationFactory`.
- [ ] Multi-stage Dockerfile and Docker Compose orchestration.
- [ ] Technical README.md documentation and video demonstration recording.

## 7. AI Guidelines
* **Code Style:** Clean architecture, DTOs for external boundaries, Fluent API for EF Core.
* **Comments:** Concise, module-specific comments in English ONLY.
* **Tone:** Objective, technical, candidate for Grade 5.0 evaluation.
* **Formatting:** Strictly NO emojis in code, documentation, or chat.

## 8. Recent Modifications & Reflections
* **ThemeColor Refactoring:** Upgraded `ThemeColor` from primitive string HEX codes to a strongly-typed Enum on the backend (with EF Core `.HasConversion<string>()`). This ensures absolute structural integrity. The frontend seamlessly maps these numerical enum indices back to visual Tailwind hex arrays via `THEME_COLOR_MAP`, allowing robust and aesthetic ribbon integration natively supported by the DataSeeder.
* **SignalR & Real-time Edge Cases:** Addressed complex query-string token parsing logic required for WebSocket handshakes.
* **Design Synchronization:** Unified layout metrics (`absolute left-0 w-1.5`) across Project and Workspace cards to maintain strict pixel-perfect visual cohesion without structural drift.
