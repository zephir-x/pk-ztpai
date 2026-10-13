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
- [x] Introduce `ThemeColor` enums internally stored as string, seamlessly mapped to UI ribbons and tags.\n
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
- [x] **Notifications & Messaging System (New Entity)**:
  - `Notification` entity with PostgreSQL soft-delete, indexes, and EF Core migration `AddNotificationsSystem`.
  - MediatR + SignalR pipeline: `@admin` and `@username` (matching email prefixes with dot handling) trigger persistent notifications and live WebSocket broadcasts.
  - Task assignment and reassignment notifications (`TaskAssigned`).
  - Direct Messaging (`DirectMessage`): Users send messages to Administrators; Administrators reply directly to users.
  - `NotificationsController` with complete RESTful endpoints for feed, badge count, mark as read, mark all as read, delete, and direct messaging.
  - Global `NotificationContext` with SignalR group management, real-time toast delivery, and sidebar unread badge.
  - `Notifications` view with role differentiation (contact form for users, reply panel for admins) and deep linking to Kanban board with automatic task modal popup.
  - Dynamic template-based i18n localization for notification titles and descriptions, preserving live user messages across language switches.
  - Automated initial notifications seeding for seeded users (`@frontend.dev`, `@admin`, task assignment).
  - Deep-link task modal integration in My Tasks view directly navigating to the details tab.
  - Instant assignee modal closure and Kanban board assignee name and avatar update without page reload.

### [x] Stage 9: Stress Testing, Data Scaling & Glassmorphism Redesign
- [x] **Glassmorphism Redesign**:
  - Complete overhaul of the entire user interface to an atmospheric futuristic grayscale glassmorphism aesthetic (`#4f5f6e` body, `#556677` silvery rain glass gradients, translucent panels with backdrop blur, fine laser rim highlights, and dynamic fiery accent themes).
  - Global CSS border beam animations with linear sweeps across Kanban columns and input fields with zero background bleeding.
  - Seamless atmospheric top vignette fading right below page headers with aligned sidebar dividing beam (210px).
  - Unified card styling across Workspaces, Projects, Kanban boards, My Tasks, Notifications, Admin Panel, and Settings.
  - Fluid CSS grid accordion reply animations for notifications direct messaging.
  - Enhanced avatar presets (expanded with Firestarter/Flame) and theme color palette (expanded with Cyan).
  - Brand identity styling in Auth with classic colorful logo on luminous elevated white glass badge with interactive glow and zoom.
- [x] **High-Volume Data Stress Testing & Layout Optimization**:
  - [x] **Dedicated Stress Test Subsystem**: Implemented `IStressTestService` and `StressTestController` (`/api/admin/stress-test/status`, `/seed`, `/cleanup`) allowing admins to inject large-scale test datasets (24 workspaces, 40+ projects, 86 tasks, 24 users, 80+ comments, notifications targeting admins) on demand.
  - [x] **Admin Stress Test Control Card**: Added interactive diagnostic glass card in `AdminPanel.tsx` beneath the users table with real-time entity counter badges, one-click seeding, mutually exclusive button states, and atomic SQL hard-delete cleanup.
  - [x] **Universal Pagination & Directional Animations**: Standardized pagination with directional blur/slide animations (`animate-slide-right`, `animate-slide-left`) across Admin Panel users, Notifications feed, Workspaces grid, Projects grid, and My Tasks cards.
  - [x] **Targeted Kanban Density & Column Scrolling**: Enabled independent vertical scrolling for Kanban Droppable columns, preventing whole-board vertical stretch and maintaining natural header alignment.
  - [x] **Color-Matched Circular Kanban Badges**: Styled column task counters as exact circular pill badges with background and border glow reflecting each column's border beam color (slate for To Do, sky for In Progress, amber for Review, emerald for Done).
  - [x] **Universal View Baseline & Stationary Gradient Fade**: Unified content start coordinates across all seven application views (`AdminPanel`, `Dashboard`, `MyTasks`, `Notifications`, `Settings`, `WorkspaceDetails`, `ProjectKanban`) with `mb-7` header margins and `pt-8` content padding. Calibrated top/bottom fade masks (`0px` to `32px`) so content is 100% opaque at rest and only fades during active scroll.
  - [x] **Hard Drop Shadow Elimination**: Replaced heavy drop shadows with clean `shadow-none` glass styling across stacked cards in Notifications and Admin Panel, eradicating dark shadow bands between elements.
  - [x] **Natural Empty States**: Restored natural vertical placement of empty state cards in My Tasks, Workspaces, and Projects, preventing them from snapping to the bottom edge.
  - [x] **Baseline Restoration**: Validated atomic cleanup via `CleanupAsync` ensuring test mock data (`[STRESS]`, `stress.*`) is permanently eradicated without leaving orphan or soft-deleted residues.

### [x] Stage 10: Quality Assurance & Testing Suite (Grade 5.0 Standards)
- [x] **Canonical Multi-Project Architecture**:
  - Restructured `backend/` into standard sibling folders: `backend/ProjectHub.Api/` (Web API application) and `backend/ProjectHub.Tests/` (test suite).
  - Maintained `ProjectHub.sln` at `backend/` root linking both projects with zero compiler warnings or circular exclusions.
  - Configured `ProjectHub.Tests` (.NET 9.0) with xUnit, FluentAssertions, Moq, `Microsoft.AspNetCore.Mvc.Testing`, and `Microsoft.EntityFrameworkCore.InMemory`.
  - Built `TestDbContextFactory` producing isolated in-memory test databases for unit tests.
  - Engineered `CustomWebApplicationFactory` with environment override (`Testing`), automated in-memory JWT configuration, and test claim token generation.\n  - Created full technical documentation in English: `ProjectHub.Tests/TEST_DOCUMENTATION.md`.
- [x] **Unit Testing Suite (21 Tests - Exceeding 5-Test Criterion)**:
  - `TaskItemService_BusinessRulesTests` (6 tests): Validated Rule 1 (cannot close task without active assignee, positive path with assignee), Rule 2 (Admin-only task assignment on creation, Admin-only reassignment, SignalR broadcast on reassignment).
  - `ProjectService_BusinessRulesTests` (5 tests): Validated Rule 3 (conflict on deleting project with unresolved critical tasks, positive path when critical task is Done, non-critical task bypass, workspace ownership access check, unauthorized project creation prevention).
  - `CommentService_AuthorizationTests` (5 tests): Validated Rule 4 (comment modification/deletion restricted to author or Admin), positive author edit, positive Admin override, and asynchronous MediatR event dispatching (`CommentCreatedEvent`).
  - `UserService_BusinessRulesTests` (5 tests): Validated Rule 5 (cannot delete own account), soft-delete query filter isolation, Admin-only user deletion authorization, email uniqueness conflicts, and password security verification.
- [x] **Integration Testing Suite (16 Tests - Exceeding 3-Test Criterion)**:
  - `AuthControllerIntegrationTests` (4 tests): Verified `/api/auth/register` (201 Created, 409 Conflict duplicate), `/api/auth/login` (200 OK with valid JWT, 401 Unauthorized for invalid password).
  - `TasksControllerIntegrationTests` (5 tests): Verified HTTP pipeline enforcement of Rule 1 (409 Conflict vs 201 Created) and Rule 2 (403 Forbidden vs 204 NoContent with real JWT claims).
  - `ProjectsControllerIntegrationTests` (4 tests): Verified HTTP pipeline enforcement of Rule 3 (409 Conflict vs 204 NoContent), 403 Forbidden for unowned workspaces, and 401 Unauthorized for unauthenticated access).
  - `CommentsControllerIntegrationTests` (3 tests): Verified `/api/comments` (201 Created with async MediatR event trigger, 403 Forbidden for non-author edits, 204 NoContent for Admin deletion).
- [x] **Suite Execution Results**: 37 total tests executed across both suites, 0 failures, 0 skipped, 100% passing in ~1-2 seconds.
- [x] **GitHub Actions CI Workflow** (`.github/workflows/ci.yml`): Automated build, lint, and test validation on Push and Pull Request.
- [x] **Multi-stage Dockerfile and Docker Compose Orchestration**: Automated multi-container environment (PostgreSQL 17 Alpine with healthcheck, ASP.NET Core 9 Web API multi-stage container with automatic migrations and data seeding, and React SPA served by Nginx with reverse proxy and WebSocket support). Tested single-command startup via `docker compose up -d` at `http://localhost:5173`. Ready for Mikr.us / VPS deployment with reverse proxy & custom domain.
- [ ] Technical README.md documentation and video demonstration recording.

## 7. AI Guidelines
* **Code Style:** Clean architecture, DTOs for external boundaries, Fluent API for EF Core.
* **Comments:** Concise, module-specific comments in English ONLY.
* **Tone:** Objective, technical, candidate for Grade 5.0 evaluation.
* **Formatting:** Strictly NO emojis in code, documentation, or chat.

## 8. Recent Modifications & Reflections
* **Stage 10 Testing, CI Automation, Containerization & Visual Polish:**
  - Cancel Button Glow Clipping Fix: Resolved button focus and hover glow clipping in `UserModal.tsx` by isolating modal action buttons outside the `overflow-y-auto` form body container into a dedicated sticky footer with top border delimiter.
  - GitHub Actions CI Workflow: Created `.github/workflows/ci.yml` providing automated parallel validation pipelines for backend (.NET 9 SDK restore, Release build, and 37 unit/integration tests with code coverage) and frontend (Node.js 20, npm ci, ESLint verification, and production Vite compilation) on push and pull requests to `main`, `master`, and `develop`.
  - Multi-Stage Docker Orchestration: Engineered complete containerization pipeline:
    * `backend/Dockerfile`: 4-stage build (`base`, `build`, `publish`, `final`) based on `aspnet:9.0` and `sdk:9.0` with layer-cached NuGet restore.
    * `frontend/Dockerfile`: 2-stage build (`build`, `final`) with Node.js 20 Alpine compilation and Nginx Alpine server.
    * `frontend/nginx.conf`: Nginx reverse proxy routing `/api/*` to backend Kestrel, `/kanbanHub` with HTTP/1.1 WebSocket Upgrade headers, `/swagger/*`, long-term asset caching, and SPA fallback (`try_files $uri /index.html`).
    * `docker-compose.yml`: Automated orchestration tying `postgres_db` (with `pg_isready` healthcheck), `backend` (`service_healthy` dependency, automated EF Core migrations & database seeding), and `frontend` gateway accessible at `http://localhost:5173`. Verified live in Docker Desktop with 100% healthy services and authenticated API calls.
  - Notification Reply Tile Background Harmonization: Replaced opaque dark background `bg-rain-950/80 border-white/15` with `glass-card-unified border border-white/20` (`rgba(28, 36, 48, 0.88)`), creating full visual continuity with the surrounding slate glass cards without harsh black contrast.
  - Creation Date Badges Glass Styling: Replaced dark badges in `Dashboard.tsx` and `WorkspaceDetails.tsx` with `glass-card-unified border border-white/20 text-white/90 shadow-glass-sm`, aligning workspace and project creation timestamps with the unified glass aesthetic.
  - Kanban Card Action Buttons Vertical Alignment: Unified `MoreHorizontal` and `MessageSquare` action button containers in `ProjectKanban.tsx` to `w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ml-auto`, ensuring identical horizontal width and absolute vertical alignment across top and bottom rows.
  - Border Beam Rotation Speed Uniformity: Calibrated `@keyframes singleBeamSweep` in `index.css` by adjusting the rotation stop from 70% (252deg) to 85% (306deg), eliminating visible deceleration/hesitation halfway through the cycle and maintaining constant sweeping velocity.
  - Missing Polish Translation for Project Navigation: Added Polish translation for `projectKanban.backButton` (`Wróć do projektów`) in `pl.ts`, eliminating untranslated English text in the Kanban board top bar.
* **Stage 9 Completion - High-Density Load Testing & Layout Perfection:**
  - High-Volume Load Auditing: Validated complete platform responsiveness, layout integrity, and zero text/overflow degradation under a heavy synthetic dataset (24 workspaces, 40+ projects, 86 tasks, 24 users, 80+ comments, 25 notifications per admin).
  - Universal View Baseline Alignment: Standardized the header-to-content distance across all 7 views (`AdminPanel`, `Dashboard`, `MyTasks`, `Notifications`, `Settings`, `WorkspaceDetails`, `ProjectKanban`) using an identical `mb-7` header margin and `pt-8` (32px) content start coordinate.
  - Stationary Gradient Mask Engineering: Rebuilt scrollable container masks (`linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)`) in Admin Panel, Notifications, and Settings. Because content begins at `pt-8` (32px), cards are 100% opaque and crisp at rest, fading smoothly only during scrolling without premature clipping.
  - Elimination of Hard Drop Shadow Artifacts: Removed `shadow-glass-sm` and `.glass-panel` from vertically stacked items in `Notifications.tsx` and `AdminPanel.tsx`, replacing them with `shadow-none` glass panels. Eliminated harsh dark shadow bands between consecutive cards while retaining top highlight rims.
  - Circular Kanban Column Counters: Formatted column item counters as circular badges (`w-6 h-6 rounded-full`) with glowing background and border tones precisely synchronized with each column's border beam (slate gray for To Do, sky blue for In Progress, amber yellow for Review, emerald green for Done).
  - Natural Empty State Centering: Removed `justify-between` from the root flexbox in `MyTasks.tsx`, ensuring the empty state tile sits naturally beneath the header rather than being pinned to the bottom screen edge.
  - Full-Spectrum Pagination Architecture: Deployed modular pagination with bidirectional slide animations (`animate-slide-right`, `animate-slide-left`) across Admin Panel, Notifications, Workspaces, Projects, and My Tasks, maintaining consistent item limits (6 to 8 items per page).
* **System Stress Testing & Diagnostics Subsystem:**
  - Architecture: Built dedicated `IStressTestService` and `StressTestController` supporting on-demand injection of large-scale test data.
  - Admin Panel Diagnostics Card: Added interactive diagnostic glass card in `AdminPanel.tsx` beneath the users table with real-time entity counter badges, one-click seeding, mutually exclusive button states, and atomic SQL hard-delete cleanup.
  - Distributed Comment Seeding: Seeded comments across every top visible task in `ProjectHub React App`.
  - Admin Targeted Notifications: Fixed JWT `sub` claim extraction in `StressTestController.cs`, generated 25 notifications (15 unread) for each admin user, and tied automatic unread count refresh in `AdminPanel.tsx` directly to `NotificationContext`.
  - Rule Compliance: Generator strictly abides by Business Rule 2 (maximum 1 active Critical task per user across the entire system), dynamically allocating critical priorities to distinct assignees.
  - Atomic Purge: Implemented direct SQL hard-delete cleanup in `CleanupAsync` ensuring test mock data (`[STRESS]`, `stress.*`) is permanently eradicated without leaving soft-deleted ghost records in the database.
* **Full Glassmorphism & Visual Redesign:**
  - Atmospheric Deep Glass System: Cohesive dark-slate glassmorphism across all application views anchored in silvery-rain tones (`bg-glass-rain`), translucent backdrop-blur panels, and sharp 1px laser rims.\n  - Luminous Border Beams: Single-pass border ray animations (`singleBeamSweep` and `inputBeamSweep`) using conic gradients and CSS property interpolation (`@property --beam-angle`).
  - Seamless Vignette Alignment: 210px top horizontal atmospheric darkening gradient aligned flush with the left sidebar's vertical fiery accent line.
  - Drag-and-Drop Optimization: Resolved `@hello-pangea/dnd` transform containing block issues by avoiding outer CSS transforms on the page container.
* **Notifications & Messaging System Integration:**
  - Designed and deployed full-stack notification infrastructure: PostgreSQL entity, EF Core migration, and SignalR personal group dispatching.
  - Asynchronous mention processing via `CommentCreatedEventHandler` supporting `@admin` and `@username`.
  - Direct messaging between regular users and system administrators with inline response capabilities.
  - Deep linking from notifications to the project Kanban board, automatically loading project state and opening the task modal in details or comments mode.
* **Comprehensive Bilingual Localization (i18n):**
  - Backend request localization via `Accept-Language` header, localized DTO validation errors, and bilingual service exception messages.
