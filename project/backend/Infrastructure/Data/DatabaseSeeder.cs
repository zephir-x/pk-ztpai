using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using System;
using System.Threading.Tasks;

namespace ProjectHub.Api.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ProjectHubDbContext context)
    {
        // Check if database is already seeded
        if (await context.Users.AnyAsync())
        {
            return;
        }

        var now = DateTime.UtcNow;

        // 1. Users (Admin and Standard User)
        var adminId = Guid.NewGuid();
        var adminUser = new User
        {
            Id = adminId,
            Email = "admin@projecthub.com",
            PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!"),
            Role = UserRole.Admin,
            CreatedAt = now
        };

        var standardUserId = Guid.NewGuid();
        var standardUser = new User
        {
            Id = standardUserId,
            Email = "user@projecthub.com",
            PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!"),
            Role = UserRole.User,
            CreatedAt = now
        };

        await context.Users.AddRangeAsync(adminUser, standardUser);

        // 2. Workspace (Owned by Admin)
        var workspaceId = Guid.NewGuid();
        var workspace = new Workspace
        {
            Id = workspaceId,
            Name = "Engineering Team",
            ThemeColor = ThemeColor.Gray,
            OwnerId = adminId,
            CreatedAt = now
        };

        await context.Workspaces.AddAsync(workspace);

        // 3. Project
        var projectId = Guid.NewGuid();
        var project = new Project
        {
            Id = projectId,
            Name = "Core Platform Redesign",
            Description = "Seed project for integration testing.",
            ThemeColor = ThemeColor.Gray,
            WorkspaceId = workspaceId,
            CreatedAt = now
        };

        await context.Projects.AddAsync(project);

        // 4. TaskItem (Unassigned, Critical Priority, ToDo Status)
        var taskId = Guid.NewGuid();
        var task = new TaskItem
        {
            Id = taskId,
            Title = "Critical Bug",
            Description = "System crashes on startup.",
            Status = ProjectTaskStatus.ToDo,
            Priority = TaskPriority.Critical,
            ProjectId = projectId,
            AssigneeId = standardUserId,
            CreatedAt = now
        };
        
        // 5. Comment (Authored by Standard User, mentioning Admin)
        var commentId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            Content = "Initial review completed. Please @Admin check the deployment configuration.",
            TaskItemId = taskId,
            AuthorId = standardUserId,
            CreatedAt = now
        };

        await context.Comments.AddAsync(comment);

        await context.Tasks.AddAsync(task);

        // Commit all changes in a single transaction
        await context.SaveChangesAsync();
    }
}
