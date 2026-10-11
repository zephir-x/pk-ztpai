using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Api.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ProjectHubDbContext context)
    {
        // If users already exist, check if notifications need initial seeding
        if (await context.Users.AnyAsync())
        {
            if (!await context.Notifications.AnyAsync())
            {
                await SeedInitialNotificationsAsync(context);
            }
            return;
        }

        var now = DateTime.UtcNow;
        var defaultPassword = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!");

        // === 1. Users Generation ===
        var adminId = Guid.NewGuid();
        var admin = new User
        {
            Id = adminId,
            Email = "admin@projecthub.com",
            PasswordHash = defaultPassword,
            Role = UserRole.Admin,
            FirstName = "Kacper",
            LastName = "Gumulak",
            AvatarUrl = "avatar-1",
            Language = "en",
            AccentColor = "fiery",
            CreatedAt = now
        };

        var dev1Id = Guid.NewGuid();
        var dev1 = new User
        {
            Id = dev1Id,
            Email = "frontend.dev@projecthub.com",
            PasswordHash = defaultPassword,
            Role = UserRole.User,
            FirstName = "Zofia",
            LastName = "Mazur",
            AvatarUrl = "avatar-2",
            Language = "en",
            AccentColor = "purple",
            CreatedAt = now
        };

        var dev2Id = Guid.NewGuid();
        var dev2 = new User
        {
            Id = dev2Id,
            Email = "backend.eng@projecthub.com",
            PasswordHash = defaultPassword,
            Role = UserRole.User,
            FirstName = "Krzysztof",
            LastName = "Dąbrowski",
            AvatarUrl = "avatar-3",
            Language = "en",
            AccentColor = "blue",
            CreatedAt = now
        };

        var qaId = Guid.NewGuid();
        var qaUser = new User
        {
            Id = qaId,
            Email = "qa.tester@projecthub.com",
            PasswordHash = defaultPassword,
            Role = UserRole.User,
            FirstName = "Zuzanna",
            LastName = "Kamińska",
            AvatarUrl = "avatar-4",
            Language = "en",
            AccentColor = "green",
            CreatedAt = now
        };

        await context.Users.AddRangeAsync(admin, dev1, dev2, qaUser);

        // === 2. Workspaces Generation ===
        var wsEngineeringId = Guid.NewGuid();
        var wsEngineering = new Workspace
        {
            Id = wsEngineeringId,
            Name = "Engineering Department",
            ThemeColor = ThemeColor.Blue,
            OwnerId = adminId,
            CreatedAt = now
        };

        var wsDesignId = Guid.NewGuid();
        var wsDesign = new Workspace
        {
            Id = wsDesignId,
            Name = "Design Studio",
            ThemeColor = ThemeColor.Pink,
            OwnerId = adminId,
            CreatedAt = now
        };

        var wsMarketingId = Guid.NewGuid();
        var wsMarketing = new Workspace
        {
            Id = wsMarketingId,
            Name = "Marketing Operations",
            ThemeColor = ThemeColor.Yellow,
            OwnerId = adminId,
            CreatedAt = now
        };

        await context.Workspaces.AddRangeAsync(wsEngineering, wsDesign, wsMarketing);

        // === 3. Projects Generation ===
        var projectFrontendId = Guid.NewGuid();
        var projectFrontend = new Project
        {
            Id = projectFrontendId,
            Name = "ProjectHub React App",
            Description = "Frontend architecture and UI components development.",
            ThemeColor = ThemeColor.Blue,
            WorkspaceId = wsEngineeringId,
            CreatedAt = now
        };

        var projectBackendId = Guid.NewGuid();
        var projectBackend = new Project
        {
            Id = projectBackendId,
            Name = "ProjectHub Core API",
            Description = "Backend services, PostgreSQL integration, and business logic.",
            ThemeColor = ThemeColor.Gray,
            WorkspaceId = wsEngineeringId,
            CreatedAt = now
        };

        var projectBrandingId = Guid.NewGuid();
        var projectBranding = new Project
        {
            Id = projectBrandingId,
            Name = "Brand Refresh 2026",
            Description = "New logo designs and color palette selections.",
            ThemeColor = ThemeColor.Pink,
            WorkspaceId = wsDesignId,
            CreatedAt = now
        };

        await context.Projects.AddRangeAsync(projectFrontend, projectBackend, projectBranding);

        // === 4. Tasks Generation ===
        var task1Id = Guid.NewGuid();
        var task1 = new TaskItem
        {
            Id = task1Id,
            Title = "Implement Kanban Board Drag & Drop",
            Description = "Integrate @hello-pangea/dnd for seamless task movements.",
            Status = ProjectTaskStatus.InProgress,
            Priority = TaskPriority.High,
            ProjectId = projectFrontendId,
            AssigneeId = dev1Id,
            CreatedAt = now
        };

        var task2Id = Guid.NewGuid();
        var task2 = new TaskItem
        {
            Id = task2Id,
            Title = "Fix Auth Token Refresh Bug",
            Description = "Users are logged out unexpectedly after 1 hour.",
            Status = ProjectTaskStatus.ToDo,
            Priority = TaskPriority.Critical,
            ProjectId = projectFrontendId,
            AssigneeId = dev1Id,
            CreatedAt = now.AddDays(-1)
        };

        var task3Id = Guid.NewGuid();
        var task3 = new TaskItem
        {
            Id = task3Id,
            Title = "Configure PostgreSQL Connection Pool",
            Description = "Optimize database connections for high concurrency.",
            Status = ProjectTaskStatus.Review,
            Priority = TaskPriority.Medium,
            ProjectId = projectBackendId,
            AssigneeId = dev2Id,
            CreatedAt = now.AddDays(-2)
        };

        var task4Id = Guid.NewGuid();
        var task4 = new TaskItem
        {
            Id = task4Id,
            Title = "Create New Entity Definitions",
            Description = "Add IsDeleted columns to all entities for soft delete architecture.",
            Status = ProjectTaskStatus.Done,
            Priority = TaskPriority.High,
            ProjectId = projectBackendId,
            AssigneeId = dev2Id,
            CreatedAt = now.AddDays(-5)
        };

        var task5Id = Guid.NewGuid();
        var task5 = new TaskItem
        {
            Id = task5Id,
            Title = "Test Notifications Pipeline",
            Description = "Verify MediatR notifications are correctly dispatched.",
            Status = ProjectTaskStatus.ToDo,
            Priority = TaskPriority.Low,
            ProjectId = projectBackendId,
            AssigneeId = qaId,
            CreatedAt = now
        };

        await context.Tasks.AddRangeAsync(task1, task2, task3, task4, task5);

        // === 5. Comments Generation ===
        var c1 = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "I've started working on the frontend integration for the drag and drop context.",
            TaskItemId = task1Id,
            AuthorId = dev1Id,
            CreatedAt = now.AddHours(-2)
        };

        var c2 = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "Please ensure the performance doesn't drop when lists get larger than 100 items.",
            TaskItemId = task1Id,
            AuthorId = adminId,
            CreatedAt = now.AddHours(-1)
        };

        var c3 = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "Connection pool logic is ready for review.",
            TaskItemId = task3Id,
            AuthorId = dev2Id,
            CreatedAt = now.AddDays(-1)
        };

        var c4 = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "I'll take a look at it this afternoon.",
            TaskItemId = task3Id,
            AuthorId = adminId,
            CreatedAt = now.AddHours(-5)
        };

        var c5 = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "This is a blocker for the v2 release. @frontend.dev please prioritize.",
            TaskItemId = task2Id,
            AuthorId = qaId,
            CreatedAt = now.AddMinutes(-30)
        };

        var c6 = new Comment
        {
            Id = Guid.NewGuid(),
            Content = "@admin Could you please review the latest Kanban board drag and drop changes?",
            TaskItemId = task1Id,
            AuthorId = dev1Id,
            CreatedAt = now.AddMinutes(-45)
        };

        await context.Comments.AddRangeAsync(c1, c2, c3, c4, c5, c6);

        // Commit core entities
        await context.SaveChangesAsync();

        // Seed notifications
        await SeedInitialNotificationsAsync(context);
    }

    private static async Task SeedInitialNotificationsAsync(ProjectHubDbContext context)
    {
        var admin = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        var dev1 = await context.Users.FirstOrDefaultAsync(u => u.Email == "frontend.dev@projecthub.com");
        var dev2 = await context.Users.FirstOrDefaultAsync(u => u.Email == "backend.eng@projecthub.com");
        var qa = await context.Users.FirstOrDefaultAsync(u => u.Email == "qa.tester@projecthub.com");

        var task1 = await context.Tasks.FirstOrDefaultAsync(t => t.Title == "Implement Kanban Board Drag & Drop");
        var task2 = await context.Tasks.FirstOrDefaultAsync(t => t.Title == "Fix Auth Token Refresh Bug");
        var task3 = await context.Tasks.FirstOrDefaultAsync(t => t.Title == "Configure PostgreSQL Connection Pool");

        if (admin == null || dev1 == null || dev2 == null || qa == null) return;

        var now = DateTime.UtcNow;
        var notifications = new List<Notification>
        {
            // Mention notification for frontend.dev (dev1)
            new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = dev1.Id,
                SenderId = qa.Id,
                Type = NotificationType.Mention,
                Title = "Mentioned in comment",
                Message = $"You were mentioned in a comment on task \"{task2?.Title ?? "Fix Auth Token Refresh Bug"}\"",
                TaskItemId = task2?.Id,
                ProjectId = task2?.ProjectId,
                IsRead = false,
                CreatedAt = now.AddMinutes(-30)
            },
            // Task assigned notification for frontend.dev (task1)
            new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = dev1.Id,
                SenderId = admin.Id,
                Type = NotificationType.TaskAssigned,
                Title = "Task Assigned",
                Message = $"You have been assigned to task \"{task1?.Title ?? "Implement Kanban Board Drag & Drop"}\"",
                TaskItemId = task1?.Id,
                ProjectId = task1?.ProjectId,
                IsRead = false,
                CreatedAt = now.AddHours(-2)
            },
            // Mention notification for admin
            new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = admin.Id,
                SenderId = dev1.Id,
                Type = NotificationType.Mention,
                Title = "Mentioned in comment",
                Message = $"You were mentioned in a comment on task \"{task1?.Title ?? "Implement Kanban Board Drag & Drop"}\"",
                TaskItemId = task1?.Id,
                ProjectId = task1?.ProjectId,
                IsRead = false,
                CreatedAt = now.AddMinutes(-45)
            },
            // Direct message from backend.eng to admin
            new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = admin.Id,
                SenderId = dev2.Id,
                Type = NotificationType.DirectMessage,
                Title = "Direct Message from User",
                Message = "Hi Kacper! Could you please grant our team write permissions to the staging Docker registry?",
                TaskItemId = null,
                ProjectId = null,
                IsRead = false,
                CreatedAt = now.AddHours(-1)
            },
            // Task assigned notification for backend.eng
            new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = dev2.Id,
                SenderId = admin.Id,
                Type = NotificationType.TaskAssigned,
                Title = "Task Assigned",
                Message = $"You have been assigned to task \"{task3?.Title ?? "Configure PostgreSQL Connection Pool"}\"",
                TaskItemId = task3?.Id,
                ProjectId = task3?.ProjectId,
                IsRead = false,
                CreatedAt = now.AddDays(-2)
            }
        };

        await context.Notifications.AddRangeAsync(notifications);
        await context.SaveChangesAsync();
    }
}
