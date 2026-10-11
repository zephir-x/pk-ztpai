using System;

namespace ProjectHub.Api.DTOs.Comments;

public record CommentResponse(
    Guid Id, 
    string Content, 
    Guid TaskItemId, 
    Guid AuthorId, 
    string? AuthorFirstName, 
    string? AuthorLastName, 
    string? AuthorAvatarUrl, 
    DateTime CreatedAt);
