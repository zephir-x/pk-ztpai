namespace ProjectHub.Api.DTOs.Projects;

public record UpdateProjectRequest(string Name, string? Description, ProjectHub.Api.Domain.Enums.ThemeColor ThemeColor);
