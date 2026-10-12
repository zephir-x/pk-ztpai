using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Projects;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Services.Projects;
using ProjectHub.Tests.Infrastructure;
using Xunit;

namespace ProjectHub.Tests.Unit.Projects;

public class ProjectService_BusinessRulesTests
{
    private readonly ProjectHubDbContext _context;
    private readonly ProjectService _service;

    public ProjectService_BusinessRulesTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new ProjectService(_context);
    }

    [Fact]
    public async Task DeleteAsync_WhenProjectHasCriticalUnresolvedTask_ShouldThrowConflictException()
    {
        // Arrange (Rule 3: Cannot delete project containing unresolved critical tasks)
        var ownerId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Core Workspace", OwnerId = ownerId };
        var project = new Project { Id = Guid.NewGuid(), Name = "API Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var criticalTask = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "Critical bug in payment engine",
            Status = ProjectTaskStatus.InProgress,
            Priority = TaskPriority.Critical,
            ProjectId = project.Id,
            Project = project
        };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(criticalTask);
        await _context.SaveChangesAsync();

        // Act
        var act = async () => await _service.DeleteAsync(project.Id, ownerId, UserRole.Admin);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task DeleteAsync_WhenProjectHasCriticalTaskThatIsDone_ShouldDeleteSuccessfully()
    {
        // Arrange (Rule 3 edge case: Critical task resolved as Done allows deletion)
        var ownerId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Core Workspace", OwnerId = ownerId };
        var project = new Project { Id = Guid.NewGuid(), Name = "API Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var resolvedCriticalTask = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "Resolved Critical Bug",
            Status = ProjectTaskStatus.Done,
            Priority = TaskPriority.Critical,
            ProjectId = project.Id,
            Project = project
        };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(resolvedCriticalTask);
        await _context.SaveChangesAsync();

        // Act
        await _service.DeleteAsync(project.Id, ownerId, UserRole.Admin);

        // Assert
        var deletedProject = await _context.Projects.FirstOrDefaultAsync(p => p.Id == project.Id);
        deletedProject.Should().BeNull();

        var softDeleted = await _context.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == project.Id);
        softDeleted.Should().NotBeNull();
        softDeleted!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_WhenProjectHasUnresolvedNonCriticalTasks_ShouldDeleteSuccessfully()
    {
        // Arrange (Rule 3 edge case: High or Medium unresolved tasks do not block project deletion)
        var ownerId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = ownerId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var highTask = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "High priority feature",
            Status = ProjectTaskStatus.ToDo,
            Priority = TaskPriority.High,
            ProjectId = project.Id,
            Project = project
        };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(highTask);
        await _context.SaveChangesAsync();

        // Act
        await _service.DeleteAsync(project.Id, ownerId, UserRole.Admin);

        // Assert
        var deletedProject = await _context.Projects.FirstOrDefaultAsync(p => p.Id == project.Id);
        deletedProject.Should().BeNull();

        var softDeleted = await _context.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == project.Id);
        softDeleted.Should().NotBeNull();
        softDeleted!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_WhenRegularUserDoesNotOwnWorkspace_ShouldThrowForbiddenException()
    {
        // Arrange (Access control: non-owner regular user cannot delete project)
        var ownerId = Guid.NewGuid();
        var nonOwnerUserId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Owner Workspace", OwnerId = ownerId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Protected Project", WorkspaceId = workspace.Id, Workspace = workspace };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Act
        var act = async () => await _service.DeleteAsync(project.Id, nonOwnerUserId, UserRole.User);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task CreateAsync_WhenRegularUserDoesNotOwnWorkspace_ShouldThrowForbiddenException()
    {
        // Arrange (Access control: non-owner regular user cannot create project in foreign workspace)
        var ownerId = Guid.NewGuid();
        var nonOwnerUserId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Owner Workspace", OwnerId = ownerId };

        _context.Workspaces.Add(workspace);
        await _context.SaveChangesAsync();

        var request = new CreateProjectRequest("Unauthorized Project", "Desc", ThemeColor.Blue, workspace.Id);

        // Act
        var act = async () => await _service.CreateAsync(request, nonOwnerUserId, UserRole.User);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
