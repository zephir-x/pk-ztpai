namespace ProjectHub.Api.DTOs.Projects;

public record ProjectResponse(Guid Id, string Name, string? Description, Guid WorkspaceId, DateTime CreatedAt);
