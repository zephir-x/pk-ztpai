namespace ProjectHub.Api.DTOs.Projects;

public record CreateProjectRequest(string Name, string? Description, Guid WorkspaceId);
