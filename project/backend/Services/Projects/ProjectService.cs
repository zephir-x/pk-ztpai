using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Projects;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Extensions;

namespace ProjectHub.Api.Services.Projects;

public class ProjectService : IProjectService
{
    private readonly ProjectHubDbContext _context;

    public ProjectService(ProjectHubDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<ProjectResponse>> GetPagedByWorkspaceAsync(Guid workspaceId, PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        await ValidateWorkspaceAccessAsync(workspaceId, userId, role, ct);

        var query = _context.Projects
            .AsNoTracking()
            .Where(p => p.WorkspaceId == workspaceId);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(p => p.Name.Contains(request.SearchTerm));
        }

        var pagedData = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToPagedResponseAsync(request.PageNumber, request.PageSize, ct);

        var mappedItems = pagedData.Items
            .Select(p => new ProjectResponse(p.Id, p.Name, p.Description, p.WorkspaceId, p.CreatedAt))
            .ToList();

        return new PagedResponse<ProjectResponse>
        {
            Items = mappedItems,
            TotalCount = pagedData.TotalCount,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize
        };
    }

    public async Task<ProjectResponse> GetByIdAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct) 
            ?? throw new NotFoundException($"Project with ID {id} was not found.");

        await ValidateWorkspaceAccessAsync(project.WorkspaceId, userId, role, ct);

        return new ProjectResponse(project.Id, project.Name, project.Description, project.WorkspaceId, project.CreatedAt);
    }

    public async Task<ProjectResponse> CreateAsync(CreateProjectRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        await ValidateWorkspaceAccessAsync(request.WorkspaceId, userId, role, ct);

        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            WorkspaceId = request.WorkspaceId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync(ct);

        return new ProjectResponse(project.Id, project.Name, project.Description, project.WorkspaceId, project.CreatedAt);
    }

    public async Task UpdateAsync(Guid id, UpdateProjectRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id, ct) 
            ?? throw new NotFoundException($"Project with ID {id} was not found.");

        await ValidateWorkspaceAccessAsync(project.WorkspaceId, userId, role, ct);

        project.Name = request.Name;
        project.Description = request.Description;
        
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id, ct) 
            ?? throw new NotFoundException($"Project with ID {id} was not found.");

        await ValidateWorkspaceAccessAsync(project.WorkspaceId, userId, role, ct);

        // Enforce Business Rule 3: Project Deletion Lock
        var hasCriticalUnresolvedTasks = await _context.Tasks
            .AnyAsync(t => t.ProjectId == id 
                        && t.Priority == TaskPriority.Critical 
                        && t.Status != ProjectTaskStatus.Done, ct);

        if (hasCriticalUnresolvedTasks)
        {
            throw new ConflictException("Cannot delete a project that contains unresolved critical tasks.");
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync(ct);
    }

    // Ensures user has access to the underlying workspace before performing project operations
    private async Task ValidateWorkspaceAccessAsync(Guid workspaceId, Guid userId, UserRole role, CancellationToken ct)
    {
        if (role == UserRole.Admin) return;

        var workspace = await _context.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == workspaceId, ct)
            ?? throw new NotFoundException($"Workspace with ID {workspaceId} was not found.");

        if (workspace.OwnerId != userId)
        {
            throw new ForbiddenException("You do not have permission to access projects in this workspace.");
        }
    }
}
