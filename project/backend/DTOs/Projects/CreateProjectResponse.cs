namespace ProjectHub.Api.DTOs.Projects;

public record CreateProjectRequest(string Name, string? Description, ProjectHub.Api.Domain.Enums.ThemeColor ThemeColor, Guid WorkspaceId);
