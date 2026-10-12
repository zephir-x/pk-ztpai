namespace ProjectHub.Api.DTOs.Workspaces;

public record CreateWorkspaceRequest(string Name, ProjectHub.Api.Domain.Enums.ThemeColor ThemeColor = ProjectHub.Api.Domain.Enums.ThemeColor.Blue);
