using ProjectHub.Api.Domain.Enums;

namespace ProjectHub.Api.DTOs.Tasks;

public record CreateTaskItemRequest(
    string Title, 
    string? Description, 
    ProjectTaskStatus Status, 
    TaskPriority Priority, 
    Guid ProjectId, 
    Guid? AssigneeId);
    