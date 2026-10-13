using MediatR;

namespace ProjectHub.Api.Domain.Events;

public record CommentCreatedEvent(
    Guid CommentId, 
    string Content, 
    Guid TaskItemId, 
    Guid AuthorId) : INotification;
    