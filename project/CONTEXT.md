# ProjectHub - AI Developer Context
**Author:** Kacper Gumulak (Index: 151872)
**Status:** In Progress (Stages 1-6 Completed. Transitioning to Stage 6.5 refinement)
**Goal:** Deliver a fully functional Jira-like task management system meeting strict academic requirements for the "Zaawansowane Technologie Programowania Aplikacji Internetowych" course (Grade 5.0 target).

## 1. Tech Stack
* **Backend:** ASP.NET Core Web API (.NET 9), C#, Entity Framework Core (Fluent API).
* **Database:** PostgreSQL (Dockerized container).
* **Frontend:** React + TypeScript (Vite).
* **Architecture:** N-Tier, REST API, DTO pattern. Strict separation of business logic from HTTP request handling.
* **Security:** JWT Authentication, BCrypt password hashing, Role-based Authorization (USER, ADMIN).

## 2. Business Domain & Database (ERD)
Strictly 5 entities required and mapped:
1. `User` (Id, Email, PasswordHash, Role, CreatedAt)
2. `Workspace` (Id, Name, ColorHex, OwnerId, CreatedAt, IsDeleted)
3. `Project` (Id, Name, Description, WorkspaceId, CreatedAt, IsDeleted)
4. `TaskItem` (Id, Title, Description, Status, Priority, ProjectId, AssigneeId, CreatedAt, UpdatedAt, IsDeleted)
5. `Comment` (Id, Content, TaskItemId, AuthorId, CreatedAt)

## 3. Strict Business Rules
Implemented in the domain/service layer:
1. **Task Completion Constraint:** A task cannot change its status to "Done" (`ProjectTaskStatus.Done`) if it does not have an active assignee attached.
2. **Admin Assignee Constraint:** Changing a task's assigned user (`AssigneeId`) can ONLY be performed by a user with `ADMIN` privileges.
3. **Project Deletion Lock:** A project cannot be deleted (or archived) as long as it contains unresolved tasks (status other than Done) with a "Critical" priority (`TaskPriority.Critical`).

## 4. Academic Grading Requirements Matrix
* **Grade 3.0:** Working backend, DB connection, 3 entities, CRUD, HTTP methods, layer separation, DTO pattern, input validation, global error handling, 1 business rule, persistent data, proper HTTP status codes.
* **Grade 4.0:** All 3.0 + Authentication, Authorization (2 roles), role-based endpoint restriction, pagination, searching or filtering of data, Swagger/OpenAPI, 5 unit tests (business logic), 3 integration tests (API), DB migrations, config management, no raw secrets in repo.
* **Grade 5.0:** All 4.0 + 5 entities, 3 business rules, frontend communicating with API, login/auth on frontend, frontend handling of listing/adding/editing/deleting/API errors, async mechanism (MediatR/Events), logic tests, Docker Compose (Backend + DB), detailed README, and one extended element (SignalR WebSockets).

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

### [ ] Stage 6.5: Polish & Architectural Clean-Up (In Progress)
- [x] Standardize code styling, remove redundant comments, and enforce professional single-line English documentation across backend services and frontend views.
- [x] Patch SignalR WebSockets integration (JWT URL parsing, React strict mode mounting safeguards, complete object broadcasting).
- [x] Refine Role-Based Access Control (RBAC) to allow global read access while strictly locking modifications to admins/owners, reflecting this securely in the React UI.
- [x] Implement robust user assignment via dedicated PATCH endpoint and translate frontend Toast notifications.
- [ ] Implement Edit and Delete functionality for Workspaces and Projects, including colored ribbons/tags (currently only available for tasks).
- [ ] Implement complete User Management for administrators (Add, edit, and delete users).

### [ ] Stage 7: Quality Assurance (xUnit)
- [ ] Minimum 5 unit tests isolating Domain/Service logic (Rules 1, 2, 3).
- [ ] Minimum 3 integration tests using `WebApplicationFactory`.

### [ ] Stage 8: Deployment & Final Deliverables
- [ ] Multi-stage Dockerfile and Docker Compose orchestration.
- [ ] Technical README.md documentation.
- [ ] Video demonstration recording.

## 7. AI Guidelines
* **Code Style:** Clean architecture, DTOs for external boundaries, Fluent API for EF Core.
* **Comments:** Concise, module-specific comments in English ONLY.
* **Tone:** Objective, technical, candidate for Grade 5.0 evaluation.
* **Formatting:** Strictly NO emojis in code, documentation, or chat.

## 8. Recent Modifications & Reflections
During Stage 6.5, several critical bugs and architectural edge cases were resolved:
* **SignalR WebSocket Authentication:** WebSockets cannot use standard HTTP Authorization: Bearer headers during handshakes. SignalR passes the token via query string (?access_token=...). The ASP.NET Core AddJwtBearer middleware was patched (OnMessageReceived) to intercept and validate tokens from the URL specifically for /kanbanHub.
* **React Strict Mode Lifecycle:** React 18's double-mounting caused SignalR to abort negotiations abruptly ("connection was stopped during negotiation"). Implemented an isMounted flag pattern inside useEffect to prevent state updates and error toasts from bleeding across canceled connection attempts.
* **Real-time Data Sync & UI Bugs:** SignalR was broadcasting an anonymous, incomplete object ({ TaskId, Status, Priority }) upon Drag & Drop. In the frontend, missing id fields led to an undefined === undefined match, causing the selectedTask state to catch the incomplete object and accidentally pop open an empty details modal. Fixed by broadcasting the full TaskItemResponse DTO.
* **Read-Only RBAC Refinements:** Backend services initially blocked GET operations with a ForbiddenException if a standard user was not the workspace owner, preventing them from viewing projects and comments. Permissions were relaxed to allow all authenticated users to read resources (allowing standard users to see comments and board items), while strictly locking POST/PUT/DELETE operations behind Ownership/Admin checks. Frontend UI (<Plus />, <Edit2 />) was also updated to selectively hide these controls from standard users.
* **Assignee Workflow:** The generic PUT task update ignored AssigneeId changes. The frontend was re-wired to use the dedicated PATCH /api/taskitems/{id}/assignee endpoint, ensuring assignments correctly persist to the database. Toast notifications were also translated to descriptive Polish messages.
