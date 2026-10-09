using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;

namespace ProjectHub.Api.Infrastructure.Data;

public class ProjectHubDbContext : DbContext
{
    public ProjectHubDbContext(DbContextOptions<ProjectHubDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configures User entity constraints
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
        });

        // Configures Workspace relationships and limits
        modelBuilder.Entity<Workspace>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ThemeColor).HasConversion<string>().HasMaxLength(20).IsRequired().HasDefaultValue(ProjectHub.Api.Domain.Enums.ThemeColor.Blue);
            entity.HasOne(w => w.Owner)
                  .WithMany(u => u.Workspaces)
                  .HasForeignKey(w => w.OwnerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Configures Project relationships
        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.ThemeColor).HasConversion<string>().HasMaxLength(20).IsRequired().HasDefaultValue(ProjectHub.Api.Domain.Enums.ThemeColor.Blue);
            entity.HasOne(p => p.Workspace)
                  .WithMany(w => w.Projects)
                  .HasForeignKey(p => p.WorkspaceId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configures TaskItem constraints and optional Assignee relation
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.HasOne(t => t.Project)
                  .WithMany(p => p.Tasks)
                  .HasForeignKey(t => t.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(t => t.Assignee)
                  .WithMany(u => u.AssignedTasks)
                  .HasForeignKey(t => t.AssigneeId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Configures Comment relationships
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.Property(e => e.Content).IsRequired().HasMaxLength(1000);
            entity.HasOne(c => c.TaskItem)
                  .WithMany(t => t.Comments)
                  .HasForeignKey(c => c.TaskItemId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Author)
                  .WithMany(u => u.Comments)
                  .HasForeignKey(c => c.AuthorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
