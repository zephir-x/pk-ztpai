# Project Execution Plan & Context Specification

## 1. Project Overview
ProjectHub is a modern, enterprise-grade project management platform inspired by Asana, Jira, and Linear. It is built as a Single Page Application (SPA) with a React frontend and an ASP.NET Core Web API backend using PostgreSQL and Entity Framework Core. The architecture emphasizes strict business validation rules, full-stack real-time collaboration via SignalR WebSockets, role-based security (RBAC), and a polished futuristic glassmorphism aesthetic.

## 2. Core Architectural Principles
* **Backend:** ASP.NET Core Web API (.NET 9) designed with Clean Architecture principles and repository/service patterns.
* **Database & ORM:** PostgreSQL 17 with Entity Framework Core, Code-First migrations, automated seeding, and Fluent API configurations.
* **Authentication & Authorization:** Stateless JWT Bearer tokens with custom claims (`id`, `email`, `role`). Strict RBAC enforced on API controllers and frontend routing.
* **Real-time Pipeline:** SignalR Hub (`/kanbanHub`) for bidirectional live Kanban board synchronization, drag-and-drop moves, assignments, and comment/mention notifications.
* **Frontend:** React 18+ (TypeScript), Vite, Tailwind CSS, Lucide icons, `@hello-pangea/dnd` for Kanban drag-and-drop.
* **CI/CD & Cloud Infrastructure:** GitHub Actions automated quality gates, GitHub Container Registry (GHCR), Cloudflare CDN/SSL termination, and multi-tenant Docker containerization on Mikr.us VPS.

## 3. Core Business Rules
* **Rule 1 (Task Closure & Assignment Constraint):** A task cannot be marked as Done or closed unless it has an active assignee assigned to it.
* **Rule 2 (Admin-Only Assignment & SignalR Broadcast):** Regular users cannot assign tasks upon creation or reassign tasks; only administrators may assign or reassign task assignees, broadcasting changes in real time via SignalR.
* **Rule 3 (Critical Task Project Deletion Shield):** A project cannot be deleted if it contains unresolved tasks with `Critical` priority. All critical tasks must be resolved (`Done`) before project deletion is permitted.
* **Rule 4 (Comment Modification & Asynchronous Mention Pipeline):** A comment can only be edited or deleted by its original author or an Administrator. Comment creation asynchronously dispatches MediatR events (`CommentCreatedEvent`) parsing `@admin` and `@username` mentions into persistent notifications.
* **Rule 5 (Self-Account Deletion Safeguard & Soft Delete Isolation):** Users cannot delete their own account. Account deletion is restricted to administrators and uses soft-delete filters (`IsDeleted`, `DeletedAt`), preventing orphaned database relationships.

## 4. Completed Stages & Milestone Roadmap
### [x] Stage 1-4: Analysis, Setup, Database Design, Logic Definition
* Domain model specifications, database schema diagrams, REST API endpoints, and business validation rules.

### [x] Stage 5: Backend Core Implementation
- [x] EF Core setup, Fluent API, Migrations, BCrypt password hashing, JWT service.
- [x] CRUD services for Workspaces, Projects, Tasks, and Comments.
- [x] Domain validation for Business Rules 1 through 5.
- [x] MediatR pipeline for async background notifications on `@mentions`.
- [x] SignalR hub infrastructure (`KanbanHub`) for live board synchronization.
- [x] Automatic database seeder for Admin, Users, Workspaces, Projects, Tasks, and Comments.

### [x] Stage 6: Frontend Core & Integration
- [x] Authentication flows (sliding Auth panel, Axios JWT interceptors).
- [x] Workspace & Project explorer views.
- [x] Kanban board with Drag & Drop (`@hello-pangea/dnd`).
- [x] SignalR client lifecycle integration with reconnection handling.
- [x] Global toast notifications (`react-hot-toast`).
- [x] Frontend RBAC decoding (Admin Panel, conditional action buttons, tabbed task details).

### [x] Stage 7: Polish & Architectural Clean-Up
- [x] Professional code styling and single-line English documentation.
- [x] SignalR WebSocket token parsing in query string for WebSocket upgrades.
- [x] Role-Based Access Control refinement: global read permissions with admin-exclusive mutations.
- [x] Dedicated PATCH endpoint for task assignments.
- [x] Edit and Delete functionality for Workspaces and Projects.
- [x] Standardized `ThemeColor` enums mapped to UI ribbons and tags.

### [x] Stage 8: Feature Expansion & Soft Delete Architecture
- [x] **Soft Delete Architecture**: Global query filters excluding soft-deleted records across all entities.
- [x] **My Tasks View**: Dedicated personal workspace view displaying assigned tasks with direct navigation.
- [x] **User Management**: Admin panel for managing users (Add, Edit, Soft Delete, and Password Override).
- [x] **Settings & Profile View**: Profile editing, Accent Color customizer, and Language selector.
- [x] **Bilingual Localization (i18n)**: English and Polish dictionaries with dynamic runtime switching.
- [x] **Notifications & Messaging Subsystem**: Persistent notification model, SignalR broadcasts, direct user-admin messaging, and deep linking from notifications to Kanban cards.

### [x] Stage 9: Stress Testing, Data Scaling & Glassmorphism Redesign
- [x] **Glassmorphism Redesign**: Grayscale slate aesthetic (`#4f5f6e`, `#556677`), translucent glass cards, linear border beam sweeps, and stationary gradient scroll masks.
- [x] **High-Volume Stress Subsystem**: `IStressTestService` injecting high-density datasets (24 workspaces, 40+ projects, 86 tasks, 24 users, 80+ comments) with atomic SQL cleanup.
- [x] **Universal Pagination & Density**: Standardized pagination with slide animations across all seven views.

### [x] Stage 10: Quality Assurance & Testing Suite (Grade 5.0 Standard)
- [x] **Canonical Sibling Architecture**: Clean separation into `ProjectHub.Api` and `ProjectHub.Tests` linked via `ProjectHub.sln`.
- [x] **Unit Testing Suite (21 Tests)**: Comprehensive coverage of Business Rules 1-5, MediatR events, and soft-delete query filters using xUnit, FluentAssertions, and Moq.
- [x] **Integration Testing Suite (16 Tests)**: `WebApplicationFactory` HTTP pipeline testing validating JWT claims, validation middleware, and status codes.
- [x] **Suite Execution**: 37 total tests executed, 0 failures, 100% pass rate in ~1.5s.
- [x] **Technical Documentation**: Comprehensive test report generated in `ProjectHub.Tests/TEST_DOCUMENTATION.md`.

### [x] Stage 11: Production Deployment Architecture (Mikr.us VPS, GHCR, Cloudflare & Reverse Proxy)
- [x] **GitHub Actions CI/CD with GHCR Registry**: Extended `.github/workflows/ci.yml` with automated container image compilation and publishing to GitHub Container Registry (`ghcr.io/zephir-x/projecthub-api` and `ghcr.io/zephir-x/projecthub-web`) on push to `project` and `main` branches and manual `workflow_dispatch`.
- [x] **Zero VPS Build Overhead**: Eliminated multi-stage compiler builds on Mikrus VPS, preventing out-of-memory crashes and CPU starvation.
- [x] **Mikrus Multi-Tenant Web-Proxy Integration**: Orchestrated `project/docker-compose.prod.yml` attaching the frontend Nginx reverse proxy gateway container directly to the host's existing `web-proxy` external Docker network alongside `gymcore` and `game-store`.
- [x] **RAM Optimization & Isolation**: Configured .NET 9 Workstation Garbage Collector (`DOTNET_gcServer=0`) and tuned PostgreSQL buffers (`shared_buffers=64MB`, `work_mem=4MB`, `max_connections=30`), capping total stack RAM usage below ~150MB with strict limits (`mem_limit`).
- [x] **Domain, Cloudflare & WebSocket Routing**: Designed host `nginx-proxy` configuration for `myprojecthub.com.pl` routing standard HTTP requests to `projecthub_web:80` and establishing persistent HTTP/1.1 WebSocket Upgrade tunnels for `/kanbanHub` live SignalR synchronization.
- [x] **Live Verification**: Successfully deployed and verified at `https://myprojecthub.com.pl` with operational SSL, database migrations, and authenticated administrative access.

### [x] Stage 12: Final Documentation & Demonstration
- [x] Technical `README.md` documentation and video demonstration recording for project evaluation.

---

## 5. Production Infrastructure & Deployment on Mikr.us VPS (Technical Breakdown)

This section provides the complete technical explanation of how ProjectHub is built, orchestrated, and deployed in production on a resource-constrained Linux VPS (Mikr.us), operating side-by-side with other production applications (`gymcore`, `game-store`).

### 5.1 End-to-End Data Flow & Network Architecture

```
User (Browser Client)
         │
         ▼  HTTPS (Port 443)
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Edge Network                                     │
│  - DNS Management (A record for @ and CNAME for www)        │
│  - Edge SSL/TLS Termination (Flexible Encryption)           │
│  - DDoS Protection & WebSocket Proxy Tunneling              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼  HTTP (Port 80)
┌─────────────────────────────────────────────────────────────┐
│ Mikr.us Host: nginx-proxy Container (Port 80/443)           │
│  - Member of external Docker bridge network: 'web-proxy'   │
│  - Virtual Host Dispatcher (Server Name: myprojecthub.com.pl│
│  - Reverse Proxy to http://projecthub_web:80                │
│  - HTTP/1.1 Upgrade Tunnel for /kanbanHub (WebSockets)      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼  Docker Internal DNS (web-proxy network)
┌─────────────────────────────────────────────────────────────┐
│ projecthub_web Container (Nginx 1.27 Alpine)                │
│  - Bridge between 'web-proxy' and 'projecthub_internal'     │
│  - Serves compiled React Vite SPA static bundles (dist/)    │
│  - Internal Proxy /api/*      ──► http://backend:8080/api/  │
│  - Internal Proxy /kanbanHub  ──► http://backend:8080       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼  Docker Internal DNS (projecthub_internal network)
┌─────────────────────────────────────────────────────────────┐
│ projecthub_api Container (ASP.NET Core 9 Runtime)           │
│  - Strict isolation: ZERO exposed host ports                │
│  - Kestrel HTTP Engine listening on port 8080               │
│  - Workstation GC enabled (DOTNET_gcServer=0)               │
│  - Automated EF Core database migrations & initial seeding  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼  Port 5432 (Internal Docker Network Only)
┌─────────────────────────────────────────────────────────────┐
│ projecthub_postgres Container (PostgreSQL 17 Alpine)        │
│  - Named persistent volume: 'projecthub_pgdata'             │
│  - Tuned buffer pools: shared_buffers=64MB, work_mem=4MB    │
│  - Automated healthcheck via pg_isready                     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 The Solution: Zero-Build Architecture via GitHub Actions & GHCR
To eliminate all compilation overhead on the VPS, ProjectHub implements a **Zero-Build Deployment Paradigm**:
1. **Automated Quality Gate**: Whenever a developer pushes to `project` or `main` (or opens a Pull Request), `.github/workflows/ci.yml` spins up a free, high-performance GitHub Actions runner (16 GB RAM, 4 vCPUs).
2. **Parallel Testing & Verification**:
   - Backend Job: Installs .NET 9 SDK, restores packages, builds in Release mode, and runs all 37 unit/integration tests with code coverage verification.
   - Frontend Job: Installs Node.js 20, executes `npm ci`, runs ESLint static code analysis, and validates TypeScript compilation via `npm run build`.
3. **Container Image Publishing**:
   - Only when all tests pass, the `docker-publish` job triggers.
   - Using Docker Buildx and GitHub Actions layer caching (`type=gha`), it compiles production runtime containers and pushes them to GitHub Container Registry (GHCR):
     * `ghcr.io/zephir-x/projecthub-api:latest` (~130 MB, pure .NET 9 ASP.NET runtime without SDK).
     * `ghcr.io/zephir-x/projecthub-web:latest` (~30 MB, pure Nginx Alpine with pre-compiled HTML/JS/CSS assets).
4. **Zero-Build Deployment on Mikr.us**:
   - The VPS does not hold the source code, does not have Node.js or .NET SDK installed, and performs zero compilation.
   - The server only pulls pre-built lightweight runtime images using `docker compose pull`. RAM and CPU consumption during deployment remains practically at 0%.

### 5.3 Multi-Tenant Reverse Proxy & Routing Configuration

#### 1. Host Nginx Gateway (`/root/nginx-proxy/nginx.conf`)
The central Nginx proxy running on Mikr.us connects to the external `web-proxy` network. It routes traffic for `myprojecthub.com.pl` to the container `projecthub_web:80`. Crucially, it includes dedicated WebSocket upgrade directives for the SignalR hub:

#### 2. Network Isolation Architecture
* **`web-proxy` (External Network)**: Only `projecthub_web` joins this network. The central `nginx-proxy` can reach `http://projecthub_web:80`, but has no direct access to backend or database.
* **`projecthub_internal` (Bridge Network)**: Connects `projecthub_web`, `projecthub_api`, and `projecthub_postgres`.
* **Zero Host Port Collisions**: No ports (neither 5432 nor 8080) are published to the host machine. All inter-container communication occurs via Docker internal DNS.

#### 3. Cloudflare Edge Integration
* **DNS**: Root `@` and `www` records point to Mikr.us IP with Cloudflare Proxy enabled.
* **SSL/TLS Encryption**: Flexible SSL terminates encrypted HTTPS traffic at Cloudflare's edge and forwards requests via HTTP port 80 to Mikr.us, providing valid TLS certificates without requiring local Let's Encrypt renewal bots on the VPS.
* **WebSockets**: Cloudflare's native WebSocket proxy allows persistent full-duplex TCP connections for SignalR without timeout drops.

---

## 6. AI Guidelines & Technical Standards
* **Code Style:** Clean architecture, DTOs for external boundaries, Fluent API for EF Core.
* **Comments:** Concise, module-specific comments in English ONLY.
* **Tone:** Objective, technical, candidate for Grade 5.0 academic evaluation.
* **Formatting:** Strictly NO emojis in code, documentation, or chat.
