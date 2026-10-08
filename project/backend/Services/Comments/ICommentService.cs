using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Comments;
using ProjectHub.Api.DTOs.Common;

namespace ProjectHub.Api.Services.Comments;

public interface ICommentService
{
    Task<PagedResponse<CommentResponse>> GetPagedByTaskAsync(Guid taskItemId, PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task<CommentResponse> CreateAsync(CreateCommentRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task UpdateAsync(Guid id, UpdateCommentRequest request, Guid userId, UserRole role, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default);
}
