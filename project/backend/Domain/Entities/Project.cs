namespace ProjectHub.Api.Domain.Entities;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid WorkspaceId { get; set; }
    public DateTime CreatedAt { get; set; }
    public ProjectHub.Api.Domain.Enums.ThemeColor ThemeColor { get; set; } = ProjectHub.Api.Domain.Enums.ThemeColor.Blue;

    // Navigation properties
    public Workspace Workspace { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
