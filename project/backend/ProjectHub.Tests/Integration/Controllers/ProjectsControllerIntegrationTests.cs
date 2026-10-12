using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Tests.Integration.Infrastructure;
using Xunit;

namespace ProjectHub.Tests.Integration.Controllers;

public class ProjectsControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ProjectsControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task DeleteProject_WhenCriticalTaskIsUnresolved_Returns409Conflict()
    {
        // Arrange (Rule 3 over HTTP: Cannot delete project with unresolved critical tasks)
        var admin = new User { Id = Guid.NewGuid(), Email = $"admin_{Guid.NewGuid():N}@test.com", Role = UserRole.Admin, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = admin.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project With Critical Bug", WorkspaceId = workspace.Id, Workspace = workspace };
        var criticalTask = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "Unresolved Critical Bug",
            Status = ProjectTaskStatus.InProgress,
            Priority = TaskPriority.Critical,
            ProjectId = project.Id,
            Project = project
        };

        await _factory.SeedAsync(async db =>
        {
            db.Users.Add(admin);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            db.Tasks.Add(criticalTask);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(admin));

        // Act
        var response = await client.DeleteAsync($"/api/projects/{project.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task DeleteProject_WhenCriticalTaskIsResolvedAsDone_Returns204NoContent()
    {
        // Arrange (Rule 3 positive over HTTP: Critical task is Done allows deletion)
        var admin = new User { Id = Guid.NewGuid(), Email = $"admin_{Guid.NewGuid():N}@test.com", Role = UserRole.Admin, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = admin.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project With Resolved Bug", WorkspaceId = workspace.Id, Workspace = workspace };
        var resolvedTask = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "Resolved Critical Bug",
            Status = ProjectTaskStatus.Done,
            Priority = TaskPriority.Critical,
            ProjectId = project.Id,
            Project = project
        };

        await _factory.SeedAsync(async db =>
        {
            db.Users.Add(admin);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            db.Tasks.Add(resolvedTask);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(admin));

        // Act
        var response = await client.DeleteAsync($"/api/projects/{project.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteProject_WhenRegularUserDoesNotOwnWorkspace_Returns403Forbidden()
    {
        // Arrange (Workspace ownership access check over HTTP)
        var owner = new User { Id = Guid.NewGuid(), Email = $"owner_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var foreignUser = new User { Id = Guid.NewGuid(), Email = $"foreign_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Owner Workspace", OwnerId = owner.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Protected Project", WorkspaceId = workspace.Id, Workspace = workspace };

        await _factory.SeedAsync(async db =>
        {
            db.Users.AddRange(owner, foreignUser);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(foreignUser));

        // Act
        var response = await client.DeleteAsync($"/api/projects/{project.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetProjectById_WithoutAuthorizationHeader_Returns401Unauthorized()
    {
        // Arrange (Global JWT security pipeline verification)
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/projects/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
