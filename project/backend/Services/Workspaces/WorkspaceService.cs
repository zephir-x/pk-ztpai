using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Workspaces;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Extensions;

namespace ProjectHub.Api.Services.Workspaces;

public class WorkspaceService : IWorkspaceService
{
    private readonly ProjectHubDbContext _context;

    public WorkspaceService(ProjectHubDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<WorkspaceResponse>> GetPagedAsync(PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var query = _context.Workspaces.AsNoTracking();

        // Business Rule: Standard users can only view their own workspaces. Admins see all.
        if (role != UserRole.Admin)
        {
            query = query.Where(w => w.OwnerId == userId);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(w => w.Name.Contains(request.SearchTerm));
        }

        var pagedData = await query
            .OrderByDescending(w => w.CreatedAt)
            .ToPagedResponseAsync(request.PageNumber, request.PageSize, ct);

        // Map domain entities to response DTOs
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

    public async Task<WorkspaceResponse> GetByIdAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var workspace = await _context.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id, ct) 
            ?? throw new NotFoundException($"Workspace with ID {id} was not found.");

        ValidateAccess(workspace, userId, role);

        return new WorkspaceResponse(workspace.Id, workspace.Name, workspace.OwnerId, workspace.CreatedAt);
    }

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

    public async Task UpdateAsync(Guid id, UpdateWorkspaceRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => w.Id == id, ct) 
            ?? throw new NotFoundException($"Workspace with ID {id} was not found.");

        ValidateAccess(workspace, userId, role);

        workspace.Name = request.Name;
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => w.Id == id, ct) 
            ?? throw new NotFoundException($"Workspace with ID {id} was not found.");

        ValidateAccess(workspace, userId, role);

        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync(ct);
    }

    // Business Rule: Ownership or Admin access is strictly required for modification or specific access
    private static void ValidateAccess(Workspace workspace, Guid userId, UserRole role)
    {
        if (workspace.OwnerId != userId && role != UserRole.Admin)
        {
            throw new ForbiddenException("You do not have permission to access or modify this workspace.");
        }
    }
}
