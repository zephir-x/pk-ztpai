using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Tasks;

namespace ProjectHub.Api.Services.Tasks;

public interface ITaskItemService
{
    Task<PagedResponse<TaskItemResponse>> GetPagedByProjectAsync(Guid projectId, PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task<TaskItemResponse> GetByIdAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default);
    Task<TaskItemResponse> CreateAsync(CreateTaskItemRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task UpdateAsync(Guid id, UpdateTaskItemRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task ChangeAssigneeAsync(Guid id, ChangeAssigneeRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default);
}
