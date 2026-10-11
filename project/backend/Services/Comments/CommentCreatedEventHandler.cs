using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Events;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Services.Notifications;

namespace ProjectHub.Api.Services.Comments;

// Handles background processing of newly created comments and generates mention notifications
public class CommentCreatedEventHandler : INotificationHandler<CommentCreatedEvent>
{
    private readonly ProjectHubDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<CommentCreatedEventHandler> _logger;

    public CommentCreatedEventHandler(
        ProjectHubDbContext context,
        INotificationService notificationService,
        ILogger<CommentCreatedEventHandler> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(CommentCreatedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Background task started: Analyzing comment {CommentId} for mentions...", notification.CommentId);

        var task = await _context.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == notification.TaskItemId, cancellationToken);

        if (task == null)
        {
            _logger.LogWarning("Task {TaskId} not found when analyzing comment {CommentId}.", notification.TaskItemId, notification.CommentId);
            return;
        }

        // Extracts words prefixed with '@', trimming trailing punctuation marks
        var mentions = Regex.Matches(notification.Content, @"@([a-zA-Z0-9_\.-]+)")
            .Select(m => m.Groups[1].Value.TrimEnd('.'))
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (mentions.Count == 0)
        {
            _logger.LogInformation("No mentions detected in comment {CommentId}.", notification.CommentId);
            return;
        }

        var recipientIds = new HashSet<Guid>();

        // Handles @admin mention to notify all active system administrators except author
        if (mentions.Any(m => string.Equals(m, "admin", StringComparison.OrdinalIgnoreCase)))
        {
            var adminIds = await _context.Users
                .AsNoTracking()
                .Where(u => u.Role == UserRole.Admin && u.Id != notification.AuthorId)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            foreach (var adminId in adminIds)
            {
                recipientIds.Add(adminId);
            }
        }

        // Handles specific username mentions matching email prefixes (e.g., @frontend.dev or @kacper.gumulak)
        var nonAdminTags = mentions
            .Where(m => !string.Equals(m, "admin", StringComparison.OrdinalIgnoreCase))
            .ToList();

        foreach (var tag in nonAdminTags)
        {
            var tagPrefix = tag.ToLowerInvariant() + "@";
            var matchedUserIds = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id != notification.AuthorId && 
                    (u.Email.ToLower().StartsWith(tagPrefix) || EF.Functions.ILike(u.Email, tag + "@%")))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            foreach (var userId in matchedUserIds)
            {
                recipientIds.Add(userId);
            }
        }

        foreach (var recipientId in recipientIds)
        {
            await _notificationService.CreateNotificationAsync(
                recipientId,
                notification.AuthorId,
                NotificationType.Mention,
                "Mentioned in comment",
                $"You were mentioned in a comment on task \"{task.Title}\"",
                task.Id,
                task.ProjectId,
                cancellationToken);

            _logger.LogInformation("Dispatched mention notification to user {RecipientId} for task {TaskId}.", recipientId, task.Id);
        }
    }
}
