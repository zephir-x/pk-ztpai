using ProjectHub.Api.Domain.Common;

namespace ProjectHub.Api.Domain.Entities;

public class Comment : ISoftDeletable
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid TaskItemId { get; set; }
    public Guid AuthorId { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public TaskItem TaskItem { get; set; } = null!;
    public User Author { get; set; } = null!;
}
