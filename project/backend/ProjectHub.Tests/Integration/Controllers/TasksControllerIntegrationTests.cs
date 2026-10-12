using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Tasks;
using ProjectHub.Tests.Integration.Infrastructure;
using Xunit;

namespace ProjectHub.Tests.Integration.Controllers;

public class TasksControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public TasksControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateTask_WhenStatusIsDoneWithoutAssignee_Returns409Conflict()
    {
        // Arrange (Rule 1 over HTTP: Cannot close task without active assignee)
        var admin = new User { Id = Guid.NewGuid(), Email = $"admin_{Guid.NewGuid():N}@test.com", Role = UserRole.Admin, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = admin.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };

        await _factory.SeedAsync(async db =>
        {
            db.Users.Add(admin);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(admin));

        var request = new CreateTaskItemRequest(
            Title: "Done Without Assignee",
            Description: "Attempting to create closed task",
            Status: ProjectTaskStatus.Done,
            Priority: TaskPriority.Medium,
            ProjectId: project.Id,
            AssigneeId: null
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/taskitems", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateTask_WhenStatusIsDoneWithAssignee_Returns201Created()
    {
        // Arrange (Rule 1 positive over HTTP)
        var admin = new User { Id = Guid.NewGuid(), Email = $"admin_{Guid.NewGuid():N}@test.com", Role = UserRole.Admin, PasswordHash = "hash" };
        var developer = new User { Id = Guid.NewGuid(), Email = $"dev_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = admin.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };

        await _factory.SeedAsync(async db =>
        {
            db.Users.AddRange(admin, developer);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(admin));

        var request = new CreateTaskItemRequest(
            Title: "Done With Assignee",
            Description: "Valid closed task",
            Status: ProjectTaskStatus.Done,
            Priority: TaskPriority.Medium,
            ProjectId: project.Id,
            AssigneeId: developer.Id
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/taskitems", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateTask_WhenRegularUserAssignsTask_Returns403Forbidden()
    {
        // Arrange (Rule 2 over HTTP: Only administrators can assign tasks)
        var user = new User { Id = Guid.NewGuid(), Email = $"user_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var colleague = new User { Id = Guid.NewGuid(), Email = $"colleague_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = user.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };

        await _factory.SeedAsync(async db =>
        {
            db.Users.AddRange(user, colleague);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(user));

        var request = new CreateTaskItemRequest(
            Title: "Assigned by User",
            Description: null,
            Status: ProjectTaskStatus.ToDo,
            Priority: TaskPriority.Low,
            ProjectId: project.Id,
            AssigneeId: colleague.Id
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/taskitems", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ChangeAssignee_WhenRegularUserAttemptsReassignment_Returns403Forbidden()
    {
        // Arrange (Rule 2 over HTTP: Regular user cannot reassign)
        var user = new User { Id = Guid.NewGuid(), Email = $"user_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = user.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "Task to Reassign",
            Status = ProjectTaskStatus.ToDo,
            Priority = TaskPriority.Medium,
            ProjectId = project.Id,
            Project = project,
            AssigneeId = null
        };

        await _factory.SeedAsync(async db =>
        {
            db.Users.Add(user);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            db.Tasks.Add(task);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(user));

        var request = new ChangeAssigneeRequest(AssigneeId: Guid.NewGuid());

        // Act
        var response = await client.PatchAsJsonAsync($"/api/taskitems/{task.Id}/assignee", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ChangeAssignee_WhenAdminReassigns_Returns204NoContent()
    {
        // Arrange (Rule 2 positive over HTTP: Admin can reassign)
        var admin = new User { Id = Guid.NewGuid(), Email = $"admin_{Guid.NewGuid():N}@test.com", Role = UserRole.Admin, PasswordHash = "hash" };
        var dev = new User { Id = Guid.NewGuid(), Email = $"dev_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = admin.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "Task to Reassign",
            Status = ProjectTaskStatus.ToDo,
            Priority = TaskPriority.Low,
            ProjectId = project.Id,
            Project = project,
            AssigneeId = null
        };

        await _factory.SeedAsync(async db =>
        {
            db.Users.AddRange(admin, dev);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            db.Tasks.Add(task);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(admin));

        var request = new ChangeAssigneeRequest(AssigneeId: dev.Id);

        // Act
        var response = await client.PatchAsJsonAsync($"/api/taskitems/{task.Id}/assignee", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
