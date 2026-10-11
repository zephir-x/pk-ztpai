using ProjectHub.Api.Domain.Enums;
using System;

namespace ProjectHub.Api.DTOs.Tasks;

public record TaskItemResponse(
    Guid Id, 
    string Title, 
    string? Description, 
    ProjectTaskStatus Status, 
    TaskPriority Priority, 
    Guid ProjectId, 
    Guid? AssigneeId, 
    string? AssigneeFirstName,
    string? AssigneeLastName,
    string? AssigneeAvatarUrl,
    DateTime CreatedAt, 
    DateTime? UpdatedAt);
