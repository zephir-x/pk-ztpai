using ProjectHub.Api.Domain.Enums;

namespace ProjectHub.Api.DTOs.Tasks;

public record TaskItemResponse(
    Guid Id, 
    string Title, 
    string? Description, 
    ProjectTaskStatus Status, 
    TaskPriority Priority, 
    Guid ProjectId, 
    Guid? AssigneeId, 
    DateTime CreatedAt, 
    DateTime? UpdatedAt);
    