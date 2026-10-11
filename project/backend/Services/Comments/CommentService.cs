using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Events;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Comments;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Events;
using ProjectHub.Api.Infrastructure.Extensions;
using ProjectHub.Api.Infrastructure.Localization;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectHub.Api.Services.Comments;

public class CommentService : ICommentService
{
    private readonly ProjectHubDbContext _context;
    private readonly IEventDispatcher _eventDispatcher;

    public CommentService(ProjectHubDbContext context, IEventDispatcher eventDispatcher)
    {
        _context = context;
        _eventDispatcher = eventDispatcher;
    }

    public async Task<PagedResponse<CommentResponse>> GetPagedByTaskAsync(Guid taskItemId, PagedRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        await ValidateTaskAccessAsync(taskItemId, userId, role, ct);

        var query = _context.Comments
            .AsNoTracking()
            .Include(c => c.Author)
            .Where(c => c.TaskItemId == taskItemId);

        var pagedData = await query
            .OrderByDescending(c => c.CreatedAt)
            .ToPagedResponseAsync(request.PageNumber, request.PageSize, ct);

        var mappedItems = pagedData.Items
            .Select(c => new CommentResponse(
                c.Id, 
                c.Content, 
                c.TaskItemId, 
                c.AuthorId, 
                c.Author != null ? c.Author.FirstName : null,
                c.Author != null ? c.Author.LastName : null,
                c.Author != null ? c.Author.AvatarUrl : null,
                c.CreatedAt))
            .ToList();

        return new PagedResponse<CommentResponse>
        {
            Items = mappedItems,
            TotalCount = pagedData.TotalCount,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize
        };
    }

    public async Task<CommentResponse> CreateAsync(CreateCommentRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        await ValidateTaskAccessAsync(request.TaskItemId, userId, role, ct);

        var author = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = request.Content,
            TaskItemId = request.TaskItemId,
            AuthorId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync(ct);

        // Dispatch domain event asynchronously without blocking the HTTP response
        var commentEvent = new CommentCreatedEvent(comment.Id, comment.Content, comment.TaskItemId, comment.AuthorId);
        await _eventDispatcher.DispatchAsync(commentEvent, ct);

        return new CommentResponse(
            comment.Id, 
            comment.Content, 
            comment.TaskItemId, 
            comment.AuthorId, 
            author?.FirstName,
            author?.LastName,
            author?.AvatarUrl,
            comment.CreatedAt);
    }

    public async Task UpdateAsync(Guid id, UpdateCommentRequest request, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == id, ct) 
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Comment", id));

        ValidateCommentOwnership(comment, userId, role);

        comment.Content = request.Content;
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, Guid userId, UserRole role, CancellationToken ct = default)
    {
        var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == id, ct) 
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Comment", id));

        ValidateCommentOwnership(comment, userId, role);

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync(ct);
    }

    // Navigates the relationship tree to verify workspace ownership for general task access
    private async Task ValidateTaskAccessAsync(Guid taskItemId, Guid userId, UserRole role, CancellationToken ct)
    {
        if (role == UserRole.Admin) return;

        var task = await _context.Tasks
            .Include(t => t.Project)
            .ThenInclude(p => p.Workspace)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskItemId, ct)
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Task", taskItemId));
    }

    // Ensures only the comment author or a system administrator can modify or delete a comment
    private static void ValidateCommentOwnership(Comment comment, Guid userId, UserRole role)
    {
        if (comment.AuthorId != userId && role != UserRole.Admin)
        {
            throw new ForbiddenException(LocalizationMessages.CommentAuthorOrAdminOnly);
        }
    }
}
