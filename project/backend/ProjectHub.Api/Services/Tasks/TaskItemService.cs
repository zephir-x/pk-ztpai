using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Tasks;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Extensions;
using ProjectHub.Api.Infrastructure.Localization;
using ProjectHub.Api.Infrastructure.SignalR;
using ProjectHub.Api.Services.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectHub.Api.Services.Tasks;

// Service handling task item operations, including CRUD, assignee management, business rule enforcement, and real-time SignalR notifications
public class TaskItemService : ITaskItemService
{
    private readonly ProjectHubDbContext _context;
    private readonly IHubContext<KanbanHub> _hubContext;
    private readonly INotificationService _notificationService;

    public TaskItemService(
        ProjectHubDbContext context,
        IHubContext<KanbanHub> hubContext,
        INotificationService notificationService)
    {
        _context = context;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }
    
    // Retrieves a paginated and optionally filtered list of tasks for a specific project
    public async Task<IEnumerable<MyTaskResponse>> GetMyTasksAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Project)
                .ThenInclude(p => p.Workspace)
            .Where(t => t.AssigneeId == userId)
            .OrderByDescending(t => t.Priority)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new MyTaskResponse(
                t.Id,
                t.Title,
                t.Description,
                t.Status,
                t.Priority,
                t.ProjectId,
                t.Project.Name,
                t.Project.ThemeColor,
                t.Project.WorkspaceId,
                t.Project.Workspace.Name,
                t.Project.Workspace.ThemeColor,
                t.AssigneeId,
                t.CreatedAt,
                t.UpdatedAt
            ))
            .ToListAsync(ct);
    }

    public async Task<PagedResponse<TaskItemResponse>> GetPagedByProjectAsync(Guid projectId, PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.Assignee)
            .Where(t => t.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(t => t.Title.Contains(request.SearchTerm));
        }

        var pagedData = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToPagedResponseAsync(request.PageNumber, request.PageSize, ct);

        var mappedItems = pagedData.Items
            .Select(t => new TaskItemResponse(
                t.Id, 
                t.Title, 
                t.Description, 
                t.Status, 
                t.Priority, 
                t.ProjectId, 
                t.AssigneeId, 
                t.Assignee != null ? t.Assignee.FirstName : null,
                t.Assignee != null ? t.Assignee.LastName : null,
                t.Assignee != null ? t.Assignee.AvatarUrl : null,
                t.CreatedAt, 
                t.UpdatedAt))
            .ToList();

        return new PagedResponse<TaskItemResponse>
        {
            Items = mappedItems,
            TotalCount = pagedData.TotalCount,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize
        };
    }
    
    // Retrieves a single task item by its identifier
    public async Task<TaskItemResponse> GetByIdAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var task = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Assignee)
            .FirstOrDefaultAsync(t => t.Id == id, ct) 
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Task", id));

        return new TaskItemResponse(
            task.Id, 
            task.Title, 
            task.Description, 
            task.Status, 
            task.Priority, 
            task.ProjectId, 
            task.AssigneeId, 
            task.Assignee?.FirstName,
            task.Assignee?.LastName,
            task.Assignee?.AvatarUrl,
            task.CreatedAt, 
            task.UpdatedAt);
    }
    
    // Creates a new task item and validates assignment constraints
    public async Task<TaskItemResponse> CreateAsync(CreateTaskItemRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        await ValidateProjectAccessAsync(request.ProjectId, ct);

        if (request.Status == ProjectTaskStatus.Done && request.AssigneeId == null)
        {
            throw new ConflictException(LocalizationMessages.TaskDoneCreateRequiresAssignee);
        }

        if (request.AssigneeId != null && role != UserRole.Admin)
        {
            throw new ForbiddenException(LocalizationMessages.TaskAssignAdminOnly);
        }

        User? assignee = null;
        if (request.AssigneeId.HasValue)
        {
            assignee = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.AssigneeId.Value, ct);
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Status = request.Status,
            Priority = request.Priority,
            ProjectId = request.ProjectId,
            AssigneeId = request.AssigneeId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(ct);

        // Notifies assigned user if task is assigned on creation
        if (task.AssigneeId.HasValue && task.AssigneeId.Value != userId)
        {
            await _notificationService.CreateNotificationAsync(
                task.AssigneeId.Value,
                userId,
                NotificationType.TaskAssigned,
                "Task Assigned",
                $"You have been assigned to task \"{task.Title}\"",
                task.Id,
                task.ProjectId,
                ct);
        }

        return new TaskItemResponse(
            task.Id, 
            task.Title, 
            task.Description, 
            task.Status, 
            task.Priority, 
            task.ProjectId, 
            task.AssigneeId, 
            assignee?.FirstName,
            assignee?.LastName,
            assignee?.AvatarUrl,
            task.CreatedAt, 
            task.UpdatedAt);
    }
    
    // Updates general details of a task and broadcasts the update to clients via SignalR
    public async Task UpdateAsync(Guid id, UpdateTaskItemRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .FirstOrDefaultAsync(t => t.Id == id, ct) 
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Task", id));

        await ValidateProjectAccessAsync(task.ProjectId, ct);

        if (request.Status == ProjectTaskStatus.Done && task.AssigneeId == null)
        {
            throw new ConflictException(LocalizationMessages.TaskDoneRequiresAssignee);
        }

        // Only administrators can change task priority after creation
        if (request.Priority != task.Priority && role != UserRole.Admin)
        {
            throw new ForbiddenException(LocalizationMessages.TaskPriorityAdminOnly);
        }

        task.Title = request.Title;
        task.Description = request.Description;
        task.Status = request.Status;
        if (role == UserRole.Admin)
        {
            task.Priority = request.Priority;
        }
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        
        await _hubContext.Clients.Group(task.Project.WorkspaceId.ToString())
            .SendAsync("TaskUpdated", new TaskItemResponse(
                task.Id, 
                task.Title, 
                task.Description, 
                task.Status, 
                task.Priority, 
                task.ProjectId, 
                task.AssigneeId, 
                task.Assignee?.FirstName,
                task.Assignee?.LastName,
                task.Assignee?.AvatarUrl,
                task.CreatedAt, 
                task.UpdatedAt), ct);
    }
    
    // Reassigns a task to a different user - requires administrative privileges - dispatches real-time assignment notifications via SignalR
    public async Task ChangeAssigneeAsync(Guid id, ChangeAssigneeRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .FirstOrDefaultAsync(t => t.Id == id, ct) 
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Task", id));

        await ValidateProjectAccessAsync(task.ProjectId, ct);

        if (role != UserRole.Admin)
        {
            throw new ForbiddenException(LocalizationMessages.TaskAssignAdminOnly);
        }

        var previousAssigneeId = task.AssigneeId;
        task.AssigneeId = request.AssigneeId;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        // Notifies newly assigned user if assignee changed
        if (request.AssigneeId.HasValue && request.AssigneeId.Value != userId && request.AssigneeId != previousAssigneeId)
        {
            await _notificationService.CreateNotificationAsync(
                request.AssigneeId.Value,
                userId,
                NotificationType.TaskAssigned,
                "Task Assigned",
                $"You have been assigned to task \"{task.Title}\"",
                task.Id,
                task.ProjectId,
                ct);
        }

        User? newAssignee = null;
        if (request.AssigneeId.HasValue)
        {
            newAssignee = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.AssigneeId.Value, ct);
        }
        
        await _hubContext.Clients.Group(task.Project.WorkspaceId.ToString())
            .SendAsync("TaskAssigneeChanged", new { 
                TaskId = task.Id, 
                AssigneeId = task.AssigneeId,
                AssigneeFirstName = newAssignee?.FirstName,
                AssigneeLastName = newAssignee?.LastName,
                AssigneeAvatarUrl = newAssignee?.AvatarUrl
            }, ct);
    }
    
    // Deletes a task item - requires administrative privileges
    public async Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var task = await _context.Tasks
            .Include(t => t.Comments)
            .FirstOrDefaultAsync(t => t.Id == id, ct) 
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Task", id));

        await ValidateProjectAccessAsync(task.ProjectId, ct);

        if (role != UserRole.Admin)
        {
            throw new ForbiddenException(LocalizationMessages.AdminOnlyOperation);
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync(ct);
    }
    
    // Confirms that the project exists
    private async Task ValidateProjectAccessAsync(Guid projectId, CancellationToken ct)
    {
        var projectExists = await _context.Projects
            .AsNoTracking()
            .AnyAsync(p => p.Id == projectId, ct);

        if (!projectExists)
        {
            throw new NotFoundException(LocalizationMessages.NotFound("Project", projectId));
        }
    }
}
