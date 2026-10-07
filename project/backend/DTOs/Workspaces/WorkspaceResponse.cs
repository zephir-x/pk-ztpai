namespace ProjectHub.Api.DTOs.Workspaces;

public record WorkspaceResponse(Guid Id, string Name, Guid OwnerId, DateTime CreatedAt);
