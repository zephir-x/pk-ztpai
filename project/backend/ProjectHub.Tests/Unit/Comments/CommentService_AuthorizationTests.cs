using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Events;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Comments;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Events;
using ProjectHub.Api.Services.Comments;
using ProjectHub.Tests.Infrastructure;
using Xunit;

namespace ProjectHub.Tests.Unit.Comments;

public class CommentService_AuthorizationTests
{
    private readonly ProjectHubDbContext _context;
    private readonly Mock<IEventDispatcher> _mockEventDispatcher;
    private readonly CommentService _service;

    public CommentService_AuthorizationTests()
    {
        _context = TestDbContextFactory.Create();
        _mockEventDispatcher = new Mock<IEventDispatcher>();
        _service = new CommentService(_context, _mockEventDispatcher.Object);
    }

    [Fact]
    public async Task CreateAsync_WhenCalled_ShouldSaveCommentAndDispatchCommentCreatedEvent()
    {
        // Arrange (Testing Comment creation and Asynchronous Domain Event dispatching)
        var userId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = userId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem { Id = Guid.NewGuid(), Title = "Task", ProjectId = project.Id, Project = project };
        var user = new User { Id = userId, Email = "author@example.com", PasswordHash = "hash", Role = UserRole.User };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(task);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateCommentRequest("This is a new test comment", task.Id);

        // Act
        var result = await _service.CreateAsync(request, userId, UserRole.User);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be("This is a new test comment");
        result.AuthorId.Should().Be(userId);

        _mockEventDispatcher.Verify(d => d.DispatchAsync(
            It.Is<CommentCreatedEvent>(e => e.CommentId == result.Id && e.TaskItemId == task.Id && e.AuthorId == userId),
            default
        ), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenUserIsNotAuthorAndNotAdmin_ShouldThrowForbiddenException()
    {
        // Arrange (Rule 4: Comment can be edited only by its author or Admin)
        var authorId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = authorId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem { Id = Guid.NewGuid(), Title = "Task", ProjectId = project.Id, Project = project };
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "Original comment text",
            TaskItemId = task.Id,
            AuthorId = authorId
        };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(task);
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateCommentRequest("Attempted unauthorized modification");

        // Act
        var act = async () => await _service.UpdateAsync(comment.Id, updateRequest, otherUserId, UserRole.User);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateAsync_WhenUserIsAuthor_ShouldUpdateSuccessfully()
    {
        // Arrange (Rule 4 positive: Author can edit their own comment)
        var authorId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = authorId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem { Id = Guid.NewGuid(), Title = "Task", ProjectId = project.Id, Project = project };
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "Original comment text",
            TaskItemId = task.Id,
            AuthorId = authorId
        };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(task);
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateCommentRequest("Updated by author");

        // Act
        await _service.UpdateAsync(comment.Id, updateRequest, authorId, UserRole.User);

        // Assert
        var updated = await _context.Comments.FirstOrDefaultAsync(c => c.Id == comment.Id);
        updated!.Content.Should().Be("Updated by author");
    }

    [Fact]
    public async Task DeleteAsync_WhenUserIsAdmin_ShouldSucceedEvenIfNotAuthor()
    {
        // Arrange (Rule 4: Admin can delete any comment)
        var authorId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = authorId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem { Id = Guid.NewGuid(), Title = "Task", ProjectId = project.Id, Project = project };
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "Inappropriate content",
            TaskItemId = task.Id,
            AuthorId = authorId
        };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(task);
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Act (Admin deletes regular user's comment)
        await _service.DeleteAsync(comment.Id, adminId, UserRole.Admin);

        // Assert
        var deleted = await _context.Comments.FirstOrDefaultAsync(c => c.Id == comment.Id);
        deleted.Should().BeNull();

        var softDeleted = await _context.Comments.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == comment.Id);
        softDeleted.Should().NotBeNull();
        softDeleted!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_WhenUserIsNotAuthorAndNotAdmin_ShouldThrowForbiddenException()
    {
        // Arrange (Rule 4: Non-author, non-admin user cannot delete comment)
        var authorId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = authorId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem { Id = Guid.NewGuid(), Title = "Task", ProjectId = project.Id, Project = project };
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "Protected comment",
            TaskItemId = task.Id,
            AuthorId = authorId
        };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(task);
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Act
        var act = async () => await _service.DeleteAsync(comment.Id, otherUserId, UserRole.User);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
