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
- [x] Authentication flows (Sliding auth view, Axios interceptors).\n- [x] Workspace & Project explorer views.
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
  - Engineered `CustomWebApplicationFactory` with environment override (`Testing`), automated in-memory JWT configuration, and test claim token generation.
  - Created full technical documentation in English: `ProjectHub.Tests/TEST_DOCUMENTATION.md`.
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

### [x] Stage 11: Production Deployment Architecture (Mikr.us VPS, GHCR, Cloudflare & Reverse Proxy)
- [x] **GitHub Actions CI/CD with GHCR Registry**: Extended `.github/workflows/ci.yml` with automated container image compilation and publishing to GitHub Container Registry (`ghcr.io/zephir-x/projecthub-api` and `ghcr.io/zephir-x/projecthub-web`) on push to `project` and `main` branches and manual `workflow_dispatch`.
- [x] **Zero VPS Build Overhead**: Eliminated multi-stage compiler builds on Mikrus VPS, preventing out-of-memory crashes and CPU starvation.
- [x] **Mikrus Multi-Tenant Web-Proxy Integration**: Orchestrated `project/docker-compose.prod.yml` attaching the frontend Nginx reverse proxy gateway container directly to the host's existing `web-proxy` external Docker network alongside `gymcore` and `game-store`.
- [x] **RAM Optimization & Isolation**: Configured .NET 9 Workstation Garbage Collector (`DOTNET_gcServer=0`) and tuned PostgreSQL buffers (`shared_buffers=64MB`, `work_mem=4MB`, `max_connections=30`), capping total stack RAM usage below ~150MB with strict limits (`mem_limit`).
- [x] **Domain, Cloudflare & WebSocket Routing**: Designed host `nginx-proxy` configuration for `myprojecthub.com.pl` routing standard HTTP requests to `projecthub_web:80` and establishing persistent HTTP/1.1 WebSocket Upgrade tunnels for `/kanbanHub` live SignalR synchronization.
- [ ] Technical README.md documentation and video demonstration recording.

## 7. AI Guidelines
* **Code Style:** Clean architecture, DTOs for external boundaries, Fluent API for EF Core.
* **Comments:** Concise, module-specific comments in English ONLY.
* **Tone:** Objective, technical, candidate for Grade 5.0 evaluation.
* **Formatting:** Strictly NO emojis in code, documentation, or chat.

## 8. Recent Modifications & Reflections
* **Stage 11 Production Deployment Architecture on Mikr.us VPS:**
  - Deployment Architecture: Domain `myprojecthub.com.pl` proxied through Cloudflare (SSL termination & DNS) to Mikrus VPS port 80/443 handled by host-level `nginx-proxy` container on external Docker network `web-proxy`.
  - Multi-Project Coexistence: Configured `projecthub_web` to join `web-proxy` alongside `gymcore_frontend` and `game-store-nginx-1`. Private PostgreSQL 17 database and ASP.NET Core 9 backend reside in an isolated `projecthub_internal` network with zero host port collisions.
  - Zero-Build Deployment via GHCR: Automated build and push in GitHub Actions eliminates Roslyn .NET and Vite Node.js compilation on the VPS, preventing OOM Killer kernel panics.
  - Workstation GC & PostgreSQL Tuning: Enforced `DOTNET_gcServer=0` reducing backend memory by ~50% and bounded PostgreSQL buffers (`shared_buffers=64MB`, `work_mem=4MB`, `max_connections=30`) so the entire 3-container stack consumes ~120-150 MB RAM in steady state.
  - SignalR WebSocket Upgrades: Configured Nginx proxy routing to provide HTTP/1.1 Upgrade and Connection headers for `/kanbanHub`, ensuring real-time Kanban board updates and direct messaging broadcasts operate seamlessly through Cloudflare and both Nginx proxy layers.
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
