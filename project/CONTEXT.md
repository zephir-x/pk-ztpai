# ProjectHub - AI Developer Context
**Author:** Kacper Gumulak (Index: 151872)
**Status:** In Progress (Stages 1-3 Completed. Stage 4 in progress)
**Goal:** Deliver a fully functional Jira-like task management system meeting strict academic requirements for the "Zaawansowane Technologie Programowania Aplikacji Internetowych" course (Grade 5.0 target).

## 1. Tech Stack
* **Backend:** ASP.NET Core Web API (.NET 9), C#, Entity Framework Core (Fluent API).
* **Database:** PostgreSQL (Dockerized container).
* **Frontend:** React + TypeScript (Vite).
* **Architecture:** N-Tier, REST API, DTO pattern. Strict separation of business logic from HTTP request handling is mandatory.
* **Security:** JWT Authentication, BCrypt password hashing, Role-based Authorization (USER, ADMIN).

## 2. Business Domain & Database (ERD)
5 entities required and mapped.
1. `User` (Id, Email, PasswordHash, Role, CreatedAt)
2. `Workspace` (Id, Name, OwnerId, CreatedAt)
3. `Project` (Id, Name, Description, WorkspaceId, CreatedAt)
4. `TaskItem` (Id, Title, Description, Status, Priority, ProjectId, AssigneeId, CreatedAt, UpdatedAt)
5. `Comment` (Id, Content, TaskItemId, AuthorId, CreatedAt)

## 3. Strict Business Rules (Approved by Professor)
These specific rules MUST be implemented in the domain/service layer:
1. **Task Completion Constraint:** A task cannot change its status to "Done" (`ProjectTaskStatus.Done`) if it does not have an active assignee attached.
2. **Admin Assignee Constraint:** Changing a task's assigned user (`AssigneeId`) can ONLY be performed by a user with `ADMIN` privileges within the given context.
3. **Project Deletion Lock:** A project cannot be deleted (or archived) as long as it contains unresolved tasks (status other than Done) with a "Critical" priority (`TaskPriority.Critical`).

## 4. Academic Grading Requirements Matrix
* **Grade 3.0:** Working backend, DB connection, 3 entities, CRUD, HTTP methods, layer separation, DTO pattern, input validation, global error handling, 1 business rule, persistent data, proper HTTP status codes.
* **Grade 4.0:** All 3.0 + Authentication, Authorization (2 roles), role-based endpoint restriction, pagination, searching or filtering of data, Swagger/OpenAPI, 5 unit tests (business logic), 3 integration tests (API), DB migrations, config management, no raw secrets in repo.
* **Grade 5.0:** All 4.0 + 5 entities, 3 business rules, frontend communicating with API, login/auth on frontend, frontend handling of listing/adding/editing/deleting/API errors, async mechanism (MediatR/Events), logic tests, Docker Compose (Backend + DB), detailed README, and one extended element (SignalR WebSockets).

## 5. Formal Deliverables Requirement
* **README.md:** Must contain project description, technologies, run instructions, core features, ERD diagram, and API documentation.
* **Demo Video (3-5 min):** Must explicitly explain the project architecture, request flow from endpoint to DB, data model, authentication/authorization mechanism, and demonstrate at least one business rule.

## 6. A-to-Z Development Roadmap & Progress Checklist

### [x] Stages 1-3: Architecture, Environment & Base Auth
- [x] ERD, Roles, Rules defined.
- [x] Git, Docker DB, ASP.NET Core init, React init.
- [x] EF Core models, Fluent API, Migrations.
- [x] BCrypt, JWT Provider, AuthController (register/login).

### [x] Stage 4: Business Logic & REST API
- [x] **Core Infrastructure:** Global Error Handling Middleware (ProblemDetails), FluentValidation pipeline, Pagination & Filtering shared DTOs.
- [x] **Swagger:** OpenAPI configured with JWT Bearer auth.
- [x] **Workspaces Feature:** DTOs, Service logic, Role-based constraints, WorkspacesController.
- [x] **Projects Feature:** Implement CRUD for Projects. Enforce **Business Rule 3** (Cannot delete project with critical unresolved tasks).
- [x] **Tasks Feature:** Implement CRUD for TaskItems. Enforce **Business Rule 1** (Cannot close unassigned task) and **Business Rule 2** (Only Admin can reassign).
- [x] **Comments Feature:** Implement basic CRUD for Comments (foundation for Stage 5).

### [x] Stage 5: Advanced Requirements (Grade 5.0 target)
- [x] **Async Mechanism:** Integrate MediatR (or BackgroundService) to asynchronously process mention notifications in comments (@user) without blocking the HTTP thread.
- [x] **Extended Element (WebSockets):** Integrate SignalR to instantly push Kanban board state changes (task moves/updates) to all connected clients in a workspace.

### [ ] Stage 6: Frontend Client (React)
- [ ] Setup Axios client with JWT interceptors.
- [ ] Auth State: Login & Registration views.
- [ ] Views: Workspace List, Project Dashboard.
- [ ] Views: Kanban Board (Drag & Drop functionality).
- [ ] UI Error Handling: Catch API 400/403/404 errors and display user-friendly toasts/messages.

### [ ] Stage 7: Quality Assurance (xUnit)
- [ ] **Unit Tests:** Minimum 5 tests isolating Domain/Service logic (focusing strictly on Business Rules 1, 2, and 3).
- [ ] **Integration Tests:** Minimum 3 tests using WebApplicationFactory (e.g., Auth flow, Workspace creation).

### [ ] Stage 8: Deployment & Documentation
- [ ] Update `docker-compose.yml` to include the Backend image.
- [ ] Write `README.md` containing all required academic sections.
- [ ] Record 3-5 min Demo Video explaining request flow and rules.

## 7. Strict AI Communication & Coding Guidelines
* **Code Style:** Clean Code. Use DTOs for external communication. Fluent API instead of Data Annotations for EF Core.
* **Comments:** Write concise, module-specific comments in English ONLY. Do not comment standard framework behavior.
* **Tone:** Objective, cool-headed, highly substantive. Point out architectural flaws early and correct them.
* **Formatting:** DO NOT use emojis in code, documentation, or chat unless explicitly asked.
* **Commits:** Upon the "commit time" command, summarize changes and generate a Conventional Commits message.
