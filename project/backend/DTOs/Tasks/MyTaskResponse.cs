using ProjectHub.Api.Domain.Enums;
using System;

namespace ProjectHub.Api.DTOs.Tasks;

public record MyTaskResponse(
    Guid Id,
    string Title,
    string? Description,
    ProjectTaskStatus Status,
    TaskPriority Priority,
    Guid ProjectId,
    string ProjectName,
    ThemeColor ProjectThemeColor,
    Guid WorkspaceId,
    string WorkspaceName,
    ThemeColor WorkspaceThemeColor,
    Guid? AssigneeId,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
