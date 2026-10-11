using System;
using ProjectHub.Api.Domain.Common;
using ProjectHub.Api.Domain.Enums;

namespace ProjectHub.Api.Domain.Entities;

// Represents an in-app notification delivered to a user
public class Notification : ISoftDeletable
{
    public Guid Id { get; set; }
    public Guid RecipientId { get; set; }
    public Guid? SenderId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? TaskItemId { get; set; }
    public Guid? ProjectId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public User Recipient { get; set; } = null!;
    public User? Sender { get; set; }
    public TaskItem? TaskItem { get; set; }
    public Project? Project { get; set; }
}
