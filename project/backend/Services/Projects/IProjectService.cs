using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Projects;

namespace ProjectHub.Api.Services.Projects;

public interface IProjectService
{
    Task<PagedResponse<ProjectResponse>> GetPagedByWorkspaceAsync(Guid workspaceId, PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task<ProjectResponse> GetByIdAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default);
    Task<ProjectResponse> CreateAsync(CreateProjectRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task UpdateAsync(Guid id, UpdateProjectRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default);
}
