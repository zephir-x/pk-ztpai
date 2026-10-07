namespace ProjectHub.Api.Domain.Entities;

public class Workspace
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public User Owner { get; set; } = null!;
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
