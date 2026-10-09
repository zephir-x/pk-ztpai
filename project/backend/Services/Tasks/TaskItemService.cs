using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Tasks;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Extensions;
using ProjectHub.Api.Infrastructure.SignalR;

namespace ProjectHub.Api.Services.Tasks;

// Service handling task item operations, including CRUD, assignee management, business rule enforcement, and real-time SignalR notifications
public class TaskItemService : ITaskItemService
{
    private readonly ProjectHubDbContext _context;
    private readonly IHubContext<KanbanHub> _hubContext;

    public TaskItemService(ProjectHubDbContext context, IHubContext<KanbanHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
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
            .Where(t => t.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(t => t.Title.Contains(request.SearchTerm));
        }

        var pagedData = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToPagedResponseAsync(request.PageNumber, request.PageSize, ct);

        var mappedItems = pagedData.Items
            .Select(t => new TaskItemResponse(t.Id, t.Title, t.Description, t.Status, t.Priority, t.ProjectId, t.AssigneeId, t.CreatedAt, t.UpdatedAt))
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
            .FirstOrDefaultAsync(t => t.Id == id, ct) 
            ?? throw new NotFoundException($"Task with ID {id} was not found.");

        return new TaskItemResponse(task.Id, task.Title, task.Description, task.Status, task.Priority, task.ProjectId, task.AssigneeId, task.CreatedAt, task.UpdatedAt);
    }
    
    // Creates a new task item and validates assignment constraints
    public async Task<TaskItemResponse> CreateAsync(CreateTaskItemRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        await ValidateProjectAccessAsync(request.ProjectId, userId, role, ct);

        if (request.Status == ProjectTaskStatus.Done && request.AssigneeId == null)
        {
            throw new ConflictException("A task cannot be created with 'Done' status if it does not have an assignee.");
        }

        if (request.AssigneeId != null && role != UserRole.Admin)
        {
            throw new ForbiddenException("Only users with ADMIN privileges can assign tasks to a user.");
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

        return new TaskItemResponse(task.Id, task.Title, task.Description, task.Status, task.Priority, task.ProjectId, task.AssigneeId, task.CreatedAt, task.UpdatedAt);
    }
    
    // Updates general details of a task and broadcasts the update to clients via SignalR
    public async Task UpdateAsync(Guid id, UpdateTaskItemRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var task = await _context.Tasks
                       .Include(t => t.Project)
                       .FirstOrDefaultAsync(t => t.Id == id, ct) 
                        ?? throw new NotFoundException($"Task with ID {id} was not found.");

        await ValidateProjectAccessAsync(task.ProjectId, userId, role, ct);

        if (request.Status == ProjectTaskStatus.Done && task.AssigneeId == null)
        {
            throw new ConflictException("A task cannot be marked as 'Done' if it does not have an active assignee attached.");
        }

        task.Title = request.Title;
        task.Description = request.Description;
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        
        await _hubContext.Clients.Group(task.Project.WorkspaceId.ToString())
            .SendAsync("TaskUpdated", new TaskItemResponse(task.Id, task.Title, task.Description, task.Status, task.Priority, task.ProjectId, task.AssigneeId, task.CreatedAt, task.UpdatedAt), ct);
    }
    
    // Reassigns a task to a different user - requires administrative privileges - dispatches real-time assignment notifications via SignalR
    public async Task ChangeAssigneeAsync(Guid id, ChangeAssigneeRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var task = await _context.Tasks
                       .Include(t => t.Project)
                       .FirstOrDefaultAsync(t => t.Id == id, ct) 
                        ?? throw new NotFoundException($"Task with ID {id} was not found.");

        await ValidateProjectAccessAsync(task.ProjectId, userId, role, ct);

        if (role != UserRole.Admin)
        {
            throw new ForbiddenException("Changing a task's assigned user can ONLY be performed by a user with ADMIN privileges.");
        }

        task.AssigneeId = request.AssigneeId;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        
        await _hubContext.Clients.Group(task.Project.WorkspaceId.ToString())
            .SendAsync("TaskAssigneeChanged", new { TaskId = task.Id, AssigneeId = task.AssigneeId }, ct);
    }
    
    // Deletes a task item
    public async Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var task = await _context.Tasks
            .Include(t => t.Comments)
            .FirstOrDefaultAsync(t => t.Id == id, ct) 
            ?? throw new NotFoundException($"Task with ID {id} was not found.");

        await ValidateProjectAccessAsync(task.ProjectId, userId, role, ct);

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync(ct);
    }
    
    // Confirms that the current user has the authority to modify the project's tasks
    private async Task ValidateProjectAccessAsync(Guid projectId, Guid userId, UserRole role, CancellationToken ct)
    {
        if (role == UserRole.Admin) return;

        var project = await _context.Projects
            .Include(p => p.Workspace)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new NotFoundException($"Project with ID {projectId} was not found.");

        if (project.Workspace.OwnerId != userId)
        {
            throw new ForbiddenException("You do not have permission to access tasks in this project.");
        }
    }
}
