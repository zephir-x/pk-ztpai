using ProjectHub.Api.Domain.Enums;

namespace ProjectHub.Api.DTOs.Tasks;

// Excludes AssigneeId to enforce Business Rule 2 via a dedicated endpoint
public record UpdateTaskItemRequest(
    string Title, 
    string? Description, 
    ProjectTaskStatus Status, 
    TaskPriority Priority);
    