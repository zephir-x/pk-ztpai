using ProjectHub.Api.Domain.Enums;

using ProjectHub.Api.Domain.Common;

namespace ProjectHub.Api.Domain.Entities;

public class User : ISoftDeletable
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties representing 1:N relations
    public ICollection<Workspace> Workspaces { get; set; } = new List<Workspace>();
    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
