# Test Suite Report & Technical Documentation: ProjectHub.Tests

## 1. Introduction and Project Context

This document provides a comprehensive overview of the architecture, scope, and implementation of the automated testing suite developed for the **ProjectHub** platform. The module was designed to fulfill rigorous academic and engineering quality standards (targeting Grade 5.0 - Excellent).

The baseline project specifications required:
* A minimum of 5 unit tests isolating domain/service logic (verifying business rules).
* A minimum of 3 integration tests verifying the HTTP pipeline using `WebApplicationFactory`.

The implemented test suite significantly exceeds these minimum requirements:
* **21 Unit Tests** (isolating domain services, validating business rules, exception handling, MediatR domain event dispatching, and EF Core soft-delete query filters).
* **16 Integration Tests** (full ASP.NET Core pipeline, controller routing, JWT security filters, request serialization/validation, and exception-to-HTTP status code mapping via custom middleware).
* **Total: 37 Automated Tests with a 100% pass rate** and an execution time of approximately 1-2 seconds.

---

## 2. Test Environment Architecture and Configuration

### 2.1. Technology Stack
* **Framework:** .NET 9.0 (C# 13)
* **Test Runner:** xUnit 2.9.3 + `Microsoft.NET.Test.Sdk` 17.12.0 + `xunit.runner.visualstudio` 3.0.1
* **Assertions:** FluentAssertions 7.0.0 (clean, readable, and declarative assertions)
* **Mocking:** Moq 4.20.72
* **Integration Testing:** `Microsoft.AspNetCore.Mvc.Testing` 9.0.*
* **Test Database:** `Microsoft.EntityFrameworkCore.InMemory` 9.0.*

### 2.2. Data Isolation in Unit Tests (`TestDbContextFactory`)
Unit tests utilize `TestDbContextFactory`. Each test invocation receives a freshly instantiated `ProjectHubDbContext` configured with a unique in-memory database name (`Guid.NewGuid()`). This completely prevents state bleeding between test executions and enables full test parallelism.

### 2.3. Test Host Configuration (`CustomWebApplicationFactory`)
The `CustomWebApplicationFactory` class inherits from `WebApplicationFactory<Program>`:
1. Overrides the hosting environment to `Testing`.
2. Swaps out the production PostgreSQL registration in `Program.cs` for an isolated in-memory database, eliminating multi-provider conflicts within the EF Core service provider.
3. Injects in-memory `JwtOptions` configuration.
4. Generates cryptographically valid JWT tokens embedded with realistic identities and roles (`Admin`, `User`) matching standard `ClaimTypes.NameIdentifier` and `ClaimTypes.Role` conventions.
5. Provides a `SeedAsync(Func<ProjectHubDbContext, Task>)` helper to seed scenario-specific data into the test context prior to HTTP requests.

---

## 3. Business Rules Under Verification

ProjectHub enforces multiple business rules extending beyond standard CRUD workflows:

### Rule 1: Task Completion Requires an Active Assignee
* **Description:** A task cannot be transitioned to or created in the completed state (`Status = ProjectTaskStatus.Done`) if `AssigneeId` is `null`. This applies to both task creation and task updates.
* **Expected Outcome:** Throws domain `ConflictException` (message: `TaskDoneRequiresAssignee`), mapped by middleware to `409 Conflict`.

### Rule 2: Task Assignment and Reassignment Restricted to Administrators
* **Description:** Regular users (`UserRole.User`) can create and modify task details, but are strictly prohibited from assigning or reassigning tasks to team members. Assigning or updating `AssigneeId` requires `UserRole.Admin`.
* **Expected Outcome:** Throws domain `ForbiddenException` (message: `TaskAssignAdminOnly`), mapped by middleware to `403 Forbidden`. The positive administrator flow persists the assignment, dispatches an in-app notification, and notifies connected clients via SignalR (`KanbanHub`).

### Rule 3: Project Deletion Blocked by Unresolved Critical Tasks
* **Description:** A project cannot be deleted if it contains at least one task with critical priority (`Priority = TaskPriority.Critical`) whose status is not `Done`.
* **Expected Outcome:** Throws domain `ConflictException` (message: `CannotDeleteProjectCriticalTasks`), mapped by middleware to `409 Conflict`. If all critical tasks are marked as `Done`, or if open tasks have non-critical priorities (e.g., High, Medium, Low), project deletion succeeds.

### Rule 4: Comments Editable and Deletable Only by Author or Administrator
* **Description:** A comment's content can only be edited by the user who created it (`AuthorId == currentUserId`). Deleting a comment is restricted to either the original author or a user with the `Admin` role (for administrative moderation).
* **Expected Outcome:** Attempting to update or delete another user's comment as a regular user throws `ForbiddenException` (`403 Forbidden`).

### Rule 5: Administrator Cannot Delete Their Own Account
* **Description:** An administrator cannot delete their own account (`id == adminId`), ensuring system integrity by preventing accidental removal of the last managing administrator.
* **Expected Outcome:** Throws domain `ConflictException` (`409 Conflict`). Regular users attempting to invoke user deletion endpoints receive `ForbiddenException` (`403 Forbidden`).

### Additional Architectural Mechanisms Verified:
* **Asynchronous Domain Event Pipeline:** Creating a comment asynchronously triggers a `CommentCreatedEvent` via `IEventDispatcher` (MediatR channel pipeline) without blocking the HTTP response.
* **Soft Delete Architecture:** Deleting entities (User, Project, Comment) does not execute hard database deletes; instead, it sets `IsDeleted = true` and records `DeletedAt`. Global query filters in EF Core automatically filter out soft-deleted records in standard queries.
* **Account Integrity:** Unique constraint enforcement on user email addresses during registration, and verification of the current password prior to profile password updates.

---

## 4. Comprehensive Unit Test Inventory (21 Tests)

### 4.1. Class `TaskItemService_BusinessRulesTests` (6 Tests)
Location: `ProjectHub.Tests/Unit/Tasks/TaskItemService_BusinessRulesTests.cs`

1. `CreateAsync_WhenStatusIsDoneAndAssigneeIsNull_ShouldThrowConflictException`
   * **Scope:** Rule 1 negative (creation).
   * **Description:** Attempts to create a new task with `Status = Done` and no assigned user (`AssigneeId = null`).
   * **Assertion:** Throws `ConflictException`.
2. `UpdateAsync_WhenChangingStatusToDoneWithoutAssignee_ShouldThrowConflictException`
   * **Scope:** Rule 1 negative (update).
   * **Description:** Attempts to transition an existing unassigned task to `Done`.
   * **Assertion:** Throws `ConflictException`.
3. `CreateAsync_WhenStatusIsDoneWithValidAssignee_ShouldSucceed`
   * **Scope:** Rule 1 positive.
   * **Description:** Successfully creates a task with `Status = Done` when a valid assignee is provided.
   * **Assertion:** Task is saved, `Status == Done`, `AssigneeId == targetId`.
4. `CreateAsync_WhenRegularUserAssignsTask_ShouldThrowForbiddenException`
   * **Scope:** Rule 2 negative (creation).
   * **Description:** A user with `UserRole.User` attempts to create a task with an assigned user.
   * **Assertion:** Throws `ForbiddenException`.
5. `ChangeAssigneeAsync_WhenRegularUserAttemptsReassignment_ShouldThrowForbiddenException`
   * **Scope:** Rule 2 negative (reassignment).
   * **Description:** A regular user attempts to reassign an existing task via the dedicated service method.
   * **Assertion:** Throws `ForbiddenException`.
6. `ChangeAssigneeAsync_WhenAdminReassignsTask_ShouldUpdateAssigneeAndBroadcastSignalR`
   * **Scope:** Rule 2 positive + SignalR / Notifications.
   * **Description:** An administrator reassigns a task.
   * **Assertion:** The database task record reflects the new `AssigneeId`, and `INotificationService.CreateNotificationAsync` is invoked exactly once.

### 4.2. Class `ProjectService_BusinessRulesTests` (5 Tests)
Location: `ProjectHub.Tests/Unit/Projects/ProjectService_BusinessRulesTests.cs`

1. `DeleteAsync_WhenProjectHasCriticalUnresolvedTask_ShouldThrowConflictException`
   * **Scope:** Rule 3 negative.
   * **Description:** Attempts to delete a project containing an unresolved critical task (`Priority = Critical`, `Status = InProgress`).
   * **Assertion:** Throws `ConflictException`.
2. `DeleteAsync_WhenProjectHasCriticalTaskThatIsDone_ShouldDeleteSuccessfully`
   * **Scope:** Rule 3 positive (edge case).
   * **Description:** Deletes a project where all critical tasks are resolved (`Status = Done`).
   * **Assertion:** Project is soft-deleted successfully (`IsDeleted = true`).
3. `DeleteAsync_WhenProjectHasUnresolvedNonCriticalTasks_ShouldDeleteSuccessfully`
   * **Scope:** Rule 3 positive (other priorities).
   * **Description:** Deletes a project containing unresolved non-critical tasks (`High` or `Medium`).
   * **Assertion:** Project is deleted successfully; non-critical tasks do not block deletion.
4. `DeleteAsync_WhenRegularUserDoesNotOwnWorkspace_ShouldThrowForbiddenException`
   * **Scope:** Access control and RBAC.
   * **Description:** A regular user attempts to delete a project in an unowned workspace.
   * **Assertion:** Throws `ForbiddenException`.
5. `CreateAsync_WhenRegularUserDoesNotOwnWorkspace_ShouldThrowForbiddenException`
   * **Scope:** Access control and RBAC.
   * **Description:** A regular user attempts to create a new project in an unowned workspace.
   * **Assertion:** Throws `ForbiddenException`.

### 4.3. Class `CommentService_AuthorizationTests` (5 Tests)
Location: `ProjectHub.Tests/Unit/Comments/CommentService_AuthorizationTests.cs`

1. `CreateAsync_WhenCalled_ShouldSaveCommentAndDispatchCommentCreatedEvent`
   * **Scope:** Asynchronous event pipeline (MediatR).
   * **Description:** A user creates a comment.
   * **Assertion:** Comment is persisted, and `IEventDispatcher.DispatchAsync` is invoked with `CommentCreatedEvent`.
2. `UpdateAsync_WhenUserIsNotAuthorAndNotAdmin_ShouldThrowForbiddenException`
   * **Scope:** Rule 4 negative (update).
   * **Description:** Another user attempts to modify a comment.
   * **Assertion:** Throws `ForbiddenException`.
3. `UpdateAsync_WhenUserIsAuthor_ShouldUpdateSuccessfully`
   * **Scope:** Rule 4 positive (update).
   * **Description:** The author updates their own comment.
   * **Assertion:** Database record reflects the updated comment content.
4. `DeleteAsync_WhenUserIsAdmin_ShouldSucceedEvenIfNotAuthor`
   * **Scope:** Rule 4 positive (administrative override).
   * **Description:** An administrator deletes another user's comment for content moderation.
   * **Assertion:** Comment is soft-deleted from the database (`IsDeleted = true`).
5. `DeleteAsync_WhenUserIsNotAuthorAndNotAdmin_ShouldThrowForbiddenException`
   * **Scope:** Rule 4 negative (deletion).
   * **Description:** A non-author, non-admin user attempts to delete someone else's comment.
   * **Assertion:** Throws `ForbiddenException`.

### 4.4. Class `UserService_BusinessRulesTests` (5 Tests)
Location: `ProjectHub.Tests/Unit/Users/UserService_BusinessRulesTests.cs`

1. `DeleteAsync_WhenAdminTriesToDeleteOwnAccount_ShouldThrowConflictException`
   * **Scope:** Rule 5 negative.
   * **Description:** An administrator attempts to delete their own account.
   * **Assertion:** Throws `ConflictException`.
2. `DeleteAsync_WhenRegularUserCallsDelete_ShouldThrowForbiddenException`
   * **Scope:** Access control and RBAC.
   * **Description:** A regular user invokes the user deletion method.
   * **Assertion:** Throws `ForbiddenException`.
3. `DeleteAsync_WhenAdminDeletesAnotherUser_ShouldSoftDeleteUser`
   * **Scope:** Soft Delete mechanism.
   * **Description:** An administrator deletes another user's account.
   * **Assertion:** The user is excluded from standard LINQ queries (`FirstOrDefaultAsync == null`), and querying with `IgnoreQueryFilters()` confirms `IsDeleted = true`.
4. `CreateAsync_WhenEmailAlreadyExists_ShouldThrowConflictException`
   * **Scope:** Data uniqueness.
   * **Description:** Attempts to create a user account with an existing email address.
   * **Assertion:** Throws `ConflictException`.
5. `UpdateProfileAsync_WhenChangingPasswordWithIncorrectCurrentPassword_ShouldThrowConflictException`
   * **Scope:** Credential security.
   * **Description:** Attempts a password change with an invalid current password.
   * **Assertion:** Throws `ConflictException`.

---

## 5. Comprehensive Integration Test Inventory (16 Tests)

Integration tests bootstrap the complete ASP.NET Core application in-memory, exercising the full network pipeline:
`Request -> Kestrel/Pipeline -> Routing -> JwtBearerHandler -> Controller -> ModelBinding/Validation -> Service -> DbContext (InMemory) -> Middleware/Status Mapping -> Response`.

### 5.1. Class `AuthControllerIntegrationTests` (4 Tests)
Location: `ProjectHub.Tests/Integration/Controllers/AuthControllerIntegrationTests.cs`

1. `Register_WhenValidDataProvided_ShouldReturn201Created`
   * **Endpoint:** `POST /api/auth/register`
   * **Description:** Registers an account with a unique email and strong password.
   * **Assertion:** HTTP status code `201 Created`.
2. `Register_WhenEmailAlreadyExists_ShouldReturn409Conflict`
   * **Endpoint:** `POST /api/auth/register`
   * **Description:** Attempts a duplicate registration using the same email address.
   * **Assertion:** HTTP status code `409 Conflict`.
3. `Login_WhenCredentialsAreValid_ShouldReturn200OkWithJwtToken`
   * **Endpoint:** `POST /api/auth/login`
   * **Description:** Authenticates with valid credentials.
   * **Assertion:** HTTP status code `200 OK`, response body contains a non-empty `token` string.
4. `Login_WhenPasswordIsIncorrect_ShouldReturn401Unauthorized`
   * **Endpoint:** `POST /api/auth/login`
   * **Description:** Attempts authentication with an incorrect password.
   * **Assertion:** HTTP status code `401 Unauthorized`.

### 5.2. Class `TasksControllerIntegrationTests` (5 Tests)
Location: `ProjectHub.Tests/Integration/Controllers/TasksControllerIntegrationTests.cs`

1. `CreateTask_WhenStatusIsDoneWithoutAssignee_Returns409Conflict`
   * **Endpoint:** `POST /api/taskitems`
   * **Description:** Rule 1 via HTTP. Submits task creation with `Status = Done` and `AssigneeId = null`.
   * **Assertion:** HTTP status code `409 Conflict`.
2. `CreateTask_WhenStatusIsDoneWithAssignee_Returns201Created`
   * **Endpoint:** `POST /api/taskitems`
   * **Description:** Rule 1 positive via HTTP. Submits task creation with `Status = Done` and a valid assignee.
   * **Assertion:** HTTP status code `201 Created`.
3. `CreateTask_WhenRegularUserAssignsTask_Returns403Forbidden`
   * **Endpoint:** `POST /api/taskitems`
   * **Description:** Rule 2 via HTTP. Request authenticated with `UserRole.User` attempting to assign a task.
   * **Assertion:** HTTP status code `403 Forbidden`.
4. `ChangeAssignee_WhenRegularUserAttemptsReassignment_Returns403Forbidden`
   * **Endpoint:** `PATCH /api/taskitems/{id}/assignee`
   * **Description:** Rule 2 via HTTP. Regular user attempts reassignment via the PATCH endpoint.
   * **Assertion:** HTTP status code `403 Forbidden`.
5. `ChangeAssignee_WhenAdminReassigns_Returns204NoContent`
   * **Endpoint:** `PATCH /api/taskitems/{id}/assignee`
   * **Description:** Rule 2 positive via HTTP. Administrator successfully reassigns a task.
   * **Assertion:** HTTP status code `204 NoContent`.

### 5.3. Class `ProjectsControllerIntegrationTests` (4 Tests)
Location: `ProjectHub.Tests/Integration/Controllers/ProjectsControllerIntegrationTests.cs`

1. `DeleteProject_WhenCriticalTaskIsUnresolved_Returns409Conflict`
   * **Endpoint:** `DELETE /api/projects/{id}`
   * **Description:** Rule 3 via HTTP. Attempts to delete a project containing an active `Critical` task.
   * **Assertion:** HTTP status code `409 Conflict`.
2. `DeleteProject_WhenCriticalTaskIsResolvedAsDone_Returns204NoContent`
   * **Endpoint:** `DELETE /api/projects/{id}`
   * **Description:** Rule 3 positive via HTTP. Deletes a project whose critical tasks are `Done`.
   * **Assertion:** HTTP status code `204 NoContent`.
3. `DeleteProject_WhenRegularUserDoesNotOwnWorkspace_Returns403Forbidden`
   * **Endpoint:** `DELETE /api/projects/{id}`
   * **Description:** User attempts to delete a project within an unowned workspace.
   * **Assertion:** HTTP status code `403 Forbidden`.
4. `GetProjectById_WithoutAuthorizationHeader_Returns401Unauthorized`
   * **Endpoint:** `GET /api/projects/{id}`
   * **Description:** Verifies the `[Authorize]` filter when no `Authorization` header is provided.
   * **Assertion:** HTTP status code `401 Unauthorized`.

### 5.4. Class `CommentsControllerIntegrationTests` (3 Tests)
Location: `ProjectHub.Tests/Integration/Controllers/CommentsControllerIntegrationTests.cs`

1. `CreateComment_WhenValidDataProvided_Returns201Created`
   * **Endpoint:** `POST /api/comments`
   * **Description:** Creates a comment and verifies the complete HTTP pipeline and MediatR event dispatch.
   * **Assertion:** HTTP status code `201 Created`.
2. `UpdateComment_WhenUserIsNotAuthorAndNotAdmin_Returns403Forbidden`
   * **Endpoint:** `PUT /api/comments/{id}`
   * **Description:** Rule 4 via HTTP. Regular user attempts to edit another user's comment.
   * **Assertion:** HTTP status code `403 Forbidden`.
3. `DeleteComment_WhenAdminDeletesOtherUserComment_Returns204NoContent`
   * **Endpoint:** `DELETE /api/comments/{id}`
   * **Description:** Rule 4 positive via HTTP. Administrator deletes another user's comment.
   * **Assertion:** HTTP status code `204 NoContent`.

---

## 6. Test Execution Summary

### Test Metrics
| Category | Total Tests | Passed | Failed | Skipped |
|---|---|---|---|---|
| Unit Tests | 21 | 21 | 0 | 0 |
| Integration Tests | 16 | 16 | 0 | 0 |
| **Total** | **37** | **37** | **0** | **0** |

### Benchmark Metrics
* Solution compilation time: ~1.2 s
* Execution time for all 37 tests under .NET 9: ~1.8 s

---

## 7. Test Execution Instructions

### 7.1. Running via Command Line (PowerShell / Terminal)
Navigate to the backend directory:
```powershell
cd C:\Users\kacpe\RiderProjects\pk-ztpai\project\backend
dotnet test ProjectHub.sln
```

### 7.2. Running with Detailed Test Output
To display the name and status of each test during execution:
```powershell
dotnet test ProjectHub.sln --logger "console;verbosity=normal"
```

### 7.3. Selective Test Execution
* **Unit tests only:**
  ```powershell
  dotnet test ProjectHub.sln --filter "FullyQualifiedName~Unit"
  ```
* **Integration tests only:**
  ```powershell
  dotnet test ProjectHub.sln --filter "FullyQualifiedName~Integration"
  ```
* **Specific service tests (e.g., TaskItemService):**
  ```powershell
  dotnet test ProjectHub.sln --filter "FullyQualifiedName~TaskItemService"
  ```

### 7.4. Running in JetBrains Rider
1. Open the solution in JetBrains Rider.
2. Select `Test` -> `Unit Tests` from the top menu (or press `Alt + 8`).
3. Click the green `Run All Tests` button (`Ctrl + U, R`).
4. All 37 tests will be discovered under `ProjectHub.Tests` categorized into `Unit` and `Integration`.
