namespace ProjectHub.Api.DTOs.Comments;

public record CommentResponse(Guid Id, string Content, Guid TaskItemId, Guid AuthorId, DateTime CreatedAt);
