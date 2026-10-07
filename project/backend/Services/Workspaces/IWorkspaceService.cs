using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Workspaces;

namespace ProjectHub.Api.Services.Workspaces;

public interface IWorkspaceService
{
    Task<PagedResponse<WorkspaceResponse>> GetPagedAsync(PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task<WorkspaceResponse> GetByIdAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default);
    Task<WorkspaceResponse> CreateAsync(CreateWorkspaceRequest request, Guid userId, CancellationToken ct = default);
    Task UpdateAsync(Guid id, UpdateWorkspaceRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default);
}
