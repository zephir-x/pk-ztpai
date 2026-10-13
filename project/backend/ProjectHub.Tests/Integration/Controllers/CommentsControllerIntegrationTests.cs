using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Comments;
using ProjectHub.Tests.Integration.Infrastructure;
using Xunit;

namespace ProjectHub.Tests.Integration.Controllers;

public class CommentsControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CommentsControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateComment_WhenValidDataProvided_Returns201Created()
    {
        // Arrange (Testing Comment Creation and async event pipeline through HTTP)
        var author = new User { Id = Guid.NewGuid(), Email = $"author_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = author.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem { Id = Guid.NewGuid(), Title = "Task With Discussion", ProjectId = project.Id, Project = project };

        await _factory.SeedAsync(async db =>
        {
            db.Users.Add(author);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            db.Tasks.Add(task);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(author));

        var request = new CreateCommentRequest("Important requirement discussion note", task.Id);

        // Act
        var response = await client.PostAsJsonAsync("/api/comments", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task UpdateComment_WhenUserIsNotAuthorAndNotAdmin_Returns403Forbidden()
    {
        // Arrange (Rule 4 over HTTP: Non-author, non-admin user cannot edit comment)
        var author = new User { Id = Guid.NewGuid(), Email = $"author_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var otherUser = new User { Id = Guid.NewGuid(), Email = $"other_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = author.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem { Id = Guid.NewGuid(), Title = "Task", ProjectId = project.Id, Project = project };
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "Author comment",
            TaskItemId = task.Id,
            AuthorId = author.Id
        };

        await _factory.SeedAsync(async db =>
        {
            db.Users.AddRange(author, otherUser);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            db.Tasks.Add(task);
            db.Comments.Add(comment);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(otherUser));

        var updateRequest = new UpdateCommentRequest("Hacked comment text");

        // Act
        var response = await client.PutAsJsonAsync($"/api/comments/{comment.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteComment_WhenAdminDeletesOtherUserComment_Returns204NoContent()
    {
        // Arrange (Rule 4 positive over HTTP: Administrator can delete any comment)
        var author = new User { Id = Guid.NewGuid(), Email = $"author_{Guid.NewGuid():N}@test.com", Role = UserRole.User, PasswordHash = "hash" };
        var admin = new User { Id = Guid.NewGuid(), Email = $"admin_{Guid.NewGuid():N}@test.com", Role = UserRole.Admin, PasswordHash = "hash" };
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = author.Id };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem { Id = Guid.NewGuid(), Title = "Task", ProjectId = project.Id, Project = project };
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "Comment to be moderated",
            TaskItemId = task.Id,
            AuthorId = author.Id
        };

        await _factory.SeedAsync(async db =>
        {
            db.Users.AddRange(author, admin);
            db.Workspaces.Add(workspace);
            db.Projects.Add(project);
            db.Tasks.Add(task);
            db.Comments.Add(comment);
            await Task.CompletedTask;
        });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.GenerateJwtToken(admin));

        // Act
        var response = await client.DeleteAsync($"/api/comments/{comment.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
