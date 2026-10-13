namespace ProjectHub.Api.DTOs.Workspaces;

public record UpdateWorkspaceRequest(string Name, ProjectHub.Api.Domain.Enums.ThemeColor ThemeColor);
