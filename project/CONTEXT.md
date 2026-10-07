# ProjectHub - AI Developer Context
**Status:** In Progress (Stage 1, 2, and 3 Completed)
**Goal:** Deliver a fully functional Jira-like task management system meeting strict academic requirements for the "Zaawansowane Technologie Programowania Aplikacji Internetowych" course (Grade 5.0 target).

## 1. Tech Stack
* **Backend:** ASP.NET Core Web API (.NET 9), C#, Entity Framework Core (Fluent API).
* **Database:** PostgreSQL (Dockerized container).
* **Frontend:** React + TypeScript (Vite).
* **Architecture:** N-Tier, REST API, DTO pattern. Strict separation of business logic from HTTP request handling is mandatory.
* **Security:** JWT Authentication, BCrypt password hashing, Role-based Authorization (USER, ADMIN).

## 2. Business Domain & Database (ERD)
Minimum 5 entities required. Current implementation:
1. `User` (Id, Email, PasswordHash, Role, CreatedAt)
2. `Workspace` (Id, Name, OwnerId, CreatedAt)
3. `Project` (Id, Name, Description, WorkspaceId, CreatedAt)
4. `TaskItem` (Id, Title, Description, Status, Priority, ProjectId, AssigneeId, CreatedAt, UpdatedAt)
5. `Comment` (Id, Content, TaskItemId, AuthorId, CreatedAt)

## 3. Strict Business Rules
Must implement minimum 3 rules beyond basic CRUD:
1. A task cannot be marked as "Done" (`TaskStatus.Done`) if it does not have an assignee (`AssigneeId` is null).
2. Users with unresolved/critical tasks cannot be removed from a workspace (or similar lock mechanism).
3. Workspace ownership or Project management is restricted strictly to the user who created it or an `ADMIN`.

## 4. Academic Grading Requirements Matrix
* **Grade 3.0:** Working backend, DB connection, 3 entities, CRUD, HTTP methods, layer separation, DTO pattern, input validation, global error handling, 1 business rule, persistent data, proper HTTP status codes.
* **Grade 4.0:** All 3.0 + Authentication, Authorization (2 roles), role-based endpoint restriction, pagination, searching or filtering of data, Swagger/OpenAPI, 5 unit tests (business logic), 3 integration tests (API), DB migrations, config management, no raw secrets in repo.
* **Grade 5.0:** All 4.0 + 5 entities, 3 business rules, frontend communicating with API, login/auth on frontend, frontend handling of listing/adding/editing/deleting/API errors, async mechanism (MediatR/Events), logic tests, Docker Compose (Backend + DB), detailed README, and one extended element (SignalR WebSockets).

## 5. Formal Deliverables Requirement
* **README.md:** Must contain project description, technologies, run instructions, core features, ERD diagram, and API documentation.
* **Demo Video (3-5 min):** Must explicitly explain the project architecture, request flow from endpoint to DB, data model, authentication/authorization mechanism, and demonstrate at least one business rule.

## 6. Development Roadmap & Progress Checklist
- [x] **Stage 1: Architecture Analysis & Design** (ERD, Roles, Rules defined).
- [x] **Stage 2: Environment Initialization** (Git, Docker DB, ASP.NET Core init, React init).
- [x] **Stage 3: Data Access & Authorization** (EF Core models, Fluent API, Migrations, BCrypt, JWT Provider, AuthController register/login).
- [ ] **Stage 4: Business Logic & REST API** (DTOs, FluentValidation, Global Error Handling Middleware, Swagger, Pagination, Searching/Filtering, Endpoints).
- [ ] **Stage 5: Advanced Requirements** (MediatR/Async Events, SignalR WebSockets).
- [ ] **Stage 6: Frontend Client** (Axios, React Router, UI Views, Auth State, CRUD operations, API Error Handling).
- [ ] **Stage 7: Quality Assurance** (5x xUnit Unit Tests for isolated logic, 3x Integration Tests for API).
- [ ] **Stage 8: Deployment & Documentation** (Final docker-compose, README.md, Demo Video).

## 7. Strict AI Communication & Coding Guidelines
* **Code Style:** Clean Code. Use DTOs for external communication. Fluent API instead of Data Annotations for EF Core.
* **Comments:** Write concise, module-specific comments in English ONLY. Do not comment standard framework behavior.
* **Tone:** Objective, cool-headed, highly substantive. Point out architectural flaws early and correct them.
* **Formatting:** DO NOT use emojis in code, documentation, or chat unless explicitly asked.
* **Commits:** Upon the "commit time" command, summarize changes and generate a Conventional Commits message.
