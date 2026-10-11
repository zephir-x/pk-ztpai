namespace ProjectHub.Api.DTOs.Workspaces;

public record WorkspaceResponse(Guid Id, string Name, ProjectHub.Api.Domain.Enums.ThemeColor ThemeColor, Guid OwnerId, DateTime CreatedAt);
