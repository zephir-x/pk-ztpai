using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Workspaces;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Extensions;

namespace ProjectHub.Api.Services.Workspaces;

// Service responsible for managing organizational workspaces
public class WorkspaceService : IWorkspaceService
{
    private readonly ProjectHubDbContext _context;

    public WorkspaceService(ProjectHubDbContext context)
    {
        _context = context;
    }
    
    // Retrieves a paginated and optionally filtered list of workspaces
    public async Task<PagedResponse<WorkspaceResponse>> GetPagedAsync(PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var query = _context.Workspaces.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(w => w.Name.Contains(request.SearchTerm));
        }

        var pagedData = await query
            .OrderByDescending(w => w.CreatedAt)
            .ToPagedResponseAsync(request.PageNumber, request.PageSize, ct);

        var mappedItems = pagedData.Items
            .Select(w => new WorkspaceResponse(w.Id, w.Name, w.OwnerId, w.CreatedAt))
            .ToList();

        return new PagedResponse<WorkspaceResponse>
        {
            Items = mappedItems,
            TotalCount = pagedData.TotalCount,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize
        };
    }
    
    // Retrieves the details of a specific workspace by its unique identifier
    public async Task<WorkspaceResponse> GetByIdAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var workspace = await _context.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id, ct) 
            ?? throw new NotFoundException($"Workspace with ID {id} was not found.");

        return new WorkspaceResponse(workspace.Id, workspace.Name, workspace.OwnerId, workspace.CreatedAt);
    }
    
    // Creates a new workspace and sets the calling user as its owner
    public async Task<WorkspaceResponse> CreateAsync(CreateWorkspaceRequest request, Guid userId, CancellationToken ct = default)
    {
        var workspace = new Workspace
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Workspaces.Add(workspace);
        await _context.SaveChangesAsync(ct);

        return new WorkspaceResponse(workspace.Id, workspace.Name, workspace.OwnerId, workspace.CreatedAt);
    }
    
    // Updates an existing workspace. Modification strictly requires ownership or admin rights
    public async Task UpdateAsync(Guid id, UpdateWorkspaceRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => w.Id == id, ct) 
            ?? throw new NotFoundException($"Workspace with ID {id} was not found.");

        ValidateAccess(workspace, userId, role);

        workspace.Name = request.Name;
        await _context.SaveChangesAsync(ct);
    }
    
    // Deletes a workspace. Deletion strictly requires ownership or admin rights
    public async Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => w.Id == id, ct) 
            ?? throw new NotFoundException($"Workspace with ID {id} was not found.");

        ValidateAccess(workspace, userId, role);

        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync(ct);
    }
    
    // Confirms that the current user has the authority to modify the workspace
    private static void ValidateAccess(Workspace workspace, Guid userId, UserRole role)
    {
        if (workspace.OwnerId != userId && role != UserRole.Admin)
        {
            throw new ForbiddenException("You do not have permission to access or modify this workspace.");
        }
    }
}
