using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Tasks;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.SignalR;
using ProjectHub.Api.Services.Notifications;
using ProjectHub.Api.Services.Tasks;
using ProjectHub.Tests.Infrastructure;
using Xunit;

namespace ProjectHub.Tests.Unit.Tasks;

public class TaskItemService_BusinessRulesTests
{
    private readonly ProjectHubDbContext _context;
    private readonly Mock<IHubContext<KanbanHub>> _mockHubContext;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly TaskItemService _service;

    public TaskItemService_BusinessRulesTests()
    {
        _context = TestDbContextFactory.Create();
        _mockHubContext = new Mock<IHubContext<KanbanHub>>();
        _mockNotificationService = new Mock<INotificationService>();

        var mockClients = new Mock<IHubClients>();
        var mockClientProxy = new Mock<IClientProxy>();
        _mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);

        _service = new TaskItemService(_context, _mockHubContext.Object, _mockNotificationService.Object);
    }

    [Fact]
    public async Task CreateAsync_WhenStatusIsDoneAndAssigneeIsNull_ShouldThrowConflictException()
    {
        // Arrange (Rule 1: Task cannot be closed / Done without an active assignee)
        var ownerId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Dev Workspace", OwnerId = ownerId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Core API", WorkspaceId = workspace.Id, Workspace = workspace };
        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var request = new CreateTaskItemRequest(
            Title: "Finalize Deliverable",
            Description: "Completed task",
            Status: ProjectTaskStatus.Done,
            Priority: TaskPriority.Medium,
            ProjectId: project.Id,
            AssigneeId: null
        );

        // Act
        var act = async () => await _service.CreateAsync(request, ownerId, UserRole.Admin);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateAsync_WhenChangingStatusToDoneWithoutAssignee_ShouldThrowConflictException()
    {
        // Arrange (Rule 1: Task cannot transition to Done if AssigneeId is null)
        var ownerId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = ownerId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "Unassigned In Progress Task",
            Status = ProjectTaskStatus.InProgress,
            Priority = TaskPriority.High,
            ProjectId = project.Id,
            Project = project,
            AssigneeId = null
        };
        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateTaskItemRequest(
            Title: "Unassigned Task",
            Description: "Trying to close without assignee",
            Status: ProjectTaskStatus.Done,
            Priority: TaskPriority.High
        );

        // Act
        var act = async () => await _service.UpdateAsync(task.Id, updateRequest, ownerId, UserRole.Admin);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_WhenStatusIsDoneWithValidAssignee_ShouldSucceed()
    {
        // Arrange (Rule 1: Succeeded when Done has a valid assignee)
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = ownerId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var user = new User { Id = assigneeId, Email = "dev@example.com", PasswordHash = "hash", Role = UserRole.User };
        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateTaskItemRequest(
            Title: "Completed Task",
            Description: "Has assignee",
            Status: ProjectTaskStatus.Done,
            Priority: TaskPriority.Low,
            ProjectId: project.Id,
            AssigneeId: assigneeId
        );

        // Act
        var result = await _service.CreateAsync(request, ownerId, UserRole.Admin);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(ProjectTaskStatus.Done);
        result.AssigneeId.Should().Be(assigneeId);
    }

    [Fact]
    public async Task CreateAsync_WhenRegularUserAssignsTask_ShouldThrowForbiddenException()
    {
        // Arrange (Rule 2: Only administrators can assign tasks)
        var regularUserId = Guid.NewGuid();
        var targetAssigneeId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = regularUserId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var request = new CreateTaskItemRequest(
            Title: "Assigned Task",
            Description: null,
            Status: ProjectTaskStatus.ToDo,
            Priority: TaskPriority.Medium,
            ProjectId: project.Id,
            AssigneeId: targetAssigneeId
        );

        // Act (UserRole.User attempts assignment)
        var act = async () => await _service.CreateAsync(request, regularUserId, UserRole.User);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task ChangeAssigneeAsync_WhenRegularUserAttemptsReassignment_ShouldThrowForbiddenException()
    {
        // Arrange (Rule 2: Regular user cannot reassign an existing task)
        var regularUserId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = regularUserId };
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
        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var changeRequest = new ChangeAssigneeRequest(AssigneeId: Guid.NewGuid());

        // Act
        var act = async () => await _service.ChangeAssigneeAsync(task.Id, changeRequest, regularUserId, UserRole.User);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task ChangeAssigneeAsync_WhenAdminReassignsTask_ShouldUpdateAssigneeAndBroadcastSignalR()
    {
        // Arrange (Rule 2 positive path: Admin reassigns task, updates DB and notifies via SignalR)
        var adminId = Guid.NewGuid();
        var newAssigneeId = Guid.NewGuid();
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Workspace", OwnerId = adminId };
        var project = new Project { Id = Guid.NewGuid(), Name = "Project", WorkspaceId = workspace.Id, Workspace = workspace };
        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = "Task",
            Status = ProjectTaskStatus.ToDo,
            Priority = TaskPriority.Low,
            ProjectId = project.Id,
            Project = project,
            AssigneeId = null
        };
        var assigneeUser = new User
        {
            Id = newAssigneeId,
            Email = "assignee@example.com",
            FirstName = "Jan",
            LastName = "Kowalski",
            PasswordHash = "hash",
            Role = UserRole.User
        };

        _context.Workspaces.Add(workspace);
        _context.Projects.Add(project);
        _context.Tasks.Add(task);
        _context.Users.Add(assigneeUser);
        await _context.SaveChangesAsync();

        var changeRequest = new ChangeAssigneeRequest(AssigneeId: newAssigneeId);

        // Act
        await _service.ChangeAssigneeAsync(task.Id, changeRequest, adminId, UserRole.Admin);

        // Assert
        var updatedTask = await _context.Tasks.FindAsync(task.Id);
        updatedTask.Should().NotBeNull();
        updatedTask!.AssigneeId.Should().Be(newAssigneeId);

        _mockNotificationService.Verify(n => n.CreateNotificationAsync(
            newAssigneeId,
            adminId,
            NotificationType.TaskAssigned,
            It.IsAny<string>(),
            It.IsAny<string>(),
            task.Id,
            task.ProjectId,
            default
        ), Times.Once);
    }
}
