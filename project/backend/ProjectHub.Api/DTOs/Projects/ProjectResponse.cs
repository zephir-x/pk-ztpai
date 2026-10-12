namespace ProjectHub.Api.DTOs.Projects;

public record ProjectResponse(Guid Id, string Name, string? Description, ProjectHub.Api.Domain.Enums.ThemeColor ThemeColor, Guid WorkspaceId, DateTime CreatedAt);
