namespace ProjectHub.Api.DTOs.Comments;

public record CreateCommentRequest(string Content, Guid TaskItemId);
