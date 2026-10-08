using System.Text.RegularExpressions;
using MediatR;
using ProjectHub.Api.Domain.Events;

namespace ProjectHub.Api.Services.Comments;

public class CommentCreatedEventHandler : INotificationHandler<CommentCreatedEvent>
{
    private readonly ILogger<CommentCreatedEventHandler> _logger;

    public CommentCreatedEventHandler(ILogger<CommentCreatedEventHandler> logger)
    {
        _logger = logger;
    }

    public async Task Handle(CommentCreatedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Background task started: Analyzing comment {CommentId} for mentions...", notification.CommentId);

        // Regex to find words starting with '@' (e.g., @Kacper, @admin)
        var mentions = Regex.Matches(notification.Content, @"@\w+")
            .Select(m => m.Value)
            .Distinct()
            .ToList();

        if (mentions.Any())
        {
            foreach (var mention in mentions)
            {
                // In a production app, this would query the DB for the user and send an email/WebSocket push
                // We simulate heavy processing with a delay
                await Task.Delay(500, cancellationToken);
                _logger.LogInformation(">>> ASYNC NOTIFICATION: User {Mention} was mentioned in task {TaskId} <<<", mention, notification.TaskItemId);
            }
        }
        else
        {
            _logger.LogInformation("No mentions found in comment {CommentId}.", notification.CommentId);
        }
    }
}
